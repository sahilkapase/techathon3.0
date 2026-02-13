# 🏦 Financial Support Module - Implementation Guide

## Overview
This guide provides step-by-step implementation for the Financial Support module, which includes:
- Loan eligibility checker
- Subsidy finder
- APY (Atal Pension Yojana) viewer
- Loan application system
- Credit score tracker

---

## DATABASE SCHEMA (Prisma Models)

Add these models to `server/prisma/schema.prisma`:

```prisma
model LoanEligibility {
  id String @id @default(cuid())
  farmerId String
  farmer Farmer @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  
  // Income & Assets
  annualIncome Float
  landSize Float // in acres
  irrigationStatus String // "Irrigated" | "Rainfed" | "Both"
  soilType String
  primaryCrop String
  
  // Calculated Eligibility
  eligibleLoanAmount Float
  interestRate Float
  maxLoanTerm Int // in years
  subsidyPercentage Float
  
  // Risk Assessment
  creditScore Int? // 300-900
  loanHistory String? // "Good" | "Fair" | "Poor" | "No History"
  defaultHistory Boolean @default(false)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([farmerId])
}

model LoanApplication {
  id String @id @default(cuid())
  farmerId String
  farmer Farmer @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  
  // Loan Details
  loanAmount Float
  loanPurpose String // "Farm Purchase", "Equipment", "Seeds", "Infrastructure"
  repaymentPeriod Int // months
  collateral String?
  
  // Status Tracking
  status String @default("Applied") // "Applied" | "Under Review" | "Approved" | "Rejected" | "Disbursed"
  statusReason String?
  bankName String?
  
  // Document References
  documentsSubmitted String[] // URL array
  approvalDate DateTime?
  disbursalDate DateTime?
  
  // Financial Terms
  approvedAmount Float?
  approvedInterestRate Float?
  emi Float? // Equated Monthly Installment
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  repayments Repayment[]
  
  @@index([farmerId])
  @@index([status])
}

model Repayment {
  id String @id @default(cuid())
  loanId String
  loan LoanApplication @relation(fields: [loanId], references: [id], onDelete: Cascade)
  
  dueDate DateTime
  amount Float
  paidDate DateTime?
  status String @default("Pending") // "Paid" | "Pending" | "Overdue"
  
  @@index([loanId])
}

model SubsidyRecord {
  id String @id @default(cuid())
  farmerId String
  farmer Farmer @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  
  subsidyName String
  subsidyType String // "Crop", "Fertilizer", "Equipment", "Labor"
  amount Float
  crops String[] // Array of applicable crops
  
  // Eligibility
  minLandSize Float
  maxLandSize Float
  regionRestriction String? // State/District
  farmerCategory String[] // "Marginal", "Small", "Medium", "Large"
  
  // Tenure
  applicationDeadline DateTime
  disbursalDate DateTime?
  status String @default("Available") // "Available" | "Applied" | "Approved" | "Disbursed" | "Expired"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([farmerId])
  @@index([subsidyType])
}

model APYSubscription {
  id String @id @default(cuid())
  farmerId String
  farmer Farmer @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  
  // Subscription Details
  enrollmentDate DateTime
  accountNumber String @unique
  
  // Contribution Details
  monthlyContribution Float
  pensionAge Int // 60, 65, 70 (years)
  
  // Pension Amount at Different Ages
  pensionAt60 Float?
  pensionAt65 Float?
  pensionAt70 Float?
  
  // Contribution Tracking
  totalContributed Float @default(0)
  governmentSubsidy Float @default(0)
  
  // Status
  status String @default("Active") // "Active" | "Paused" | "Matured"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([farmerId])
}

model CreditScore {
  id String @id @default(cuid())
  farmerId String @unique
  farmer Farmer @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  
  // Score
  score Int // 300-900
  scoreGrade String // "Poor" | "Fair" | "Good" | "Excellent"
  
  // History
  loanHistory String?
  repaymentRecord String?
  defaultCount Int @default(0)
  
  lastUpdated DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([farmerId])
}

// Update Farmer model to include relations
model Farmer {
  // ... existing fields ...
  
  loanEligibility LoanEligibility?
  loanApplications LoanApplication[]
  subsidies SubsidyRecord[]
  apySubscription APYSubscription?
  creditScore CreditScore?
}
```

