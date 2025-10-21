const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const { generateBatchEmbeddings, chunkText } = require('../utils/ai');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { type } = req.body;
    if (!type || !['resume', 'job_description'].includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Check if user already has a document of this type
    const existingDoc = await Document.findOne({
      userId: req.userId,
      type
    });

    if (existingDoc) {
      // Delete old document from S3
      await deleteFromS3(existingDoc.s3Key);
      await Document.deleteOne({ _id: existingDoc._id });
    }

    // Parse PDF
    const pdfData = await pdfParse(req.file.buffer);
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from PDF' });
    }

    // Upload to S3
    const s3Key = `${req.userId}/${type}_${Date.now()}.pdf`;
    const s3Url = await uploadToS3(req.file, s3Key);

    // Chunk the text
    const textChunks = chunkText(fullText, 500);

    // Generate embeddings for all chunks in a single batch API call (MUCH FASTER!)
    console.log(`📄 Processing ${textChunks.length} chunks for ${type}...`);
    const embeddings = await generateBatchEmbeddings(textChunks);

    // Combine chunks with their embeddings
    const chunks = textChunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      metadata: {
        chunkIndex: index,
        pageNumber: Math.floor(index / 3) + 1 // Approximate page number
      }
    }));

    // Save document to database
    const document = new Document({
      userId: req.userId,
      type,
      filename: req.file.originalname,
      s3Key,
      s3Url,
      chunks,
      fullText
    });

    await document.save();

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        type: document.type,
        filename: document.filename,
        chunksCount: chunks.length,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

// GET /api/documents/list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .select('type filename createdAt')
      .sort('-createdAt');

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        type: doc.type,
        filename: doc.filename,
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from S3
    await deleteFromS3(document.s3Key);

    // Delete from database
    await Document.deleteOne({ _id: document._id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;