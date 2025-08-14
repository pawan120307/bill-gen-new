import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceAI = ({ onVoiceProcessed, customer }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [voiceResult, setVoiceResult] = useState(null);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    
    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      const newTranscript = finalTranscript + interimTranscript;
      setTranscript(newTranscript);
      
      // Auto-stop after 3 seconds of silence (only for final results)
      if (finalTranscript) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 3000);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      clearTimeout(timeoutRef.current);
      // Process voice input only if we have meaningful content
      if (transcript && transcript.trim().length > 10) {
        processVoiceInput(transcript.trim());
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      clearTimeout(timeoutRef.current);
    };
  }, [language]); // Removed transcript from dependencies to prevent recreation

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError('');
      setVoiceResult(null);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceInput = async (voiceText) => {
    if (!voiceText.trim()) return;
    
    setIsProcessing(true);
    try {
      // Use enhanced voice processing endpoint
      const response = await axios.post(`${API}/ai/enhanced-voice-processing`, {
        voice_input: voiceText,
        customer_name: customer?.name || 'New Customer',
        business_id: 'default-business-id'
      });

      setVoiceResult(response.data);
      setSuggestions(response.data.suggestions || []);
      
      if (onVoiceProcessed) {
        onVoiceProcessed(response.data);
      }
      
      // Show success message with option to create invoice
      if (response.data.invoice_data && response.data.invoice_data.items && response.data.invoice_data.items.length > 0) {
        // Voice processing was successful with valid invoice data
        console.log('Voice processing successful - invoice data extracted:', response.data.invoice_data);
      }
    } catch (err) {
      setError('Failed to process voice input. Please try again.');
      console.error('Voice processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', file);
      formData.append('language', language);
      
      const response = await axios.post(`${API}/ai/voice-file-to-text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { transcript, confidence, language_detected, invoice_suggestions, structured_data } = response.data;
      
      setTranscript(transcript);
      setSuggestions(invoice_suggestions || []);
      setLanguage(language_detected);
      
      // Process the transcript for invoice data
      if (transcript.trim()) {
        processVoiceInput(transcript);
      }
      
    } catch (err) {
      setError('Failed to process audio file. Please try again.');
      console.error('Audio processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      processVoiceInput(transcript);
    }
  };

  const languageOptions = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' }
  ];

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 self-center">Language:</span>
        {languageOptions.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center space-x-2 ${
              language === lang.code 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-gray-100'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </Button>
        ))}
      </div>

      {/* Voice Input Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
        <div className="text-center">
          <div className="mb-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200' 
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
            }`}>
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isListening ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/>
                ) : (
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                )}
              </svg>
            </div>
            {isListening && (
              <div className="mt-2">
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-4 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-8 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-2 h-4 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isListening ? '🎙️ Listening...' : '🎤 AI Voice Assistant'}
            </h3>
            <p className="text-gray-600">
              {isListening 
                ? 'Speak naturally about your invoice details...' 
                : 'Click to start voice input for invoice creation'
              }
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/>
                  </svg>
                  Stop Recording
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                  </svg>
                  Start Voice Input
                </>
              )}
            </Button>

            {transcript && !isListening && (
              <Button
                onClick={handleManualSubmit}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                {isProcessing ? 'Processing...' : 'Process Voice'}
              </Button>
            )}
          </div>
          
          {/* File Upload Option */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Or upload an audio file:</p>
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Upload Audio File</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            Voice Transcript
            <Badge className="ml-2 bg-blue-100 text-blue-800">
              {language.includes('hi') ? 'हिंदी' : 'English'}
            </Badge>
          </h4>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your voice transcript will appear here..."
            className="min-h-[100px] bg-gray-50 border-gray-200"
          />
        </Card>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700 font-medium">Processing voice input with AI...</span>
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🤖</span>
            AI Suggestions
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Voice Result */}
      {voiceResult && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Voice Processing Complete
          </h4>
          <p className="text-green-700">{voiceResult.message}</p>
          
          {voiceResult.invoice_data && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h5 className="font-medium text-gray-900 mb-2">Extracted Invoice Data:</h5>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(voiceResult.invoice_data, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </Card>
      )}

      {/* Usage Tips */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Voice Input Tips
        </h4>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-800 mb-1">🇺🇸 English Examples:</p>
            <p>• "Create invoice for John Doe, web design services, 500 dollars"</p>
            <p>• "Invoice for ABC Company, consulting work, 1500 dollars"</p>
            <p>• "Bill Sarah Smith for logo design project, 300 dollars"</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-1">🇮🇳 हिंदी उदाहरण:</p>
            <p>• "जॉन डो के लिए चालान बनाएं, वेब डिज़ाइन सेवा, पांच सौ डॉलर"</p>
            <p>• "राज कुमार का बिल, सॉफ्टवेयर विकास, एक हज़ार डॉलर"</p>
            <p>• "प्रिया शर्मा के लिए, ग्राफिक डिज़ाइन काम, तीन सौ डॉलर"</p>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <p className="font-medium text-gray-800">✅ Best Practices:</p>
            <p>• Speak clearly and at a normal pace</p>
            <p>• Include customer name, service description, and amount</p>
            <p>• Use either "dollars", "डॉलर", or "रुपए" for currency</p>
            <p>• The AI will automatically detect language and extract information</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceAI;
