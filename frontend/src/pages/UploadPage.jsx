import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService } from '../services/api';

function UploadPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({ resume: false, job_description: false });
  const [uploadProgress, setUploadProgress] = useState({ resume: 0, job_description: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentService.list();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
      // Don't show error toast on initial load if user has no documents yet
    } finally {
      setLoading(false);
    }
  };

  const hasDocument = (type) => {
    return Array.isArray(documents) && documents.some(doc => doc.type === type);
  };

  const handleUpload = async (file, type) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [type]: Math.min(prev[type] + 10, 90)
      }));
    }, 200);

    try {
      const toastId = toast.loading(
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Processing PDF and generating embeddings...</span>
        </div>
      );

      await documentService.upload(file, type);
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));

      toast.dismiss(toastId);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>{type === 'resume' ? 'Resume' : 'Job Description'} uploaded and processed!</span>
        </div>
      );
      await fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    } finally {
      clearInterval(progressInterval);
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.delete(id);
      toast.success('Document deleted successfully');
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const ResumeDropzone = () => {
    const onDrop = useCallback((acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0], 'resume');
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      maxFiles: 1,
      disabled: uploading.resume || hasDocument('resume')
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : hasDocument('resume')
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 bg-white'
        } ${uploading.resume || hasDocument('resume') ? 'cursor-not-allowed opacity-75' : ''}`}
      >
        <input {...getInputProps()} />
        {hasDocument('resume') ? (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Resume Uploaded ✓</p>
            <div className="mt-3 px-4 py-2 bg-white border border-green-200 rounded-lg inline-block">
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                {documents.find(d => d.type === 'resume')?.filename}
              </p>
            </div>
          </>
        ) : uploading.resume ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-bounce" />
            <p className="text-lg font-medium text-gray-900">Uploading...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.resume}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{uploadProgress.resume}%</p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900">Upload Your Resume</p>
            <p className="text-sm text-gray-500 mt-2">
              Drag and drop or click to browse (PDF, max 2MB)
            </p>
          </>
        )}
      </div>
    );
  };

  const JobDescriptionDropzone = () => {
    const onDrop = useCallback((acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0], 'job_description');
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      maxFiles: 1,
      disabled: uploading.job_description || hasDocument('job_description')
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : hasDocument('job_description')
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 bg-white'
        } ${uploading.job_description || hasDocument('job_description') ? 'cursor-not-allowed opacity-75' : ''}`}
      >
        <input {...getInputProps()} />
        {hasDocument('job_description') ? (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Job Description Uploaded ✓</p>
            <div className="mt-3 px-4 py-2 bg-white border border-green-200 rounded-lg inline-block">
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                {documents.find(d => d.type === 'job_description')?.filename}
              </p>
            </div>
          </>
        ) : uploading.job_description ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-bounce" />
            <p className="text-lg font-medium text-gray-900">Uploading...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.job_description}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{uploadProgress.job_description}%</p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900">Upload Job Description</p>
            <p className="text-sm text-gray-500 mt-2">
              Drag and drop or click to browse (PDF, max 2MB)
            </p>
          </>
        )}
      </div>
    );
  };

  const canStartInterview = hasDocument('resume') && hasDocument('job_description');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Upload your resume and the job description to start your AI-powered interview preparation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
          <ResumeDropzone />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
          <JobDescriptionDropzone />
        </div>
      </div>

      {Array.isArray(documents) && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {doc.type === 'resume' ? 'Resume' : 'Job Description'} •{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.type)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canStartInterview ? (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-xl p-10 text-center text-white animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <CheckCircle className="h-16 w-16" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-3">All Set! Ready to Begin?</h3>
          <div className="mb-6 space-y-2">
            <p className="text-lg text-blue-50">
              Both documents have been uploaded and processed successfully.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Resume Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Job Description Ready
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-white text-blue-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
          >
            Begin Interview Now →
          </button>
          <p className="mt-4 text-sm text-blue-100">
            Your AI interviewer is ready to assess your qualifications
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Documents Required</h3>
            <p className="text-yellow-800 text-sm">
              Please upload both your resume and the job description to start the interview simulation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
