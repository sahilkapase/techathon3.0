const axios = require('axios');

async function testLogin(email, password) {
    console.log(`Testing Login for: ${email}`);
    try {
        const response = await axios.post('http://localhost:8000/expert/expert_login', {
            Email: email,
            Password: password
        });

        console.log("Status Code:", response.status);
        console.log("Response Data:", response.data);

        if (response.data.status === "error") {
            console.error("❌ Login Failed:", response.data.error);
        } else if (response.data.Email) {
            console.log("✅ Login Success!");
        } else {
            console.log("⚠️ Unknown response format");
        }

    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }
}

// Test with the default expert we created
testLogin("expert@growfarm.com", "password123");
