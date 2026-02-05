# FastAPI Server Setup Guide - Email OTP Verification

## ✅ What Was Done

Added email OTP verification endpoint to FastAPI server:
- **Endpoint**: `GET /verify/{email}`
- **Port**: 5000 (as expected by frontend)
- **OTP Display**: Logs to terminal for easy testing

## 🚀 Quick Setup

### Step 1: Navigate to FastAPI Directory
```bash
cd "D:\Desktop\Techthon 3.0\GrowFarm\ML FAST API"
```

### Step 2: Install Dependencies (First Time Only)
```bash
pip install fastapi uvicorn python-multipart
```

**Note**: The full `requirements.txt` has 300+ packages (TensorFlow, PyTorch, etc.) which take a long time to install. For OTP functionality, you only need the 3 packages above.

### Step 3: Start FastAPI Server
```bash
uvicorn main:app1 --host 0.0.0.0 --port 5000 --reload
```

**Important**: Use `app1` not `app` (the FastAPI instance is named `app1` in main.py)

## 📱 How It Works

### Email OTP Flow:
1. User enters email in registration form
2. Clicks "Verify" button
3. Frontend calls: `http://127.0.0.1:5000/verify/{email}`
4. FastAPI generates 4-digit OTP
5. **OTP displays in FastAPI terminal** (for testing)
6. Frontend receives OTP in response
7. User enters OTP from terminal
8. Frontend verifies OTP

## 🧪 Testing

### Test Email OTP:
1. **Start FastAPI server** (port 5000)
2. **Start Node server** (port 8000)
3. **Start React client** (port 3001)
4. Go to registration form
5. Enter email: `sahilkapase97@gmail.com`
6. Click "Verify"
7. **Check FastAPI terminal** for OTP:
   ```
   ========================================
   📧 EMAIL OTP GENERATED
   ========================================
   Email: sahilkapase97@gmail.com
   OTP: 1234
   ========================================
   ```
8. Enter OTP in modal
9. Click "Verify OTP"

## 🖥️ Terminal Output Example

When email verification is requested, you'll see:

```
INFO:     127.0.0.1:xxxxx - "GET /verify/sahilkapase97@gmail.com HTTP/1.1" 200 OK

========================================
📧 EMAIL OTP GENERATED
========================================
Email: sahilkapase97@gmail.com
OTP: 3847
========================================
```

## 📊 Current Server Status

You need **3 servers running**:

### 1. Node.js Server (Backend)
```bash
cd server
npm start
# Port: 8000
# For: Mobile OTP, Schemes, Database
```

### 2. FastAPI Server (ML + Email OTP)
```bash
cd "ML FAST API"
uvicorn main:app1 --host 0.0.0.0 --port 5000 --reload
# Port: 5000
# For: Email OTP, Crop Recommendation, Disease Detection
```

### 3. React Client (Frontend)
```bash
cd client
npm start
# Port: 3001
# For: User Interface
```

## ⚡ Quick Start Commands

Open 3 separate terminals:

**Terminal 1 - Node Server:**
```bash
cd "D:\Desktop\Techthon 3.0\GrowFarm\server"
npm start
```

**Terminal 2 - FastAPI Server:**
```bash
cd "D:\Desktop\Techthon 3.0\GrowFarm\ML FAST API"
uvicorn main:app1 --host 0.0.0.0 --port 5000 --reload
```

**Terminal 3 - React Client:**
```bash
cd "D:\Desktop\Techthon 3.0\GrowFarm\client"
npm start
```

## 🔍 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'fastapi'"
**Fix**: Install FastAPI
```bash
pip install fastapi uvicorn
```

### Error: "Port 5000 already in use"
**Fix**: Kill the process or use different port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different port
uvicorn main:app1 --port 5001 --reload
# Then update frontend to use port 5001
```

### Error: "Cannot import torch/tensorflow"
**Fix**: These are only needed for ML features (crop recommendation, disease detection). For OTP only, you can comment out the imports at the top of main.py or just ignore the warnings.

## ✅ Verification Checklist

- [ ] FastAPI server running on port 5000
- [ ] Node server running on port 8000
- [ ] React client running on port 3001
- [ ] Can access: http://localhost:5000/docs (FastAPI Swagger UI)
- [ ] Email OTP endpoint working: http://localhost:5000/verify/test@example.com

## 🎯 For Hackathon Demo

**Recommended**: Start all 3 servers before your presentation:
1. Node server (8000) - for schemes and mobile OTP
2. FastAPI server (5000) - for email OTP
3. React client (3001) - for UI

**OTP will display in terminals** - keep them visible during demo!

## 📝 Production Notes

For production deployment:
- Uncomment email sending code in `main.py`
- Set up SMTP credentials (Gmail App Password)
- Remove OTP from API response
- Use Redis/database for OTP storage
- Add OTP expiration (10 minutes)

---

**Status**: ✅ Ready for testing!

Just run the FastAPI server and OTP will display in terminal for easy verification.
