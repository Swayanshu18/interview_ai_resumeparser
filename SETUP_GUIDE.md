# Quick Setup Guide - AI Interview Prep App

## Step-by-Step Setup (5-10 minutes)

### 1. Configure MongoDB (Required)

**Option A: MongoDB Atlas (Recommended - Free)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Build a Database" → Choose "Free" (M0)
4. Select a cloud provider and region
5. Click "Create"
6. Create a database user:
   - Username: `admin`
   - Password: (generate or create a strong password)
   - Save credentials!
7. In "Network Access" → Add IP Address → Allow access from anywhere (0.0.0.0/0)
8. Click "Connect" on your cluster
9. Choose "Connect your application"
10. Copy the connection string (looks like: `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
11. Replace `<password>` with your actual password

**Update backend/.env:**
```env
MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/interview-prep?retryWrites=true&w=majority
```

### 2. Configure AWS S3 (Required for file upload)

**Option A: AWS S3 (Recommended)**
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3 service
3. Click "Create bucket"
   - Bucket name: `interview-prep-docs-yourname` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)
   - Uncheck "Block all public access" (we'll use signed URLs)
   - Create bucket
4. Create IAM user for S3 access:
   - Go to IAM service
   - Users → Add users
   - Username: `interview-app-s3`
   - Access type: "Programmatic access"
   - Permissions: Attach "AmazonS3FullAccess" policy
   - Create user
   - **Save Access Key ID and Secret Access Key**

**Update backend/.env:**
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_BUCKET_NAME=interview-prep-docs-yourname
```

**Option B: Cloudinary (Alternative - Easier)**
If you prefer Cloudinary over S3, you'll need to modify the backend code:
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the dashboard
3. Update backend code to use Cloudinary SDK instead of S3

### 3. Verify API Key (Already Configured)

The OpenAI API key is already set in your `.env`:
```env
OPENAI_API_KEY=sk-mega-b56817eee9a537f54a4e772d00919d38b38989808a8df55d11d157fdc6247aad
OPENAI_BASE_URL=https://ai.megallm.io/v1
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
You should see: `Server running on port 5000` and `MongoDB connected`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:3000`

### 5. Test the Application

1. Open browser: `http://localhost:3000`
2. Click "Get Started" or "Sign Up"
3. Create an account:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Upload two PDF files (one resume, one job description)
5. Click "Start Interview"
6. Answer questions and get AI feedback!

## Common Issues & Solutions

### Issue: "MongoDB connection failed"
**Solution:**
- Check your MongoDB URI is correct
- Verify your IP is whitelisted in MongoDB Atlas Network Access
- Make sure password doesn't have special characters (or URL encode them)

### Issue: "File upload failed"
**Solution:**
- Verify AWS credentials are correct
- Check S3 bucket name matches
- Ensure IAM user has S3 permissions
- Check bucket exists and is in the correct region

### Issue: "OpenAI API error"
**Solution:**
- Verify API key is correct
- Check MegaLLM endpoint is accessible
- Test with a simple request: `curl https://ai.megallm.io/v1/models`

### Issue: Frontend can't connect to backend
**Solution:**
- Ensure backend is running on port 5000
- Check no other service is using port 5000
- Verify CORS settings in backend

### Issue: "Port already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

## Environment Variable Checklist

Make sure your `backend/.env` has all these filled:

- [ ] MONGODB_URI (from MongoDB Atlas)
- [ ] JWT_SECRET (can keep default for development)
- [ ] AWS_ACCESS_KEY_ID (from AWS IAM)
- [ ] AWS_SECRET_ACCESS_KEY (from AWS IAM)
- [ ] AWS_BUCKET_NAME (your S3 bucket name)
- [ ] OPENAI_API_KEY (already provided)

## Testing Checklist

- [ ] Backend starts without errors
- [ ] MongoDB connects successfully
- [ ] Frontend starts on port 3000
- [ ] Can create a new account
- [ ] Can login with created account
- [ ] Can upload resume PDF
- [ ] Can upload job description PDF
- [ ] Can start interview chat
- [ ] Can send messages and receive AI responses
- [ ] Responses include scores and feedback

## Next Steps

Once everything works locally:

1. **Version Control**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AI Interview Prep App"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy Backend**:
   - Use Render.com (free tier)
   - Or Railway.app
   - Or Vercel (serverless functions)

3. **Deploy Frontend**:
   - Use Vercel: `vercel --prod`
   - Or Netlify: Upload `dist` folder after `npm run build`

4. **Create Demo Video**:
   - Record 3-5 minute walkthrough
   - Show signup → upload → chat flow
   - Explain key features and architecture

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API endpoints and architecture
- Check browser console for frontend errors
- Check terminal logs for backend errors

Good luck with your interview assignment! 🚀
