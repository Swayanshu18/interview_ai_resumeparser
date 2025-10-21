const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload file to local storage (instead of S3)
const uploadToS3 = async (file, key) => {
  try {
    const filePath = path.join(uploadsDir, key);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Return a mock URL (in production, this would be the S3 URL)
    const url = `/uploads/${key}`;
    return url;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

// Delete file from local storage (instead of S3)
const deleteFromS3 = async (key) => {
  try {
    const filePath = path.join(uploadsDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error('Failed to delete file');
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3
};
