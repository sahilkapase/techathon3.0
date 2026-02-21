import React, { useState, useEffect, useCallback } from "react"; 
import "./signup.css";
import app from "./firebase_config";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const auth = getAuth(app);

// Maharashtra districts
const maharashtraDistricts = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
  "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
  "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];

// Common crops
const commonCrops = [
  "Rice", "Wheat", "Jowar", "Bajra", "Maize", "Sugarcane", "Cotton",
  "Soybean", "Groundnut", "Tur", "Gram", "Onion", "Grapes", "Banana",
  "Tomato", "Potato", "Chilli", "Turmeric"
];

const FarmerSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form fields
  const [formData, setFormData] = useState({
    Name: "",
    Mobilenum: "",
    District: "",
    LandSize: "",
    CropTypes: [],
    Password: "",
    ConfirmPassword: "",
    Adharnum: "",
    Bankname: "",
    Accountnum: "",
    IFSC: ""
  });

  // OTP verification state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [testOtp, setTestOtp] = useState(""); // For testing mode
  
  // Set to true for testing (logs OTP to terminal), false for production (Firebase)
  const TEST_MODE = true;

  // OTP Timer
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Setup reCAPTCHA
  const setupRecaptcha = useCallback(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {}
      });
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  // Handle crop selection
  const toggleCrop = (crop) => {
    setFormData(prev => ({
      ...prev,
      CropTypes: prev.CropTypes.includes(crop)
        ? prev.CropTypes.filter(c => c !== crop)
        : [...prev.CropTypes, crop]
    }));
  };

  // Send OTP
  const sendOTP = async () => {
    if (!formData.Mobilenum || formData.Mobilenum.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (TEST_MODE) {
        // TEST MODE: Generate random OTP and log to console/backend
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setTestOtp(generatedOtp);
        
        // Log to browser console
        console.log("=".repeat(50));
        console.log("🔐 TEST MODE - OTP Generated");
        console.log(`📱 Mobile: +91${formData.Mobilenum}`);
        console.log(`🔢 OTP: ${generatedOtp}`);
        console.log("=".repeat(50));
        
        // Send to backend to log in terminal
        try {
          await axios.post("http://localhost:8000/farmer/test-otp", {
            mobile: formData.Mobilenum,
            otp: generatedOtp
          });
        } catch (e) {
          // Backend endpoint may not exist, just log to console
          console.log("(Backend logging not available, OTP shown in browser console only)");
        }
        
        setOtpSent(true);
        setOtpTimer(60);
        setSuccess(`OTP sent! Check terminal/console for OTP`);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        // PRODUCTION MODE: Use Firebase
        setupRecaptcha();
        const phoneNumber = "+91" + formData.Mobilenum;
        const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpTimer(60);
        setSuccess("OTP sent successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("OTP Error:", err);
      setError("Failed to send OTP. Please try again.");
      window.recaptchaVerifier = null;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (TEST_MODE) {
        // TEST MODE: Compare with generated OTP
        if (otp === testOtp) {
          setOtpVerified(true);
          setSuccess("Mobile number verified!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Invalid OTP. Please try again.");
        }
      } else {
        // PRODUCTION MODE: Verify with Firebase
        await confirmationResult.confirm(otp);
        setOtpVerified(true);
        setSuccess("Mobile number verified!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Validate Step 1
  const validateStep1 = () => {
    if (!formData.Name.trim()) {
      setError("Please enter your name");
      return false;
    }
    if (!otpVerified) {
      setError("Please verify your mobile number");
      return false;
    }
    if (!formData.District) {
      setError("Please select your district");
      return false;
    }
    return true;
  };

  // Validate Step 2
  const validateStep2 = () => {
    if (!formData.LandSize || parseFloat(formData.LandSize) <= 0) {
      setError("Please enter valid land size");
      return false;
    }
    if (formData.CropTypes.length === 0) {
      setError("Please select at least one crop");
      return false;
    }
    if (!formData.Password || formData.Password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.Password !== formData.ConfirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  // Next step
  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError("");
    }
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/farmer/farmersignup",
        {
          Name: formData.Name,
          Mobilenum: formData.Mobilenum,
          District: formData.District,
          State: "Maharashtra",
          LandSize: parseFloat(formData.LandSize),
          CropTypes: formData.CropTypes,
          Password: formData.Password,
          Adharnum: formData.Adharnum || null,
          Bankname: formData.Bankname || null,
          Accountnum: formData.Accountnum || null,
          IFSC: formData.IFSC || null
        }
      );

      if (response.data.status === "ok") {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        {/* Header */}
        <div className="signup-header">
          <div className="header-icon"></div>
          <h1>Farmer Registration</h1>
          <p>Join GrowFarm - Your Digital Farming Partner</p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
            <span className="step-num">1</span>
            <span className="step-text">Personal Info</span>
          </div>
          <div className="progress-line">
            <div className={`line-fill ${step >= 2 ? "filled" : ""}`}></div>
          </div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
            <span className="step-num">2</span>
            <span className="step-text">Farm Details</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="form-step fade-in">
              <h2 className="step-title"> Personal Information</h2>
              
              {/* Name */}
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="Name"
                  placeholder="Enter your full name"
                  value={formData.Name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Mobile with OTP */}
              <div className="form-group">
                <label>Mobile Number *</label>
                <div className="mobile-input-group">
                  <span className="country-code">+91</span>
                  <input
                    type="tel"
                    name="Mobilenum"
                    placeholder="Enter 10-digit mobile"
                    value={formData.Mobilenum}
                    onChange={handleChange}
                    maxLength={10}
                    disabled={otpVerified}
                    className="form-input mobile-input"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading || otpTimer > 0}
                      className="otp-btn"
                    >
                      {loading ? "..." : otpSent ? (otpTimer > 0 ? `${otpTimer}s` : "Resend") : "Send OTP"}
                    </button>
                  )}
                  {otpVerified && <span className="verified-badge"></span>}
                </div>
              </div>

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <div className="form-group otp-group">
                  <label>Enter OTP</label>
                  <div className="otp-input-group">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="form-input otp-input"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={verifyOTP}
                      disabled={loading}
                      className="verify-btn"
                    >
                      {loading ? "..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}

              {/* District */}
              <div className="form-group">
                <label>District (Maharashtra) *</label>
                <select
                  name="District"
                  value={formData.District}
                  onChange={handleChange}
                  className="form-input form-select"
                >
                  <option value="">Select your district</option>
                  {maharashtraDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button 
                type="button" 
                onClick={nextStep}
                className="btn-primary btn-next"
              >
                Next  Farm Details
              </button>
            </div>
          )}

          {/* Step 2: Farm Details */}
          {step === 2 && (
            <div className="form-step fade-in">
              <h2 className="step-title"> Farm Details</h2>

              {/* Land Size */}
              <div className="form-group">
                <label>Land Size (Acres) *</label>
                <input
                  type="number"
                  name="LandSize"
                  placeholder="Enter land size in acres"
                  value={formData.LandSize}
                  onChange={handleChange}
                  step="0.1"
                  min="0.1"
                  className="form-input"
                />
              </div>

              {/* Crops Selection */}
              <div className="form-group">
                <label>Crops You Grow *</label>
                <div className="crops-grid">
                  {commonCrops.map(crop => (
                    <button
                      key={crop}
                      type="button"
                      className={`crop-chip ${formData.CropTypes.includes(crop) ? "selected" : ""}`}
                      onClick={() => toggleCrop(crop)}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="form-row">
                <div className="form-group half">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="Password"
                    placeholder="Min 6 characters"
                    value={formData.Password}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group half">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="ConfirmPassword"
                    placeholder="Re-enter password"
                    value={formData.ConfirmPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Optional Section */}
              <div className="optional-section">
                <h3 className="optional-title">Optional Details</h3>
                
                <div className="form-group">
                  <label>Aadhaar Number (for verification)</label>
                  <input
                    type="text"
                    name="Adharnum"
                    placeholder="12-digit Aadhaar (optional)"
                    value={formData.Adharnum}
                    onChange={(e) => handleChange({ target: { name: "Adharnum", value: e.target.value.replace(/\D/g, "").slice(0, 12) } })}
                    maxLength={12}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="Bankname"
                    placeholder="Bank name (optional)"
                    value={formData.Bankname}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="Accountnum"
                      placeholder="Account number"
                      value={formData.Accountnum}
                      onChange={(e) => handleChange({ target: { name: "Accountnum", value: e.target.value.replace(/\D/g, "") } })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group half">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      name="IFSC"
                      placeholder="IFSC code"
                      value={formData.IFSC}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="btn-group">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                   Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary btn-submit"
                >
                  {loading ? "Registering..." : " Register as Farmer"}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="signup-footer">
          <p>Already have an account? <Link to="/login" className="login-link">Login here</Link></p>
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default FarmerSignup;
