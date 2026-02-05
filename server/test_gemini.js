require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    console.log("Testing Gemini API...");

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing from .env");
        return;
    }
    console.log("✅ Found GEMINI_API_KEY (" + key.length + " chars)");

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending 'Hello' to Gemini...");
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();

        console.log("✅ API SUCCESS!");
        console.log("Response:", text);
    } catch (error) {
        console.error("❌ API FAILURE:");
        console.error(error.message);
        if (error.response) {
            console.error("Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
