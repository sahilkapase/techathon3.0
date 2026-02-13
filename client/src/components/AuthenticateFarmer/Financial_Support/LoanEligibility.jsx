import React, { useState } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

/**
 * Loan Eligibility Component
 * Allows farmers to check their eligibility and apply for loans
 */
const LoanEligibility = ({ farmerId, farmerInfo, onEligibilityFetch }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    annualIncome: '',
    landSize: farmerInfo?.LandSize || '',
    irrigationStatus: 'Both',
    primaryCrop: farmerInfo?.CropTypes?.[0] || '',
  });
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'annualIncome' || name === 'landSize' ? parseFloat(value) : value,
    }));
    setError('');
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    if (!formData.annualIncome || formData.annualIncome <= 0) {
      setError('Please enter a valid annual income');
      return false;
    }
    if (!formData.landSize || formData.landSize <= 0) {
      setError('Please enter a valid land size');
      return false;
    }
    if (!formData.primaryCrop) {
      setError('Please select a primary crop');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission to check eligibility
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await axios.post(
        `http://localhost:8000/api/financial/loan/check-eligibility/${farmerId}`,
        formData
      );

      setEligibility(response.data.eligibility);
      setSuccessMessage('Eligibility calculated successfully!');
      setStep(2);
      onEligibilityFetch?.();

      // Auto-scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Error checking eligibility. Please try again.'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle loan application submission
   */
  const handleApplyLoan = async () => {
    if (!eligibility || !eligibility.eligibleLoanAmount) {
      setError('Please check eligibility first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const loanAmount = eligibility.eligibleLoanAmount;
      const response = await axios.post(
        `http://localhost:8000/api/financial/loan/apply/${farmerId}`,
        {
          loanAmount,
          loanPurpose: 'Agricultural Purpose',
          repaymentPeriod: 60,
          collateral: 'Land',
          documents: [],
        }
      );

      setSuccessMessage('Loan application submitted successfully! Bank will contact you soon.');
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Error submitting application. Please try again.'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form to start over
   */
  const handleReset = () => {
    setStep(1);
    setFormData({
      annualIncome: '',
      landSize: farmerInfo?.LandSize || '',
      irrigationStatus: 'Both',
      primaryCrop: farmerInfo?.CropTypes?.[0] || '',
    });
    setEligibility(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="loan-eligibility-container">
      <h2>💳 Loan Eligibility Checker</h2>

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Eligibility</span>
        </div>
        <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Review</span>
        </div>
        <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Apply</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span className="alert-message">{error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span className="alert-message">{successMessage}</span>
          <button className="alert-close" onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}

      {/* Step 1: Eligibility Form */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="eligibility-form">
          <div className="form-section">
            <h3>Fill Your Details</h3>
            <p className="section-description">
              Provide accurate information to calculate your loan eligibility
            </p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="annualIncome">
                  Annual Income (₹)
                  <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="annualIncome"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleChange}
                  placeholder="e.g., 200000"
                  min="0"
                  step="1000"
                  required
                />
                <small className="help-text">
                  📝 Total yearly farm income from all sources
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="landSize">
                  Land Size (Acres)
                  <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="landSize"
                  name="landSize"
                  value={formData.landSize}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  min="0"
                  step="0.5"
                  required
                />
                <small className="help-text">
                  📐 Total cultivated land area
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="irrigationStatus">
                  Irrigation Status
                  <span className="required">*</span>
                </label>
                <select
                  id="irrigationStatus"
                  name="irrigationStatus"
                  value={formData.irrigationStatus}
                  onChange={handleChange}
                >
                  <option value="Irrigated">Fully Irrigated</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Both">Both (Mixed)</option>
                </select>
                <small className="help-text">
                  💧 Type of water supply to your farm
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="primaryCrop">
                  Primary Crop
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="primaryCrop"
                  name="primaryCrop"
                  value={formData.primaryCrop}
                  onChange={handleChange}
                  placeholder="e.g., Sugarcane, Wheat"
                  required
                />
                <small className="help-text">
                  🌾 Main crop you cultivate
                </small>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Checking...
                </>
              ) : (
                <>
                  ✓ Check Eligibility
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Eligibility Results */}
      {step === 2 && eligibility && (
        <div className="eligibility-results">
          <div className="result-header">
            <h3>✅ Your Loan Eligibility Results</h3>
            <p className="result-subtitle">Based on your financial profile</p>
          </div>

          <div className="result-cards-grid">
            <div className="result-card primary">
              <div className="card-header">
                <span className="card-icon">💰</span>
                <span className="card-title">Eligible Loan Amount</span>
              </div>
              <div className="card-value">
                ₹{eligibility.eligibleLoanAmount?.toLocaleString()}
              </div>
              <div className="card-footer">Maximum you can borrow</div>
            </div>

            <div className="result-card">
              <div className="card-header">
                <span className="card-icon">📊</span>
                <span className="card-title">Interest Rate</span>
              </div>
              <div className="card-value">
                {eligibility.interestRate?.toFixed(2)}% p.a.
              </div>
              <div className="card-footer">Per annum interest</div>
            </div>

            <div className="result-card">
              <div className="card-header">
                <span className="card-icon">📅</span>
                <span className="card-title">Loan Tenure</span>
              </div>
              <div className="card-value">
                {eligibility.maxLoanTerm} Years
              </div>
              <div className="card-footer">Repayment period</div>
            </div>

            <div className="result-card">
              <div className="card-header">
                <span className="card-icon">💵</span>
                <span className="card-title">Monthly EMI</span>
              </div>
              <div className="card-value">
                ₹{eligibility.monthlyEMI?.toLocaleString()}
              </div>
              <div className="card-footer">Approximate monthly payment</div>
            </div>

            <div className="result-card">
              <div className="card-header">
                <span className="card-icon">🎁</span>
                <span className="card-title">Subsidy</span>
              </div>
              <div className="card-value">
                {eligibility.subsidyPercentage?.toFixed(2)}%
              </div>
              <div className="card-footer">Government support available</div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="recommendation-box">
            <h4>💡 Recommendation</h4>
            <p>{eligibility.recommendation}</p>
          </div>

          {/* Information Box */}
          <div className="info-box">
            <h4>ℹ️ How Loan Amount is Calculated?</h4>
            <ul>
              <li>Base calculation: (Annual Income × 2) + (Land Size × ₹50,000)</li>
              <li>Adjusted for your farmer category and land size</li>
              <li>Interest rate determined based on risk assessment</li>
              <li>Subsidies available for marginal and small farmers</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleApplyLoan}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '→ Proceed to Apply for Loan'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              ← Start Over
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Application Submitted */}
      {step === 3 && (
        <div className="application-success">
          <div className="success-icon">🎉</div>
          <h3>Application Submitted Successfully!</h3>
          <p className="success-message">
            Your loan application has been submitted. Our team will review it and contact you within 3-5 business days.
          </p>

          <div className="success-details">
            <h4>Next Steps:</h4>
            <div className="steps-list">
              <div className="step-item">
                <span className="step-check">✓</span>
                <div className="step-content">
                  <strong>Review Process</strong>
                  <p>Your application is now under review by our bank partners</p>
                </div>
              </div>
              <div className="step-item">
                <span className="step-check">2</span>
                <div className="step-content">
                  <strong>Verification Call</strong>
                  <p>We will contact you at {farmerInfo?.Mobilenum} to verify details</p>
                </div>
              </div>
              <div className="step-item">
                <span className="step-check">3</span>
                <div className="step-content">
                  <strong>Approval Notification</strong>
                  <p>You will receive approval status via SMS and email</p>
                </div>
              </div>
              <div className="step-item">
                <span className="step-check">4</span>
                <div className="step-content">
                  <strong>Disbursement</strong>
                  <p>Loan amount will be credited to your bank account</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanEligibility;
