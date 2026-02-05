import React, { useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './VoiceInput.css';

export default function VoiceInput({ onVoiceInput, placeholder = "Search schemes..." }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('en-IN');

    const languages = [
        { code: 'en-IN', name: 'English' },
        { code: 'hi-IN', name: 'हिंदी (Hindi)' },
        { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
        { code: 'mr-IN', name: 'मराठी (Marathi)' },
        { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
        { code: 'te-IN', name: 'తెలుగు (Telugu)' }
    ];

    const toggleListening = () => {
        if (!isListening) {
            // Start listening (mock implementation for demo)
            setIsListening(true);

            // Simulate voice recognition after 2 seconds
            setTimeout(() => {
                const mockTranscripts = {
                    'en-IN': 'Show me schemes for wheat farmers',
                    'hi-IN': 'गेहूं किसानों के लिए योजनाएं दिखाएं',
                    'gu-IN': 'ઘઉં ખેડૂતો માટે યોજનાઓ બતાવો',
                    'mr-IN': 'गहू शेतकऱ्यांसाठी योजना दाखवा',
                    'ta-IN': 'கோதுமை விவசாயிகளுக்கான திட்டங்களைக் காட்டு',
                    'te-IN': 'గోధుమ రైతుల కోసం పథకాలను చూపించు'
                };

                const mockText = mockTranscripts[language] || mockTranscripts['en-IN'];
                setTranscript(mockText);
                setIsListening(false);

                if (onVoiceInput) {
                    onVoiceInput(mockText);
                }
            }, 2000);
        } else {
            // Stop listening
            setIsListening(false);
        }
    };

    return (
        <div className="voice-input-container">
            <div className="voice-input-wrapper">
                <input
                    type="text"
                    className="voice-input-field"
                    placeholder={placeholder}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                />
                <button
                    className={`voice-button ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isListening ? (
                        <>
                            <FaMicrophoneSlash />
                            <span className="listening-pulse"></span>
                        </>
                    ) : (
                        <FaMicrophone />
                    )}
                </button>
                <select
                    className="language-selector"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    title="Select language"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>
            {isListening && (
                <div className="listening-indicator">
                    <span className="pulse-dot"></span>
                    Listening...
                </div>
            )}
        </div>
    );
}
