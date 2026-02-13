/**
 * AS-4: Farmer Access to Schemes, Insurance & Financial Support
 * 
 * Core Features:
 * - Eligible schemes based on farmer profile
 * - Insurance recommendations
 * - Subsidy & financial support information
 * - Voice input (regional language)
 * - WhatsApp/IVR access
 * - Auto-filled PDF forms
 * - Deadline reminders
 * - Simple language explanations
 * 
 * @file farmer_financial_support_controller.js
 * @version 1.0.0
 */

require('dotenv').config();
const scheme_details = require('../models/scheme_details');
const insurance = require('../models/insurance_company');
const farmer_info = require('../models/farmer_info');
const Notification = require('../models/Notification');
const uniqueid = require('generate-unique-id');

// Twilio Configuration
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * AS-4.1: Get eligible schemes for a farmer
 * 
 * Input: cropType, landSize, district, season
 * Output: Eligible schemes with details
 */
module.exports.getEligibleSchemes = async (req, res) => {
    try {
        const { cropType, landSize, district, season } = req.body;

        // Validate input
        if (!cropType || !landSize || !district || !season) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields: cropType, landSize, district, season"
            });
        }

        // Find matching schemes
        const eligibleSchemes = await scheme_details.find({
            Status: "Active",
            CropTypes: cropType,
            MinLandSize: { $lte: landSize },
            MaxLandSize: { $gte: landSize },
            Season: season
        }).select('-__v');

        // Enhance schemes with simple explanations and insurance options
        const enhancedSchemes = eligibleSchemes.map(scheme => ({
            schemeId: scheme.Schemeid,
            title: scheme.Title,
            simpleExplanation: scheme.SimplifiedDescription || generateSimpleExplanation(scheme),
            benefits: scheme.Benefits,
            subsidy: {
                amount: scheme.SubsidyAmount,
                description: `Subsidy available for ${cropType} cultivation in ${district}`
            },
            eligibility: {
                cropTypes: scheme.CropTypes,
                landSize: `${scheme.MinLandSize} - ${scheme.MaxLandSize} acres`,
                seasons: scheme.Season
            },
            applicationDeadline: scheme.Expired,
            daysUntilDeadline: calculateDaysUntilDeadline(scheme.Expired),
            insuranceOptions: scheme.InsuranceOptions || [],
            howToApply: scheme.How,
            moreInfo: scheme.More,
            applicationStats: {
                applied: scheme.Applied,
                approved: scheme.Approved,
                rejected: scheme.Reject
            }
        }));

        return res.status(200).json({
            status: "success",
            count: enhancedSchemes.length,
            schemes: enhancedSchemes,
            message: `Found ${enhancedSchemes.length} eligible schemes`
        });

    } catch (error) {
        console.error('Error fetching eligible schemes:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch eligible schemes",
            error: error.message
        });
    }
};

/**
 * AS-4.2: Get insurance options for farmer
 * 
 * Output: Insurance plans with premiums and coverage
 */
module.exports.getInsuranceOptions = async (req, res) => {
    try {
        const { cropType, landSize, district, season } = req.body;

        if (!cropType || !landSize) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields: cropType, landSize"
            });
        }

        // Get schemes with insurance options
        const schemesWithInsurance = await scheme_details.find({
            Status: "Active",
            CropTypes: cropType,
            InsuranceOptions: { $exists: true, $ne: [] }
        }).select('InsuranceOptions Title Schemeid');

        // Compile unique insurance options
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
                            premium: calculatePremium(landSize, option),
                            description: option.description,
                            simplifiedInfo: generateSimpleInsuranceExplanation(option),
                            applicableFor: cropType,
                            schemeSource: scheme.Title
                        });
                    }
                });
            }
        });

        // Sort by premium (ascending)
        insuranceOptions.sort((a, b) => a.premium - b.premium);

        return res.status(200).json({
            status: "success",
            count: insuranceOptions.length,
            insuranceOptions: insuranceOptions,
            message: `Found ${insuranceOptions.length} insurance options for ${cropType}`
        });

    } catch (error) {
        console.error('Error fetching insurance options:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch insurance options",
            error: error.message
        });
    }
};

/**
 * AS-4.3: Get financial support & subsidies
 * 
 * Output: All subsidies, loans, and financial aid available
 */
