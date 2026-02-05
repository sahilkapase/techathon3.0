const axios = require('axios');

async function testAdminLogin(username, password) {
    console.log(`Testing Admin Login for: ${username}`);
    try {
        const response = await axios.post('http://localhost:8000/admin/login', {
            Username: username,
            Password: password
        });

        console.log("Status Code:", response.status);
        console.log("Response Data:", response.data);

        if (response.data.status === "error") {
            console.error("❌ Login Failed:", response.data.error);
        } else if (response.data.Username) {
            console.log("✅ Login Success!");
        } else {
            console.log("⚠️ Unknown response format");
        }

    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }
}

// Test with the default admin we created
testAdminLogin("admin", "admin123");
    