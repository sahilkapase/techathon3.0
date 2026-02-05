// Seed script to add Maharashtra District, Taluka, and Village data
// Run this file: node seed-maharashtra-data.js

require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/district');

// MongoDB connection
const URI = process.env.MONGODB_URI || "mongodb+srv://sahilkapase97_db_user:0fYwDPjBMhZKU7Sy@cluster0.uigit4n.mongodb.net/?appName=Cluster0";

mongoose.connect(URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Sample Maharashtra data (Pune district as example)
// Add more districts/talukas/villages as needed
const maharashtraData = [
    // Pune District
    { District: "Pune", Taluka: "Pune City", Village: "Shivajinagar" },
    { District: "Pune", Taluka: "Pune City", Village: "Kothrud" },
    { District: "Pune", Taluka: "Pune City", Village: "Deccan" },
    { District: "Pune", Taluka: "Haveli", Village: "Kharadi" },
    { District: "Pune", Taluka: "Haveli", Village: "Wagholi" },
    { District: "Pune", Taluka: "Haveli", Village: "Hadapsar" },
    { District: "Pune", Taluka: "Mulshi", Village: "Mulshi" },
    { District: "Pune", Taluka: "Mulshi", Village: "Paud" },
    { District: "Pune", Taluka: "Maval", Village: "Lonavala" },
    { District: "Pune", Taluka: "Maval", Village: "Khandala" },
    { District: "Pune", Taluka: "Bhor", Village: "Bhor" },
    { District: "Pune", Taluka: "Baramati", Village: "Baramati" },
    { District: "Pune", Taluka: "Indapur", Village: "Indapur" },
    { District: "Pune", Taluka: "Daund", Village: "Daund" },
    { District: "Pune", Taluka: "Purandar", Village: "Saswad" },
    { District: "Pune", Taluka: "Shirur", Village: "Shirur" },
    { District: "Pune", Taluka: "Junnar", Village: "Junnar" },
    { District: "Pune", Taluka: "Ambegaon", Village: "Ghodegaon" },

    // Mumbai City
    { District: "Mumbai City", Taluka: "Mumbai City", Village: "Colaba" },
    { District: "Mumbai City", Taluka: "Mumbai City", Village: "Fort" },
    { District: "Mumbai City", Taluka: "Mumbai City", Village: "Marine Lines" },
    { District: "Mumbai City", Taluka: "Mumbai City", Village: "Girgaon" },
    { District: "Mumbai City", Taluka: "Mumbai City", Village: "Byculla" },

    // Mumbai Suburban
    { District: "Mumbai Suburban", Taluka: "Andheri", Village: "Andheri East" },
    { District: "Mumbai Suburban", Taluka: "Andheri", Village: "Andheri West" },
    { District: "Mumbai Suburban", Taluka: "Borivali", Village: "Borivali East" },
    { District: "Mumbai Suburban", Taluka: "Borivali", Village: "Borivali West" },
    { District: "Mumbai Suburban", Taluka: "Kurla", Village: "Kurla East" },
    { District: "Mumbai Suburban", Taluka: "Kurla", Village: "Kurla West" },

    // Nashik
    { District: "Nashik", Taluka: "Nashik", Village: "Nashik Road" },
    { District: "Nashik", Taluka: "Nashik", Village: "College Road" },
    { District: "Nashik", Taluka: "Igatpuri", Village: "Igatpuri" },
    { District: "Nashik", Taluka: "Sinnar", Village: "Sinnar" },
    { District: "Nashik", Taluka: "Dindori", Village: "Dindori" },
    { District: "Nashik", Taluka: "Trimbakeshwar", Village: "Trimbak" },

    // Nagpur
    { District: "Nagpur", Taluka: "Nagpur Urban", Village: "Sitabuldi" },
    { District: "Nagpur", Taluka: "Nagpur Urban", Village: "Dharampeth" },
    { District: "Nagpur", Taluka: "Nagpur Rural", Village: "Kamptee" },
    { District: "Nagpur", Taluka: "Nagpur Rural", Village: "Umred" },
    { District: "Nagpur", Taluka: "Ramtek", Village: "Ramtek" },

    // Aurangabad
    { District: "Aurangabad", Taluka: "Aurangabad", Village: "Aurangabad City" },
    { District: "Aurangabad", Taluka: "Paithan", Village: "Paithan" },
    { District: "Aurangabad", Taluka: "Gangapur", Village: "Gangapur" },
    { District: "Aurangabad", Taluka: "Vaijapur", Village: "Vaijapur" },

    // Solapur
    { District: "Solapur", Taluka: "Solapur North", Village: "Solapur City" },
    { District: "Solapur", Taluka: "Solapur South", Village: "Solapur South" },
    { District: "Solapur", Taluka: "Barshi", Village: "Barshi" },
    { District: "Solapur", Taluka: "Pandharpur", Village: "Pandharpur" },

    // Ahmednagar
    { District: "Ahmednagar", Taluka: "Ahmednagar", Village: "Ahmednagar City" },
    { District: "Ahmednagar", Taluka: "Shrirampur", Village: "Shrirampur" },
    { District: "Ahmednagar", Taluka: "Rahuri", Village: "Rahuri" },
    { District: "Ahmednagar", Taluka: "Sangamner", Village: "Sangamner" },

    // Kolhapur
    { District: "Kolhapur", Taluka: "Kolhapur", Village: "Kolhapur City" },
    { District: "Kolhapur", Taluka: "Panhala", Village: "Panhala" },
    { District: "Kolhapur", Taluka: "Shahuwadi", Village: "Shahuwadi" },
    { District: "Kolhapur", Taluka: "Kagal", Village: "Kagal" },

    // Satara
    { District: "Satara", Taluka: "Satara", Village: "Satara City" },
    { District: "Satara", Taluka: "Karad", Village: "Karad" },
    { District: "Satara", Taluka: "Wai", Village: "Wai" },
    { District: "Satara", Taluka: "Phaltan", Village: "Phaltan" },

    // Sangli
    { District: "Sangli", Taluka: "Sangli", Village: "Sangli City" },
    { District: "Sangli", Taluka: "Miraj", Village: "Miraj" },
    { District: "Sangli", Taluka: "Tasgaon", Village: "Tasgaon" },

    // Thane
    { District: "Thane", Taluka: "Thane", Village: "Thane City" },
    { District: "Thane", Taluka: "Kalyan", Village: "Kalyan" },
    { District: "Thane", Taluka: "Bhiwandi", Village: "Bhiwandi" },
    { District: "Thane", Taluka: "Ulhasnagar", Village: "Ulhasnagar" },

    // Add more districts as needed...
];

async function seedData() {
    try {
        console.log('🗑️  Clearing existing Maharashtra data...');
        await District.deleteMany({
            District: {
                $in: [
                    "Pune", "Mumbai City", "Mumbai Suburban", "Nashik",
                    "Nagpur", "Aurangabad", "Solapur", "Ahmednagar",
                    "Kolhapur", "Satara", "Sangli", "Thane"
                ]
            }
        });

        console.log('📝 Inserting Maharashtra data...');
        await District.insertMany(maharashtraData);

        console.log(`✅ Successfully added ${maharashtraData.length} records!`);
        console.log('📊 Data breakdown:');

        const districts = [...new Set(maharashtraData.map(d => d.District))];
        districts.forEach(dist => {
            const count = maharashtraData.filter(d => d.District === dist).length;
            console.log(`   - ${dist}: ${count} villages`);
        });

        console.log('\n✨ Database seeding complete!');
        console.log('🚀 You can now use the dropdown menus in registration form');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

// Wait for connection then seed
mongoose.connection.once('open', () => {
    seedData();
});