---

## BACKEND - CONTROLLERS

### File: `server/controllers/financial_controller.js`

```javascript
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// LOAN ELIGIBILITY CONTROLLER
// ==========================================

exports.checkLoanEligibility = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { annualIncome, landSize, irrigationStatus, primaryCrop } = req.body;

    // Fetch farmer details
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Calculate loan eligibility based on income and land size
    const eligibleAmount = calculateLoanAmount(annualIncome, landSize, farmer.farmerType);
    const interestRate = calculateInterestRate(landSize, farmer.farmerType);
    const subsidyPercentage = calculateSubsidy(farmer.farmerType, landSize);

    // Check credit score if available
    const creditScore = await prisma.creditScore.findUnique({
      where: { farmerId },
    });

    // Save eligibility record
    const eligibility = await prisma.loanEligibility.upsert({
      where: { farmerId },
      create: {
        farmerId,
        annualIncome,
        landSize,
        irrigationStatus,
        primaryCrop,
        eligibleLoanAmount: eligibleAmount,
        interestRate,
        maxLoanTerm: 5, // Default 5 years
        subsidyPercentage,
        creditScore: creditScore?.score || null,
        loanHistory: creditScore?.scoreGrade || 'No History',
      },
      update: {
        annualIncome,
        landSize,
        irrigationStatus,
        primaryCrop,
        eligibleLoanAmount: eligibleAmount,
        interestRate,
        subsidyPercentage,
      },
    });

    res.status(200).json({
      success: true,
      eligibility: {
        farmerId,
        eligibleLoanAmount,
        interestRate,
        maxLoanTerm: 5,
        subsidyPercentage,
        monthlyEMI: calculateEMI(eligibleAmount, interestRate, 5),
        recommendation: generateLoanRecommendation(eligibleAmount, primaryCrop),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoanEligibility = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const eligibility = await prisma.loanEligibility.findUnique({
      where: { farmerId },
    });

    if (!eligibility) {
      return res.status(404).json({
        message: 'No eligibility data. Please complete assessment first.',
      });
    }

    res.status(200).json({
      success: true,
      eligibility,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// LOAN APPLICATION CONTROLLER
// ==========================================

exports.applyForLoan = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { loanAmount, loanPurpose, repaymentPeriod, collateral, documents } = req.body;

    // Verify eligibility
    const eligibility = await prisma.loanEligibility.findUnique({
      where: { farmerId },
    });

    if (!eligibility) {
      return res.status(400).json({
        message: 'Must complete loan eligibility assessment first',
      });
    }

    if (loanAmount > eligibility.eligibleLoanAmount) {
      return res.status(400).json({
        message: `Requested amount exceeds eligible amount of ₹${eligibility.eligibleLoanAmount}`,
      });
    }

    // Create loan application
    const application = await prisma.loanApplication.create({
      data: {
        farmerId,
        loanAmount,
        loanPurpose,
        repaymentPeriod,
        collateral,
        documentsSubmitted: documents || [],
        status: 'Applied',
        approvedInterestRate: eligibility.interestRate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      application,
      nextSteps: [
        'Your application is under review',
        'Bank will contact you within 3-5 business days',
        'Please keep your documents ready',
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoanApplications = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const applications = await prisma.loanApplication.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      include: {
        repayments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoanApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        repayments: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// SUBSIDY CONTROLLER
// ==========================================

exports.getAvailableSubsidies = async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get farmer details
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { farmDetails: true },
    });

    // Get all subsidies and filter by eligibility
    const allSubsidies = await prisma.subsidyRecord.findMany({
      where: {
        status: 'Available',
        applicationDeadline: {
          gte: new Date(),
        },
      },
    });

    // Filter by eligibility criteria
    const eligibleSubsidies = allSubsidies.filter((subsidy) => {
      return (
        subsidy.minLandSize <= farmer.farmDetails.landSize &&
        farmer.farmDetails.landSize <= subsidy.maxLandSize &&
        subsidy.farmerCategory.includes(farmer.farmerCategory) &&
        (!subsidy.regionRestriction ||
          subsidy.regionRestriction === farmer.district)
      );
    });

    res.status(200).json({
      success: true,
      totalAvailable: eligibleSubsidies.length,
      subsidies: eligibleSubsidies,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubsidyDetails = async (req, res) => {
  try {
    const { subsidyId } = req.params;

    const subsidy = await prisma.subsidyRecord.findUnique({
      where: { id: subsidyId },
    });

    if (!subsidy) {
      return res.status(404).json({ message: 'Subsidy not found' });
    }

    res.status(200).json({
      success: true,
      subsidy,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// APY (PENSION) CONTROLLER
// ==========================================

exports.getAPYDetails = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const apySubscription = await prisma.aPYSubscription.findUnique({
      where: { farmerId },
    });

    if (!apySubscription) {
      // Farmer not enrolled, show enrollment info
      return res.status(200).json({
        success: true,
        enrolled: false,
        enrollmentInfo: {
          description:
            'Atal Pension Yojana (APY) is a government pension scheme for unorganized sector workers',
          eligibleAge: '18-40 years',
          minContribution: 1000,
          benefits: [
            'Monthly pension from age 60',
            'Government contribution of 50%',
            'Life insurance coverage',
          ],
        },
      });
    }

    res.status(200).json({
      success: true,
      enrolled: true,
      subscription: apySubscription,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enrollAPY = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { monthlyContribution, pensionAge } = req.body;

    // Validate contribution amount (minimum ₹1000)
    if (monthlyContribution < 1000) {
      return res.status(400).json({
        message: 'Minimum monthly contribution is ₹1000',
      });
    }

    // Calculate pension amount based on contribution and age
    const pensionAmount = calculateAPYPension(monthlyContribution, pensionAge);

    const subscription = await prisma.aPYSubscription.create({
      data: {
        farmerId,
        monthlyContribution,
        pensionAge,
        accountNumber: generateAccountNumber(),
        enrollmentDate: new Date(),
        status: 'Active',
        pensionAt60: pensionAge >= 60 ? pensionAmount : null,
        pensionAt65: pensionAge >= 65 ? pensionAmount : null,
        pensionAt70: pensionAge >= 70 ? pensionAmount : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in APY',
      subscription,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// CREDIT SCORE CONTROLLER
// ==========================================

exports.getCreditScore = async (req, res) => {
  try {
    const { farmerId } = req.params;

    let creditScore = await prisma.creditScore.findUnique({
      where: { farmerId },
    });

    if (!creditScore) {
      // Calculate initial credit score if not exists
      creditScore = await calculateAndSaveCreditScore(farmerId);
    }

    res.status(200).json({
      success: true,
      creditScore,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function calculateLoanAmount(annualIncome, landSize, farmerType) {
  // Formula: Loan Amount = (Annual Income * 2) + (Land Size * 50,000)
  let baseAmount = annualIncome * 2 + landSize * 50000;

  // Apply multiplier based on farmer type
  const multiplier = {
    Marginal: 1.0,
    Small: 1.25,
    Medium: 1.5,
    Large: 1.75,
  };

  return baseAmount * (multiplier[farmerType] || 1.0);
}

function calculateInterestRate(landSize, farmerType) {
  // Base rate 6%
  let rate = 6;

  // Reduce rate for larger farms
  if (landSize > 5) rate -= 0.5;
  if (landSize > 10) rate -= 1;

  // Subsidies for marginal and small farmers
  if (farmerType === 'Marginal') rate -= 2;
  if (farmerType === 'Small') rate -= 1;

  return Math.max(rate, 4); // Minimum 4%
}

function calculateSubsidy(farmerType, landSize) {
  if (farmerType === 'Marginal' && landSize <= 1) return 5; // 5% subsidy
  if (farmerType === 'Small' && landSize <= 2) return 3; // 3% subsidy
  return 0;
}

function calculateEMI(principal, rate, years) {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

function generateLoanRecommendation(amount, crop) {
  return `Based on your profile, we recommend using this loan for: Buying quality seeds and fertilizers for ${crop}, Farm equipment maintenance, or Labor costs during peak season.`;
}

function calculateAPYPension(monthlyContribution, pensionAge) {
  // Simplified calculation (actual is complex)
  // Monthly Pension = (Monthly Contribution × Annuity Factor)
  const annuityFactor = {
    60: 12.5,
    65: 11.2,
    70: 10.5,
  };
  return monthlyContribution * (annuityFactor[pensionAge] || 10);
}

function generateAccountNumber() {
  return 'APY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

async function calculateAndSaveCreditScore(farmerId) {
  // Get loan history
  const loans = await prisma.loanApplication.findMany({
    where: { farmerId },
  });

  const repayments = await prisma.repayment.findMany({
    where: {
      loan: {
        farmerId,
      },
    },
  });

  // Calculate score based on repayment history
  let score = 700; // Base score

  if (loans.length > 0) {
    const paidRepayments = repayments.filter((r) => r.status === 'Paid').length;
    const totalRepayments = repayments.length;

    const paymentRate = totalRepayments > 0 ? paidRepayments / totalRepayments : 0;

    if (paymentRate === 1) score += 100; // Perfect payment
    else if (paymentRate >= 0.95) score += 50;
    else if (paymentRate >= 0.85) score -= 50;
    else score -= 150;
  }

  score = Math.max(300, Math.min(900, score)); // Keep between 300-900

  const creditScore = await prisma.creditScore.create({
    data: {
      farmerId,
      score,
      scoreGrade:
        score >= 750
          ? 'Excellent'
          : score >= 650
            ? 'Good'
            : score >= 550
              ? 'Fair'
              : 'Poor',
      defaultCount: repayments.filter((r) => r.status === 'Overdue').length,
    },
  });

  return creditScore;
}

module.exports = exports;
```

