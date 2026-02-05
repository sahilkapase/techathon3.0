# Twilio Setup Guide for GrowFarm

## What You Need from Twilio

### 1. **Twilio Account** (Free Trial Available)
Sign up at: https://www.twilio.com/try-twilio

### 2. **Three Key Credentials**

#### A. Account SID
- **What it is**: Your unique Twilio account identifier
- **Where to find**: Twilio Console Dashboard → Account Info section
- **Looks like**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (34 characters)

#### B. Auth Token
- **What it is**: Secret key for API authentication
- **Where to find**: Twilio Console Dashboard → Account Info section (click "View" to reveal)
- **Looks like**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 characters)
- **⚠️ IMPORTANT**: Keep this secret! Never commit to GitHub

#### C. Twilio Phone Number (WhatsApp Sandbox)
- **What it is**: The phone number that sends WhatsApp messages
- **Where to find**: Twilio Console → Messaging → Try it out → Send a WhatsApp message
- **Format**: `whatsapp:+14155238886` (Sandbox number - FREE)
- **For Production**: Buy a dedicated number ($1-15/month)

---

## Setup Steps

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email and phone number
4. You'll get **$15 free credit**

### Step 2: Get Your Credentials
1. Login to Twilio Console
2. On the dashboard, you'll see:
   ```
   ACCOUNT SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   AUTH TOKEN: [Click "View" to reveal]
   ```
3. Copy both values

### Step 3: Set Up WhatsApp Sandbox (FREE - No Phone Number Needed)
1. Go to: Console → Messaging → Try WhatsApp
2. You'll see a sandbox number: `+1 415 523 8886`
3. **Activate your WhatsApp**:
   - Open WhatsApp on your phone
   - Send a message to `+1 415 523 8886`
   - Message content: `join <your-sandbox-code>` (e.g., `join happy-tiger`)
   - You'll receive a confirmation
4. Now this WhatsApp number can receive messages from your app!

### Step 4: Configure in Your Project

Create `.env` file in `server` folder:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 5: Update scheme_controller.js

The code is already set up! Just verify these lines exist:

```javascript
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
```

---

## Testing WhatsApp Notifications

### Test 1: New Scheme Notification
1. Add a new scheme via admin panel
2. Check your WhatsApp (the number you activated in sandbox)
3. You should receive a message with scheme details

### Test 2: Deadline Reminder
```bash
curl -X POST http://localhost:8000/scheme/reminders/send
```
Check WhatsApp for reminder messages

---

## For OTP/SMS (Optional - Costs Money)

If you want to send OTP via SMS (not WhatsApp):

### What You Need:
1. **Verified Phone Numbers** (Free tier):
   - Console → Phone Numbers → Verified Caller IDs
   - Add your phone number for testing
   
2. **Buy a Twilio Phone Number** (Production):
   - Console → Phone Numbers → Buy a number
   - Cost: $1-15/month depending on country
   - Choose a number with SMS capability

### Code for SMS OTP:
```javascript
client.messages.create({
    body: `Your OTP is: ${otp}`,
    from: '+1234567890', // Your Twilio number
    to: '+91' + farmerMobileNumber
})
```

---

## Current Implementation Status

### ✅ Already Working:
- WhatsApp notifications when new schemes are added
- Deadline reminders via WhatsApp
- Twilio client initialized in scheme_controller.js

### 📋 What's Using Twilio:
1. **New Scheme Notifications** (Line ~30 in scheme_controller.js)
   - Sends WhatsApp message to all eligible farmers
   
2. **Deadline Reminders** (Line ~1650 in scheme_controller.js)
   - Sends reminders for schemes expiring in 3-7 days

---

## Troubleshooting

### Error: "Authentication Error"
- **Fix**: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
- **Verify**: No extra spaces in .env file

### Error: "Unverified Number"
- **Fix**: Join WhatsApp sandbox first
- **Send**: `join <sandbox-code>` to +1 415 523 8886

### Error: "Insufficient Balance"
- **Fix**: Add credit to Twilio account
- **Free Tier**: $15 credit should be enough for testing

### Messages Not Received
- **Check**: WhatsApp number is activated in sandbox
- **Check**: Server is running and connected to MongoDB
- **Check**: Farmer's mobile number in database is correct

---

## Cost Breakdown

### Free Tier (Perfect for Hackathon):
- ✅ $15 free credit
- ✅ WhatsApp Sandbox (unlimited messages)
- ✅ Enough for 1000+ WhatsApp messages
- ✅ No credit card required initially

### Production Costs:
- WhatsApp: $0.005 per message (very cheap!)
- SMS: $0.0075 per message in India
- Phone Number: $1-15/month

---

## Quick Start Checklist

- [ ] Create Twilio account
- [ ] Copy Account SID
- [ ] Copy Auth Token
- [ ] Join WhatsApp Sandbox (send message to +1 415 523 8886)
- [ ] Create `server/.env` file with credentials
- [ ] Restart server
- [ ] Test by adding a new scheme
- [ ] Check WhatsApp for notification

---

## Summary

**For your hackathon, you only need:**
1. Twilio Account (free)
2. Account SID (from dashboard)
3. Auth Token (from dashboard)
4. WhatsApp Sandbox activation (send one message)

**Total time**: 5-10 minutes  
**Total cost**: $0 (uses free credit)

The WhatsApp notifications will work perfectly for your demo! 🎉
