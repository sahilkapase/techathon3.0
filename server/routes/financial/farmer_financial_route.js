/**
 * AS-4: Routes for Farmer Financial Support
 * 
 * Handles all routes for:
 * - Eligible schemes
 * - Insurance options
 * - Financial support
 * - WhatsApp/SMS communications
 * - PDF form generation
 * 
 * @file farmer_financial_route.js
 */

const express = require('express');
const router = express.Router();
const financialController = require('../../controllers/farmer_financial_support_controller');
const formGenerator = require('../../services/form_generator_service');
const scheme_details = require('../../models/scheme_details');
const farmer_info = require('../../models/farmer_info');

/**
 * @route POST /financial/eligible-schemes
 * @desc Get eligible schemes based on farmer profile
 * @access Public
 * 
 * @param {string} cropType - Type of crop
 * @param {number} landSize - Size of land in acres
 * @param {string} district - District name
 * @param {string} season - Season (Kharif/Rabi/Zaid)
 */
router.post('/eligible-schemes', financialController.getEligibleSchemes);

/**
 * @route POST /financial/insurance-options
 * @desc Get insurance options for specific crop and land size
 * @access Public
 * 
 * @param {string} cropType - Type of crop
 * @param {number} landSize - Size of land in acres
 */
router.post('/insurance-options', financialController.getInsuranceOptions);

/**
 * @route POST /financial/support
 * @desc Get all financial support options (subsidies, loans, insurance)
 * @access Public
 * 
 * @param {string} cropType - Type of crop
 * @param {number} landSize - Size of land in acres
 * @param {string} district - District name
 * @param {string} season - Current season
 */
router.post('/support', financialController.getFinancialSupport);

/**
 * @route POST /financial/whatsapp-schemes
 * @desc Send scheme information via WhatsApp
 * @access Public
 * 
 * @param {string} farmerPhone - 10-digit phone number
 * @param {array} schemeIds - Array of scheme IDs
 */
router.post('/whatsapp-schemes', financialController.sendSchemeViaWhatsApp);

/**
 * @route POST /financial/register-reminders
 * @desc Register for deadline reminders
 * @access Public
 * 
 * @param {string} farmerId - Farmer ID
 * @param {array} schemeIds - Array of scheme IDs
 * @param {string} communicationMethod - 'sms', 'whatsapp', or 'both'
 */
router.post('/register-reminders', financialController.registerForReminders);

/**
 * @route POST /financial/compare-schemes
 * @desc Compare multiple schemes side-by-side
 * @access Public
 * 
 * @param {array} schemeIds - Array of at least 2 scheme IDs
 */
router.post('/compare-schemes', financialController.compareSchemes);

/**
 * @route GET /financial/form/scheme/:schemeId/:farmerId
 * @desc Generate application form as PDF
 * @access Public
 */
