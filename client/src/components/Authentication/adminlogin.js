import React, { Component } from "react";
import { sha256 } from 'js-sha256';
import "./adminlogin.css";

export default class AdminLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Username: "",
      Password: "",
      loginerroralert: "",
      isLoading: false,
      showPassword: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ isLoading: true, loginerroralert: "" });

    const { Password, Username } = this.state;

    fetch("http://localhost:8000/admin/login", {
      method: "POST",
      crossDomain: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        Username,
        Password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({ isLoading: false });
        if (data.id || data._id || data.Id) {
          localStorage.setItem("user", JSON.stringify(data));
          window.location.href = "./findfarmer";
        } else {
          this.setState({
            loginerroralert: data.error || "Invalid credentials. Please try again.",
          });
        }
      })
      .catch((error) => {
        this.setState({
          isLoading: false,
          loginerroralert: "Connection error. Please try again.",
        });
      });
  }

  togglePasswordVisibility = () => {
    this.setState((prevState) => ({
      showPassword: !prevState.showPassword,
    }));
  };

  render() {
    const { loginerroralert, isLoading, showPassword } = this.state;

    return (
      <div className="admin-auth-wrapper">
        <div className="admin-auth-container">
          {/* Left Side - Branding */}
          <div className="admin-branding-section">
            <div className="admin-branding-content">
              <div className="admin-logo-wrapper">
                <img 
                  src="./imgs/logopng.png" 
                  alt="Admin Logo" 
                  className="admin-logo-image"
                />
              </div>
              <h1 className="admin-brand-title">Admin Portal</h1>
              <p className="admin-brand-subtitle">
                Secure access to your administrative dashboard
              </p>
              <div className="admin-features">
                <div className="admin-feature-item">
                  <span className="feature-icon">🔐</span>
                  <span>Secure Authentication</span>
                </div>
                <div className="admin-feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Full Dashboard Access</span>
                </div>
                <div className="admin-feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Real-time Monitoring</span>
                </div>
              </div>
            </div>
            <div className="admin-branding-overlay"></div>
          </div>

          {/* Right Side - Login Form */}
          <div className="admin-form-section">
            <div className="admin-form-container">
              <div className="admin-header">
                <div className="admin-icon-badge">
                  <span className="admin-shield-icon">🛡️</span>
                </div>
                <h2 className="admin-form-title">Administrator Login</h2>
                <p className="admin-form-subtitle">
                  Enter your credentials to access the admin panel
                </p>
              </div>

              <form className="admin-login-form" onSubmit={this.handleSubmit}>
                {/* Username Field */}
                <div className="admin-form-group">
                  <label className="admin-input-label">
                    <span className="label-text">Username</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="admin-input-wrapper">
                    <span className="admin-input-icon">👤</span>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Enter your username"
                      onChange={(e) => this.setState({ Username: e.target.value })}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="admin-form-group">
                  <label className="admin-input-label">
                    <span className="label-text">Password</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="admin-input-wrapper">
                    <span className="admin-input-icon">🔑</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="admin-form-input"
                      placeholder="Enter your password"
                      onChange={(e) => this.setState({ Password: e.target.value })}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={this.togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                {/* Error Alert */}
                {loginerroralert && (
                  <div className="admin-error-alert fade-in">
                    <span className="admin-error-icon">⚠️</span>
                    <span className="admin-error-text">{loginerroralert}</span>
                  </div>
                )}

                {/* Security Notice */}
                <div className="security-notice">
                  <span className="security-icon">🔒</span>
                  <span className="security-text">
                    This is a secure admin area. All activities are logged.
                  </span>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className={`admin-submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="admin-spinner"></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                {/* Footer Links */}
                <div className="admin-form-footer">
                  <a href="/login" className="admin-footer-link">
                    ← Back to Farmer Login
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}