module.exports.getFinancialSupport = async (req, res) => {
    try {
        const { cropType, landSize, district, season, farmerType } = req.body;

        if (!cropType || !landSize) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields"
            });
        }

        // Fetch all applicable schemes
        const schemes = await scheme_details.find({
            Status: "Active",
            CropTypes: cropType,
            MinLandSize: { $lte: landSize },
            MaxLandSize: { $gte: landSize }
        });

        // Categorize financial support
        const financialSupport = {
            subsidies: [],
            loans: [],
            insurance: [],
            otherBenefits: []
        };

        schemes.forEach(scheme => {
            const support = {
                schemeName: scheme.Title,
                schemeId: scheme.Schemeid,
                amount: scheme.SubsidyAmount,
                deadline: scheme.Expired,
                daysLeft: calculateDaysUntilDeadline(scheme.Expired),
                description: scheme.SimplifiedDescription,
                benefits: scheme.Benefits,
                howToApply: scheme.How,
                applicationLink: scheme.More
            };

            // Categorize based on title keywords
            if (scheme.Title.toLowerCase().includes('subsid')) {
                financialSupport.subsidies.push(support);
            } else if (scheme.Title.toLowerCase().includes('loan')) {
                financialSupport.loans.push(support);
            } else if (scheme.Title.toLowerCase().includes('insur')) {
                financialSupport.insurance.push(support);
            } else {
                financialSupport.otherBenefits.push(support);
            }
        });

        // Calculate total potential support
        const totalSubsidyAmount = financialSupport.subsidies.length > 0 ? 
            `Check individual scheme details` : 'No subsidies available';

        return res.status(200).json({
            status: "success",
            financialSupport: financialSupport,
            summary: {
                totalSchemes: schemes.length,
                subsidiesAvailable: financialSupport.subsidies.length,
                loansAvailable: financialSupport.loans.length,
                insuranceOptions: financialSupport.insurance.length,
                otherBenefits: financialSupport.otherBenefits.length,
                totalSubsidyAmount: totalSubsidyAmount
            },
            message: "Financial support options retrieved successfully"
        });

    } catch (error) {
        console.error('Error fetching financial support:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch financial support",
            error: error.message
        });
    }
};

/**
 * AS-4.4: Send scheme info via WhatsApp
 * 
 * For farmers without smartphone access
 */
module.exports.sendSchemeViaWhatsApp = async (req, res) => {
    try {
        const { farmerPhone, schemeIds } = req.body;

        if (!farmerPhone || !schemeIds || schemeIds.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields: farmerPhone, schemeIds"
            });
        }

        // Validate phone number
        if (!/^\d{10}$/.test(farmerPhone)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid phone number. Please provide 10-digit number"
            });
        }

        const schemes = await scheme_details.find({
            Schemeid: { $in: schemeIds },
            Status: "Active"
        });

        const results = [];

        for (let scheme of schemes) {
            try {
                const message = formatSchemeMessage(scheme);
                
                const whatsappMessage = await client.messages.create({
                    body: message,
                    from: process.env.TWILIO_WHATSAPP_NUMBER,
                    to: `whatsapp:+91${farmerPhone}`
                });

                results.push({
                    schemeId: scheme.Schemeid,
                    status: "sent",
                    messageId: whatsappMessage.sid
                });

                console.log(`WhatsApp message sent: ${whatsappMessage.sid}`);
            } catch (error) {
                results.push({
                    schemeId: scheme.Schemeid,
                    status: "failed",
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            status: "success",
            message: `WhatsApp messages sent to +91${farmerPhone}`,
            results: results
        });

    } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to send WhatsApp messages",
            error: error.message
        });
    }
};

/**
 * AS-4.5: Register for deadline reminders
 * 
 * Sends SMS/WhatsApp reminders before application deadline
 */
module.exports.registerForReminders = async (req, res) => {
    try {
        const { farmerId, schemeIds, communicationMethod } = req.body;

        if (!farmerId || !schemeIds || schemeIds.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields"
            });
        }

        const validMethods = ['sms', 'whatsapp', 'both'];
        const method = communicationMethod && validMethods.includes(communicationMethod) ? 
            communicationMethod : 'whatsapp';

        // Find farmer
        const farmer = await farmer_info.findOne({ Farmerid: farmerId });
        if (!farmer) {
            return res.status(404).json({
                status: "error",
                message: "Farmer not found"
            });
        }

        // Create reminders for each scheme
        const reminders = [];
        const schemes = await scheme_details.find({
            Schemeid: { $in: schemeIds },
            Status: "Active"
        });

        for (let scheme of schemes) {
            const daysUntilDeadline = calculateDaysUntilDeadline(scheme.Expired);
            
            // Set reminder for 7 days before deadline
            if (daysUntilDeadline > 7) {
                const notification = new Notification({
                    farmerId: farmerId,
                    schemeId: scheme.Schemeid,
                    schemeName: scheme.Title,
                    type: 'deadline-reminder',
                    communicationMethod: method,
                    scheduleDate: new Date(scheme.Expired.getTime() - 7 * 24 * 60 * 60 * 1000),
                    message: `Reminder: Application deadline for ${scheme.Title} is on ${scheme.Expired.toDateString()}. Click here to apply.`,
                    status: 'scheduled'
                });

                await notification.save();
                reminders.push({
                    schemeId: scheme.Schemeid,
                    schemeName: scheme.Title,
                    reminderDate: notification.scheduleDate,
                    daysUntilDeadline: daysUntilDeadline
                });
            }
        }

        return res.status(200).json({
            status: "success",
            message: `Reminders registered for ${reminders.length} schemes`,
            reminders: reminders,
            communicationMethod: method
        });

    } catch (error) {
        console.error('Error registering reminders:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to register reminders",
            error: error.message
        });
    }
};

