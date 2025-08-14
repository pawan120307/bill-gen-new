import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FeedbackPage = () => {
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    category: 'general',
    rating: 5,
    title: '',
    description: '',
    features_used: [],
    improvement_suggestions: '',
    recommend_rating: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  // Sample testimonials - in real app, fetch from backend
  useEffect(() => {
    setTestimonials([
      {
        id: 1,
        name: 'Sarah Chen',
        role: 'Freelance Designer',
        rating: 5,
        text: 'InvoiceForge has revolutionized my invoicing process! The AI voice input is incredibly accurate and saves me so much time.',
        avatar: '👩‍💻',
        date: '2024-01-15'
      },
      {
        id: 2,
        name: 'Marcus Johnson',
        role: 'Small Business Owner',
        rating: 5,
        text: 'The professional templates and automated reminders have improved my cash flow significantly. Highly recommend!',
        avatar: '👨‍💼',
        date: '2024-01-12'
      },
      {
        id: 3,
        name: 'Priya Sharma',
        role: 'Consultant',
        rating: 4,
        text: 'Great tool with excellent Hindi language support. The AI understands context perfectly.',
        avatar: '👩‍🔬',
        date: '2024-01-10'
      }
    ]);
  }, []);

  const handleInputChange = (field, value) => {
    setFeedbackData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFeedbackData(prev => ({
      ...prev,
      features_used: prev.features_used.includes(feature)
        ? prev.features_used.filter(f => f !== feature)
        : [...prev.features_used, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // In a real implementation, you would send this to your backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      console.log('Feedback submitted:', feedbackData);
      
      setSubmitStatus('success');
      setFeedbackData({
        name: '',
        email: '',
        category: 'general',
        rating: 5,
        title: '',
        description: '',
        features_used: [],
        improvement_suggestions: '',
        recommend_rating: 10
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, label, maxRating = 5 }) => {
    return (
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">{label}</Label>
        <div className="flex items-center space-x-1">
          {[...Array(maxRating)].map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onRatingChange(index + 1)}
              className={`text-2xl transition-colors duration-200 ${
                index < rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              ⭐
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating}/{maxRating} {maxRating === 10 ? '(Net Promoter Score)' : ''}
          </span>
        </div>
      </div>
    );
  };

  const features = [
    { key: 'voice_input', label: '🎤 Voice Input', color: 'blue' },
    { key: 'ai_assistant', label: '🤖 AI Assistant', color: 'purple' },
    { key: 'templates', label: '🎨 Templates', color: 'green' },
    { key: 'pdf_export', label: '📄 PDF Export', color: 'red' },
    { key: 'excel_export', label: '📊 Excel Export', color: 'orange' },
    { key: 'payment_integration', label: '💳 Payment Integration', color: 'blue' },
    { key: 'multilingual', label: '🌐 Multi-language Support', color: 'purple' },
    { key: 'customer_management', label: '👥 Customer Management', color: 'green' }
  ];

  const categories = [
    { value: 'general', label: 'General Feedback', color: 'blue' },
    { value: 'feature_request', label: 'Feature Request', color: 'green' },
    { value: 'bug_report', label: 'Bug Report', color: 'red' },
    { value: 'ui_ux', label: 'UI/UX Feedback', color: 'purple' },
    { value: 'performance', label: 'Performance', color: 'orange' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Feedback</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your feedback helps us improve InvoiceForge for everyone. Tell us about your experience, 
            suggest new features, or share how we've helped your business grow.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell Us What You Think</h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={feedbackData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={feedbackData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">We'll only use this to follow up if needed</p>
                  </div>
                </div>

                {/* Feedback Category */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Feedback Category</Label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleInputChange('category', category.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          feedbackData.category === category.value
                            ? `bg-${category.color}-600 text-white shadow-lg`
                            : `bg-${category.color}-100 text-${category.color}-700 hover:bg-${category.color}-200`
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overall Rating */}
                <StarRating
                  rating={feedbackData.rating}
                  onRatingChange={(rating) => handleInputChange('rating', rating)}
                  label="Overall Rating"
                />

                {/* Feedback Title */}
                <div>
                  <Label htmlFor="title">Feedback Title *</Label>
                  <Input
                    id="title"
                    value={feedbackData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Summary of your feedback"
                    className="mt-1"
                    required
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={feedbackData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide detailed feedback about your experience..."
                    className="mt-1"
                    rows={6}
                    required
                  />
                </div>

                {/* Features Used */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Which features have you used? (Select all that apply)
                  </Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {features.map((feature) => (
                      <button
                        key={feature.key}
                        type="button"
                        onClick={() => handleFeatureToggle(feature.key)}
                        className={`flex items-center justify-start p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                          feedbackData.features_used.includes(feature.key)
                            ? `bg-${feature.color}-100 border-2 border-${feature.color}-300 text-${feature.color}-800`
                            : 'bg-gray-100 border-2 border-transparent text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="mr-2">{feature.key === 'voice_input' ? '🎤' : 
                                              feature.key === 'ai_assistant' ? '🤖' : 
                                              feature.key === 'templates' ? '🎨' : 
                                              feature.key === 'pdf_export' ? '📄' : 
                                              feature.key === 'excel_export' ? '📊' : 
                                              feature.key === 'payment_integration' ? '💳' : 
                                              feature.key === 'multilingual' ? '🌐' : '👥'}</span>
                        {feature.label.split(' ').slice(1).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div>
                  <Label htmlFor="suggestions">Improvement Suggestions</Label>
                  <Textarea
                    id="suggestions"
                    value={feedbackData.improvement_suggestions}
                    onChange={(e) => handleInputChange('improvement_suggestions', e.target.value)}
                    placeholder="What features would you like to see added or improved?"
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {/* Net Promoter Score */}
                <StarRating
                  rating={feedbackData.recommend_rating}
                  onRatingChange={(rating) => handleInputChange('recommend_rating', rating)}
                  label="How likely are you to recommend InvoiceForge to others?"
                  maxRating={10}
                />

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800 font-medium">
                          Thank you for your feedback! We appreciate you taking the time to help us improve InvoiceForge.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 font-medium">
                          Sorry, there was an error submitting your feedback. Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Feedback...
                    </div>
                  ) : (
                    'Submit Feedback 🚀'
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Feedback Stats */}
            <Card className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Feedback</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Rating</span>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-yellow-500 mr-1">4.8</span>
                    <div className="flex text-yellow-400">
                      {'⭐'.repeat(5)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-bold text-gray-900">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recommendation Rate</span>
                  <span className="font-bold text-green-600">94%</span>
                </div>
              </div>
            </Card>

            {/* Recent Testimonials */}
            <Card className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Testimonials</h3>
              <div className="space-y-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{testimonial.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm">{testimonial.name}</span>
                          <Badge variant="outline" className="text-xs">{testimonial.role}</Badge>
                        </div>
                        <div className="flex text-yellow-400 text-sm mb-2">
                          {'⭐'.repeat(testimonial.rating)}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{testimonial.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Feedback Guidelines */}
            <Card className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Feedback Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Be specific about features you used</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Include screenshots for UI/UX issues</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Suggest improvements or new features</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Rate honestly to help us improve</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 border-0 shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                Help Us Build the Future of Invoicing
              </h2>
              <p className="text-xl text-purple-100 mb-8">
                Your feedback shapes every update we make. Join our community of users building better invoicing tools together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Join Beta Program →
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                >
                  Feature Roadmap
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
