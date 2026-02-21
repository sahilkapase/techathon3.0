/**
 * Smart Farmer Scheme Assistant Controller
 * 
 * Comprehensive controller for:
 * - Eligibility Engine (Rule-based scheme matching)
 * - Insurance Recommendations (Weather-based)
 * - Document Checklist Generator
 * - Application Tracking
 * - Scheme Comparison
 * - Weather Risk Alerts
 * - Auto Form Pre-fill
 * - Financial Support Summary
 */

require('dotenv').config();
const { prisma } = require('../config/prisma');
const axios = require('axios');
const uniqueid = require('generate-unique-id');

// ==================== HELPER: Classify Farmer Type ====================
function classifyFarmerType(landSize) {
  if (landSize <= 1) return 'marginal';
  if (landSize <= 2) return 'small';
  if (landSize <= 5) return 'medium';
  return 'large';
}

// ==================== HELPER: Get Language Field ====================
function getLangField(field, lang) {
  if (lang === 'hi') return field + 'Hi';
  if (lang === 'mr') return field + 'Mr';
  return field;
}

// ==================== HELPER: Translate Scheme for Language ====================
function translateScheme(scheme, lang) {
  const result = { ...scheme };
  if (lang === 'hi') {
    result.displayName = scheme.schemeNameHi || scheme.schemeName;
    result.displayDescription = scheme.descriptionHi || scheme.description;
    result.displayDocuments = scheme.documentsRequiredHi?.length > 0 ? scheme.documentsRequiredHi : scheme.documentsRequired;
    result.displayProcess = scheme.applicationProcessHi || scheme.applicationProcess;
  } else if (lang === 'mr') {
    result.displayName = scheme.schemeNameMr || scheme.schemeName;
    result.displayDescription = scheme.descriptionMr || scheme.description;
    result.displayDocuments = scheme.documentsRequiredMr?.length > 0 ? scheme.documentsRequiredMr : scheme.documentsRequired;
    result.displayProcess = scheme.applicationProcessMr || scheme.applicationProcess;
  } else {
    result.displayName = scheme.schemeName;
    result.displayDescription = scheme.description;
    result.displayDocuments = scheme.documentsRequired;
    result.displayProcess = scheme.applicationProcess;
  }
  return result;
}

// ==================== HELPER: Translate Insurance for Language ====================
function translateInsurance(product, lang) {
  const result = { ...product };
  if (lang === 'hi') {
    result.displayName = product.productNameHi || product.productName;
    result.displayDescription = product.descriptionHi || product.description;
    result.displayCoverage = product.coverageDetailsHi || product.coverageDetails;
    result.displayClaim = product.claimProcessHi || product.claimProcess;
  } else if (lang === 'mr') {
    result.displayName = product.productNameMr || product.productName;
    result.displayDescription = product.descriptionMr || product.description;
    result.displayCoverage = product.coverageDetailsMr || product.coverageDetails;
    result.displayClaim = product.claimProcessMr || product.claimProcess;
  } else {
    result.displayName = product.productName;
    result.displayDescription = product.description;
    result.displayCoverage = product.coverageDetails;
    result.displayClaim = product.claimProcess;
  }
  return result;
}

