import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

/**
 * Subsidy Finder Component
 * Displays all available subsidies for the farmer
 */
const SubsidyFinder = ({ farmerId, farmerInfo }) => {
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubsidy, setSelectedSubsidy] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Fetch subsidies on component mount
  useEffect(() => {
    fetchSubsidies();
  }, [farmerId]);

  /**
   * Fetch available subsidies
   */
  const fetchSubsidies = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `http://localhost:8000/api/financial/subsidies/available/${farmerId}`
      );
      setSubsidies(response.data.subsidies || []);
    } catch (err) {
      setError('Unable to fetch subsidies. Please try again later.');
      console.error('Error fetching subsidies:', err);
      setSubsidies([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter subsidies by type
   */
  const filteredSubsidies =
    filterType === 'all'
      ? subsidies
      : subsidies.filter((s) => s.subsidyType === filterType);

  /**
   * Get unique subsidy types
   */
  const subsidyTypes = ['all', ...new Set(subsidies.map((s) => s.subsidyType))];

  /**
   * Format deadline date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Check if deadline is approaching
   */
  const isDeadlineNear = (dateString) => {
    const deadline = new Date(dateString);
    const today = new Date();
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  return (
    <div className="subsidy-finder-container">
      <h2>🎁 Available Subsidies & Government Support</h2>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span className="alert-message">{error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available subsidies for you...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Summary Section */}
          <div className="subsidy-summary">
            <div className="summary-card">
              <span className="summary-icon">✅</span>
              <div className="summary-content">
                <h4>Total Available</h4>
                <p className="summary-value">{filteredSubsidies.length}</p>
              </div>
            </div>
            <div className="summary-card highlight">
              <span className="summary-icon">👤</span>
              <div className="summary-content">
                <h4>Farmer Type</h4>
                <p className="summary-value">{farmerInfo?.Farmertype || 'Unknown'}</p>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-icon">📍</span>
              <div className="summary-content">
                <h4>District</h4>
                <p className="summary-value">{farmerInfo?.District || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          {subsidies.length > 0 && (
            <div className="filter-section">
              <h4>Filter by Type</h4>
              <div className="filter-buttons">
                {subsidyTypes.map((type) => (
                  <button
                    key={type}
                    className={`filter-button ${filterType === type ? 'active' : ''}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === 'all' ? '📋 All' : `${type}`}
                    <span className="count">
                      {type === 'all'
                        ? subsidies.length
                        : subsidies.filter((s) => s.subsidyType === type).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subsidies Grid */}
          {filteredSubsidies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Subsidies Available</h3>
              <p>
                {subsidies.length === 0
                  ? 'Currently no subsidies match your profile. Please check back later.'
                  : 'No subsidies found for selected category.'}
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => setFilterType('all')}
              >
                ← View All Subsidies
              </button>
            </div>
          ) : (
            <div className="subsidies-grid">
              {filteredSubsidies.map((subsidy) => (
                <div key={subsidy.id} className="subsidy-card">
                  {isDeadlineNear(subsidy.applicationDeadline) && (
                    <div className="deadline-badge">⚡ Urgent</div>
                  )}

                  <div className="subsidy-card-header">
                    <h3>{subsidy.subsidyName}</h3>
                    <span className="subsidy-type-badge">{subsidy.subsidyType}</span>
                  </div>

                  <div className="subsidy-card-body">
                    <div className="detail-item">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">
                        ₹{subsidy.amount?.toLocaleString() || 'Varies'}
                      </span>
                    </div>

                    {subsidy.crops && subsidy.crops.length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Applicable Crops</span>
                        <div className="crop-tags">
                          {subsidy.crops.slice(0, 3).map((crop, idx) => (
                            <span key={idx} className="crop-tag">
                              {crop}
                            </span>
                          ))}
                          {subsidy.crops.length > 3 && (
                            <span className="crop-tag more">
                              +{subsidy.crops.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="detail-item">
                      <span className="detail-label">Deadline</span>
                      <span className={`detail-value ${isDeadlineNear(subsidy.applicationDeadline) ? 'urgent' : ''}`}>
                        {formatDate(subsidy.applicationDeadline)}
                      </span>
                    </div>

                    {subsidy.minLandSize || subsidy.maxLandSize ? (
                      <div className="detail-item">
                        <span className="detail-label">Land Size Eligibility</span>
                        <span className="detail-value">
                          {subsidy.minLandSize || 0} - {subsidy.maxLandSize || '∞'} acres
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => setSelectedSubsidy(subsidy)}
                  >
                    View Details & Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Subsidy Details Modal */}
      {selectedSubsidy && (
        <div className="modal-overlay" onClick={() => setSelectedSubsidy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedSubsidy(null)}
            >
              ✕
            </button>

            <h3>{selectedSubsidy.subsidyName}</h3>

            <div className="modal-body">
              <div className="modal-section">
                <h4>💰 Subsidy Details</h4>
                <div className="detail-row">
                  <span className="label">Subsidy Type:</span>
                  <span className="value">{selectedSubsidy.subsidyType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value highlight">
                    ₹{selectedSubsidy.amount?.toLocaleString() || 'Varies'}
                  </span>
                </div>
              </div>

              {selectedSubsidy.crops && selectedSubsidy.crops.length > 0 && (
                <div className="modal-section">
                  <h4>🌾 Applicable Crops</h4>
                  <div className="crops-list">
                    {selectedSubsidy.crops.map((crop, idx) => (
                      <span key={idx} className="crop-badge">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-section">
                <h4>📋 Eligibility Criteria</h4>
                <ul className="criteria-list">
                  <li>
                    <strong>Land Size:</strong> {selectedSubsidy.minLandSize || 0} -
                    {selectedSubsidy.maxLandSize || '∞'} acres
                  </li>
                  <li>
                    <strong>Farmer Category:</strong>{' '}
                    {selectedSubsidy.farmerCategory?.join(', ') || 'All types'}
                  </li>
                  {selectedSubsidy.regionRestriction && (
                    <li>
                      <strong>Region:</strong> {selectedSubsidy.regionRestriction}
                    </li>
                  )}
                </ul>
              </div>

              <div className="modal-section">
                <h4>📄 Documents Required</h4>
                <ul className="documents-list">
                  <li>Aadhar Card</li>
                  <li>Land Ownership Certificate / Lease Deed</li>
                  <li>Bank Passbook / Account Statement</li>
                  <li>Recent Farm Photos</li>
                  <li>Income Certificate (if applicable)</li>
                </ul>
              </div>

              <div className="modal-section">
                <h4>⏰ Application Timeline</h4>
                <div className="timeline-item">
                  <strong>Application Deadline:</strong>
                  <p>{formatDate(selectedSubsidy.applicationDeadline)}</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="important-notice">
                <strong>⚠️ Important:</strong>
                <p>
                  This subsidy information is for reference only. Please verify with
                  official government sources before application. Eligibility may vary based
                  on your specific situation.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary btn-full">
                ✓ Apply for Subsidy
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setSelectedSubsidy(null)}
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

export default SubsidyFinder;
