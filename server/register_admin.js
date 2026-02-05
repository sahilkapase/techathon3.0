const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/admin_details');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const defaultAdmin = {
            Username: "admin",
            Password: "admin123"
        };

        const existing = await Admin.findOne({ Username: defaultAdmin.Username });
        if (existing) {
            console.log("Default admin already exists.");
        } else {
            const newAdmin = await Admin.create(defaultAdmin);
            console.log("✅ Created Default Admin:");
            console.log(newAdmin);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

seedAdmin();
