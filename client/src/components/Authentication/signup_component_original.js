import React, { Component } from "react";
import { sha256 } from "js-sha256";
import "./signup.css";
import app from "./firebase_config";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import axios from "axios";
import Select from "react-select";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { async } from "@firebase/util";
import Alert from "react-bootstrap/Alert";

let otpglobalMob = 0;
let otpglobal = 0;
let newMobilenum = 0;
let Districtss = "";
const auth = getAuth(app);

export default class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 1,
      totalSteps: 5,
      Districtdata: [],
      Talukadata: [],
      show: false,
      show2: false,
      show3: false,
      Name: "",
      Lastname: "",
      Mobilenum: "",
      Adharnum: "",
      Email: "",
      Password: "",
      Gender: "",
      Category: "",
      Qualification: "",
      Dateofbirth: "",
      Physical_handicap: "",
      Rationcardcategory: "",
      Rationcardnum: "",
      State: "",
      District: "",
      Districtsdata: "",
      Taluka: "",
      Village: "",
      Address: "",
      Contract_Farming: "",
      Pincode: "",
      Bankname: "",
      IFSC: "",
      Accountnum: "",
      Confirmpass: "",
      verifyButton: true,
      verifyButtonAdharnum: true,
      verifyButtonemail: true,
      verifyOtp: false,
      verifyOtpAdharbtn: false,
      verifyemailOtp: false,
      otp: "",
      emailotp: "",
      Adharotp: "",
      verified: false,
      verifiedAdhar: false,
      verifiedemail: false,
      alertbox: false,
      alertboxAdhar: false,
      alertboxemailotp: false,
      alertbox2: false,
      alertbox2Adhar: false,
      alertbox3: false,
      alertbox4: false,
      alertboxinvalidotp: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.onSignInSubmit = this.onSignInSubmit.bind(this);
    this.onAdharnumSubmit = this.onAdharnumSubmit.bind(this);
    this.verifyCodeMob = this.verifyCodeMob.bind(this);
    this.verifyCode2Adhar = this.verifyCode2Adhar.bind(this);
    this.handleDistrict = this.handleDistrict.bind(this);
  }

  nextStep = () => {
    const { currentStep, totalSteps } = this.state;
    if (currentStep < totalSteps) {
      this.setState({ currentStep: currentStep + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  prevStep = () => {
    const { currentStep } = this.state;
    if (currentStep > 1) {
      this.setState({ currentStep: currentStep - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  handleClose = () => {
    this.setState({
      show: false,
      show2: false,
      show3: false,
    });
  };

  onSignInSubmit(e) {
    e.preventDefault();
    const { Mobilenum } = this.state;

    fetch(`http://localhost:8000/farmer/mobilenumverify/${Mobilenum}`, {
      method: "get",
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({
          show: true,
          alertbox: true,
          verifyOtp: true,
        });
        otpglobalMob = data.OTP;
      });
  }

  verifyCodeMob() {
    const otp = this.state.otp;
    if (otpglobalMob == otp) {
      this.setState({
        verified: true,
        verifyOtp: false,
        alertbox: false,
        show: false,
        alertboxinvalidotp: false,
      });
    } else {
      this.setState({
        alertboxinvalidotp: true,
      });
    }
  }

  onCaptchaVerifyAdharnum() {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          this.onAdharnumSubmit();
        },
        "expired-callback": () => {},
      },
      auth
    );
  }

  onAdharnumSubmitotp() {
    this.onCaptchaVerifyAdharnum();
    const phoneNumber = "+91" + newMobilenum;
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        this.setState({
          alertboxAdhar: true,
          show3: true,
          verifyOtpAdharbtn: true,
        });
      })
      .catch((error) => {
        this.setState({
          alertbox5: true,
        });
      });
  }

  onAdharnumSubmit(e) {
    e.preventDefault();
    const { Adharnum } = this.state;
    fetch("http://localhost:8000/farmer/adhar", {
      method: "POST",
      crossDomain: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        Adharnum,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        newMobilenum = data.Mobilenum;
        this.onAdharnumSubmitotp();
      });
  }

  onEmailSubmit(e) {
    e.preventDefault();
    const { Email } = this.state;

    fetch(`http://127.0.0.1:5000/verify/${Email}`, {
      method: "get",
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({
          show2: true,
          alertboxemailotp: true,
          verifyemailOtp: true,
        });
        otpglobal = data.OTP;
      });
  }

  verifyCode2Adhar() {
    window.confirmationResult
      .confirm(this.state.Adharotp)
      .then((result) => {
        const user = result.user;
        this.setState({
          verifiedAdhar: true,
          verifyOtpAdharbtn: false,
          alertboxAdhar: false,
          show3: false,
          alertboxinvalidotp: false,
        });
      })
      .catch((error) => {
        this.setState({
          alertboxinvalidotp: true,
          alertboxAdhar: false,
        });
      });
  }

  verifyCodeEmail() {
    const emailotp = this.state.emailotp;
    if (otpglobal == emailotp) {
      this.setState({
        verifiedemail: true,
        verifyemailOtp: false,
        alertboxemailotp: false,
        show2: false,
        alertboxinvalidotp: false,
      });
    } else {
      this.setState({
        alertboxinvalidotp: true,
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.verified) {
      if (this.state.Password === this.state.Confirmpass) {
        if (
          this.state.Password.match(
            `^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$`
          )
        ) {
          this.setState({
            alertbox4: false,
          });
          const Password = sha256(this.state.Password);
          const Confirmpass = sha256(this.state.Confirmpass);
          const {
            Name,
            Lastname,
            Mobilenum,
            Email,
            Gender,
            Category,
            Physical_handicap,
            Qualification,
            Dateofbirth,
            Adharnum,
            Rationcardcategory,
            Rationcardnum,
            State,
            District,
            Taluka,
            Village,
            Contract_Farming,
            Address,
            Pincode,
            Bankname,
            IFSC,
            Accountnum,
          } = this.state;

          fetch("http://localhost:8000/farmer/farmersignup", {
            method: "POST",
            crossDomain: true,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              Name,
              Password,
              Mobilenum,
              Email,
              Gender,
              Category,
              Qualification,
              Physical_handicap,
              Dateofbirth,
              Adharnum,
              Rationcardcategory,
              Rationcardnum,
              State,
              District,
              Taluka,
              Village,
              Contract_Farming,
              Pincode,
              Address,
              Bankname,
              IFSC,
              Accountnum,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status == "ok") {
                window.location.href = "./aftersignup";
              } else {
                alert(data.error);
              }
            });
        } else {
          this.setState({
            alertbox4: true,
          });
        }
      } else {
        this.setState({
          alertbox3: true,
        });
      }
    } else {
      alert("Please Verify Your Mobile Number");
    }
  }

  changeMobile(e) {
    this.setState({ Mobilenum: e.target.value }, function () {
      if (this.state.Mobilenum.length === 10) {
        this.setState({
          verifyButton: true,
          alertbox2: false,
        });
      } else {
        this.setState({
          alertbox2: true,
          verifyButton: false,
        });
      }
    });
  }

  changeAdharnum(e) {
    this.setState({ Adharnum: e.target.value }, function () {
      if (this.state.Adharnum.length === 12) {
        this.setState({
          verifyButtonAdharnum: true,
          alertbox2Adhar: false,
        });
      } else {
        this.setState({
          alertbox2Adhar: true,
          verifyButtonAdharnum: false,
        });
      }
    });
  }

  changeEmail(e) {
    this.setState({ Email: e.target.value }, function () {
      this.setState({
        verifyButtonemail: true,
        alertbox2: false,
      });
    });
  }

  Password(e) {
    this.setState({ Password: e.target.value }, function () {
      if (
        this.state.Password.match(
          `^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$`
        )
      ) {
        this.setState({
          alertbox4: false,
        });
      } else {
        this.setState({
          alertbox4: true,
        });
      }
    });
  }

  handleDistrict(e) {
    this.setState({ District: e.target.value }, async function () {
      try {
        const response = await fetch(
          `http://localhost:8000/District/${this.state.District}`
        );
        const data = await response.json();
        this.setState({ Districtdata: data });
      } catch (err) {
        console.log(err);
      }
    });
  }

  handleTaluka(e) {
    this.setState({ Taluka: e.target.value }, async function () {
      try {
        const response = await fetch(
          `http://localhost:8000/District/${this.state.District}/${this.state.Taluka}`
        );
        const data = await response.json();
        this.setState({ Talukadata: data });
      } catch (err) {
        console.log(err);
      }
    });
  }

  ContractYes(e) {
    this.setState({ Contract_Farming: e.target.value }, function () {
      if (this.state.Contract_Farming === "Yes") {
        window.alert(
          "Your Some Personal Information will be Shared with Private Company, are you Agree?"
        );
      }
    });
  }

  renderStepContent() {
    const { currentStep, Districtdata, Talukadata } = this.state;

    switch (currentStep) {
      case 1:
        return this.renderPersonalInfo();
      case 2:
        return this.renderLocationDetails();
      case 3:
        return this.renderBankDetails();
      case 4:
        return this.renderAuthentication();
      case 5:
        return this.renderPasswordSetup();
      default:
        return null;
    }
  }

  renderPersonalInfo() {
    return (
      <div className="step-content fade-in">
        <div className="step-header">
          <h2 className="step-title">👤 Personal Information</h2>
          <p className="step-subtitle">Tell us about yourself</p>
        </div>

        <div className="form-grid">
          <div className="form-group-modern">
            <label className="modern-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="modern-input"
              placeholder="Enter your full name"
              value={this.state.Name}
              onChange={(e) => this.setState({ Name: e.target.value })}
              required
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">
              Gender <span className="required">*</span>
            </label>
            <select
              className="modern-select"
              value={this.state.Gender}
              onChange={(e) => this.setState({ Gender: e.target.value })}
              required
            >
              <option value="">Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">
              Category <span className="required">*</span>
            </label>
            <select
              className="modern-select"
              value={this.state.Category}
              onChange={(e) => this.setState({ Category: e.target.value })}
            >
              <option value="">Select your category</option>
              <option value="GENERAL">GENERAL</option>
              <option value="EWS">EWS</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Physical Handicap</label>
            <select
              className="modern-select"
              value={this.state.Physical_handicap}
              onChange={(e) =>
                this.setState({ Physical_handicap: e.target.value })
              }
            >
              <option value="">Select status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Qualification</label>
            <select
              className="modern-select"
              value={this.state.Qualification}
              onChange={(e) => this.setState({ Qualification: e.target.value })}
            >
              <option value="">Select qualification</option>
              <option value="Graduation">Graduation</option>
              <option value="HSC">Higher Secondary (12th)</option>
              <option value="SSC">Secondary (10th)</option>
              <option value="Primary">Primary</option>
              <option value="None">None</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Date of Birth</label>
            <input
              type="date"
              className="modern-input"
              value={this.state.Dateofbirth}
              onChange={(e) => this.setState({ Dateofbirth: e.target.value })}
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Ration Card Category</label>
            <select
              className="modern-select"
              value={this.state.Rationcardcategory}
              onChange={(e) =>
                this.setState({ Rationcardcategory: e.target.value })
              }
            >
              <option value="">Select category</option>
              <option value="APL">Above Poverty Line (APL)</option>
              <option value="BPL">Below Poverty Line (BPL)</option>
              <option value="AY">Annapoorna Yojana (AY)</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Ration Card Number</label>
            <input
              type="text"
              className="modern-input"
              placeholder="1967-425-5901"
              value={this.state.Rationcardnum}
              onChange={(e) => this.setState({ Rationcardnum: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  renderLocationDetails() {
    const { Districtdata, Talukadata } = this.state;
    
    return (
      <div className="step-content fade-in">
        <div className="step-header">
          <h2 className="step-title">📍 Farm Location & Details</h2>
          <p className="step-subtitle">Where is your farm located?</p>
        </div>

        <div className="form-grid">
          <div className="form-group-modern">
            <label className="modern-label">State</label>
            <input
              type="text"
              className="modern-input"
              value="Maharashtra"
              disabled
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">
              District <span className="required">*</span>
            </label>
            <select
              className="modern-select"
              value={this.state.District}
              onChange={(e) => this.handleDistrict(e)}
            >
              <option value="">Select district</option>
              <option>Ahmednagar</option>
              <option>Akola</option>
              <option>Amravati</option>
              <option>Aurangabad</option>
              <option>Beed</option>
              <option>Bhandara</option>
              <option>Buldhana</option>
              <option>Chandrapur</option>
              <option>Dhule</option>
              <option>Gadchiroli</option>
              <option>Gondia</option>
              <option>Hingoli</option>
              <option>Jalgaon</option>
              <option>Jalna</option>
              <option>Kolhapur</option>
              <option>Latur</option>
              <option>Mumbai City</option>
              <option>Mumbai Suburban</option>
              <option>Nagpur</option>
              <option>Nanded</option>
              <option>Nandurbar</option>
              <option>Nashik</option>
              <option>Osmanabad</option>
              <option>Palghar</option>
              <option>Parbhani</option>
              <option>Pune</option>
              <option>Raigad</option>
              <option>Ratnagiri</option>
              <option>Sangli</option>
              <option>Satara</option>
              <option>Sindhudurg</option>
              <option>Solapur</option>
              <option>Thane</option>
              <option>Wardha</option>
              <option>Washim</option>
              <option>Yavatmal</option>
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Taluka</label>
            <select
              className="modern-select"
              value={this.state.Taluka}
              onChange={(e) => this.handleTaluka(e)}
            >
              <option value="">Select taluka</option>
              {Districtdata.map((taluka, index) => (
                <option key={index} value={taluka}>
                  {taluka}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Village</label>
            <select
              className="modern-select"
              value={this.state.Village}
              onChange={(e) => this.setState({ Village: e.target.value })}
            >
              <option value="">Select village</option>
              {Talukadata.map((village, index) => (
                <option key={index} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Pincode</label>
            <input
              type="text"
              className="modern-input"
              placeholder="Enter pincode"
              value={this.state.Pincode}
              onChange={(e) => this.setState({ Pincode: e.target.value })}
              maxLength="6"
            />
          </div>

          <div className="form-group-modern full-width">
            <label className="modern-label">Complete Address</label>
            <textarea
              className="modern-textarea"
              placeholder="Enter your complete address"
              value={this.state.Address}
              onChange={(e) => this.setState({ Address: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Contract Farming Interest</label>
            <select
              className="modern-select"
              value={this.state.Contract_Farming}
              onChange={(e) => this.ContractYes(e)}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  renderBankDetails() {
    return (
      <div className="step-content fade-in">
        <div className="step-header">
          <h2 className="step-title">🏦 Bank Details</h2>
          <p className="step-subtitle">For subsidy and payment transfers</p>
        </div>

        <div className="form-grid">
          <div className="form-group-modern">
            <label className="modern-label">
              Bank Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="modern-input"
              placeholder="Enter bank name"
              value={this.state.Bankname}
              onChange={(e) => this.setState({ Bankname: e.target.value })}
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">
              IFSC Code <span className="required">*</span>
            </label>
            <input
              type="text"
              className="modern-input"
              placeholder="Enter IFSC code"
              value={this.state.IFSC}
              onChange={(e) => this.setState({ IFSC: e.target.value })}
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">
              Account Number <span className="required">*</span>
            </label>
            <input
              type="text"
              className="modern-input"
              placeholder="Enter account number"
              value={this.state.Accountnum}
              onChange={(e) => this.setState({ Accountnum: e.target.value })}
            />
          </div>

          <div className="form-group-modern">
            <label className="modern-label">Confirm Account Number</label>
            <input
              type="text"
              className="modern-input"
              placeholder="Re-enter account number"
            />
          </div>
        </div>
      </div>
    );
  }

  renderAuthentication() {
    return (
      <div className="step-content fade-in">
        <div className="step-header">
          <h2 className="step-title">🔐 Authentication</h2>
          <p className="step-subtitle">Verify your identity</p>
        </div>

        <div id="recaptcha-container"></div>

        <div className="form-grid">
          {/* Aadhar Verification */}
          <div className="form-group-modern verification-group">
            <label className="modern-label">
              Aadhar Card Number <span className="required">*</span>
            </label>
            <div className="verification-wrapper">
              <input
                type="text"
                className="modern-input"
                placeholder="Enter 12-digit Aadhar number"
                value={this.state.Adharnum}
                onChange={(e) => this.changeAdharnum(e)}
                maxLength="12"
              />
              {this.state.verifyButtonAdharnum && (
                <button
                  type="button"
                  className={`verify-btn ${
                    this.state.verifiedAdhar ? "verified" : ""
                  }`}
                  onClick={this.onAdharnumSubmit}
                  disabled={this.state.verifiedAdhar}
                >
                  {this.state.verifiedAdhar ? "✓ Verified" : "Verify"}
                </button>
              )}
            </div>
            {this.state.alertbox2Adhar && (
              <span className="error-text">Enter 12-digit Aadhar number</span>
            )}
          </div>

          {/* Mobile Verification */}
          <div className="form-group-modern verification-group">
            <label className="modern-label">
              Mobile Number <span className="required">*</span>
            </label>
            <div className="verification-wrapper">
              <input
                type="tel"
                className="modern-input"
                placeholder="Enter 10-digit mobile number"
                value={this.state.Mobilenum}
                onChange={(e) => this.changeMobile(e)}
                maxLength="10"
              />
              {this.state.verifyButton && (
                <button
                  type="button"
                  className={`verify-btn ${
                    this.state.verified ? "verified" : ""
                  }`}
                  onClick={this.onSignInSubmit}
                  disabled={this.state.verified}
                >
                  {this.state.verified ? "✓ Verified" : "Verify"}
                </button>
              )}
            </div>
            {this.state.alertbox2 && (
              <span className="error-text">Enter 10-digit mobile number</span>
            )}
          </div>

          {/* Email Verification */}
          <div className="form-group-modern verification-group">
            <label className="modern-label">
              Email Address <span className="required">*</span>
            </label>
            <div className="verification-wrapper">
              <input
                type="email"
                className="modern-input"
                placeholder="Enter your email"
                value={this.state.Email}
                onChange={(e) => this.changeEmail(e)}
              />
              {this.state.verifyButtonemail && (
                <button
                  type="button"
                  className={`verify-btn ${
                    this.state.verifiedemail ? "verified" : ""
                  }`}
                  onClick={(e) => this.onEmailSubmit(e)}
                  disabled={this.state.verifiedemail}
                >
                  {this.state.verifiedemail ? "✓ Verified" : "Verify"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modals for OTP Verification */}
        {this.renderOTPModals()}
      </div>
    );
  }

  renderPasswordSetup() {
    return (
      <div className="step-content fade-in">
        <div className="step-header">
          <h2 className="step-title">🔑 Create Password</h2>
          <p className="step-subtitle">Secure your account</p>
        </div>

        <div className="form-grid">
          <div className="form-group-modern full-width">
            <label className="modern-label">
              Create Password <span className="required">*</span>
            </label>
            <input
              type="password"
              className="modern-input"
              placeholder="Enter password"
              value={this.state.Password}
              onChange={(e) => this.Password(e)}
            />
            <div className="password-hint">
              Password must contain 7-15 characters with at least one number and one special character (!@#$%^&*)
            </div>
            {this.state.alertbox4 && (
              <span className="error-text">Password is not strong enough</span>
            )}
          </div>

          <div className="form-group-modern full-width">
            <label className="modern-label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              className="modern-input"
              placeholder="Re-enter password"
              value={this.state.Confirmpass}
              onChange={(e) => this.setState({ Confirmpass: e.target.value })}
            />
            {this.state.alertbox3 && (
              <span className="error-text">Passwords do not match</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderOTPModals() {
    return (
      <>
        {/* Mobile OTP Modal */}
        <Modal show={this.state.show} onHide={this.handleClose} centered className="modern-modal">
          <Modal.Header closeButton>
            <Modal.Title>📱 Mobile Verification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter 4-digit OTP"
                className="modern-input"
                value={this.state.otp}
                onChange={(e) => this.setState({ otp: e.target.value })}
                autoFocus
              />
              {this.state.alertbox && (
                <Alert variant="success" className="mt-3">
                  OTP sent to {this.state.Mobilenum}
                </Alert>
              )}
              {this.state.alertboxinvalidotp && (
                <Alert variant="danger" className="mt-3">
                  Invalid OTP
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.verifyCodeMob}>
              Verify OTP
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Email OTP Modal */}
        <Modal show={this.state.show2} onHide={this.handleClose} centered className="modern-modal">
          <Modal.Header closeButton>
            <Modal.Title>📧 Email Verification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter 4-digit OTP"
                className="modern-input"
                value={this.state.emailotp}
                onChange={(e) => this.setState({ emailotp: e.target.value })}
                autoFocus
              />
              {this.state.alertboxemailotp && (
                <Alert variant="success" className="mt-3">
                  OTP sent to your email
                </Alert>
              )}
              {this.state.alertboxinvalidotp && (
                <Alert variant="danger" className="mt-3">
                  Invalid OTP
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={(e) => this.verifyCodeEmail(e)}>
              Verify OTP
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Aadhar OTP Modal */}
        <Modal show={this.state.show3} onHide={this.handleClose} centered className="modern-modal">
          <Modal.Header closeButton>
            <Modal.Title>🆔 Aadhar Verification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter 6-digit OTP"
                className="modern-input"
                value={this.state.Adharotp}
                onChange={(e) => this.setState({ Adharotp: e.target.value })}
                autoFocus
              />
              {this.state.alertboxAdhar && (
                <Alert variant="success" className="mt-3">
                  OTP sent to mobile linked with Aadhar: {this.state.Adharnum}
                </Alert>
              )}
              {this.state.alertboxinvalidotp && (
                <Alert variant="danger" className="mt-3">
                  Invalid OTP
                </Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.verifyCode2Adhar}>
              Verify OTP
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  render() {
    const { currentStep, totalSteps } = this.state;
    const progress = (currentStep / totalSteps) * 100;

    return (
      <div className="farmer-registration-wrapper">
        <div className="farmer-registration-container">
          {/* Header */}
          <div className="registration-header">
            <div className="header-content">
              <div className="logo-section">
                <span className="logo-icon">🌾</span>
                <h1 className="registration-title">Farmer Registration</h1>
              </div>
              <p className="registration-subtitle">
                Join thousands of farmers benefiting from our platform
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="step-indicators">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`step-indicator ${
                    step === currentStep
                      ? "active"
                      : step < currentStep
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="step-number">
                    {step < currentStep ? "✓" : step}
                  </div>
                  <div className="step-label">
                    {step === 1 && "Personal"}
                    {step === 2 && "Location"}
                    {step === 3 && "Bank"}
                    {step === 4 && "Verify"}
                    {step === 5 && "Password"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={this.handleSubmit} className="registration-form">
            {this.renderStepContent()}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="nav-btn prev-btn"
                  onClick={this.prevStep}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="nav-btn next-btn"
                  onClick={this.nextStep}
                >
                  Next →
                </button>
              ) : (
                <button type="submit" className="nav-btn submit-btn">
                  Complete Registration
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="registration-footer">
            <p>
              Already registered?{" "}
              <a href="/sign-in" className="footer-link">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}