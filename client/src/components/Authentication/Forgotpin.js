import React, { useState, useEffect } from "react";
import { sha256 } from "js-sha256";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Forgotpin.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [mobilenum, setMobilenum] = useState("");
  const [otp, setOtp] = useState("");
  const [testOtp, setTestOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // TEST MODE
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

  // Send OTP
  const sendOTP = async () => {
    if (!mobilenum || mobilenum.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First check if mobile exists in database
      const checkResponse = await axios.get(
        `http://localhost:8000/farmer/mobilenumverify/${mobilenum}`
      );

      if (TEST_MODE) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setTestOtp(generatedOtp);
        
        console.log("=".repeat(50));
        console.log(" FORGOT PASSWORD - OTP Generated");
        console.log(` Mobile: +91${mobilenum}`);
        console.log(` OTP: ${generatedOtp}`);
        console.log("=".repeat(50));
        
        // Log to backend terminal
        try {
          await axios.post("http://localhost:8000/farmer/test-otp", {
            mobile: mobilenum,
            otp: generatedOtp
          });
        } catch (e) {
          console.log("Backend logging available in server terminal");
        }
        
        setStep(2);
        setOtpTimer(60);
        setSuccess("OTP sent! Check server terminal for OTP.");
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Mobile number not registered or server error");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (TEST_MODE) {
      if (otp === testOtp) {
        setStep(3);
        setSuccess("OTP verified! Set your new password.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    }
  };

  // Reset Password
  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const hashedPassword = sha256(newPassword);
      
      const response = await axios.post(
        "http://localhost:8000/farmer/forgotpassword",
        {
          Mobilenum: mobilenum,
          Password: hashedPassword
        }
      );

      if (response.data.status === "ok") {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/sign-in"), 2000);
      } else {
        setError(response.data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-container">
        {/* Header */}
        <div className="forgot-header">
          <div className="header-icon"></div>
          <h1>Reset Password</h1>
          <p>Recover access to your account</p>
        </div>

        {/* Progress */}
        <div className="forgot-progress">
          <div className={`progress-dot ${step >= 1 ? "active" : ""}`}>
            <span>1</span>
            <p>Mobile</p>
          </div>
          <div className={`progress-line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`progress-dot ${step >= 2 ? "active" : ""}`}>
            <span>2</span>
            <p>Verify</p>
          </div>
          <div className={`progress-line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`progress-dot ${step >= 3 ? "active" : ""}`}>
            <span>3</span>
            <p>Reset</p>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="forgot-form">
          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <div className="form-step fade-in">
              <h2> Enter Mobile Number</h2>
              <p className="step-desc">Enter your registered mobile number to receive OTP</p>
              
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="mobile-group">
                  <span className="country-code">+91</span>
                  <input
                    type="tel"
                    value={mobilenum}
                    onChange={(e) => {
                      setMobilenum(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="Enter 10-digit mobile"
                    maxLength={10}
                    className="form-input"
                  />
                </div>
              </div>

              <button
                onClick={sendOTP}
                disabled={loading || mobilenum.length !== 10}
                className="btn-primary"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="form-step fade-in">
              <h2> Enter OTP</h2>
              <p className="step-desc">Enter the 6-digit code sent to +91{mobilenum}</p>
              
              <div className="form-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="form-input otp-input"
                />
                {otpTimer > 0 && (
                  <p className="timer">Resend OTP in {otpTimer}s</p>
                )}
                {otpTimer === 0 && (
                  <button onClick={sendOTP} className="resend-btn">
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="btn-group">
                <button onClick={() => setStep(1)} className="btn-secondary">
                   Back
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={otp.length !== 6}
                  className="btn-primary"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="form-step fade-in">
              <h2> Set New Password</h2>
              <p className="step-desc">Create a strong password for your account</p>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Min 6 characters"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Re-enter password"
                  className="form-input"
                />
              </div>

              <button
                onClick={resetPassword}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Resetting..." : " Reset Password"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="forgot-footer">
          <p>Remember your password? <Link to="/sign-in" className="login-link">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
