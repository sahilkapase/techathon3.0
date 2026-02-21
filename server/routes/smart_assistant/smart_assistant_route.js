/**
 * Smart Farmer Scheme Assistant Routes
 * Complete API for farmer scheme management, eligibility, insurance & tracking
 */

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/smart_assistant_controller');

// ===== Quick Registration =====
router.post('/register', controller.quickRegister);

// ===== Farmer Profile =====
router.get('/profile/:farmerId', controller.getFarmerProfile);

// ===== Language Preference =====
router.put('/language/:farmerId', controller.updateLanguage);

// ===== Eligibility Engine =====
router.get('/eligible-schemes/:farmerId', controller.getEligibleSchemes);

// ===== All Schemes =====
router.get('/schemes', controller.getAllSchemes);
router.get('/schemes/:schemeId', controller.getSchemeDetail);

// ===== Compare Schemes =====
router.post('/compare-schemes', controller.compareSchemes);

// ===== Document Checklist =====
router.get('/checklist/:farmerId/:schemeId', controller.getDocumentChecklist);

// ===== Apply for Scheme =====
router.post('/apply/:farmerId/:schemeId', controller.applyForScheme);

// ===== Application Tracking =====
router.get('/applications/:farmerId', controller.getApplications);
router.get('/application/:applicationId', controller.getApplicationDetail);

// ===== Update Application Status (Admin) =====
router.put('/application/:applicationId/status', controller.updateApplicationStatus);

// ===== Insurance Recommendations =====
router.get('/insurance/:farmerId', controller.getInsuranceRecommendations);
router.get('/insurance-products', controller.getAllInsuranceProducts);

// ===== Weather Risk Alerts =====
router.get('/weather-risk/:farmerId', controller.getWeatherRiskAlerts);

// ===== Financial Dashboard =====
router.get('/dashboard/:farmerId', controller.getFinancialDashboard);

module.exports = router;
