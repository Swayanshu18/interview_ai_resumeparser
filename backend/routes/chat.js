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
      // Generate FIRST interview question based on job description
      const prompt = `You are starting an interview. Based on the job description below, ask ONLY the first question.

Job Description:
${jobDescription.fullText.substring(0, 2000)}

IMPORTANT RULES:
- Ask ONLY ONE question (the first question)
- DO NOT include numbers like "1.", "2.", "3."
- DO NOT list multiple questions
- DO NOT say "Let's begin with" or similar phrases
- Just ask a single, direct question

Your response should be ONLY the question itself, nothing else.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
        messages: [
          { role: 'system', content: 'You are an interviewer. You MUST ask only ONE question at a time. Never list multiple questions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const firstQuestion = completion.choices[0].message.content.trim();

      // Create new chat session
      chat = new Chat({
        userId: req.userId,
        resumeId: resume._id,
        jobDescriptionId: jobDescription._id,
        questionCount: 1, // Starting with first question
        messages: [
          {
            role: 'system',
            content: 'You are conducting a job interview based on the provided job description. Ask questions one at a time and provide feedback after each answer.'
          },
          {
            role: 'assistant',
            content: firstQuestion
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

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message
    });

    // Check if this is the last question (3rd question answered)
    const isLastQuestion = chat.questionCount >= 3;

    let aiResponse;
    let score = null;

    if (isLastQuestion) {
      // Generate comprehensive evaluation for ALL 3 answers
      const allQuestionsAndAnswers = [];
      let currentQuestion = '';

      // Extract all Q&A pairs
      for (let i = 0; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (msg.role === 'assistant' && !msg.content.includes('Score:') && !msg.content.includes('Welcome')) {
          currentQuestion = msg.content;
        } else if (msg.role === 'user') {
          if (currentQuestion) {
            allQuestionsAndAnswers.push({
              question: currentQuestion,
              answer: msg.content
            });
            currentQuestion = '';
          }
        }
      }

      const evaluationPrompt = `You are evaluating a complete 3-question interview. Here are all the questions and answers:

${allQuestionsAndAnswers.map((qa, idx) =>
  `Question ${idx + 1}: ${qa.question}\n\nCandidate's Answer ${idx + 1}: ${qa.answer}`
).join('\n\n---\n\n')}

Relevant context from resume and job description:
${context}

Please provide a comprehensive evaluation:

1. For each answer, provide:
   - Score (1-10)
   - Specific feedback (2-3 sentences)

2. Overall interview summary with:
   - Overall performance score (1-10)
   - Key strengths
   - Areas for improvement
   - Final recommendation

Format your response EXACTLY as:
Answer 1 Score: [1-10]
Answer 1 Feedback: [Your feedback]

Answer 2 Score: [1-10]
Answer 2 Feedback: [Your feedback]

Answer 3 Score: [1-10]
Answer 3 Feedback: [Your feedback]

Overall Score: [1-10]
Summary: [Your comprehensive summary with strengths, areas for improvement, and recommendation]`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
        messages: [
          { role: 'system', content: 'You are an experienced technical interviewer providing comprehensive feedback on a complete interview.' },
          { role: 'user', content: evaluationPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      aiResponse = completion.choices[0].message.content;

      // Parse overall score
      const overallScoreMatch = aiResponse.match(/Overall Score:\s*(\d+)/i);
      score = overallScoreMatch ? parseInt(overallScoreMatch[1]) : null;

      // Add comprehensive feedback with citations
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
    } else {
      // Just ask the next question, no feedback yet
      const nextQuestionPrompt = `Based on the following job description and the candidate's previous responses, generate ONE new relevant interview question.

Job Description:
${jobDescription.fullText.substring(0, 2000)}

Previous conversation:
${chat.messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

Generate ONE specific, relevant interview question. DO NOT provide feedback or scores. Just ask the next question.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
        messages: [
          { role: 'system', content: 'You are an experienced technical interviewer. Ask questions one at a time without providing feedback yet.' },
          { role: 'user', content: nextQuestionPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      aiResponse = completion.choices[0].message.content;

      // Add next question without score or citations
      chat.messages.push({
        role: 'assistant',
        content: aiResponse
      });
    }

    // Increment question count if not the last question
    // (questionCount tracks questions asked, not answered - so only increment when asking next question)
    if (!isLastQuestion) {
      chat.questionCount += 1;
    } else {
      // Mark interview as complete after 3rd question is answered
      chat.isActive = false;
    }

    await chat.save();

    res.json({
      response: aiResponse,
      score: isLastQuestion ? score : undefined, // Only send score at the end
      isComplete: isLastQuestion, // Signal to frontend that interview is complete
      questionCount: chat.questionCount,
      citations: isLastQuestion ? similarChunks.map(chunk => ({
        type: chunk.documentType,
        text: chunk.text.substring(0, 200) + '...',
        relevance: Math.round(chunk.similarity * 100)
      })) : undefined // Only send citations at the end
    });
  } catch (error) {
    console.error('Query chat error:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// DELETE /api/chat/reset - Reset/delete active chat session
router.delete('/reset', authMiddleware, async (req, res) => {
  try {
    // Find and delete active chat session
    const result = await Chat.deleteMany({
      userId: req.userId,
      isActive: true
    });

    res.json({
      message: 'Chat session reset successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Reset chat error:', error);
    res.status(500).json({ error: 'Failed to reset chat session' });
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