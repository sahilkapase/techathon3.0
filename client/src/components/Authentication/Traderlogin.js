import React, { Component } from "react";
import "./Traderlogin.css";

export default class TraderLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      GST_No: "",
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

    const { Password, GST_No } = this.state;

    fetch("http://localhost:8000/trader/trader_login", {
      method: "POST",
      crossDomain: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        GST_No,
        Password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({ isLoading: false });
        if (data._id) {
          localStorage.setItem("userTrader", JSON.stringify(data));
          window.location.href = "./Trader_Accountpage";
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
      <div className="trader-auth-wrapper">
        <div className="trader-auth-container">
          {/* Left Side - Branding */}
          <div className="trader-branding-section">
            <div className="trader-branding-content">
              <div className="trader-logo-wrapper">
                <img
                  src="./imgs/logopng.png"
                  alt="Trader Logo"
                  className="trader-logo-image"
                />
              </div>
              <h1 className="trader-brand-title">Trader Portal</h1>
              <p className="trader-brand-subtitle">
                Your gateway to agricultural commerce and trade management
              </p>
              <div className="trader-features">
                <div className="trader-feature-item">
                  <span className="feature-icon">📦</span>
                  <span>Inventory Management</span>
                </div>
                <div className="trader-feature-item">
                  <span className="feature-icon">💰</span>
                  <span>Transaction Tracking</span>
                </div>
                <div className="trader-feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Business Analytics</span>
                </div>
              </div>
            </div>
            <div className="trader-branding-overlay"></div>
          </div>

          {/* Right Side - Login Form */}
          <div className="trader-form-section">
            <div className="trader-form-container">
              <div className="trader-header">
                <div className="trader-icon-badge">
                  <span className="trader-briefcase-icon">💼</span>
                </div>
                <h2 className="trader-form-title">Trader Login</h2>
                <p className="trader-form-subtitle">
                  Access your trading dashboard and manage your business
                </p>
              </div>

              <form className="trader-login-form" onSubmit={this.handleSubmit}>
                {/* GST Number Field */}
                <div className="trader-form-group">
                  <label className="trader-input-label">
                    <span className="label-text">GST Number</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="trader-input-wrapper">
                    <span className="trader-input-icon">🏢</span>
                    <input
                      type="text"
                      className="trader-form-input"
                      placeholder="Enter your GST number"
                      onChange={(e) => this.setState({ GST_No: e.target.value })}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="gst-hint">
                    Format: 22AAAAA0000A1Z5
                  </div>
                </div>

                {/* Password Field */}
                <div className="trader-form-group">
                  <label className="trader-input-label">
                    <span className="label-text">Password</span>
                    <span className="label-required">*</span>
                  </label>
                  <div className="trader-input-wrapper">
                    <span className="trader-input-icon">🔑</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="trader-form-input"
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
                  <div className="trader-error-alert fade-in">
                    <span className="trader-error-icon">⚠️</span>
                    <span className="trader-error-text">{loginerroralert}</span>
                  </div>
                )}

                {/* Info Notice */}
                <div className="trader-info-notice">
                  <span className="info-icon">💡</span>
                  <span className="info-text">
                    Use your registered GST number to access your account
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`trader-submit-btn ${isLoading ? "loading" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="trader-spinner"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>

                {/* Footer Links */}
                <div className="trader-form-footer">
                  <a href="/login" className="trader-footer-link">
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