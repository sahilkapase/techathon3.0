const mongoose = require('mongoose');
require('dotenv').config();
const Expert = require('./models/experts_registration');

async function getExperts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const experts = await Expert.find({});
        console.log("\n--- EXPERT CREDENTIALS ---");
        experts.forEach(e => {
            console.log(`Email: ${e.Email} | Password: ${e.Password}`);
        });
        console.log("--------------------------\n");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

getExperts();
