const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/admin_details');

async function getAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const admins = await Admin.find({});
        console.log("\n--- ADMIN CREDENTIALS ---");
        admins.forEach(a => {
            console.log(`Username: ${a.Username} | Password: ${a.Password} | Name: ${a.Name}`);
        });
        console.log("-------------------------\n");

        if (admins.length === 0) {
            console.log("No admins found!");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

getAdmins();
