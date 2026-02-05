const mongoose = require('mongoose');
require('dotenv').config();
const Apydata = require('./models/apy');

const sampleData = [
    // RICE in Kachchh
    { District: "Kachchh", Crop: "RICE", Year: 2016, Area: 500, Prod: 1500, Yield: 3.0 },
    { District: "Kachchh", Crop: "RICE", Year: 2017, Area: 550, Prod: 1700, Yield: 3.1 },
    { District: "Kachchh", Crop: "RICE", Year: 2018, Area: 600, Prod: 1900, Yield: 3.2 },
    { District: "Kachchh", Crop: "RICE", Year: 2019, Area: 580, Prod: 1800, Yield: 3.1 },
    { District: "Kachchh", Crop: "RICE", Year: 2020, Area: 620, Prod: 2100, Yield: 3.4 },
    { District: "Kachchh", Crop: "RICE", Year: 2021, Area: 650, Prod: 2300, Yield: 3.5 },

    // WHEAT in Kachchh
    { District: "Kachchh", Crop: "WHEAT", Year: 2016, Area: 400, Prod: 1200, Yield: 3.0 },
    { District: "Kachchh", Crop: "WHEAT", Year: 2017, Area: 450, Prod: 1350, Yield: 3.0 },
    { District: "Kachchh", Crop: "WHEAT", Year: 2018, Area: 420, Prod: 1300, Yield: 3.1 },
    { District: "Kachchh", Crop: "WHEAT", Year: 2019, Area: 480, Prod: 1500, Yield: 3.1 },
    { District: "Kachchh", Crop: "WHEAT", Year: 2020, Area: 500, Prod: 1600, Yield: 3.2 },
    { District: "Kachchh", Crop: "WHEAT", Year: 2021, Area: 550, Prod: 1800, Yield: 3.3 },

    // RICE in Ahmedabad
    { District: "Ahmedabad", Crop: "RICE", Year: 2016, Area: 800, Prod: 2500, Yield: 3.1 },
    { District: "Ahmedabad", Crop: "RICE", Year: 2017, Area: 850, Prod: 2700, Yield: 3.2 },
    { District: "Ahmedabad", Crop: "RICE", Year: 2018, Area: 900, Prod: 2900, Yield: 3.2 },
    { District: "Ahmedabad", Crop: "RICE", Year: 2019, Area: 880, Prod: 2800, Yield: 3.1 },
    { District: "Ahmedabad", Crop: "RICE", Year: 2020, Area: 950, Prod: 3100, Yield: 3.3 },
    { District: "Ahmedabad", Crop: "RICE", Year: 2021, Area: 1000, Prod: 3500, Yield: 3.5 }
];

async function seedAPY() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Use 'insertMany' but we won't delete existing to be safe, just add
        const result = await Apydata.insertMany(sampleData);
        console.log(`✅ Seeded ${result.length} APY records.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

seedAPY();
