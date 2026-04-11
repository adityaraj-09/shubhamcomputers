import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import API from '../api/axios';
import './AIBubble.css';

const AIBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! 🙏 I\'m Shubham AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data } = await API.post('/ai/chat', {
        message: userMessage,
        history: messages.slice(-10)
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting. Please try again!' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window slide-up">
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-avatar">🤖</div>
              <div>
                <div className="ai-chat-title">Shubham AI</div>
                <div className="ai-chat-status">Always here to help</div>
              </div>
            </div>
            <button className="modal-close" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                <div className="ai-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-msg-bubble ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-area">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={500}
              className="ai-input"
            />
            <button 
              className="ai-send-btn" 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button 
        className={`ai-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </>
  );
};

export default AIBubble;
