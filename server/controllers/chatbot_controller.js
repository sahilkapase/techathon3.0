const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini AI (Done dynamically in sendMessage now)
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation histories (in production, use Redis or database)
const conversationHistories = new Map();

// Agriculture-specific system prompt
const SYSTEM_PROMPT = `You are an expert agricultural advisor for GrowFarm, a platform helping farmers in Maharashtra, India. 

Your role is to:
- Provide practical farming advice on crops, soil, irrigation, and pest management
- Recommend crops suitable for Maharashtra's climate and soil conditions
- Explain government schemes and subsidies for farmers
- Suggest modern farming techniques and best practices
- Answer questions about crop diseases, fertilizers, and weather impacts

Keep responses:
- Concise and practical (2-3 paragraphs max)
- In simple language that farmers can understand
- Specific to Indian/Maharashtra agriculture when possible
- Actionable with clear next steps

If asked about topics outside agriculture, politely redirect to farming-related questions.`;

const axios = require('axios');

// Helper function to get weather
async function getWeather(location) {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) return "Weather API Key missing.";

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;

        return `Weather in ${data.name}: ${data.weather[0].description}, Temperature: ${data.main.temp}°C, Humidity: ${data.main.humidity}%`;
    } catch (error) {
        return `Could not fetch weather for ${location}. Reason: ${error.message}`;
    }
}

// Send message to AI chatbot
module.exports.sendMessage = async function (req, res) {
    try {
        const { message, farmerId } = req.body;

        console.log("Chatbot Request:", { message, farmerId });
        const apiKey = process.env.GEMINI_API_KEY;

        // ... (validation checks remain same) ...
        if (!apiKey) {
            console.error("ERROR: GEMINI_API_KEY is missing in server environment");
            return res.json({ status: "error", error: "API Key missing" });
        }
        if (!message || !farmerId) {
            return res.json({ status: "error", error: "Message and farmerId are required" });
        }

        // Get history
        if (!conversationHistories.has(farmerId)) conversationHistories.set(farmerId, []);
        const history = conversationHistories.get(farmerId);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Enhanced System Prompt for Tool Use
        let systemPrompt = SYSTEM_PROMPT + `
        
        You have access to a Weather Tool.
        If the user asks about weather/temperature for a specific place:
        1. Responds with strictly JSON: { "tool": "get_weather", "location": "city_name" }
        2. Do NOT provide any other text with the JSON.
        
        If no specific city is mentioned for weather, ask the user for the city name.
        For all other queries, answer normally as an agricultural expert.
        `;

        // Build context
        let conversationContext = systemPrompt + "\n\n";
        history.slice(-5).forEach(msg => {
            conversationContext += `${msg.role}: ${msg.content}\n`;
        });
        conversationContext += `User: ${message}\nAssistant:`;

        // First API Call - Check for intent
        let result = await model.generateContent(conversationContext);
        let aiMessage = result.response.text();

        // Check if AI wants to use the tool
        if (aiMessage.trim().startsWith('{') && aiMessage.includes("get_weather")) {
            try {
                // Parse tool request
                const toolRequest = JSON.parse(aiMessage.match(/\{.*\}/s)[0]);

                if (toolRequest.tool === "get_weather" && toolRequest.location) {
                    console.log(`🌤️ Weather Tool Triggered for: ${toolRequest.location}`);

                    // Fetch real data
                    const weatherData = await getWeather(toolRequest.location);

                    // Feed data back to AI
                    conversationContext += `${aiMessage}\nSystem (Tool Output): ${weatherData}\nAssistant:`;

                    // Second API Call - Final Answer
                    result = await model.generateContent(conversationContext);
                    aiMessage = result.response.text();
                }
            } catch (e) {
                console.error("Tool execution failed:", e);
                // Fallback: just send the raw AI JSON or a generic error if parsing failed (usually AI corrects itself in next turn)
                // But better to hide the JSON from user
                aiMessage = "I tried to check the weather but encountered an internal error.";
            }
        }

        // Update history
        history.push({ role: "User", content: message });
        history.push({ role: "Assistant", content: aiMessage });

        // Keep last 20
        if (history.length > 20) conversationHistories.set(farmerId, history.slice(-20));

        console.log('🤖 AI Response:', aiMessage.substring(0, 100) + '...');

        return res.json({
            status: "ok",
            message: aiMessage,
            conversationLength: history.length
        });

    } catch (error) {
        console.error('AI Chatbot Error:', error);
        return res.json({
            status: "error",
            error: "Failed to get AI response. " + (error.message || ""),
            details: JSON.stringify(error)
        });
    }
};

// Clear conversation history for a farmer
module.exports.clearHistory = function (req, res) {
    try {
        const { farmerId } = req.params;

        if (conversationHistories.has(farmerId)) {
            conversationHistories.delete(farmerId);
        }

        return res.json({
            status: "ok",
            message: "Conversation history cleared"
        });
    } catch (error) {
        console.error('Clear History Error:', error);
        return res.json({
            status: "error",
            error: "Failed to clear history"
        });
    }
};
