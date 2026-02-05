const mongoose = require('mongoose');
require('dotenv').config();
const Expert = require('./models/experts_registration');

async function seedExpert() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const defaultExpert = {
            Email: "expert@growfarm.com",
            Password: "password123",
            Name: "Dr. Green",
            Mobile_no: 1234567890
        };

        const existing = await Expert.findOne({ Email: defaultExpert.Email });
        if (existing) {
            console.log("Default expert already exists.");
        } else {
            const newExpert = await Expert.create(defaultExpert);
            console.log("✅ Created Default Expert:");
            console.log(newExpert);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

seedExpert();
