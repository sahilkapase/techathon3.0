import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

/**
 * Loan Applications Component
 * Displays and tracks all loan applications
 */
const LoanApplications = ({ farmerId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, [farmerId]);

  /**
   * Fetch loan applications
   */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/financial/loan/applications/${farmerId}`
      );
      setApplications(response.data.applications || []);
      setError('');
    } catch (err) {
      setError('Unable to fetch applications');
      console.error('Error:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Applied':
        return 'badge-pending';
      case 'Under Review':
        return 'badge-review';
      case 'Approved':
        return 'badge-approved';
      case 'Rejected':
        return 'badge-rejected';
      case 'Disbursed':
        return 'badge-disbursed';
      default:
        return 'badge-default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Applied':
        return '📤';
      case 'Under Review':
        return '⏳';
      case 'Approved':
        return '✅';
      case 'Rejected':
        return '❌';
      case 'Disbursed':
        return '💰';
      default:
        return '❓';
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Filter applications by status
   */
  const filteredApplications =
    filterStatus === 'all'
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  /**
   * Get unique statuses
   */
  const statuses = ['all', ...new Set(applications.map((app) => app.status))];

  if (loading) {
    return (
      <div className="loan-applications-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loan-applications-container">
      <h2>📋 My Loan Applications</h2>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span className="alert-message">{error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {applications.length === 0 ? (
        // Empty State
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Applications Yet</h3>
          <p>
            You haven't submitted any loan applications yet. Start by checking your
            eligibility and submitting an application.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="applications-summary">
            <div className="summary-card">
              <span className="summary-icon">📊</span>
              <div className="summary-content">
                <h4>Total Applications</h4>
                <p className="summary-value">{applications.length}</p>
              </div>
            </div>
            <div className="summary-card highlight">
              <span className="summary-icon">✅</span>
              <div className="summary-content">
                <h4>Approved</h4>
                <p className="summary-value">
                  {applications.filter((app) => app.status === 'Approved').length}
                </p>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-icon">⏳</span>
              <div className="summary-content">
                <h4>Pending</h4>
                <p className="summary-value">
                  {applications.filter((app) => ['Applied', 'Under Review'].includes(app.status)).length}
                </p>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-icon">💰</span>
              <div className="summary-content">
                <h4>Total Applied</h4>
                <p className="summary-value">
                  ₹{applications.reduce((sum, app) => sum + (app.loanAmount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="filter-section">
            <h4>Filter by Status</h4>
            <div className="filter-buttons">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`filter-button ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? '📋 All' : `${getStatusIcon(status)} ${status}`}
                  <span className="count">
                    {status === 'all'
                      ? applications.length
                      : applications.filter((app) => app.status === status).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Applications in This Category</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setFilterStatus('all')}
              >
                ← View All Applications
              </button>
            </div>
          ) : (
            <div className="applications-grid">
              {filteredApplications.map((app, idx) => (
                <div key={app.id || idx} className="application-card">
                  <div className="card-header">
                    <div className="header-left">
                      <h4>Loan Application #{app.id}</h4>
                      <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                        {getStatusIcon(app.status)} {app.status}
                      </span>
                    </div>
                    <button
                      className="card-menu-button"
                      onClick={() => setSelectedApplication(app)}
                    >
                      ⋮
                    </button>
                  </div>

                  <div className="card-body">
                    <div className="amount-section">
                      <span className="amount-label">Loan Amount</span>
                      <span className="amount-value">
                        ₹{app.loanAmount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="details-row">
                      <span className="detail-label">Purpose:</span>
                      <span className="detail-value">
                        {app.loanPurpose || 'Agricultural Purpose'}
                      </span>
                    </div>

                    {app.approvedAmount && (
                      <div className="details-row">
                        <span className="detail-label">Approved Amount:</span>
                        <span className="detail-value highlight">
                          ₹{app.approvedAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="details-row">
                      <span className="detail-label">Applied Date:</span>
                      <span className="detail-value">{formatDate(app.createdAt)}</span>
                    </div>

                    {app.approvalDate && (
                      <div className="details-row">
                        <span className="detail-label">Approval Date:</span>
                        <span className="detail-value">
                          {formatDate(app.approvalDate)}
                        </span>
                      </div>
                    )}

                    {app.status === 'Under Review' && (
                      <div className="status-message info-message">
                        <span className="message-icon">ℹ️</span>
                        <span>
                          Your application is under review. We'll contact you soon.
                        </span>
                      </div>
                    )}

                    {app.status === 'Approved' && (
                      <div className="status-message success-message">
                        <span className="message-icon">✅</span>
                        <span>
                          Congratulations! Your loan has been approved.
                        </span>
                      </div>
                    )}

                    {app.status === 'Rejected' && (
                      <div className="status-message error-message">
                        <span className="message-icon">❌</span>
                        <span>
                          {app.statusReason || 'Your application was not approved.'}
                        </span>
                      </div>
                    )}

                    {app.status === 'Disbursed' && (
                      <div className="status-message success-message">
                        <span className="message-icon">💰</span>
                        <span>
                          Loan has been disbursed to your account on{' '}
                          {formatDate(app.disbursalDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedApplication(app)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedApplication(null)}
            >
              ✕
            </button>

            <h3>Loan Application Details</h3>

            <div className="modal-body">
              <div className="modal-section">
                <h4>Application Information</h4>
                <div className="detail-row">
                  <span className="label">Application ID:</span>
                  <span className="value">{selectedApplication.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value status-badge ${getStatusBadgeClass(selectedApplication.status)}`}>
                    {getStatusIcon(selectedApplication.status)} {selectedApplication.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Applied Date:</span>
                  <span className="value">{formatDate(selectedApplication.createdAt)}</span>
                </div>
              </div>

              <div className="modal-section">
                <h4>Loan Details</h4>
                <div className="detail-row">
                  <span className="label">Loan Amount Requested:</span>
                  <span className="value highlight">
                    ₹{selectedApplication.loanAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Purpose:</span>
                  <span className="value">
                    {selectedApplication.loanPurpose || 'Agricultural Purpose'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Repayment Period:</span>
                  <span className="value">
                    {selectedApplication.repaymentPeriod} months
                  </span>
                </div>
                {selectedApplication.collateral && (
                  <div className="detail-row">
                    <span className="label">Collateral:</span>
                    <span className="value">{selectedApplication.collateral}</span>
                  </div>
                )}
              </div>

              {selectedApplication.status === 'Approved' && (
                <div className="modal-section success-section">
                  <h4>✅ Approval Details</h4>
                  <div className="detail-row">
                    <span className="label">Approved Amount:</span>
                    <span className="value highlight">
                      ₹{selectedApplication.approvedAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Interest Rate:</span>
                    <span className="value">
                      {selectedApplication.approvedInterestRate}% p.a.
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Monthly EMI:</span>
                    <span className="value">
                      ₹{selectedApplication.emi?.toLocaleString()}
                    </span>
                  </div>
                  {selectedApplication.approvalDate && (
                    <div className="detail-row">
                      <span className="label">Approval Date:</span>
                      <span className="value">
                        {formatDate(selectedApplication.approvalDate)}
                      </span>
                    </div>
                  )}
                  {selectedApplication.bankName && (
                    <div className="detail-row">
                      <span className="label">Lending Bank:</span>
                      <span className="value">{selectedApplication.bankName}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedApplication.status === 'Rejected' && (
                <div className="modal-section error-section">
                  <h4>❌ Rejection Details</h4>
                  <p className="reason">
                    {selectedApplication.statusReason ||
                      'Unfortunately, your application could not be approved at this time.'}
                  </p>
                  <p className="footer-note">
                    You can submit a new application after reviewing your profile.
                  </p>
                </div>
              )}

              {selectedApplication.status === 'Disbursed' && (
                <div className="modal-section success-section">
                  <h4>💰 Disbursement Details</h4>
                  <div className="detail-row">
                    <span className="label">Disbursed Amount:</span>
                    <span className="value highlight">
                      ₹{selectedApplication.approvedAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Disbursement Date:</span>
                    <span className="value">
                      {formatDate(selectedApplication.disbursalDate)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Monthly EMI:</span>
                    <span className="value">
                      ₹{selectedApplication.emi?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {selectedApplication.documentsSubmitted?.length > 0 && (
                <div className="modal-section">
                  <h4>📄 Submitted Documents</h4>
                  <ul className="documents-list">
                    {selectedApplication.documentsSubmitted.map((doc, idx) => (
                      <li key={idx}>📎 {doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-section info-section">
                <h4>ℹ️ Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-marker">📤</span>
                    <div className="timeline-details">
                      <strong>Application Submitted</strong>
                      <p>{formatDate(selectedApplication.createdAt)}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-marker">⏳</span>
                    <div className="timeline-details">
                      <strong>Under Review</strong>
                      <p>3-5 business days from submission</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-marker">✅</span>
                    <div className="timeline-details">
                      <strong>Approval & Disbursement</strong>
                      <p>Within 2-3 days of approval</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setSelectedApplication(null)}
              >
                ← Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;
