require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function findWorkingModel() {
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing");
        return;
    }

    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.5-flash",
        "gemini-2.5-flash"
    ];

    console.log("Testing available Gemini models...\n");

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing: ${modelName}...`);
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent("Hello");
            const response = await result.response;
            
            if (response.text()) {
                console.log(`✅ ${modelName} - WORKS!\n`);
            }
        } catch (err) {
            console.log(`❌ ${modelName} - ${err.message.split('\n')[0]}\n`);
        }
    }
}

findWorkingModel();
