/**
 * Chatbot Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 * Handles Gemini AI chatbot with farming expertise
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { prisma } = require('../config/prisma');
const axios = require('axios');
require('dotenv').config();

// Store conversation histories in memory (in production, use Redis or database)
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

// ==================== HELPER: GET WEATHER ====================
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

// ==================== SEND MESSAGE TO CHATBOT ====================
module.exports.sendMessage = async function (req, res) {
  try {
    const { message, farmerId } = req.body;

    console.log("Chatbot Request:", { message, farmerId });

    // Validate inputs
    if (!message || !farmerId) {
      return res.json({
        status: "error",
        error: "Message and farmerId are required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERROR: GEMINI_API_KEY is missing in server environment");
      return res.json({
        status: "error",
        error: "API Key missing"
      });
    }

    // Verify farmer exists
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: farmerId }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Get or create conversation history for this farmer
    if (!conversationHistories.has(farmerId)) {
      conversationHistories.set(farmerId, []);
    }
    const history = conversationHistories.get(farmerId);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Enhanced System Prompt for Tool Use
    let systemPrompt = SYSTEM_PROMPT + `
        
        You have access to a Weather Tool.
        If the user asks about weather/temperature for a specific place:
        1. Respond with strictly JSON: { "tool": "get_weather", "location": "city_name" }
        2. Do NOT provide any other text with the JSON.
        
        If no specific city is mentioned for weather, ask the user for the city name.
        For all other queries, answer normally as an agricultural expert.
        `;

    // Build conversation context
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
        aiMessage = "I tried to check the weather but encountered an internal error.";
      }
    }

    // Update history
    history.push({ role: "User", content: message });
    history.push({ role: "Assistant", content: aiMessage });

    // Keep last 20 messages
    if (history.length > 20) {
      conversationHistories.set(farmerId, history.slice(-20));
    }

    // Save message to database
    try {
      await prisma.message.create({
        data: {
          farmerId: farmer.id,
          senderType: "farmer",
          content: message,
          messageType: "text"
        }
      });

      // Save AI response
      await prisma.message.create({
        data: {
          farmerId: farmer.id,
          senderType: "chatbot",
          content: aiMessage,
          messageType: "text"
        }
      });
    } catch (dbError) {
      console.log("Warning: Could not save message to database:", dbError);
      // Continue anyway - chatbot still works even if DB save fails
    }

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

// ==================== CLEAR CONVERSATION HISTORY ====================
module.exports.clearHistory = async function (req, res) {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    // Verify farmer exists
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: farmerId }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Clear in-memory history
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

// ==================== GET CONVERSATION HISTORY ====================
module.exports.getConversationHistory = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const { limit = 20 } = req.query;

    if (!farmerId) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    // Verify farmer exists
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: farmerId }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Get messages from database
    const messages = await prisma.message.findMany({
      where: {
        farmerId: farmer.id,
        senderType: {
          in: ['farmer', 'chatbot']
        }
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      status: "ok",
      count: messages.length,
      messages: messages.reverse()
    });

  } catch (error) {
    console.error('Get History Error:', error);
    return res.json({
      status: "error",
      error: "Failed to get conversation history"
    });
  }
};

// ==================== DELETE CONVERSATION ====================
module.exports.deleteConversation = async function (req, res) {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    // Verify farmer exists
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: farmerId }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Delete all messages for this farmer
    const result = await prisma.message.deleteMany({
      where: {
        farmerId: farmer.id,
        senderType: {
          in: ['farmer', 'chatbot']
        }
      }
    });

    // Clear in-memory history
    if (conversationHistories.has(farmerId)) {
      conversationHistories.delete(farmerId);
    }

    return res.json({
      status: "ok",
      message: "Conversation deleted successfully",
      deletedMessages: result.count
    });

  } catch (error) {
    console.error('Delete Conversation Error:', error);
    return res.json({
      status: "error",
      error: "Failed to delete conversation"
    });
  }
};