/**
 * AS-4.6: Get comparison of schemes & insurance
 * 
 * Compare multiple schemes side-by-side
 */
module.exports.compareSchemes = async (req, res) => {
    try {
        const { schemeIds } = req.body;

        if (!schemeIds || schemeIds.length < 2) {
            return res.status(400).json({
                status: "error",
                message: "Please provide at least 2 scheme IDs for comparison"
            });
        }

        const schemes = await scheme_details.find({
            Schemeid: { $in: schemeIds },
            Status: "Active"
        });

        if (schemes.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No schemes found"
            });
        }

        const comparison = schemes.map(scheme => ({
            schemeId: scheme.Schemeid,
            title: scheme.Title,
            benefits: scheme.Benefits,
            subsidy: scheme.SubsidyAmount,
            eligibility: {
                crops: scheme.CropTypes,
                landSize: `${scheme.MinLandSize} - ${scheme.MaxLandSize} acres`,
                seasons: scheme.Season
            },
            deadline: scheme.Expired,
            daysLeft: calculateDaysUntilDeadline(scheme.Expired),
            insurance: scheme.InsuranceOptions ? scheme.InsuranceOptions.length : 0,
            applicationStats: {
                applied: scheme.Applied,
                approved: scheme.Approved,
                approvalRate: scheme.Applied > 0 ? 
                    `${((scheme.Approved / scheme.Applied) * 100).toFixed(2)}%` : 'N/A'
            }
        }));

        return res.status(200).json({
            status: "success",
            comparisonCount: comparison.length,
            schemes: comparison,
            message: "Scheme comparison retrieved successfully"
        });

    } catch (error) {
        console.error('Error comparing schemes:', error);
        return res.status(500).json({
            status: "error",
            message: "Failed to compare schemes",
            error: error.message
        });
    }
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Generate simple explanation for a scheme in farmer-friendly language
 */
function generateSimpleExplanation(scheme) {
    const title = scheme.Title;
    const benefits = scheme.Benefits || "";
    
    return `यह योजना ${title} है जो आपको ${benefits} प्रदान करती है। इस योजना के तहत आप आवेदन कर सकते हैं और लाभ प्राप्त कर सकते हैं।`;
}

/**
 * Generate simple insurance explanation
 */
function generateSimpleInsuranceExplanation(insurance) {
    return `यह बीमा योजना ${insurance.provider} द्वारा प्रदान की जाती है जो ${insurance.coverageAmount} रुपये का कवरेज देती है।`;
}

/**
 * Calculate days until deadline
 */
function calculateDaysUntilDeadline(deadline) {
    if (!deadline) return 0;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Calculate premium based on land size and coverage
 */
function calculatePremium(landSize, insurance) {
    const baseRate = 20; // Base rate per acre
    const premiumPerAcre = (insurance.coverageAmount / 100000) * baseRate;
    return Math.round(landSize * premiumPerAcre);
}

/**
 * Format scheme message for WhatsApp
 */
function formatSchemeMessage(scheme) {
    const deadline = new Date(scheme.Expired).toDateString();
    return `
📢 *${scheme.Title}*

📝 *विवरण:*
${scheme.Description}

💰 *लाभ:*
${scheme.Benefits}

🎯 *कैसे आवेदन करें:*
${scheme.How}

📅 *आवेदन की समय सीमा:* ${deadline}

🔗 *अधिक जानकारी:* ${scheme.More}

*कृपया जल्दी आवेदन करें!*
    `.trim();
}

module.exports.generateSimpleExplanation = generateSimpleExplanation;
module.exports.calculateDaysUntilDeadline = calculateDaysUntilDeadline;
