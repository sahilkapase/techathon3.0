# Fixing Twilio 401 Authentication Error

## ❌ Error You're Getting:
```
RestException [Error]: Authenticate
status: 401,
code: 20003
```

This means your **Auth Token is incorrect or has been regenerated**.

## 🔧 Solution: Get Fresh Credentials

### Step 1: Login to Twilio Console
Go to: https://console.twilio.com/

### Step 2: Get Your Current Auth Token
1. On the dashboard, you'll see:
   ```
   ACCOUNT SID
   Your_Account_SID
   
   AUTH TOKEN
   [Hidden - Click "View" to reveal]
   ```

2. **Click "View"** next to Auth Token
3. **Copy the EXACT token** (all 32 characters, no spaces!)

### Step 3: Verify Your Credentials

**Your Account SID**: `AC...` (Verify in console)

**Your Auth Token**: `...` (Verify in console)

### Step 4: Update If Needed

If the Auth Token is different, update these files:

#### File 1: `server/controllers/scheme_controller.js` (Line 9)
```javascript
const authToken = 'YOUR_NEW_AUTH_TOKEN_HERE';
```

#### File 2: `server/test-whatsapp.js` (Line 5)
```javascript
const authToken = 'YOUR_NEW_AUTH_TOKEN_HERE';
```

### Step 5: Restart Server
```bash
# Stop the current server (Ctrl+C)
cd server
npm start
```

## 🔍 Common Causes of 401 Error

1. **Auth Token was regenerated**
   - If you clicked "Reset" or "Regenerate" in Twilio Console
   - Old token becomes invalid immediately

2. **Typo in Auth Token**
   - Extra space at beginning/end
   - Missing character
   - Wrong case (though tokens are case-sensitive)

3. **Using Test Credentials**
   - Make sure you're using your actual account credentials
   - Not example/placeholder values

## ✅ How to Verify Credentials Are Correct

### Test 1: Check in Twilio Console
1. Go to: https://console.twilio.com/
2. Dashboard should show:
   - Account SID: `YOUR_ACCOUNT_SID`
   - Auth Token: Click "View" to see

### Test 2: Use Twilio's Test Tool
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Try sending a test message from there
3. If it works, copy those exact credentials

## 📞 Alternative: Use Environment Variables (Recommended)

Instead of hardcoding, use environment variables:

### Create `server/.env`:
```env
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Update `scheme_controller.js`:
```javascript
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
```

### Install dotenv:
```bash
cd server
npm install dotenv
```

## 🎯 Quick Fix Checklist

- [ ] Login to Twilio Console
- [ ] Click "View" on Auth Token
- [ ] Copy the EXACT token (32 characters)
- [ ] Verify it matches your code
- [ ] If different, update `scheme_controller.js` line 9
- [ ] If different, update `test-whatsapp.js` line 5
- [ ] Restart server: `npm start`
- [ ] Test again: `node test-whatsapp.js`

## 💡 Still Not Working?

If you've verified the Auth Token is correct and still getting 401:

1. **Check Account Status**
   - Make sure your Twilio account is active
   - Verify you have free credit ($15)

2. **Try Regenerating Auth Token**
   - In Twilio Console, click "Reset Auth Token"
   - Copy the NEW token
   - Update your code
   - Restart server

3. **Contact Twilio Support**
   - They can verify if there's an account issue

## 📋 What to Send Me

If still not working, please share:
1. Screenshot of Twilio Console showing Account SID (hide Auth Token!)
2. The exact error message you're getting
3. Confirm you can see the Auth Token in Twilio Console

**Most likely cause**: The Auth Token has been regenerated and needs to be updated in your code.

