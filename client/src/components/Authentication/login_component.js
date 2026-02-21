import React, { Component } from "react";
import { sha256 } from 'js-sha256';
import io from 'socket.io-client';
import "./login.css";
import Button from 'react-bootstrap/Button';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: localStorage.getItem("user"),
      Mobilenum: "",
      Password: "",
      Mobilenumfield: false,
      Uniqeidfield: false,
      loginerroralert: "",
      isLoading: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.socket = io('http://localhost:7000');
  }

  selectMobilenum(e) {
    this.setState({
      Mobilenumfield: true,
      Uniqeidfield: false,
      loginerroralert: "",
    });
  }

  selectUniqeid(e) {
    this.setState({
      Mobilenumfield: false,
      Uniqeidfield: true,
      loginerroralert: "",
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ isLoading: true, loginerroralert: "" });

    const Password = this.state.Password === "" ? "" : sha256(this.state.Password);
    const { Mobilenum, Farmerid } = this.state;

    fetch("http://localhost:8000/farmer/farmerlogin", {
      method: "POST",
      crossDomain: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        Mobilenum,
        Farmerid,
        Password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({ isLoading: false });
        if (data.Farmerid) {
          localStorage.setItem("user", JSON.stringify(data));
          window.location.href = "./Myaccount";
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

  render() {
    const { Mobilenumfield, Uniqeidfield, loginerroralert, isLoading } = this.state;

    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          {/* Left Side - Form */}
          <div className="auth-form-section">
            <div className="form-container">
              <div className="logo-section">
                <div className="logo-icon">🌾</div>
                <h1 className="brand-title">FarmConnect</h1>
              </div>

              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">Sign in to access your farmer account</p>

              <form className="login-form" onSubmit={this.handleSubmit}>
                {/* Login Method Selection */}
                <div className="login-method-selector">
                  <label className={`method-option ${Mobilenumfield ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="loginMethod"
                      onChange={(e) => this.selectMobilenum(e)}
                    />
                    <span className="method-label">
                      <span className="method-icon">📱</span>
                      Mobile Number
                    </span>
                  </label>
                  
                  <label className={`method-option ${Uniqeidfield ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="loginMethod"
                      onChange={(e) => this.selectUniqeid(e)}
                    />
                    <span className="method-label">
                      <span className="method-icon">🆔</span>
                      Unique ID
                    </span>
                  </label>
                </div>

                {/* Input Fields */}
                {Mobilenumfield && (
                  <div className="form-group fade-in">
                    <label className="input-label">Mobile Number</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📞</span>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Enter your mobile number"
                        onChange={(e) => this.setState({ Mobilenum: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {Uniqeidfield && (
                  <div className="form-group fade-in">
                    <label className="input-label">Unique Farmer ID</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔖</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your unique ID"
                        onChange={(e) => this.setState({ Farmerid: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter your password"
                      onChange={(e) => this.setState({ Password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {loginerroralert && (
                  <div className="error-alert fade-in">
                    <span className="error-icon">⚠️</span>
                    {loginerroralert}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="form-footer">
                  <p className="footer-text">
                    <a href="/Forgotpin" className="footer-link forgot-link">Forgot Password?</a>
                  </p>
                  <p className="footer-text">
                    Don't have an account? 
                    <a href="/sign-up" className="footer-link"> Sign Up</a>
                  </p>
                  <p className="footer-text">
                    <a href="/adminlogin" className="footer-link">Admin Login</a>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="auth-image-section">
            <div className="image-overlay">
              <h2 className="overlay-title">Empowering Farmers</h2>
              <p className="overlay-subtitle">
                Connect, Grow, and Thrive with Modern Agriculture Solutions
              </p>
            </div>
            <img 
              src="./imgs/login_pic.jpg" 
              alt="Farming" 
              className="auth-image"
            />
          </div>
        </div>
      </div>
    );
  }
}