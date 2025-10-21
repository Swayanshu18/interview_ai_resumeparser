import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, CheckCircle, FileText, MessageSquare, Award } from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">AI-Powered</span>
                  <span className="block text-primary-600">Interview Preparation</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Practice with an intelligent AI interviewer that adapts to your resume and job description. Get
                  personalized feedback and improve your interview skills.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {isAuthenticated ? (
                    <Link
                      to="/upload"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                      <Link
                        to="/login"
                        className="mt-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10 sm:mt-0 sm:ml-3"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-blue-500 to-indigo-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center p-8">
            <div className="text-center text-white space-y-6">
              <div className="flex justify-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <FileText className="h-12 w-12" />
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <MessageSquare className="h-12 w-12" />
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <Award className="h-12 w-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">AI-Powered Interviews</h3>
                <p className="text-blue-100 max-w-md mx-auto">
                  Upload your documents, practice with AI, and get instant feedback on your performance
                </p>
              </div>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Real-time Feedback</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Personalized Questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to ace your interview
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Document Analysis</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Upload your resume and job description. Our AI analyzes them to create personalized interview
                  questions.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI Interview Simulation</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Practice with an intelligent AI interviewer that asks relevant questions based on the job
                  requirements.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Instant Feedback</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Get scored feedback on your responses with specific suggestions for improvement.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">How it Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple 3-step process
            </p>
          </div>

          <div className="mt-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-8 md:space-y-0 md:space-x-8">
              <div className="flex-1 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold">
                    1
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Documents</h3>
                <p className="mt-2 text-base text-gray-500">Upload your resume and the job description you're applying for.</p>
              </div>

              <div className="flex-1 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold">
                    2
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Start Interview</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our AI generates relevant questions and conducts a realistic interview simulation.
                </p>
              </div>

              <div className="flex-1 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold">
                    3
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Get Feedback</h3>
                <p className="mt-2 text-base text-gray-500">
                  Receive instant feedback with scores and suggestions for improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to ace your interview?</span>
            <span className="block">Start practicing today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-200">
            Join thousands of job seekers who have improved their interview skills with our AI-powered platform.
          </p>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
            >
              Get started for free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;