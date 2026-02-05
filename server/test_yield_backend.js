const axios = require('axios');

async function testAPY() {
    const district = "Kachchh";
    const crop = "RICE";
    const url = `http://localhost:8000/area/apy/${district}/${crop}`;

    console.log(`Testing URL: ${url}`);

    try {
        const response = await axios.get(url);
        console.log("Status:", response.status);
        if (response.data.data && response.data.data.length > 0) {
            console.log("✅ Data Found:");
            console.log(`- Main Records: ${response.data.data.length}`);
            console.log(`- Highest Area Records: ${response.data.highest_area.length}`);
            console.log("- Sample Record:", response.data.data[0]);
        } else {
            console.log("⚠️ No Data Returned (Arrays are empty)");
            console.log("Response:", response.data);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Server Response:", error.response.data);
        }
    }
}

testAPY();