router.get('/form/scheme/:schemeId/:farmerId', async (req, res) => {
    try {
        const { schemeId, farmerId } = req.params;

        // Fetch scheme details
        const scheme = await scheme_details.findOne({ Schemeid: schemeId });
        if (!scheme) {
            return res.status(404).json({
                status: "error",
                message: "Scheme not found"
            });
        }

        // Fetch farmer details
        const farmer = await farmer_info.findOne({ Farmerid: farmerId });
        if (!farmer) {
            return res.status(404).json({
                status: "error",
                message: "Farmer not found"
            });
        }

        // Prepare data
        const schemeData = {
            title: scheme.Title,
            schemeId: scheme.Schemeid,
            benefits: scheme.Benefits,
            subsidy: scheme.SubsidyAmount,
            applicationDeadline: scheme.Expired
        };

        const farmerData = {
            farmerId: farmer.Farmerid,
            name: farmer.Name,
            mobileNumber: farmer.Mobilenum,
            aadharNumber: farmer.Aadhar,
            district: farmer.District,
            taluka: farmer.Taluka,
            village: farmer.Village,
            landSize: farmer.Cultivatedarea || 'Not specified',
            cropType: farmer.Category ? farmer.Category.join(', ') : 'Not specified',
            soilType: farmer.Soiltype || 'Not specified',
            irrigationType: farmer.Irrigationtype || 'Not specified',
            season: 'Current'
        };

        // Generate PDF
        const pdfBuffer = await formGenerator.generateSchemeApplicationForm(farmerData, schemeData);

        // Send as download
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Scheme_Application_${schemeId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating form:', error);
        res.status(500).json({
            status: "error",
            message: "Failed to generate form",
            error: error.message
        });
    }
});

/**
 * @route GET /financial/report/insurance/:farmerId
 * @desc Generate insurance comparison report as PDF
 * @access Public
 */
router.get('/report/insurance/:farmerId', async (req, res) => {
    try {
        const { farmerId } = req.params;
        const { cropType, landSize } = req.query;

        if (!cropType || !landSize) {
            return res.status(400).json({
                status: "error",
                message: "Missing required query parameters: cropType, landSize"
            });
        }

        // Fetch farmer details
        const farmer = await farmer_info.findOne({ Farmerid: farmerId });
        if (!farmer) {
            return res.status(404).json({
                status: "error",
                message: "Farmer not found"
            });
        }

        // Get insurance options
        const schemesWithInsurance = await scheme_details.find({
            Status: "Active",
            CropTypes: cropType,
            InsuranceOptions: { $exists: true, $ne: [] }
        }).select('InsuranceOptions');

        const insuranceOptions = [];
        const seenProviders = new Set();

        schemesWithInsurance.forEach(scheme => {
            if (scheme.InsuranceOptions) {
                scheme.InsuranceOptions.forEach(option => {
                    const key = `${option.provider}-${option.coverageAmount}`;
                    if (!seenProviders.has(key)) {
                        seenProviders.add(key);
                        insuranceOptions.push({
                            provider: option.provider,
                            coverageAmount: option.coverageAmount,
                            premium: Math.round((landSize * option.coverageAmount) / 100000 * 20),
                            description: option.description
                        });
                    }
                });
            }
        });

        const farmerData = {
            name: farmer.Name,
            district: farmer.District,
            cropType: cropType,
            landSize: landSize
        };

        // Generate PDF
        const pdfBuffer = await formGenerator.generateInsuranceComparison(insuranceOptions, farmerData);

        // Send as download
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Insurance_Comparison_${farmerId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating insurance report:', error);
        res.status(500).json({
            status: "error",
            message: "Failed to generate insurance report",
            error: error.message
        });
    }
});

/**
 * @route GET /financial/report/support/:farmerId
 * @desc Generate financial support summary report as PDF
 * @access Public
 */
router.get('/report/support/:farmerId', async (req, res) => {
    try {
        const { farmerId } = req.params;
        const { cropType, landSize, district } = req.query;

        if (!cropType || !landSize) {
            return res.status(400).json({
                status: "error",
                message: "Missing required query parameters: cropType, landSize"
            });
        }

        // Fetch farmer details
        const farmer = await farmer_info.findOne({ Farmerid: farmerId });
        if (!farmer) {
            return res.status(404).json({
                status: "error",
                message: "Farmer not found"
            });
        }

        // Get all schemes
        const schemes = await scheme_details.find({
            Status: "Active",
            CropTypes: cropType,
            MinLandSize: { $lte: landSize },
            MaxLandSize: { $gte: landSize }
        });

        // Categorize support
        const support = {
            subsidies: [],
            loans: [],
            insurance: [],
            summary: {
                totalSchemes: schemes.length,
                subsidiesAvailable: 0,
                loansAvailable: 0,
                insuranceOptions: 0,
                otherBenefits: 0
            }
        };

        schemes.forEach(scheme => {
            const supportItem = {
                schemeName: scheme.Title,
                schemeId: scheme.Schemeid,
                amount: scheme.SubsidyAmount,
                deadline: scheme.Expired,
                daysLeft: calculateDaysLeft(scheme.Expired),
                benefits: scheme.Benefits
            };

            if (scheme.Title.toLowerCase().includes('subsid')) {
                support.subsidies.push(supportItem);
                support.summary.subsidiesAvailable++;
            } else if (scheme.Title.toLowerCase().includes('loan')) {
                support.loans.push(supportItem);
                support.summary.loansAvailable++;
            } else if (scheme.Title.toLowerCase().includes('insur')) {
                support.insurance.push(supportItem);
                support.summary.insuranceOptions++;
            }
        });

        const farmerData = {
            name: farmer.Name,
            district: farmer.District || district || 'N/A',
            cropType: cropType,
            landSize: landSize
        };

        // Generate PDF
        const pdfBuffer = await formGenerator.generateFinancialSupportReport(support, farmerData);

        // Send as download
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Financial_Support_${farmerId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating support report:', error);
        res.status(500).json({
            status: "error",
            message: "Failed to generate support report",
            error: error.message
        });
    }
});

/**
 * @route GET /financial/demo
 * @desc Get demo data for testing
 * @access Public
 */
router.get('/demo', (req, res) => {
    res.json({
        status: "success",
        message: "AS-4 Financial Support API Demo",
        endpoints: {
            "Get Eligible Schemes": {
                method: "POST",
                url: "/financial/eligible-schemes",
                body: {
                    cropType: "Rice",
                    landSize: 5,
                    district: "Pune",
                    season: "Kharif"
                }
            },
            "Get Insurance Options": {
                method: "POST",
                url: "/financial/insurance-options",
                body: {
                    cropType: "Rice",
                    landSize: 5
                }
            },
            "Get Financial Support": {
                method: "POST",
                url: "/financial/support",
                body: {
                    cropType: "Rice",
                    landSize: 5,
                    district: "Pune",
                    season: "Kharif"
                }
            },
            "Send via WhatsApp": {
                method: "POST",
                url: "/financial/whatsapp-schemes",
                body: {
                    farmerPhone: "9876543210",
                    schemeIds: ["SCH001", "SCH002"]
                }
            },
            "Register Reminders": {
                method: "POST",
                url: "/financial/register-reminders",
                body: {
                    farmerId: "FARM001",
                    schemeIds: ["SCH001"],
                    communicationMethod: "whatsapp"
                }
            },
            "Compare Schemes": {
                method: "POST",
                url: "/financial/compare-schemes",
                body: {
                    schemeIds: ["SCH001", "SCH002", "SCH003"]
                }
            },
            "Download Scheme Form": {
                method: "GET",
                url: "/financial/form/scheme/:schemeId/:farmerId"
            },
            "Download Insurance Report": {
                method: "GET",
                url: "/financial/report/insurance/:farmerId?cropType=Rice&landSize=5"
            },
            "Download Support Report": {
                method: "GET",
                url: "/financial/report/support/:farmerId?cropType=Rice&landSize=5"
            }
        }
    });
});

/**
 * Helper function
 */
function calculateDaysLeft(deadline) {
    if (!deadline) return 0;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

module.exports = router;