// ==================== 1. GET FARMER PROFILE (Minimal Input) ====================
module.exports.getFarmerProfile = async function (req, res) {
  try {
    const { farmerId } = req.params;
    
    // Build OR conditions for lookup
    const orConditions = [{ Farmerid: farmerId }];
    if (!isNaN(farmerId) && farmerId.length <= 9) {
      orConditions.push({ id: parseInt(farmerId) });
    }
    if (!isNaN(farmerId) && farmerId.length === 10) {
      orConditions.push({ Mobilenum: BigInt(farmerId) });
    }

    const farmer = await prisma.farmerInfo.findFirst({
      where: { OR: orConditions },
      include: {
        farms: true,
        cropHistories: { orderBy: { createdAt: 'desc' }, take: 5 },
        schemeApplications: {
          include: { scheme: true },
          orderBy: { createdAt: 'desc' }
        },
        loanApplications: { orderBy: { createdAt: 'desc' }, take: 5 },
        creditScore: true
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const farmerType = classifyFarmerType(farmer.LandSize);

    return res.json({
      status: 'success',
      farmer: {
        id: farmer.id,
        farmerId: farmer.Farmerid,
        name: farmer.Name,
        mobile: farmer.Mobilenum?.toString(),
        state: farmer.State,
        district: farmer.District,
        taluka: farmer.Taluka,
        village: farmer.Village,
        landSize: farmer.LandSize,
        farmerType: farmerType,
        category: farmer.Category,
        crops: farmer.CropTypes,
        preferredLanguage: farmer.PreferredLanguage,
        bankName: farmer.Bankname,
        aadhaar: farmer.Adharnum ? '****' + farmer.Adharnum.toString().slice(-4) : null,
        farms: farmer.farms,
        recentApplications: farmer.schemeApplications.slice(0, 5),
        creditScore: farmer.creditScore
      }
    });
  } catch (error) {
    console.error('getFarmerProfile error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 2. ELIGIBILITY ENGINE ====================
module.exports.getEligibleSchemes = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const lang = req.query.lang || 'en';

    // Get farmer details
    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const farmerType = classifyFarmerType(farmer.LandSize);
    const farmerCrops = farmer.CropTypes.map(c => c.toLowerCase());
    const farmerState = farmer.State || 'Maharashtra';
    const farmerDistrict = farmer.District || '';
    const farmerCategory = farmer.Category || 'General';

    // Get all active schemes
    const allSchemes = await prisma.governmentScheme.findMany({
      where: { status: 'Active' },
      orderBy: { priority: 'desc' }
    });

    // Check existing applications
    const existingApps = await prisma.schemeApplication.findMany({
      where: { farmerId: farmer.id },
      select: { schemeId: true, status: true }
    });
    const appliedSchemeIds = new Set(existingApps.map(a => a.schemeId));

    // Run eligibility engine
    const eligibleSchemes = [];

    for (const scheme of allSchemes) {
      let eligible = true;
      let matchScore = 0;
      const matchReasons = [];

      // 1. Check land size
      if (scheme.minLandSize !== null && farmer.LandSize < scheme.minLandSize) {
        eligible = false;
        continue;
      }
      if (scheme.maxLandSize !== null && farmer.LandSize > scheme.maxLandSize) {
        eligible = false;
        continue;
      }
      matchScore += 10;

      // 2. Check farmer type
      if (scheme.farmerTypes.length > 0 && !scheme.farmerTypes.includes('all')) {
        if (!scheme.farmerTypes.includes(farmerType)) {
          eligible = false;
          continue;
        }
        matchReasons.push(`Eligible as ${farmerType} farmer`);
        matchScore += 15;
      }

      // 3. Check state eligibility
      if (scheme.applicableStates.length > 0 && !scheme.applicableStates.includes('All States')) {
        if (!scheme.applicableStates.includes(farmerState)) {
          eligible = false;
          continue;
        }
        matchReasons.push(`Available in ${farmerState}`);
        matchScore += 10;
      }

      // 4. Check district eligibility
      if (scheme.applicableDistricts.length > 0) {
        if (!scheme.applicableDistricts.includes(farmerDistrict)) {
          eligible = false;
          continue;
        }
        matchReasons.push(`Available in ${farmerDistrict}`);
        matchScore += 5;
      }

      // 5. Check farmer category
      if (scheme.farmerCategories.length > 0) {
        if (scheme.farmerCategories.includes(farmerCategory)) {
          matchReasons.push(`Open to ${farmerCategory} category`);
          matchScore += 5;
        }
      }

      // 6. Check crop matching
      if (scheme.cropTypes.length > 0) {
        const matchingCrops = scheme.cropTypes.filter(c => 
          farmerCrops.includes(c.toLowerCase())
        );
        if (matchingCrops.length > 0) {
          matchReasons.push(`Matches your crops: ${matchingCrops.join(', ')}`);
          matchScore += 20;
        } else if (!scheme.cropTypes.includes('all')) {
          // Crop-specific scheme but farmer doesn't grow those crops
          eligible = false;
          continue;
        }
      }

      // 7. Check deadline
      if (scheme.applicationDeadline) {
        const deadline = new Date(scheme.applicationDeadline);
        if (deadline < new Date()) {
          eligible = false;
          continue;
        }
        const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          matchReasons.push(`⚠️ Deadline in ${daysLeft} days!`);
          matchScore += 10;
        }
      }

      if (eligible) {
        const translated = translateScheme(scheme, lang);
        const existingApp = existingApps.find(a => a.schemeId === scheme.id);
        
        eligibleSchemes.push({
          ...translated,
          matchScore,
          matchReasons,
          alreadyApplied: appliedSchemeIds.has(scheme.id),
          applicationStatus: existingApp?.status || null,
          farmerType: farmerType,
          estimatedBenefit: scheme.benefitAmount
        });
      }
    }

    // Sort by match score
    eligibleSchemes.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      status: 'success',
      farmerName: farmer.Name,
      farmerType: farmerType,
      landSize: farmer.LandSize,
      crops: farmer.CropTypes,
      state: farmerState,
      district: farmerDistrict,
      totalEligibleSchemes: eligibleSchemes.length,
      schemes: eligibleSchemes
    });

  } catch (error) {
    console.error('getEligibleSchemes error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 3. INSURANCE RECOMMENDATIONS ====================
module.exports.getInsuranceRecommendations = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const lang = req.query.lang || 'en';

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const farmerCrops = farmer.CropTypes.map(c => c.toLowerCase());
    const farmerDistrict = farmer.District || '';

    // Get all insurance products
    const allProducts = await prisma.insuranceProduct.findMany({
      where: { status: 'Active' }
    });

    // Get weather risks for farmer's district
    const weatherRisks = await prisma.weatherRiskAlert.findMany({
      where: { 
        district: farmerDistrict,
        isActive: true
      }
    });

    // Get current weather data
    let weatherData = null;
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey && farmerDistrict) {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${farmerDistrict},Maharashtra,IN&appid=${apiKey}&units=metric`
        );
        weatherData = weatherRes.data;
      }
    } catch (err) {
      console.log('Weather API unavailable, continuing without weather data');
    }

    // Calculate weather risk score
    let weatherRiskScore = 0;
    let weatherRiskFactors = [];
    
    if (weatherData) {
      // High temperature risk
      if (weatherData.main?.temp > 40) {
        weatherRiskScore += 30;
        weatherRiskFactors.push('Extreme heat (>40°C)');
      } else if (weatherData.main?.temp > 35) {
        weatherRiskScore += 15;
        weatherRiskFactors.push('High temperature (>35°C)');
      }
      
      // Humidity risk
      if (weatherData.main?.humidity > 85) {
        weatherRiskScore += 20;
        weatherRiskFactors.push('High humidity - disease risk');
      }
      
      // Rain/storm risk
      if (weatherData.weather?.[0]?.main === 'Thunderstorm') {
        weatherRiskScore += 25;
        weatherRiskFactors.push('Thunderstorm activity');
      }
    }

    // Add stored weather risk alerts
    for (const alert of weatherRisks) {
      if (alert.riskLevel === 'critical') weatherRiskScore += 40;
      else if (alert.riskLevel === 'high') weatherRiskScore += 30;
      else if (alert.riskLevel === 'medium') weatherRiskScore += 15;
      
      weatherRiskFactors.push(`${alert.riskType}: ${alert.description}`);
    }

    // Match insurance products
    const recommendations = [];
    
    for (const product of allProducts) {
      let relevanceScore = 0;
      const reasons = [];

      // Check crop matching
      if (product.applicableCrops.length > 0) {
        const matchingCrops = product.applicableCrops.filter(c =>
          farmerCrops.includes(c.toLowerCase()) || c === 'All Crops'
        );
        if (matchingCrops.length > 0) {
          relevanceScore += 30;
          reasons.push(`Covers your crops: ${matchingCrops.join(', ')}`);
        }
      }

      // Determine current season
      const month = new Date().getMonth() + 1;
      const currentSeason = (month >= 6 && month <= 10) ? 'Kharif' : 'Rabi';
      
      if (product.season.length > 0) {
        if (product.season.includes(currentSeason)) {
          relevanceScore += 20;
          reasons.push(`Active for current ${currentSeason} season`);
        }
      }

      // Weather risk based recommendation
      if (weatherRiskScore > 20 && product.insuranceType === 'weather') {
        relevanceScore += 25;
        reasons.push('Recommended due to weather risks in your area');
      }
      if (weatherRiskScore > 30 && product.insuranceType === 'crop') {
        relevanceScore += 20;
        reasons.push('Crop protection recommended for your area');
      }

      // Calculate premium for farmer
      const sumInsured = product.sumInsured * farmer.LandSize;
      const farmerPremium = (sumInsured * product.premiumRate) / 100;
      const governmentSubsidy = (sumInsured * (100 - product.premiumRate)) / 100 * (product.subsidyPercentage || 0) / 100;

      const translated = translateInsurance(product, lang);

      recommendations.push({
        ...translated,
        relevanceScore,
        reasons,
        calculatedForFarmer: {
          landSize: farmer.LandSize,
          sumInsured: sumInsured,
          farmerPremium: Math.round(farmerPremium),
          governmentSubsidy: Math.round(governmentSubsidy),
          totalCoverage: sumInsured
        }
      });
    }

    // Sort by relevance
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return res.json({
      status: 'success',
      farmerName: farmer.Name,
      district: farmerDistrict,
      crops: farmer.CropTypes,
      landSize: farmer.LandSize,
      weatherRisk: {
        score: weatherRiskScore,
        level: weatherRiskScore > 50 ? 'high' : weatherRiskScore > 25 ? 'medium' : 'low',
        factors: weatherRiskFactors,
        currentWeather: weatherData ? {
          temp: weatherData.main?.temp,
          humidity: weatherData.main?.humidity,
          description: weatherData.weather?.[0]?.description,
          windSpeed: weatherData.wind?.speed
        } : null
      },
      weatherAlerts: weatherRisks.map(a => ({
        ...a,
        displayDescription: lang === 'hi' ? (a.descriptionHi || a.description) :
                           lang === 'mr' ? (a.descriptionMr || a.description) : a.description,
        displayActions: lang === 'hi' ? (a.recommendedActionsHi?.length > 0 ? a.recommendedActionsHi : a.recommendedActions) :
                       lang === 'mr' ? (a.recommendedActionsMr?.length > 0 ? a.recommendedActionsMr : a.recommendedActions) : a.recommendedActions
      })),
      totalRecommendations: recommendations.length,
      recommendations
    });

  } catch (error) {
    console.error('getInsuranceRecommendations error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 4. DOCUMENT CHECKLIST GENERATOR ====================
module.exports.getDocumentChecklist = async function (req, res) {
  try {
    const { farmerId, schemeId } = req.params;
    const lang = req.query.lang || 'en';

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const scheme = await prisma.governmentScheme.findUnique({
      where: { id: parseInt(schemeId) }
    });

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found', status: 'error' });
    }

    // Generate checklist based on scheme requirements and farmer data
    const docs = lang === 'hi' ? (scheme.documentsRequiredHi?.length > 0 ? scheme.documentsRequiredHi : scheme.documentsRequired) :
                 lang === 'mr' ? (scheme.documentsRequiredMr?.length > 0 ? scheme.documentsRequiredMr : scheme.documentsRequired) :
                 scheme.documentsRequired;

    const checklist = docs.map(doc => {
      let available = false;
      let hint = '';

      // Determine if farmer likely has this document
      const docLower = doc.toLowerCase();
      if (docLower.includes('aadhaar') || docLower.includes('aadhar') || docLower.includes('आधार')) {
        available = !!farmer.Adharnum;
        hint = available ? 'Available in your profile' : 'Please link your Aadhaar number';
      } else if (docLower.includes('bank') || docLower.includes('बैंक') || docLower.includes('बँक')) {
        available = !!farmer.Bankname && !!farmer.Accountnum;
        hint = available ? 'Bank details available' : 'Please add bank account details';
      } else if (docLower.includes('land') || docLower.includes('7/12') || docLower.includes('भूमि') || docLower.includes('जमीन')) {
        available = farmer.LandSize > 0;
        hint = available ? `Land size: ${farmer.LandSize} acres recorded` : 'Please add land details';
      } else if (docLower.includes('mobile') || docLower.includes('मोबाइल')) {
        available = !!farmer.Mobilenum;
        hint = available ? 'Mobile number verified' : 'Please verify mobile number';
      } else if (docLower.includes('crop') || docLower.includes('sowing') || docLower.includes('फसल') || docLower.includes('पीक') || docLower.includes('पेरणी')) {
        available = farmer.CropTypes.length > 0;
        hint = available ? `Crops: ${farmer.CropTypes.join(', ')}` : 'Please add crop information';
      }

      return {
        document: doc,
        required: true,
        available: available,
        hint: hint,
        status: available ? 'ready' : 'needed'
      };
    });

    const readyCount = checklist.filter(c => c.available).length;
    const totalCount = checklist.length;
    const readinessPercent = Math.round((readyCount / totalCount) * 100);

    const translated = translateScheme(scheme, lang);

    return res.json({
      status: 'success',
      scheme: {
        id: scheme.id,
        name: translated.displayName,
        description: translated.displayDescription
      },
      farmer: {
        name: farmer.Name,
        farmerId: farmer.Farmerid
      },
      checklist,
      summary: {
        total: totalCount,
        ready: readyCount,
        needed: totalCount - readyCount,
        readinessPercent: readinessPercent,
        message: readinessPercent === 100 ? 
          (lang === 'hi' ? 'सभी दस्तावेज तैयार हैं! आप आवेदन कर सकते हैं।' :
           lang === 'mr' ? 'सर्व कागदपत्रे तयार आहेत! तुम्ही अर्ज करू शकता.' :
           'All documents ready! You can proceed with the application.') :
          (lang === 'hi' ? `${totalCount - readyCount} दस्तावेज अभी भी आवश्यक हैं।` :
           lang === 'mr' ? `${totalCount - readyCount} कागदपत्रे अजूनही आवश्यक आहेत.` :
           `${totalCount - readyCount} document(s) still needed.`)
      }
    });

  } catch (error) {
    console.error('getDocumentChecklist error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 5. APPLY FOR SCHEME (Auto-fill Form) ====================
module.exports.applyForScheme = async function (req, res) {
  try {
    const { farmerId, schemeId } = req.params;

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      },
      include: { farms: true }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const scheme = await prisma.governmentScheme.findUnique({
      where: { id: parseInt(schemeId) }
    });

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found', status: 'error' });
    }

    // Check if already applied
    const existingApp = await prisma.schemeApplication.findFirst({
      where: { farmerId: farmer.id, schemeId: scheme.id }
    });

    if (existingApp) {
      return res.json({
        status: 'already_applied',
        message: 'You have already applied for this scheme',
        application: existingApp
      });
    }

    // Generate application number
    const appNumber = 'APP-' + uniqueid({ length: 10, useLetters: false });

    // Auto-fill form data
    const formData = {
      applicantName: farmer.Name,
      fatherName: '',
      gender: farmer.Gender,
      dateOfBirth: farmer.Dateofbirth,
      category: farmer.Category,
      aadhaarNumber: farmer.Adharnum ? '****' + farmer.Adharnum.toString().slice(-4) : '',
      mobileNumber: farmer.Mobilenum?.toString(),
      email: farmer.Email,
      state: farmer.State,
      district: farmer.District,
      taluka: farmer.Taluka,
      village: farmer.Village,
      pincode: farmer.Pincode,
      landSize: farmer.LandSize,
      farmerType: classifyFarmerType(farmer.LandSize),
      crops: farmer.CropTypes,
      bankName: farmer.Bankname,
      ifscCode: farmer.IFSC,
      accountNumber: farmer.Accountnum ? '****' + farmer.Accountnum.toString().slice(-4) : '',
      farms: farmer.farms.map(f => ({
        district: f.District,
        taluka: f.Taluka,
        village: f.Village,
        surveyNumber: f.Surveynumber,
        area: f.Hectare
      })),
      schemeName: scheme.schemeName,
      schemeCode: scheme.schemeCode,
      applicationDate: new Date().toISOString()
    };

    // Create document checklist
    const documentsChecklist = scheme.documentsRequired.map(doc => ({
      document: doc,
      required: true,
      uploaded: false,
      verified: false
    }));

    // Create application
    const application = await prisma.schemeApplication.create({
      data: {
        farmerId: farmer.id,
        schemeId: scheme.id,
        applicationNumber: appNumber,
        status: 'Submitted',
        statusHistory: [{
          status: 'Submitted',
          date: new Date().toISOString(),
          remarks: 'Application submitted via Smart Assistant'
        }],
        formData: formData,
        documentsChecklist: documentsChecklist
      },
      include: { scheme: true }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        farmerId: farmer.id,
        title: `Application Submitted: ${scheme.schemeName}`,
        message: `Your application ${appNumber} for ${scheme.schemeName} has been submitted successfully.`,
        notificationType: 'scheme',
        status: 'unread'
      }
    });

    return res.json({
      status: 'success',
      message: 'Application submitted successfully!',
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        schemeName: scheme.schemeName,
        status: application.status,
        formData: formData,
        documentsChecklist: documentsChecklist,
        submittedAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('applyForScheme error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 6. APPLICATION TRACKING ====================
module.exports.getApplications = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const lang = req.query.lang || 'en';

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const applications = await prisma.schemeApplication.findMany({
      where: { farmerId: farmer.id },
      include: { scheme: true },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: applications.length,
      draft: applications.filter(a => a.status === 'Draft').length,
      submitted: applications.filter(a => a.status === 'Submitted').length,
      underReview: applications.filter(a => a.status === 'Under_Review').length,
      approved: applications.filter(a => a.status === 'Approved').length,
      rejected: applications.filter(a => a.status === 'Rejected').length,
      disbursed: applications.filter(a => a.status === 'Disbursed').length
    };

    const formattedApps = applications.map(app => {
      const translated = translateScheme(app.scheme, lang);
      return {
        id: app.id,
        applicationNumber: app.applicationNumber,
        schemeName: translated.displayName,
        schemeCode: app.scheme.schemeCode,
        category: app.scheme.category,
        benefitAmount: app.scheme.benefitAmount,
        status: app.status,
        statusHistory: app.statusHistory,
        approvedAmount: app.approvedAmount,
        disbursedAmount: app.disbursedAmount,
        remarks: app.remarks,
        rejectionReason: app.rejectionReason,
        appliedDate: app.createdAt,
        approvedDate: app.approvedDate,
        lastUpdated: app.updatedAt
      };
    });

    return res.json({
      status: 'success',
      farmerName: farmer.Name,
      stats,
      applications: formattedApps
    });

  } catch (error) {
    console.error('getApplications error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 7. SINGLE APPLICATION DETAIL ====================
module.exports.getApplicationDetail = async function (req, res) {
  try {
    const { applicationId } = req.params;
    const lang = req.query.lang || 'en';

    const application = await prisma.schemeApplication.findUnique({
      where: { id: parseInt(applicationId) },
      include: { 
        scheme: true,
        farmer: { select: { Name: true, Farmerid: true, Mobilenum: true, District: true } }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found', status: 'error' });
    }

    const translated = translateScheme(application.scheme, lang);

    return res.json({
      status: 'success',
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        schemeName: translated.displayName,
        schemeDescription: translated.displayDescription,
        status: application.status,
        statusHistory: application.statusHistory,
        formData: application.formData,
        documentsChecklist: application.documentsChecklist,
        farmer: application.farmer,
        approvedAmount: application.approvedAmount,
        disbursedAmount: application.disbursedAmount,
        remarks: application.remarks,
        rejectionReason: application.rejectionReason,
        applicationProcess: translated.displayProcess,
        appliedDate: application.createdAt,
        lastUpdated: application.updatedAt
      }
    });

  } catch (error) {
    console.error('getApplicationDetail error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 8. WEATHER RISK ALERTS ====================
module.exports.getWeatherRiskAlerts = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const lang = req.query.lang || 'en';

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    // Get alerts for farmer's district
    const alerts = await prisma.weatherRiskAlert.findMany({
      where: { 
        district: farmer.District || '',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get current weather from OpenWeatherMap
    let currentWeather = null;
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey && farmer.District) {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${farmer.District},Maharashtra,IN&appid=${apiKey}&units=metric`
        );
        currentWeather = {
          temp: weatherRes.data.main?.temp,
          feelsLike: weatherRes.data.main?.feels_like,
          humidity: weatherRes.data.main?.humidity,
          description: weatherRes.data.weather?.[0]?.description,
          windSpeed: weatherRes.data.wind?.speed,
          icon: weatherRes.data.weather?.[0]?.icon
        };
      }
    } catch (err) {
      console.log('Weather API call failed');
    }

    // Get 5-day forecast
    let forecast = null;
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey && farmer.District) {
        const forecastRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${farmer.District},Maharashtra,IN&appid=${apiKey}&units=metric&cnt=8`
        );
        forecast = forecastRes.data.list?.map(f => ({
          datetime: f.dt_txt,
          temp: f.main?.temp,
          humidity: f.main?.humidity,
          description: f.weather?.[0]?.description,
          rain: f.rain?.['3h'] || 0
        }));
      }
    } catch (err) {
      console.log('Forecast API call failed');
    }

    // Translate alerts
    const translatedAlerts = alerts.map(a => ({
      ...a,
      displayDescription: lang === 'hi' ? (a.descriptionHi || a.description) :
                          lang === 'mr' ? (a.descriptionMr || a.description) : a.description,
      displayActions: lang === 'hi' ? (a.recommendedActionsHi?.length > 0 ? a.recommendedActionsHi : a.recommendedActions) :
                     lang === 'mr' ? (a.recommendedActionsMr?.length > 0 ? a.recommendedActionsMr : a.recommendedActions) : a.recommendedActions
    }));

    // Generate crop-specific risk analysis
    const cropRisks = farmer.CropTypes.map(crop => {
      const relevantAlerts = alerts.filter(a => 
        a.affectedCrops.some(c => c.toLowerCase() === crop.toLowerCase())
      );
      return {
        crop,
        riskLevel: relevantAlerts.length > 0 ? 
          (relevantAlerts.some(a => a.riskLevel === 'critical' || a.riskLevel === 'high') ? 'high' : 'medium') : 'low',
        alerts: relevantAlerts.length,
        recommendation: relevantAlerts.length > 0 ? 
          'Consider crop insurance for protection' : 'No immediate risk detected'
      };
    });

    return res.json({
      status: 'success',
      district: farmer.District,
      state: farmer.State,
      currentWeather,
      forecast,
      alerts: translatedAlerts,
      cropRisks,
      overallRisk: alerts.some(a => a.riskLevel === 'critical') ? 'critical' :
                   alerts.some(a => a.riskLevel === 'high') ? 'high' :
                   alerts.some(a => a.riskLevel === 'medium') ? 'medium' : 'low'
    });

  } catch (error) {
    console.error('getWeatherRiskAlerts error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 9. COMPREHENSIVE FINANCIAL DASHBOARD ====================
module.exports.getFinancialDashboard = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const lang = req.query.lang || 'en';

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      },
      include: {
        schemeApplications: { include: { scheme: true }, orderBy: { createdAt: 'desc' } },
        loanApplications: { orderBy: { createdAt: 'desc' }, take: 5 },
        subsidies: { where: { status: 'Available' }, take: 5 },
        creditScore: true
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    const farmerType = classifyFarmerType(farmer.LandSize);

    // Count eligible schemes
    const allSchemes = await prisma.governmentScheme.findMany({ where: { status: 'Active' } });
    let eligibleCount = 0;
    for (const scheme of allSchemes) {
      let eligible = true;
      if (scheme.minLandSize !== null && farmer.LandSize < scheme.minLandSize) eligible = false;
      if (scheme.maxLandSize !== null && farmer.LandSize > scheme.maxLandSize) eligible = false;
      if (scheme.farmerTypes.length > 0 && !scheme.farmerTypes.includes('all') && !scheme.farmerTypes.includes(farmerType)) eligible = false;
      if (scheme.applicableStates.length > 0 && !scheme.applicableStates.includes('All States') && !scheme.applicableStates.includes(farmer.State)) eligible = false;
      if (eligible) eligibleCount++;
    }

    // Get weather alerts count
    const alertsCount = await prisma.weatherRiskAlert.count({
      where: { district: farmer.District || '', isActive: true }
    });

    // Applications summary
    const appStats = {
      total: farmer.schemeApplications.length,
      approved: farmer.schemeApplications.filter(a => a.status === 'Approved').length,
      pending: farmer.schemeApplications.filter(a => ['Submitted', 'Under_Review'].includes(a.status)).length,
      rejected: farmer.schemeApplications.filter(a => a.status === 'Rejected').length,
      totalDisbursed: farmer.schemeApplications
        .filter(a => a.status === 'Disbursed')
        .reduce((sum, a) => sum + (a.disbursedAmount || 0), 0)
    };

    // Loan summary
    const loanStats = {
      totalLoans: farmer.loanApplications.length,
      activeLoans: farmer.loanApplications.filter(a => a.status === 'Approved' || a.status === 'Disbursed').length,
      totalAmount: farmer.loanApplications
        .filter(a => a.status === 'Approved')
        .reduce((sum, a) => sum + (a.approvedAmount || 0), 0)
    };

    return res.json({
      status: 'success',
      farmer: {
        name: farmer.Name,
        farmerId: farmer.Farmerid,
        farmerType,
        landSize: farmer.LandSize,
        crops: farmer.CropTypes,
        district: farmer.District,
        state: farmer.State,
        language: farmer.PreferredLanguage
      },
      dashboard: {
        eligibleSchemes: eligibleCount,
        weatherAlerts: alertsCount,
        applications: appStats,
        loans: loanStats,
        creditScore: farmer.creditScore?.score || null,
        creditGrade: farmer.creditScore?.scoreGrade || null,
        subsidiesAvailable: farmer.subsidies.length,
        recentApplications: farmer.schemeApplications.slice(0, 5).map(app => ({
          id: app.id,
          applicationNumber: app.applicationNumber,
          schemeName: app.scheme.schemeName,
          status: app.status,
          date: app.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('getFinancialDashboard error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 10. COMPARE SCHEMES ====================
module.exports.compareSchemes = async function (req, res) {
  try {
    const { schemeIds } = req.body; // Array of scheme IDs
    const lang = req.query.lang || 'en';

    if (!schemeIds || !Array.isArray(schemeIds) || schemeIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 scheme IDs', status: 'error' });
    }

    const schemes = await prisma.governmentScheme.findMany({
      where: { id: { in: schemeIds.map(id => parseInt(id)) } }
    });

    const comparison = schemes.map(scheme => {
      const translated = translateScheme(scheme, lang);
      return {
        id: scheme.id,
        name: translated.displayName,
        description: translated.displayDescription,
        category: scheme.category,
        benefitAmount: scheme.benefitAmount,
        benefitType: scheme.benefitType,
        minLandSize: scheme.minLandSize,
        maxLandSize: scheme.maxLandSize,
        farmerTypes: scheme.farmerTypes,
        cropTypes: scheme.cropTypes,
        documentsRequired: translated.displayDocuments,
        applicationDeadline: scheme.applicationDeadline,
        applicationProcess: translated.displayProcess,
        helpline: scheme.helplineNumber,
        website: scheme.websiteUrl
      };
    });

    return res.json({
      status: 'success',
      comparisonCount: comparison.length,
      schemes: comparison
    });

  } catch (error) {
    console.error('compareSchemes error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 11. QUICK REGISTRATION (Minimal Input) ====================
module.exports.quickRegister = async function (req, res) {
  try {
    const { name, mobile, state, district, landSize, crops, language } = req.body;

    // Validate minimal fields
    if (!name || !mobile) {
      return res.status(400).json({ 
        error: 'Name and mobile number are required',
        status: 'error' 
      });
    }

    // Check if farmer already exists
    const existing = await prisma.farmerInfo.findFirst({
      where: { Mobilenum: BigInt(mobile) }
    });

    if (existing) {
      return res.json({
        status: 'existing',
        message: 'Farmer already registered',
        farmerId: existing.Farmerid,
        farmerName: existing.Name
      });
    }

    // Generate farmer ID
    const farmerId = 'FRM' + uniqueid({ length: 8, useLetters: false });

    // Classify farmer type
    const farmerType = classifyFarmerType(landSize || 0);

    // Create farmer with minimal input
    const farmer = await prisma.farmerInfo.create({
      data: {
        Farmerid: farmerId,
        Name: name,
        Mobilenum: BigInt(mobile),
        State: state || 'Maharashtra',
        District: district || '',
        LandSize: parseFloat(landSize) || 0,
        Farmertype: farmerType,
        CropTypes: crops || [],
        PreferredLanguage: language || 'English',
        Password: mobile.toString().slice(-4) // Default password: last 4 digits of mobile
      }
    });

    return res.json({
      status: 'success',
      message: 'Registration successful!',
      farmer: {
        farmerId: farmer.Farmerid,
        name: farmer.Name,
        mobile: farmer.Mobilenum.toString(),
        state: farmer.State,
        district: farmer.District,
        landSize: farmer.LandSize,
        farmerType: farmerType,
        crops: farmer.CropTypes,
        defaultPassword: `Last 4 digits of your mobile: ${mobile.toString().slice(-4)}`
      }
    });

  } catch (error) {
    console.error('quickRegister error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 12. ALL ACTIVE SCHEMES LIST ====================
module.exports.getAllSchemes = async function (req, res) {
  try {
    const lang = req.query.lang || 'en';
    const category = req.query.category;
    
    const where = { status: 'Active' };
    if (category) where.category = category;

    const schemes = await prisma.governmentScheme.findMany({
      where,
      orderBy: { priority: 'desc' }
    });

    const translatedSchemes = schemes.map(s => translateScheme(s, lang));

    return res.json({
      status: 'success',
      total: schemes.length,
      schemes: translatedSchemes
    });

  } catch (error) {
    console.error('getAllSchemes error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 13. SCHEME DETAIL ====================
module.exports.getSchemeDetail = async function (req, res) {
  try {
    const { schemeId } = req.params;
    const lang = req.query.lang || 'en';

    const scheme = await prisma.governmentScheme.findUnique({
      where: { id: parseInt(schemeId) }
    });

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found', status: 'error' });
    }

    const translated = translateScheme(scheme, lang);

    return res.json({
      status: 'success',
      scheme: translated
    });

  } catch (error) {
    console.error('getSchemeDetail error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 14. UPDATE APPLICATION STATUS (Admin) ====================
module.exports.updateApplicationStatus = async function (req, res) {
  try {
    const { applicationId } = req.params;
    const { status, remarks, approvedAmount } = req.body;

    const validStatuses = ['Draft', 'Submitted', 'Under_Review', 'Approved', 'Rejected', 'Disbursed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', status: 'error' });
    }

    const application = await prisma.schemeApplication.findUnique({
      where: { id: parseInt(applicationId) },
      include: { scheme: true, farmer: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found', status: 'error' });
    }

    const updateData = {
      status,
      remarks: remarks || application.remarks,
      statusHistory: [
        ...application.statusHistory,
        { status, date: new Date().toISOString(), remarks: remarks || '' }
      ]
    };

    if (status === 'Approved') {
      updateData.approvedDate = new Date();
      updateData.approvedAmount = approvedAmount || null;
    }
    if (status === 'Rejected') {
      updateData.rejectionReason = remarks || 'Application rejected';
    }
    if (status === 'Disbursed') {
      updateData.disbursedDate = new Date();
      updateData.disbursedAmount = approvedAmount || application.approvedAmount;
    }

    const updated = await prisma.schemeApplication.update({
      where: { id: parseInt(applicationId) },
      data: updateData
    });

    // Create notification for farmer
    await prisma.notification.create({
      data: {
        farmerId: application.farmerId,
        title: `Application ${status}: ${application.scheme.schemeName}`,
        message: `Your application ${application.applicationNumber} has been ${status.toLowerCase()}. ${remarks || ''}`,
        notificationType: 'scheme',
        status: 'unread'
      }
    });

    return res.json({
      status: 'success',
      message: `Application updated to ${status}`,
      application: updated
    });

  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 15. GET ALL INSURANCE PRODUCTS ====================
module.exports.getAllInsuranceProducts = async function (req, res) {
  try {
    const lang = req.query.lang || 'en';
    const type = req.query.type;

    const where = { status: 'Active' };
    if (type) where.insuranceType = type;

    const products = await prisma.insuranceProduct.findMany({ where });

    const translated = products.map(p => translateInsurance(p, lang));

    return res.json({
      status: 'success',
      total: products.length,
      products: translated
    });

  } catch (error) {
    console.error('getAllInsuranceProducts error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};

// ==================== 16. UPDATE FARMER LANGUAGE PREFERENCE ====================
module.exports.updateLanguage = async function (req, res) {
  try {
    const { farmerId } = req.params;
    const { language } = req.body; // "English", "Hindi", "Marathi"

    const farmer = await prisma.farmerInfo.findFirst({
      where: { 
        OR: [
          { Farmerid: farmerId },
          { id: isNaN(farmerId) ? undefined : parseInt(farmerId) }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found', status: 'error' });
    }

    await prisma.farmerInfo.update({
      where: { id: farmer.id },
      data: { PreferredLanguage: language }
    });

    return res.json({
      status: 'success',
      message: `Language updated to ${language}`
    });

  } catch (error) {
    console.error('updateLanguage error:', error);
    return res.status(500).json({ error: 'Internal server error', status: 'error' });
  }
};
