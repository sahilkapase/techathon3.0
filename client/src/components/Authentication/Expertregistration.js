import React, { useEffect, useContext, useState } from "react";
import "./Expertregistration.css";

function Expertregistration() {
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Mobile_no: "",
    Password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Name.trim()) {
      newErrors.Name = "Name is required";
    }

    if (!formData.Email.trim()) {
      newErrors.Email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = "Email is invalid";
    }

    if (!formData.Mobile_no.trim()) {
      newErrors.Mobile_no = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.Mobile_no)) {
      newErrors.Mobile_no = "Mobile number must be 10 digits";
    }

    if (!formData.Password) {
      newErrors.Password = "Password is required";
    } else if (formData.Password.length < 6) {
      newErrors.Password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/expert/registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();

      setIsLoading(false);

      if (data.status === "ok") {
        alert("Registration Successful! Please Login.");
        window.location.href = "/Expertlogin";
      } else {
        alert(data.error || "Registration Failed");
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert("Network Error. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="expert-registration-wrapper">
        <div className="expert-registration-container">
          {/* Left Side - Form */}
          <div className="expert-form-section">
            <div className="expert-form-content">
              <div className="expert-header">
                <div className="expert-icon-badge">
                  <span className="expert-icon">🎓</span>
                </div>
                <h1 className="expert-form-title">Expert Registration</h1>
                <p className="expert-form-subtitle">
                  Join our network of agricultural experts and help farmers succeed
                </p>
              </div>

              <form className="expert-registration-form" onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="expert-form-group">
                  <label className="expert-input-label">
                    <span className="label-text">Full Name</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">👤</span>
                    <input
                      type="text"
                      name="Name"
                      value={formData.Name}
                      className={`expert-form-input ${errors.Name ? "error" : ""}`}
                      placeholder="Enter your full name"
                      onChange={handleChange}
                    />
                  </div>
                  {errors.Name && (
                    <span className="error-message">⚠️ {errors.Name}</span>
                  )}
                </div>

                {/* Email Field */}
                <div className="expert-form-group">
                  <label className="expert-input-label">
                    <span className="label-text">Email Address</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">📧</span>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      className={`expert-form-input ${errors.Email ? "error" : ""}`}
                      placeholder="expert@example.com"
                      onChange={handleChange}
                    />
                  </div>
                  {errors.Email && (
                    <span className="error-message">⚠️ {errors.Email}</span>
                  )}
                </div>

                {/* Mobile Number Field */}
                <div className="expert-form-group">
                  <label className="expert-input-label">
                    <span className="label-text">Mobile Number</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">📱</span>
                    <input
                      type="tel"
                      name="Mobile_no"
                      value={formData.Mobile_no}
                      className={`expert-form-input ${errors.Mobile_no ? "error" : ""}`}
                      placeholder="10-digit mobile number"
                      onChange={handleChange}
                      maxLength="10"
                    />
                  </div>
                  {errors.Mobile_no && (
                    <span className="error-message">⚠️ {errors.Mobile_no}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="expert-form-group">
                  <label className="expert-input-label">
                    <span className="label-text">Password</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="Password"
                      value={formData.Password}
                      className={`expert-form-input ${errors.Password ? "error" : ""}`}
                      placeholder="Minimum 6 characters"
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.Password && (
                    <span className="error-message">⚠️ {errors.Password}</span>
                  )}
                </div>

                {/* Info Box */}
                <div className="expert-info-box">
                  <span className="info-icon">💡</span>
                  <span className="info-text">
                    As an expert, you'll be able to provide guidance and support to farmers
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`expert-submit-btn ${isLoading ? "loading" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="expert-spinner"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <span>Register as Expert</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                {/* Footer Links */}
                <div className="expert-form-footer">
                  <p className="footer-text">
                    Already registered?{" "}
                    <a href="/Expertlogin" className="footer-link">
                      Login here
                    </a>
                  </p>
                  <p className="footer-text">
                    Are you a farmer?{" "}
                    <a href="/sign-up" className="footer-link">
                      Farmer Registration
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="expert-image-section">
            <div className="expert-image-overlay">
              <div className="expert-stats">
                <div className="stat-card">
                  <div className="stat-icon">👨‍🌾</div>
                  <div className="stat-content">
                    <h3 className="stat-number">10,000+</h3>
                    <p className="stat-label">Farmers Helped</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💬</div>
                  <div className="stat-content">
                    <h3 className="stat-number">50,000+</h3>
                    <p className="stat-label">Consultations</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3 className="stat-number">4.8/5</h3>
                    <p className="stat-label">Expert Rating</p>
                  </div>
                </div>
              </div>
              <div className="overlay-content">
                <h2 className="overlay-title">Share Your Expertise</h2>
                <p className="overlay-subtitle">
                  Help transform agriculture by guiding farmers with your knowledge and experience
                </p>
              </div>
            </div>
            <img
              src="./imgs/admin.jpg"
              alt="Agricultural Expert"
              className="expert-background-image"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Expertregistration;