---

## BACKEND - ROUTES

### File: `server/routes/financial.js`

```javascript
const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial_controller');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Loan Eligibility Routes
router.post('/loan/check-eligibility/:farmerId', auth, financialController.checkLoanEligibility);
router.get('/loan/eligibility/:farmerId', auth, financialController.getLoanEligibility);

// Loan Application Routes
router.post('/loan/apply/:farmerId', auth, financialController.applyForLoan);
router.get('/loan/applications/:farmerId', auth, financialController.getLoanApplications);
router.get('/loan/application/:applicationId', auth, financialController.getLoanApplicationDetail);

// Subsidy Routes
router.get('/subsidies/available/:farmerId', auth, financialController.getAvailableSubsidies);
router.get('/subsidy/:subsidyId', auth, financialController.getSubsidyDetails);

// APY Routes
router.get('/apy/:farmerId', auth, financialController.getAPYDetails);
router.post('/apy/enroll/:farmerId', auth, financialController.enrollAPY);

// Credit Score Routes
router.get('/credit-score/:farmerId', auth, financialController.getCreditScore);

module.exports = router;
```

Add to `server/index.js`:
```javascript
const financialRoutes = require('./routes/financial');
app.use('/api/financial', financialRoutes);
```

---

## FRONTEND - COMPONENTS

