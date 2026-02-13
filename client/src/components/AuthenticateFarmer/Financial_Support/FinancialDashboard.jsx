import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';
import LoanEligibility from './LoanEligibility';
import SubsidyFinder from './SubsidyFinder';
import APYDashboard from './APYDashboard';
import LoanApplications from './LoanApplications';

/**
 * Financial Dashboard - Main component for financial services
 * Displays loans, subsidies, and pension options
 */
const FinancialDashboard = ({ farmerId, farmerInfo }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creditScore, setCreditScore] = useState(null);

  // Fetch loan eligibility and credit score on mount
  useEffect(() => {
    fetchEligibility();
    fetchCreditScore();
  }, [farmerId]);

  /**
   * Fetch loan eligibility data
   */
  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/financial/loan/eligibility/${farmerId}`
      );
      setEligibility(response.data.eligibility);
      setError(null);
    } catch (error) {
      // No eligibility data yet - this is normal
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch credit score data
   */
  const fetchCreditScore = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/financial/credit-score/${farmerId}`
      );
      setCreditScore(response.data.creditScore);
    } catch (error) {
      console.error('Error fetching credit score:', error);
    }
  };

  /**
   * Handle tab navigation
   */
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="financial-dashboard">
      {/* Header Section */}
      <header className="financial-header">
        <div className="header-content">
          <h1>💰 Financial Services Portal</h1>
          <p>Access loans, subsidies, and pension schemes designed for farmers</p>
        </div>
        {creditScore && (
          <div className="credit-score-widget">
            <div className="score-box">
              <span className="score-label">Credit Score</span>
              <span className="score-value">{creditScore.score}</span>
              <span className={`score-grade ${creditScore.scoreGrade.toLowerCase()}`}>
                {creditScore.scoreGrade}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="financial-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabClick('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => handleTabClick('loans')}
        >
          <span className="tab-icon">💳</span>
          Loans
        </button>
        <button
          className={`tab-button ${activeTab === 'subsidies' ? 'active' : ''}`}
          onClick={() => handleTabClick('subsidies')}
        >
          <span className="tab-icon">🎁</span>
          Subsidies
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => handleTabClick('applications')}
        >
          <span className="tab-icon">📋</span>
          My Applications
        </button>
        <button
          className={`tab-button ${activeTab === 'pension' ? 'active' : ''}`}
          onClick={() => handleTabClick('pension')}
        >
          <span className="tab-icon">🏦</span>
          Pension (APY)
        </button>
      </nav>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="financial-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Your Financial Profile</h2>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your financial data...</p>
              </div>
            ) : eligibility ? (
              <div className="overview-grid">
                {/* Eligibility Cards */}
                <div className="eligibility-cards">
                  <div className="card primary">
                    <div className="card-icon">💵</div>
                    <h3>Eligible Loan Amount</h3>
                    <p className="amount">₹{eligibility.eligibleLoanAmount?.toLocaleString() || 0}</p>
                    <p className="description">Maximum you can borrow</p>
                  </div>

                  <div className="card">
                    <div className="card-icon">📈</div>
                    <h3>Interest Rate</h3>
                    <p className="rate">{eligibility.interestRate?.toFixed(2) || 0}%</p>
                    <p className="description">Per annum</p>
                  </div>

                  <div className="card">
                    <div className="card-icon">🎯</div>
                    <h3>Subsidy Available</h3>
                    <p className="subsidy">{eligibility.subsidyPercentage?.toFixed(2) || 0}%</p>
                    <p className="description">Government support</p>
                  </div>

                  <div className="card">
                    <div className="card-icon">📅</div>
                    <h3>Monthly EMI (5 years)</h3>
                    <p className="emi">₹{eligibility.monthlyEMI?.toLocaleString() || 0}</p>
                    <p className="description">Approximate payment</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleTabClick('loans')}
                    >
                      Apply for Loan
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleTabClick('subsidies')}
                    >
                      View Subsidies
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleTabClick('applications')}
                    >
                      Track Applications
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data-state">
                <div className="empty-state-icon">📋</div>
                <h3>Start Your Financial Journey</h3>
                <p>Complete your loan eligibility assessment to see your financial profile and available options</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleTabClick('loans')}
                >
                  Check Loan Eligibility
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <LoanEligibility
            farmerId={farmerId}
            farmerInfo={farmerInfo}
            onEligibilityFetch={fetchEligibility}
          />
        )}

        {/* Subsidies Tab */}
        {activeTab === 'subsidies' && (
          <SubsidyFinder
            farmerId={farmerId}
            farmerInfo={farmerInfo}
          />
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <LoanApplications farmerId={farmerId} />
        )}

        {/* Pension Tab */}
        {activeTab === 'pension' && (
          <APYDashboard farmerId={farmerId} farmerInfo={farmerInfo} />
        )}
      </main>
    </div>
  );
};

export default FinancialDashboard;
