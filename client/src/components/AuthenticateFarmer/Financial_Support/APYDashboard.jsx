import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

/**
 * APY Dashboard Component
 * Manages Atal Pension Yojana enrollment and details
 */
const APYDashboard = ({ farmerId, farmerInfo }) => {
  const [apyData, setApyData] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [formData, setFormData] = useState({
    monthlyContribution: 1000,
    pensionAge: 60,
  });

  // Fetch APY details on component mount
  useEffect(() => {
    fetchAPYDetails();
  }, [farmerId]);

  /**
   * Fetch APY details
   */
  const fetchAPYDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/financial/apy/${farmerId}`
      );
      setApyData(response.data);
      setEnrolled(response.data.enrolled || false);
    } catch (err) {
      setError('Error fetching APY details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monthlyContribution' ? parseInt(value) : parseInt(value),
    }));
  };

  /**
   * Handle enrollment submission
   */
  const handleEnroll = async (e) => {
    e.preventDefault();

    // Validate contribution
    if (formData.monthlyContribution < 1000) {
      setError('Minimum contribution is ₹1000 per month');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await axios.post(
        `http://localhost:8000/api/financial/apy/enroll/${farmerId}`,
        formData
      );

      setApyData(response.data);
      setEnrolled(true);
      setShowEnrollForm(false);
      setSuccessMessage('Successfully enrolled in APY! Check your details below.');

      // Reset form
      setFormData({
        monthlyContribution: 1000,
        pensionAge: 60,
      });

      // Auto-scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Error enrolling in APY. Please try again.'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !apyData) {
    return (
      <div className="apy-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading APY information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apy-container">
      <h2>🏦 Atal Pension Yojana (APY)</h2>

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

      {!enrolled ? (
        // Not Enrolled Section
        <div className="apy-info-section">
          <div className="apy-intro">
            <h3>Secure Your Future with APY</h3>
            <p>
              Atal Pension Yojana is a government-sponsored pension scheme designed
              specifically for unorganized sector workers, including farmers. Start
              contributing today and enjoy guaranteed pension from age 60.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="benefits-container">
            <div className="benefit-card">
              <div className="benefit-icon">🏦</div>
              <h4>Guaranteed Pension</h4>
              <p>Receive monthly pension starting at age 60, 65, or 70</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h4>Government Support</h4>
              <p>50% of your contribution is matched by government</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h4>Life Insurance</h4>
              <p>Coverage of ₹2 lakhs for your family</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">👨‍👩‍👧</div>
              <h4>Spouse Security</h4>
              <p>Spouse receives 50% pension after your death</p>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="eligibility-section">
            <h4>📋 Eligibility Criteria</h4>
            <div className="criteria-box">
              <div className="criteria-item">
                <span className="criteria-check">✓</span>
                <div>
                  <strong>Age:</strong> Between 18-40 years at enrollment
                </div>
              </div>
              <div className="criteria-item">
                <span className="criteria-check">✓</span>
                <div>
                  <strong>Minimum Contribution:</strong> ₹1,000 per month
                </div>
              </div>
              <div className="criteria-item">
                <span className="criteria-check">✓</span>
                <div>
                  <strong>Regular Contribution:</strong> Must contribute every month
                </div>
              </div>
              <div className="criteria-item">
                <span className="criteria-check">✓</span>
                <div>
                  <strong>Bank Account:</strong> Valid AADHAR linked bank account
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="how-it-works-section">
            <h4>💡 How It Works</h4>
            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <h5>Contribute Monthly</h5>
                <p>
                  You decide your monthly contribution
                  (₹1000, ₹1500, ₹2000, etc.)
                </p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h5>Get Government Support</h5>
                <p>
                  Government adds 50% of your contribution
                  from your account
                </p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h5>Invest till 60</h5>
                <p>
                  Fund grows with investment returns
                  over the years
                </p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h5>Receive Pension</h5>
                <p>
                  Get guaranteed monthly pension
                  for life from age 60 onwards
                </p>
              </div>
            </div>
          </div>

          {/* Enrollment Section */}
          {!showEnrollForm ? (
            <div className="enrollment-action">
              <button
                className="btn btn-primary btn-large"
                onClick={() => setShowEnrollForm(true)}
              >
                ✓ Start APY Enrollment
              </button>
            </div>
          ) : (
            // Enrollment Form
            <form onSubmit={handleEnroll} className="apy-enrollment-form">
              <h4>Complete Your APY Enrollment</h4>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monthlyContribution">
                    Monthly Contribution (₹)
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="monthlyContribution"
                    name="monthlyContribution"
                    value={formData.monthlyContribution}
                    onChange={handleChange}
                    min="1000"
                    step="100"
                    required
                  />
                  <small className="help-text">
                    Minimum ₹1000 | You can increase this anytime
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="pensionAge">
                    Pension Age
                    <span className="required">*</span>
                  </label>
                  <select
                    id="pensionAge"
                    name="pensionAge"
                    value={formData.pensionAge}
                    onChange={handleChange}
                  >
                    <option value={60}>60 years (Higher contribution)</option>
                    <option value={65}>65 years (Medium contribution)</option>
                    <option value={70}>70 years (Lower contribution)</option>
                  </select>
                  <small className="help-text">
                    Earlier age = Higher monthly pension
                  </small>
                </div>
              </div>

              {/* Contribution Calculator */}
              <div className="contribution-calculator">
                <h5>📊 Your Estimated Benefit</h5>
                <p className="calculator-text">
                  With ₹{formData.monthlyContribution}/month contribution:
                </p>
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Government will contribute:</span>
                    <span className="result-value">
                      ₹{Math.round(formData.monthlyContribution / 2)}/month
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Total monthly investment:</span>
                    <span className="result-value">
                      ₹{Math.round(formData.monthlyContribution * 1.5)}/month
                    </span>
                  </div>
                  <div className="result-item highlight">
                    <span className="result-label">Estimated monthly pension at age {formData.pensionAge}:</span>
                    <span className="result-value">
                      ~₹{Math.round(formData.monthlyContribution * (formData.pensionAge === 60 ? 12.5 : formData.pensionAge === 65 ? 11.2 : 10.5))}
                    </span>
                  </div>
                </div>
                <small className="calculator-note">
                  ℹ️ This is an estimate and may vary based on market conditions
                </small>
              </div>

              {/* Important Notes */}
              <div className="important-notes">
                <h5>⚠️ Important Notes</h5>
                <ul>
                  <li>Contribution is deducted automatically from your bank account</li>
                  <li>You must maintain regular contributions without gap</li>
                  <li>If you miss payment, you need to catch up with late fees</li>
                  <li>You can withdraw before 60 only in emergencies (with restrictions)</li>
                </ul>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? '⏳ Enrolling...' : '✓ Complete Enrollment'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEnrollForm(false)}
                  disabled={loading}
                >
                  ← Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        // Enrolled Section
        <div className="apy-enrolled-section">
          <div className="enrollment-status">
            <div className="status-icon">✅</div>
            <h3>Successfully Enrolled in APY</h3>
            <p>Your pension journey has begun. Here are your enrollment details.</p>
          </div>

          {/* Account Details */}
          <div className="account-details">
            <div className="details-card">
              <h4>Account Information</h4>
              <div className="detail-row">
                <span className="detail-label">Account Holder</span>
                <span className="detail-value">{farmerInfo?.Name || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value">
                  {apyData?.subscription?.accountNumber || 'APY-XXXX'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Enrollment Date</span>
                <span className="detail-value">
                  {new Date(apyData?.subscription?.enrollmentDate).toLocaleDateString(
                    'en-IN'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value status-active">
                  {apyData?.subscription?.status}
                </span>
              </div>
            </div>

            <div className="details-card">
              <h4>Contribution Details</h4>
              <div className="detail-row">
                <span className="detail-label">Monthly Contribution</span>
                <span className="detail-value">
                  ₹{apyData?.subscription?.contributionAmount?.toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Government Support</span>
                <span className="detail-value">
                  ₹{Math.round(apyData?.subscription?.contributionAmount / 2)}
                </span>
              </div>
              <div className="detail-row highlight">
                <span className="detail-label">Total Monthly Investment</span>
                <span className="detail-value">
                  ₹{Math.round(apyData?.subscription?.contributionAmount * 1.5)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Contributed</span>
                <span className="detail-value">
                  ₹{apyData?.subscription?.totalContributed?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="details-card">
              <h4>Pension Information</h4>
              <div className="detail-row">
                <span className="detail-label">Pension Starting Age</span>
                <span className="detail-value">60 years</span>
              </div>
              <div className="detail-row highlight">
                <span className="detail-label">Estimated Monthly Pension</span>
                <span className="detail-value">
                  ₹{apyData?.subscription?.pensionAmount?.toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pension Till</span>
                <span className="detail-value">Lifetime</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Survivor Benefit</span>
                <span className="detail-value">
                  50% pension to spouse/nominee
                </span>
              </div>
            </div>
          </div>

          {/* Contribution Timeline */}
          <div className="contribution-timeline">
            <h4>📅 Your Contribution Timeline</h4>
            <div className="timeline">
              <div className="timeline-event">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>Now (Age {farmerInfo?.Dateofbirth ? new Date().getFullYear() - new Date(farmerInfo.Dateofbirth).getFullYear() : 'N/A'})</strong>
                  <p>Start contributing monthly</p>
                </div>
              </div>
              <div className="timeline-event">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>Next 20-40 years</strong>
                  <p>Continue regular contributions (fund grows with returns)</p>
                </div>
              </div>
              <div className="timeline-event">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>Age 60</strong>
                  <p>Start receiving guaranteed monthly pension for life</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="action-items">
            <h4>✅ Next Steps</h4>
            <div className="action-list">
              <div className="action-item">
                <span className="action-icon">1</span>
                <div className="action-content">
                  <strong>Set up Automatic Deduction</strong>
                  <p>
                    Ensure your bank account has enough balance on
                    the monthly deduction date
                  </p>
                </div>
              </div>
              <div className="action-item">
                <span className="action-icon">2</span>
                <div className="action-content">
                  <strong>Download Your Enrollment Certificate</strong>
                  <p>
                    Keep your APY enrollment certificate safe for future
                    reference
                  </p>
                </div>
              </div>
              <div className="action-item">
                <span className="action-icon">3</span>
                <div className="action-content">
                  <strong>Monitor Your Account</strong>
                  <p>
                    Check your contribution status regularly through
                    the APY portal
                  </p>
                </div>
              </div>
              <div className="action-item">
                <span className="action-icon">4</span>
                <div className="action-content">
                  <strong>Update Your Nominee</strong>
                  <p>
                    Ensure your nominee details are correctly registered
                    for survivor benefits
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="support-section">
            <h4>📞 Need Help?</h4>
            <p>
              For queries related to your APY account, contact the
              NSDL APY team at toll-free number 1800-22-9191
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default APYDashboard;