### Component 1: `client/src/components/AuthenticateFarmer/FinancialSupport/FinancialDashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';
import LoanEligibility from './LoanEligibility';
import SubsidyFinder from './SubsidyFinder';
import APYDashboard from './APYDashboard';
import LoanApplications from './LoanApplications';

export default function FinancialDashboard({ farmerId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, [farmerId]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/financial/loan/eligibility/${farmerId}`);
      setEligibility(response.data.eligibility);
    } catch (error) {
      console.log('No eligibility data yet'); // User hasn't completed assessment
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="financial-dashboard">
      <header className="financial-header">
        <h1>💰 Financial Services</h1>
        <p>Access loans, subsidies, and pension schemes</p>
      </header>

      <nav className="financial-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'loans' ? 'active' : ''}
          onClick={() => setActiveTab('loans')}
        >
          Loans
        </button>
        <button
          className={activeTab === 'subsidies' ? 'active' : ''}
          onClick={() => setActiveTab('subsidies')}
        >
          Subsidies
        </button>
        <button
          className={activeTab === 'pension' ? 'active' : ''}
          onClick={() => setActiveTab('pension')}
        >
          Pension (APY)
        </button>
      </nav>

      <main className="financial-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Your Financial Profile</h2>
            {eligibility ? (
              <div className="eligibility-cards">
                <div className="card">
                  <h3>Eligible Loan Amount</h3>
                  <p className="amount">₹{eligibility.eligibleLoanAmount.toLocaleString()}</p>
                </div>
                <div className="card">
                  <h3>Interest Rate</h3>
                  <p className="rate">{eligibility.interestRate}% p.a.</p>
                </div>
                <div className="card">
                  <h3>Subsidy Available</h3>
                  <p className="subsidy">{eligibility.subsidyPercentage}%</p>
                </div>
              </div>
            ) : (
              <div className="no-data">
                <p>Complete your loan eligibility assessment to see your profile</p>
              </div>
            )}

            <div className="quick-actions">
              <button onClick={() => setActiveTab('loans')} className="btn-primary">
                Check Loan Eligibility
              </button>
              <button onClick={() => setActiveTab('subsidies')} className="btn-secondary">
                View Available Subsidies
              </button>
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <LoanEligibility farmerId={farmerId} onEligibilityFetch={fetchEligibility} />
        )}

        {activeTab === 'subsidies' && <SubsidyFinder farmerId={farmerId} />}

        {activeTab === 'pension' && <APYDashboard farmerId={farmerId} />}
      </main>
    </div>
  );
}
```

### Component 2: `client/src/components/AuthenticateFarmer/FinancialSupport/LoanEligibility.jsx`

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

export default function LoanEligibility({ farmerId, onEligibilityFetch }) {
  const [formData, setFormData] = useState({
    annualIncome: '',
    landSize: '',
    irrigationStatus: 'Both',
    primaryCrop: '',
  });
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.annualIncome || !formData.landSize || !formData.primaryCrop) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`/api/financial/loan/check-eligibility/${farmerId}`, formData);

      setEligibility(response.data.eligibility);
      onEligibilityFetch?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Error checking eligibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-eligibility">
      <h2>Check Your Loan Eligibility</h2>

      <form onSubmit={handleSubmit} className="eligibility-form">
        <div className="form-group">
          <label>Annual Income (₹)*</label>
          <input
            type="number"
            name="annualIncome"
            value={formData.annualIncome}
            onChange={handleChange}
            placeholder="e.g., 200000"
            required
          />
          <small>Total yearly farm income</small>
        </div>

        <div className="form-group">
          <label>Land Size (Acres)*</label>
          <input
            type="number"
            name="landSize"
            value={formData.landSize}
            onChange={handleChange}
            placeholder="e.g., 5"
            step="0.5"
            required
          />
          <small>Total cultivated land area</small>
        </div>

        <div className="form-group">
          <label>Irrigation Status*</label>
          <select name="irrigationStatus" value={formData.irrigationStatus} onChange={handleChange}>
            <option value="Irrigated">Fully Irrigated</option>
            <option value="Rainfed">Rainfed</option>
            <option value="Both">Both</option>
          </select>
        </div>

        <div className="form-group">
          <label>Primary Crop*</label>
          <input
            type="text"
            name="primaryCrop"
            value={formData.primaryCrop}
            onChange={handleChange}
            placeholder="e.g., Sugarcane"
            required
          />
          <small>Main crop you cultivate</small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Checking...' : 'Check Eligibility'}
        </button>
      </form>

      {eligibility && (
        <div className="eligibility-result">
          <h3>Your Loan Eligibility</h3>
          <div className="result-cards">
            <div className="card">
              <label>Maximum Loan Amount</label>
              <p className="amount">₹{eligibility.eligibleLoanAmount.toLocaleString()}</p>
            </div>
            <div className="card">
              <label>Interest Rate</label>
              <p>{eligibility.interestRate}% per annum</p>
            </div>
            <div className="card">
              <label>Monthly EMI (5 years)</label>
              <p>₹{(eligibility.monthlyEMI || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}</p>
            </div>
            <div className="card">
              <label>Subsidy Available</label>
              <p>{eligibility.subsidyPercentage}%</p>
            </div>
          </div>

          <div className="recommendation">
            <h4>💡 Recommendation</h4>
            <p>{eligibility.recommendation}</p>
          </div>

          <button className="btn-primary" onClick={() => alert('Apply for Loan functionality coming soon')}>
            Proceed to Apply
          </button>
        </div>
      )}
    </div>
  );
}
```

### Component 3: `client/src/components/AuthenticateFarmer/FinancialSupport/SubsidyFinder.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

