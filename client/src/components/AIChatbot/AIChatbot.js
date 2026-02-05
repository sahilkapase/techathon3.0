import React, { useState, useRef, useEffect } from 'react';
import './AIChatbot.css';

const AIChatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Namaste! I am your AI Agriculture Assistant. How can I help you with your farming queries today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Get farmer ID from local storage or use a default
            const user = JSON.parse(localStorage.getItem('user'));
            const farmerId = user ? user._id : 'guest_farmer';

            const response = await fetch('http://localhost:8000/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    farmerId: farmerId
                }),
            });

            const data = await response.json();

            if (data.status === 'ok') {
                setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
                console.error('Chatbot error:', data.error);
            }
        } catch (error) {
            console.error('Network error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please make sure the server is running.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>🌾 GrowFarm AI Assistant</h3>
            </div>

            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="message assistant">
                        <span className="loading-dots">Thinking</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask about crops, weather, schemes..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default AIChatbot;
