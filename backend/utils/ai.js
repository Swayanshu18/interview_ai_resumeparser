const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

// Generate embedding for text using OpenAI's latest embedding model
async function generateEmbedding(text) {
  try {
    const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';
    console.log(`Generating embedding with model: ${model}`);

    const response = await openai.embeddings.create({
      model: model,
      input: text,
      encoding_format: "float"
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    console.log('Falling back to simple embedding for development');
    // Fallback to simple hash-based embedding
    return generateSimpleEmbedding(text);
  }
}

// Generate embeddings for multiple texts in batch (MUCH FASTER!)
async function generateBatchEmbeddings(texts) {
  try {
    const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';
    console.log(`Generating ${texts.length} embeddings in batch with model: ${model}`);

    const startTime = Date.now();

    const response = await openai.embeddings.create({
      model: model,
      input: texts, // Pass array of texts for batch processing
      encoding_format: "float"
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Batch embedding completed in ${duration}s (${texts.length} chunks)`);

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Batch embedding generation error:', error.message);
    console.log('Falling back to simple embeddings for development');
    // Fallback to simple embeddings
    return texts.map(text => generateSimpleEmbedding(text));
  }
}

// Simple embedding fallback (for development/testing)
// text-embedding-3-small produces 1536-dimensional vectors by default
function generateSimpleEmbedding(text) {
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const index = i % 1536;
    embedding[index] += text.charCodeAt(i) / 1000;
  }
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

// Calculate cosine similarity between two embeddings
function cosineSimilarity(embedding1, embedding2) {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

// Chunk text into smaller pieces
function chunkText(text, maxChunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxChunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Find most similar chunks
async function findSimilarChunks(queryEmbedding, documents, topK = 2) {
  const similarities = [];

  for (const doc of documents) {
    for (let i = 0; i < doc.chunks.length; i++) {
      const chunk = doc.chunks[i];
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      similarities.push({
        documentId: doc._id,
        documentType: doc.type,
        chunkIndex: i,
        text: chunk.text,
        similarity,
        metadata: chunk.metadata
      });
    }
  }

  // Sort by similarity and return top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, topK);
}

module.exports = {
  openai,
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  chunkText,
  findSimilarChunks
};