import React, { useState, useEffect, useRef } from 'react';
import { useLiquidGlass } from './SimpleLiquidGlass';
import MarkdownRenderer from './MarkdownRenderer';
import { Send, Mic, MicOff, Brain, User, Minimize2, Maximize2, Expand, Shrink } from 'lucide-react';
import { useData } from '../context/DataContext';

const FormulaChatWidget = () => {
  const { prices, circulationData, getTokenCirculation, mergerConfiguration } = useData();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm FORMULA, your DAO merger analysis assistant. How can I help you explore one-sided JIT liquidity mergers using EulerSwap today?",
      timestamp: new Date(),
      confidence: 95
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Data comes from context - prices, circulation data, mergerConfiguration
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Liquid glass for chat container - dynamic sizing
  const chatContainerRef = useLiquidGlass({ 
    width: isFullScreen ? window.innerWidth * 0.8 : 420, 
    height: isFullScreen ? window.innerHeight * 0.8 : 600 
  });

  // Data is automatically loaded and refreshed by DataContext

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle escape key for fullscreen mode
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    if (isFullScreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isFullScreen]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputText('');

    // Prepare messages for Claude API
    const messagesForAPI = [...messages.slice(1), userMessage].map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAPI })
      });
      const result = await response.json();
      const aiContent = result.success ? result.completion : `Error: ${result.error}`;

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Floating Action Button
  if (!isExpanded) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-blue-500/25"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <Brain className="relative w-8 h-8 text-white" />
          
          {/* Pulse indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-500 ${
      isFullScreen 
        ? 'inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm' 
        : 'bottom-8 right-8'
    }`}>
      <div 
        ref={chatContainerRef}
        className={`relative bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 transition-all duration-500 flex flex-col ${
          isFullScreen 
            ? 'w-[80vw] h-[80vh] max-w-6xl max-h-[900px]' 
            : isMinimized 
              ? 'w-80 h-20' 
              : 'w-96 h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-white font-medium">FORMULA</h3>
              <p className="text-white/60 text-xs">Merger Analysis Engine</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsFullScreen(!isFullScreen);
                if (isMinimized) setIsMinimized(false);
              }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${
                    isFullScreen ? 'max-w-2xl' : 'max-w-xs lg:max-w-sm'
                  } ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-lg'
                      : 'bg-white/10 backdrop-blur-sm text-gray-100 rounded-2xl rounded-bl-lg border border-white/20'
                  } px-4 py-3`}>
                    <div className="flex items-start space-x-3">
                      {message.type === 'ai' && (
                        <Brain className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <MarkdownRenderer 
                          content={message.content} 
                          className="text-sm leading-relaxed"
                        />
                        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                          <span>{formatTime(message.timestamp)}</span>
                          {message.confidence && (
                            <span className="font-mono">{message.confidence}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm text-gray-100 rounded-2xl rounded-bl-lg border border-white/20 px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask FORMULA about DAO mergers..."
                  className="flex-1 bg-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm border border-white/20 placeholder-white/50"
                />
                <button
                  onClick={handleVoiceInput}
                  className={`px-4 py-3 rounded-xl transition-all backdrop-blur-sm ${
                    isListening 
                      ? 'bg-red-600/80 hover:bg-red-600 border-red-500/50' 
                      : 'bg-white/10 hover:bg-white/20 border-white/20'
                  } border`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all backdrop-blur-sm"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-blue-400 mt-2 animate-pulse">
                  Listening... Speak your query
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FormulaChatWidget;