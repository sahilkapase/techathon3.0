# AS-4 Feature Testing Guide

## Quick Start

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Access Enhanced Schemes:**
   - Navigate to: `http://localhost:3001/enhanced-schemes`
   - (Or whatever port your React app is running on)

## Sample Data for Testing

### Adding a Test Scheme with All Features

Use MongoDB Compass or shell to add a sample scheme:

```javascript
db.getCollection("scheme details").insertOne({
  "Title": "PM-KISAN Crop Insurance Scheme 2024",
  "Schemeid": "12345678",
  "Description": "This scheme provides financial assistance and insurance coverage to farmers for crop cultivation. Eligible farmers receive direct income support and comprehensive insurance against crop failure.",
  "SimplifiedDescription": "सरकार किसानों को फसल उगाने के लिए पैसे देती है और अगर फसल खराब हो जाए तो बीमा भी देती है। (Government gives money to farmers for growing crops and also provides insurance if crops fail.)",
  "Benefits": "₹6000 annual income support + Crop insurance coverage up to ₹2 lakhs",
  "How": "Apply online through PM-KISAN portal or visit nearest CSC center with Aadhaar card and land documents",
  "More": "https://pmkisan.gov.in",
  "Start": new Date("2024-01-01"),
  "Expired": new Date("2024-12-31"),
  "Category": ["General", "SC", "ST", "OBC"],
  "Farmertype": ["Small", "Marginal"],
  "CropTypes": ["Wheat", "Rice", "Cotton"],
  "MinLandSize": 0.5,
  "MaxLandSize": 5,
  "Season": ["Kharif", "Rabi"],
  "SubsidyAmount": "₹6,000 per year + Insurance premium subsidy",
  "InsuranceOptions": [
    {
      "provider": "Agriculture Insurance Company of India",
      "coverageAmount": 200000,
      "premium": 5000,
      "description": "Comprehensive crop insurance covering natural calamities"
    },
    {
      "provider": "HDFC ERGO General Insurance",
      "coverageAmount": 150000,
      "premium": 3500,
      "description": "Weather-based crop insurance"
    }
  ],
  "ReminderSent": false,
  "Applied": 0,
  "Approved": 0,
  "Reject": 0,
  "Status": "Active",
  "Farmers": []
});
```

### Update Farmer Profile for Testing

Update a farmer's profile to test filtering:

```javascript
db.getCollection("Farmer's information").updateOne(
  { "Farmerid": "YOUR_FARMER_ID" },
  {
    $set: {
      "CropTypes": ["Wheat", "Rice"],
      "LandSize": 2.5,
      "PreferredLanguage": "Hindi"
    }
  }
);
```

## Testing Checklist

### ✅ Voice Input
1. Click microphone button
2. Select language (Hindi, Gujarati, etc.)
3. Wait 2 seconds for mock transcription
4. Verify search query appears

### ✅ Filters
1. Select crop type (Wheat)
2. Verify only matching schemes show
3. Select season (Kharif)
4. Verify filtered results
5. Click "Clear Filters"

### ✅ Insurance Display
1. Click "More Info" on a scheme
2. Verify insurance options table appears
3. Check provider, coverage, premium details

### ✅ Simplified Language
1. In scheme modal, toggle "Simple Language" switch
2. Verify description changes to SimplifiedDescription
3. Toggle back to see original

### ✅ Subsidy Display
1. Check "Subsidy" column in table
2. Verify subsidy amount shows with icon
3. Check modal for detailed subsidy info

### ✅ Deadline Badges
1. Create scheme expiring in 5 days
2. Verify red "X days left!" badge appears
3. Check modal shows urgent deadline warning

### ✅ Auto-filled PDF
1. Click "Download Auto-filled PDF"
2. Open PDF
3. Verify farmer details are pre-filled:
   - Farmer ID, Name, Category, Type
   - District, Taluka, Village, Mobile
4. Verify scheme details included
5. Check insurance options table in PDF

### ✅ Deadline Reminders (Backend)
1. Create scheme expiring in 5 days
2. Call reminder API:
   ```bash
   curl -X POST http://localhost:8000/scheme/reminders/send
   ```
3. Check WhatsApp for reminder message
4. Verify ReminderSent flag set to true

## API Endpoints to Test

```bash
# Enhanced eligibility
GET http://localhost:8000/scheme/enhanced/eligible/:farmerid

# Insurance options
GET http://localhost:8000/scheme/insurance/:schemeid

# Simplified explanation
GET http://localhost:8000/scheme/simplified/:schemeid

# Send reminders
POST http://localhost:8000/scheme/reminders/send
```

## Troubleshooting

**Issue**: Enhanced schemes page shows no data
- **Fix**: Check if farmer has CropTypes and LandSize set
- **Fix**: Verify server is running on port 8000

**Issue**: Voice input doesn't work
- **Note**: This is a mock implementation for demo
- **Expected**: Shows sample text after 2 seconds

**Issue**: Insurance options not showing
- **Fix**: Ensure scheme has InsuranceOptions array in database

**Issue**: PDF download fails
- **Fix**: Check if jsPDF and autoTable are installed
- **Fix**: Verify farmer data exists in localStorage

## WhatsApp/IVR Note

WhatsApp notifications are already implemented via Twilio. For IVR:
- Requires Twilio phone number provisioning
- See `scheme_controller.js` for WhatsApp implementation
- IVR would follow similar pattern with voice responses

## Demo Tips

1. **Show voice input**: Click mic, wait for animation, show transcription
2. **Demonstrate filters**: Filter by crop → show count changes
3. **Highlight insurance**: Open modal → show insurance table
4. **Toggle language**: Switch to simplified → back to technical
5. **Generate PDF**: Download → open → show auto-filled details
6. **Deadline urgency**: Point out red badges for expiring schemes
