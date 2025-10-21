# AI-Powered Interview Prep App

A full-stack web application that provides AI-powered interview simulation and preparation. Upload your resume and job description, and practice with an intelligent interviewer that evaluates your responses using Retrieval-Augmented Generation (RAG).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Swayanshu18/interview_ai_resumeparser.git
cd interview_ai_resumeparser

# Run with Docker (Recommended)
echo "OPENAI_API_KEY=your-key-here" > .env
docker-compose up -d

# Access the app at http://localhost
```

## Features

- **User Authentication**: Secure signup/login with JWT tokens and bcrypt password hashing
- **Document Upload**: Drag-and-drop PDF upload for resumes and job descriptions (max 2MB)
- **AI Interview Simulation**: Chat with an AI interviewer that generates questions from the job description
- **Intelligent Evaluation**: Responses are evaluated against your resume using RAG with scoring (1-10) and detailed feedback
- **Citation Support**: View specific resume chunks referenced in the AI's feedback
- **Responsive Design**: Mobile-first UI built with Tailwind CSS

## Tech Stack

### Frontend
- React 18.2
- React Router DOM 6.20
- Tailwind CSS
- Axios
- React Hot Toast (notifications)
- React Dropzone (file upload)
- Lucide React (icons)
- Vite (build tool)

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- OpenAI API (via MegaLLM)
- AWS S3 (file storage)
- PDF Parse (text extraction)
- bcryptjs (password hashing)
- Helmet & CORS (security)
- Express Rate Limit

## Project Structure

```
interview-prep-app/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Document.js          # Document schema with embeddings
│   │   └── Chat.js              # Chat session schema
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── documents.js         # Document upload/management
│   │   └── chat.js              # Interview chat endpoints
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── utils/
│   │   ├── ai.js                # OpenAI integration & RAG logic
│   │   └── s3.js                # AWS S3 file operations
│   ├── server.js                # Express server setup
│   ├── package.json
│   └── .env                     # Environment variables
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx  # Home page
    │   │   ├── LoginPage.jsx    # Login form
    │   │   ├── SignupPage.jsx   # Registration form
    │   │   ├── UploadPage.jsx   # Document upload
    │   │   └── ChatPage.jsx     # Interview simulation
    │   ├── components/
    │   │   ├── Layout.jsx       # Navigation & layout
    │   │   └── ProtectedRoute.jsx # Route protection
    │   ├── contexts/
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── services/
    │   │   └── api.js           # API service layer
    │   ├── App.jsx              # Main app component
    │   └── index.css            # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Setup Instructions

### Quick Start with Docker (Recommended)

The easiest way to run the application is using Docker:

```bash
# 1. Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" > .env

# 2. Start all services
docker-compose up -d

# 3. Access the app
# Frontend: http://localhost
# Backend: http://localhost:5000
```

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

### Manual Setup

#### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create a `.env` file in the backend directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://127.0.0.1:27017/interview-prep

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d

   # OpenAI API
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini-2024-07-18
   OPENAI_EMBEDDING_MODEL=text-embedding-3-large

   # Port
   PORT=5000
   ```

4. **MongoDB Setup**:
   - For local: Install MongoDB Community Edition and start the service
   - For Atlas: Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and update the connection string

5. **Start the backend server**:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Documents
- `POST /api/documents/upload` - Upload PDF (resume or job description)
- `GET /api/documents/list` - List user's documents
- `DELETE /api/documents/:id` - Delete document

### Chat/Interview
- `POST /api/chat/start` - Initialize interview session
- `POST /api/chat/query` - Send user response and get AI feedback
- `GET /api/chat/history/:chatId` - Get chat history

## Usage Guide

### 1. Sign Up / Login
- Create an account with your email and password
- Login to access the application

### 2. Upload Documents
- Navigate to the Upload page
- Drag and drop or click to upload your **Resume** (PDF, max 2MB)
- Upload the **Job Description** (PDF, max 2MB)
- Both documents are required to start the interview

### 3. Start Interview
- Once both documents are uploaded, click "Start Interview"
- The AI will analyze the job description and generate 3 initial questions
- Answer each question thoughtfully

### 4. Get Feedback
- After each response, the AI will:
  - Evaluate your answer using RAG (retrieving relevant chunks from your resume)
  - Provide a score (1-10)
  - Give detailed feedback (max 100 words)
  - Include citations from your resume that support or contradict your response
- Click on citation links to view specific resume snippets

### 5. Continue Practice
- Continue answering questions to improve your interview skills
- The AI will adapt questions based on your responses

## How It Works

### RAG (Retrieval-Augmented Generation) Flow

1. **Document Processing**:
   - PDFs are parsed and extracted as text
   - Text is split into ~500 word chunks
   - Each chunk is embedded using OpenAI's `text-embedding-ada-002`
   - Embeddings are stored in MongoDB with the original text

2. **Question Generation**:
   - Job description is analyzed by the AI
   - AI generates relevant interview questions

3. **Response Evaluation**:
   - User's response is embedded
   - Top 2 similar chunks are retrieved from resume and JD using cosine similarity
   - AI evaluates the response using the context from retrieved chunks
   - Returns score, feedback, and citations

## Deployment

### Backend (Render/Railway/Vercel)

**Render:**
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `npm start`
5. Add all environment variables from `.env`

**Vercel (Serverless):**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Add environment variables in Vercel dashboard

### Frontend (Vercel/Netlify)

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the frontend directory
3. Update `vite.config.js` to point to your deployed backend API

**Netlify:**
1. Run `npm run build` in frontend directory
2. Deploy `dist` folder to Netlify
3. Update API base URL to your deployed backend

### Environment Variables for Production

Don't forget to update:
- `FRONTEND_URL` in backend .env (to your deployed frontend URL)
- `VITE_API_BASE_URL` in frontend (if needed, to your deployed backend URL)
- Set `NODE_ENV=production` for backend

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Helmet security headers
- Rate limiting (100 requests per 15 minutes)
- Input validation with Joi
- Protected routes requiring authentication

## Development Scripts

### Backend
```bash
npm start       # Production server
npm run dev     # Development with nodemon
```

### Frontend
```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check your connection string format
- Verify network access settings

### File Upload Errors
- Check AWS S3 bucket permissions
- Verify IAM user has PutObject permissions
- Ensure bucket CORS is configured

### OpenAI API Errors
- Verify API key is correct
- Check MegaLLM endpoint is accessible
- Ensure you have sufficient API credits

### Frontend Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version compatibility
- Verify all dependencies are installed

## Contributing

This is an intern assignment project. Feel free to fork and enhance!

## License

MIT License - Feel free to use this project for learning and development.

## Contact

For questions or issues, please open a GitHub issue or contact the development team.

---

**Built with ❤️ using React, Node.js, MongoDB, and OpenAI**
