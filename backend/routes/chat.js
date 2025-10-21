const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const { openai, generateEmbedding, findSimilarChunks } = require('../utils/ai');

// POST /api/chat/start - Initialize chat with interview questions
router.post('/start', authMiddleware, async (req, res) => {
  try {
    // Check if user has both documents
    const documents = await Document.find({ userId: req.userId });
    const resume = documents.find(doc => doc.type === 'resume');
    const jobDescription = documents.find(doc => doc.type === 'job_description');

    if (!resume || !jobDescription) {
      return res.status(400).json({
        error: 'Please upload both resume and job description before starting the interview'
      });
    }

    // Check for existing active chat
    let chat = await Chat.findOne({
      userId: req.userId,
      isActive: true
    });

    if (!chat) {
      // Generate initial interview questions based on job description
      const prompt = `Based on the following job description, generate 3 relevant interview questions that would help assess a candidate's qualifications. Format as a numbered list.

Job Description:
${jobDescription.fullText.substring(0, 2000)}

Generate questions that are specific, relevant, and behavioral when appropriate.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
        messages: [
          { role: 'system', content: 'You are an experienced technical interviewer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const questions = completion.choices[0].message.content;

      // Create new chat session
      chat = new Chat({
        userId: req.userId,
        resumeId: resume._id,
        jobDescriptionId: jobDescription._id,
        messages: [
          {
            role: 'system',
            content: 'You are conducting a job interview based on the provided job description.'
          },
          {
            role: 'assistant',
            content: questions
          }
        ]
      });

      await chat.save();
    }

    res.json({
      chatId: chat._id,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// POST /api/chat/query - Process user response with RAG
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message || !chatId) {
      return res.status(400).json({ error: 'Message and chatId are required' });
    }

    // Get chat session
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Get documents
    const [resume, jobDescription] = await Promise.all([
      Document.findById(chat.resumeId),
      Document.findById(chat.jobDescriptionId)
    ]);

    // Generate embedding for the user's message
    const queryEmbedding = await generateEmbedding(message);

    // Find similar chunks from both documents
    const similarChunks = await findSimilarChunks(
      queryEmbedding,
      [resume, jobDescription],
      2
    );

    // Get the last question asked
    const lastQuestion = chat.messages
      .filter(msg => msg.role === 'assistant')
      .pop()?.content || 'the interview question';

    // Prepare context from similar chunks
    const context = similarChunks.map(chunk =>
      `[${chunk.documentType}]: ${chunk.text}`
    ).join('\n\n');

    // Generate evaluation using RAG
    const evaluationPrompt = `You are evaluating an interview response.

Question asked: ${lastQuestion}

Candidate's response: ${message}

Relevant context from resume and job description:
${context}

Please evaluate this response on a scale of 1-10 and provide specific feedback (100 words max). Consider:
1. How well the answer addresses the question
2. Relevance to the job requirements
3. Use of specific examples or experiences
4. Communication clarity

Format your response as:
Score: [1-10]
Feedback: [Your detailed feedback]

Then suggest a follow-up question based on the response.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: 'You are an experienced technical interviewer providing constructive feedback.' },
        { role: 'user', content: evaluationPrompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse score from response
    const scoreMatch = aiResponse.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

    // Add messages to chat
    chat.messages.push({
      role: 'user',
      content: message
    });

    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      score,
      citations: similarChunks.map(chunk => ({
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text.substring(0, 200) + '...'
      }))
    });

    await chat.save();

    res.json({
      response: aiResponse,
      score,
      citations: similarChunks.map(chunk => ({
        type: chunk.documentType,
        text: chunk.text.substring(0, 200) + '...',
        relevance: Math.round(chunk.similarity * 100)
      }))
    });
  } catch (error) {
    console.error('Query chat error:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// GET /api/chat/history - Get chat history
router.get('/history/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        score: msg.score,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;