export default function SubsidyFinder({ farmerId }) {
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubsidy, setSelectedSubsidy] = useState(null);

  useEffect(() => {
    fetchSubsidies();
  }, [farmerId]);

  const fetchSubsidies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/financial/subsidies/available/${farmerId}`);
      setSubsidies(response.data.subsidies);
    } catch (error) {
      console.error('Error fetching subsidies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subsidy-finder">
      <h2>Available Subsidies</h2>
      <p className="subtitle">You are eligible for {subsidies.length} subsidies</p>

      {loading ? (
        <p className="loading">Loading subsidies...</p>
      ) : subsidies.length === 0 ? (
        <div className="no-data">
          <p>No subsidies available for your profile at this time</p>
        </div>
      ) : (
        <div className="subsidies-grid">
          {subsidies.map((subsidy) => (
            <div key={subsidy.id} className="subsidy-card">
              <h3>{subsidy.subsidyName}</h3>
              <div className="subsidy-details">
                <p>
                  <strong>Type:</strong> {subsidy.subsidyType}
                </p>
                <p>
                  <strong>Amount:</strong> ₹{subsidy.amount.toLocaleString()}
                </p>
                <p>
                  <strong>Crops:</strong> {subsidy.crops.join(', ')}
                </p>
                <p>
                  <strong>Deadline:</strong> {new Date(subsidy.applicationDeadline).toLocaleDateString()}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedSubsidy(subsidy)}>
                View Details & Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedSubsidy && (
        <div className="subsidy-modal">
          <div className="modal-content">
            <button className="close" onClick={() => setSelectedSubsidy(null)}>
              ✕
            </button>
            <h3>{selectedSubsidy.subsidyName}</h3>
            <div className="modal-details">
              <p>
                <strong>Description:</strong> {selectedSubsidy.subsidyName} is a government program to
                support farmers
              </p>
              <p>
                <strong>Eligible Crops:</strong> {selectedSubsidy.crops.join(', ')}
              </p>
              <p>
                <strong>Subsidy Amount:</strong> ₹{selectedSubsidy.amount.toLocaleString()}
              </p>
              <p>
                <strong>Documents Required:</strong> Aadhar, Land Ownership Certificate, Bank Details
              </p>
              <p>
                <strong>Application Deadline:</strong>{' '}
                {new Date(selectedSubsidy.applicationDeadline).toLocaleDateString()}
              </p>
            </div>
            <button className="btn-primary">Apply for Subsidy</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Component 4: `client/src/components/AuthenticateFarmer/FinancialSupport/APYDashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialSupport.css';

