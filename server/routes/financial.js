const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial_controller');

// ==========================================
// LOAN ELIGIBILITY ROUTES
// ==========================================

/**
 * POST /api/financial/loan/check-eligibility/:farmerId
 * Check if farmer is eligible for loan and get loan terms
 */
router.post('/loan/check-eligibility/:farmerId', financialController.checkLoanEligibility);

/**
 * GET /api/financial/loan/eligibility/:farmerId
 * Get previously calculated loan eligibility
 */
router.get('/loan/eligibility/:farmerId', financialController.getLoanEligibility);

// ==========================================
// LOAN APPLICATION ROUTES
// ==========================================

/**
 * POST /api/financial/loan/apply/:farmerId
 * Submit loan application
 */
router.post('/loan/apply/:farmerId', financialController.applyForLoan);

/**
 * GET /api/financial/loan/applications/:farmerId
 * Get all loan applications for farmer
 */
router.get('/loan/applications/:farmerId', financialController.getLoanApplications);

/**
 * GET /api/financial/loan/application/:applicationId
 * Get specific loan application details
 */
router.get('/loan/application/:applicationId', financialController.getLoanApplicationDetail);

// ==========================================
// SUBSIDY ROUTES
// ==========================================

/**
 * GET /api/financial/subsidies/available/:farmerId
 * Get all subsidies available for farmer
 */
router.get('/subsidies/available/:farmerId', financialController.getAvailableSubsidies);

/**
 * GET /api/financial/subsidy/:subsidyId
 * Get specific subsidy details
 */
router.get('/subsidy/:subsidyId', financialController.getSubsidyDetails);

/**
 * POST /api/financial/subsidy/apply/:farmerId
 * Apply for a specific subsidy
 */
router.post('/subsidy/apply/:farmerId', financialController.applyForSubsidy);

// ==========================================
// APY (ATAL PENSION YOJANA) ROUTES
// ==========================================

/**
 * GET /api/financial/apy/:farmerId
 * Get APY subscription details or enrollment info
 */
router.get('/apy/:farmerId', financialController.getAPYDetails);

/**
 * POST /api/financial/apy/enroll/:farmerId
 * Enroll farmer in APY
 */
router.post('/apy/enroll/:farmerId', financialController.enrollAPY);

// ==========================================
// CREDIT SCORE ROUTES
// ==========================================

/**
 * GET /api/financial/credit-score/:farmerId
 * Get farmer's credit score
 */
router.get('/credit-score/:farmerId', financialController.getCreditScore);

module.exports = router;
