import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader, Award, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService, documentService } from '../services/api';

function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [chatId, setChatId] = useState(null);
  const [showCitation, setShowCitation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkDocumentsAndInitialize();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkDocumentsAndInitialize = async () => {
    try {
      // Check if both documents are uploaded
      const response = await documentService.list();
      const docs = response.documents || [];

      const hasResume = docs.some(doc => doc.type === 'resume');
      const hasJobDescription = docs.some(doc => doc.type === 'job_description');

      if (!hasResume || !hasJobDescription) {
        toast.error('Please upload both resume and job description first');
        navigate('/upload');
        return;
      }

      // Initialize chat session
      await initializeChat();
    } catch (error) {
      console.error('Check documents error:', error);
      toast.error('Failed to check documents');
      navigate('/upload');
    }
  };

  const initializeChat = async () => {
    try {
      const response = await chatService.start();
      setChatId(response.chatId);

      // Add initial messages from the chat session
      if (response.messages && response.messages.length > 0) {
        // Get the assistant message (skip system message)
        const assistantMessages = response.messages.filter(msg => msg.role === 'assistant');
        if (assistantMessages.length > 0) {
          const initialMessage = {
            role: 'assistant',
            content: `Welcome to your AI-powered interview! I've analyzed the job description and prepared some questions for you. Let's get started:\n\n${assistantMessages[0].content}\n\nPlease answer the first question to begin.`,
            timestamp: new Date().toISOString()
          };
          setMessages([initialMessage]);
        }
      }
    } catch (error) {
      console.error('Initialize chat error:', error);
      toast.error(error.response?.data?.error || 'Failed to start interview');
      navigate('/upload');
    } finally {
      setInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !chatId) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(chatId, userMessage.content);

      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        score: response.score,
        citations: response.citations,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your response. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const CitationModal = ({ citation, onClose }) => {
    if (!citation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Citation from Resume</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{citation}</p>
          </div>
        </div>
      </div>
    );
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing your interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">AI Interview Simulation</h1>
          <p className="text-gray-600 text-sm mt-1">
            Answer the questions thoughtfully. I'll provide feedback based on your resume and the job description.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-3xl ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1">
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Score Badge */}
                    {message.score && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold text-gray-900">
                          Score: {message.score}/10
                        </span>
                      </div>
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Referenced from your resume:</p>
                        <div className="space-y-2">
                          {message.citations.map((citation, idx) => (
                            <button
                              key={idx}
                              onClick={() => setShowCitation(citation)}
                              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              <span>View citation {idx + 1}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Analyzing your response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here... (Press Enter to send)"
                rows="3"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Shift + Enter for a new line
          </p>
        </div>
      </div>

      {/* Citation Modal */}
      {showCitation && (
        <CitationModal citation={showCitation} onClose={() => setShowCitation(null)} />
      )}
    </div>
  );
}

export default ChatPage;