export default function APYDashboard({ farmerId }) {
  const [apy, setApy] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [formData, setFormData] = useState({
    monthlyContribution: 1000,
    pensionAge: 60,
  });

  useEffect(() => {
    fetchAPYDetails();
  }, [farmerId]);

  const fetchAPYDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/financial/apy/${farmerId}`);
      setApy(response.data);
      setEnrolled(response.data.enrolled);
    } catch (error) {
      console.error('Error fetching APY details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`/api/financial/apy/enroll/${farmerId}`, formData);
      setApy(response.data);
      setEnrolled(true);
      setShowEnrollForm(false);
      alert('Successfully enrolled in APY!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error enrolling in APY');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading APY details...</div>;

  return (
    <div className="apy-dashboard">
      <h2>Atal Pension Yojana (APY)</h2>

      {!enrolled ? (
        <div className="apy-info">
          <h3>Secure Your Future with APY</h3>
          <p>
            Atal Pension Yojana is a government-sponsored pension scheme for unorganized sector workers.
          </p>

          <div className="benefits-list">
            <h4>Key Benefits:</h4>
            <ul>
              <li>✅ Guaranteed monthly pension from age 60</li>
              <li>✅ Government co-contribution (50% of your contribution)</li>
              <li>✅ Life insurance coverage of ₹2 lakhs</li>
              <li>✅ Spouse gets 50% of pension after your death</li>
            </ul>
          </div>

          <div className="eligibility-criteria">
            <h4>Eligibility:</h4>
            <p>Age: 18-40 years</p>
            <p>Minimum contribution: ₹1,000/month</p>
          </div>

          {!showEnrollForm ? (
            <button className="btn-primary" onClick={() => setShowEnrollForm(true)}>
              Enroll in APY
            </button>
          ) : (
            <form onSubmit={handleEnroll} className="apy-form">
              <div className="form-group">
                <label>Monthly Contribution (₹)*</label>
                <input
                  type="number"
                  value={formData.monthlyContribution}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyContribution: parseInt(e.target.value) })
                  }
                  min={1000}
                  step={100}
                  required
                />
                <small>Minimum ₹1,000</small>
              </div>

              <div className="form-group">
                <label>Pension Age*</label>
                <select
                  value={formData.pensionAge}
                  onChange={(e) =>
                    setFormData({ ...formData, pensionAge: parseInt(e.target.value) })
                  }
                >
                  <option value={60}>60 years</option>
                  <option value={65}>65 years</option>
                  <option value={70}>70 years</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="apy-status">
          <h3>Your APY Status</h3>
          <div className="status-cards">
            <div className="card">
              <label>Account Number</label>
              <p>{apy.subscription.accountNumber}</p>
            </div>
            <div className="card">
              <label>Monthly Contribution</label>
              <p>₹{apy.subscription.monthlyContribution}</p>
            </div>
            <div className="card">
              <label>Pension Age</label>
              <p>{apy.subscription.pensionAge} years</p>
            </div>
            <div className="card">
              <label>Enrollment Date</label>
              <p>{new Date(apy.subscription.enrollmentDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="pension-projection">
            <h4>Projected Monthly Pension</h4>
            <p>₹{(apy.subscription.monthlyContribution * 12).toLocaleString()} at age {apy.subscription.pensionAge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Styling: `client/src/components/AuthenticateFarmer/FinancialSupport/FinancialSupport.css`

```css
.financial-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.financial-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.financial-header h1 {
  margin: 0;
  font-size: 2.5rem;
}

.financial-header p {
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.financial-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
  flex-wrap: wrap;
}

.financial-tabs button {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.financial-tabs button:hover {
  color: #667eea;
}

.financial-tabs button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.overview-section {
  animation: fadeIn 0.3s ease;
}

.eligibility-cards,
.result-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  border-left: 4px solid #667eea;
}

.card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card .amount,
.card .rate,
.card .subsidy {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
}

.loan-eligibility,
.subsidy-finder,
.apy-dashboard {
  animation: fadeIn 0.3s ease;
}

.loan-eligibility h2,
.subsidy-finder h2,
.apy-dashboard h2 {
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  color: #999;
  margin-bottom: 20px;
}

.eligibility-form {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 0.9rem;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  border-left: 4px solid #c33;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.eligibility-result {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
}

.eligibility-result h3 {
  color: #667eea;
  margin-bottom: 20px;
}

.recommendation {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  border-left: 4px solid #667eea;
}

.recommendation h4 {
  margin: 0 0 10px 0;
  color: #667eea;
}

.subsidies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.subsidy-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.subsidy-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.subsidy-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.subsidy-details {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 15px;
}

.subsidy-details p {
  margin: 8px 0;
}

.subsidy-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  position: relative;
  animation: slideUp 0.3s ease;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-details {
  margin: 20px 0;
  color: #666;
  line-height: 1.8;
}

.modal-details p {
  margin: 10px 0;
}

.apy-info,
.apy-status {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.apy-info h3 {
  color: #667eea;
  margin-bottom: 10px;
}

.apy-info > p {
  color: #666;
  margin-bottom: 20px;
}

.benefits-list {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  border-left: 4px solid #667eea;
}

.benefits-list h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.benefits-list ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.benefits-list li {
  margin: 8px 0;
}

.eligibility-criteria {
  background: #f0f7ff;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.eligibility-criteria h4 {
  margin: 0 0 10px 0;
  color: #667eea;
}

.eligibility-criteria p {
  margin: 5px 0;
  color: #666;
}

.apy-form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
  margin: 20px 0;
}

.apy-status h3 {
  color: #667eea;
  margin-bottom: 20px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.pension-projection {
  background: #f0f7ff;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  border-left: 4px solid #667eea;
}

.pension-projection h4 {
  margin: 0 0 10px 0;
  color: #667eea;
}

.pension-projection p {
  margin: 0;
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.no-data {
  background: #f9f9f9;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  color: #999;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  flex-wrap: wrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .financial-dashboard {
    padding: 10px;
  }

  .financial-header h1 {
    font-size: 1.8rem;
  }

  .eligibility-cards,
  .result-cards {
    grid-template-columns: 1fr;
  }

  .financial-tabs {
    flex-direction: column;
  }

  .financial-tabs button {
    width: 100%;
    border-bottom: none;
    border-left: 4px solid transparent;
  }

  .financial-tabs button.active {
    border-left-color: #667eea;
    border-bottom: none;
  }

  .subsidy-modal {
    padding: 20px;
  }

  .modal-content {
    max-width: 90%;
  }
}
```

---

## INTEGRATION STEPS

1. **Add Prisma models** to `server/prisma/schema.prisma`
2. **Run migration**: `prisma migrate dev --name add_financial_support`
3. **Copy financial controller** to `server/controllers/financial_controller.js`
4. **Copy financial routes** to `server/routes/financial.js`
5. **Add routes to index.js**: `app.use('/api/financial', financialRoutes);`
6. **Create React components** in `client/src/components/AuthenticateFarmer/FinancialSupport/`
7. **Copy CSS file** for styling
8. **Add to farmer dashboard** navigation menu

---

## TESTING CHECKLIST

- [ ] POST /api/financial/loan/check-eligibility/:farmerId
- [ ] GET /api/financial/loan/eligibility/:farmerId
- [ ] POST /api/financial/loan/apply/:farmerId
- [ ] GET /api/financial/loan/applications/:farmerId
- [ ] GET /api/financial/subsidies/available/:farmerId
- [ ] POST /api/financial/apy/enroll/:farmerId
- [ ] GET /api/financial/credit-score/:farmerId

---

## NOTES

- All calculations are simplified for demonstration
- Real implementation should integrate with bank APIs
- Credit score calculation is basic; use actual CIBIL data in production
- Add proper error handling and validation
- Implement proper authentication/authorization
- Add role-based access control for admin approval workflows
