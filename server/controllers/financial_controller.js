const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// LOAN ELIGIBILITY CONTROLLER
// ==========================================

/**
 * Check loan eligibility for a farmer
 * POST /api/financial/loan/check-eligibility/:farmerId
 */
exports.checkLoanEligibility = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { annualIncome, landSize, irrigationStatus, primaryCrop } = req.body;

    // Validate input
    if (!annualIncome || !landSize || !primaryCrop) {
      return res.status(400).json({
        success: false,
        message: 'Annual income, land size, and primary crop are required',
      });
    }

    // Fetch farmer details
    const farmer = await prisma.farmerInfo.findFirst({
      where: { id: parseInt(farmerId) },
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // Calculate loan eligibility based on income and land size
    const eligibleAmount = calculateLoanAmount(annualIncome, landSize, farmer.Farmertype);
    const interestRate = calculateInterestRate(landSize, farmer.Farmertype);
    const subsidyPercentage = calculateSubsidy(farmer.Farmertype, landSize);

    // Check credit score if available
    const creditScore = await prisma.creditScore.findFirst({
      where: { farmerId: parseInt(farmerId) },
    });

    // Save or update eligibility record
    const eligibility = await prisma.loanEligibility.upsert({
      where: { farmerId: parseInt(farmerId) },
      create: {
        farmerId: parseInt(farmerId),
        annualIncome,
        landSize,
        irrigationStatus,
        primaryCrop,
        eligibleLoanAmount: eligibleAmount,
        interestRate,
        maxLoanTerm: 5,
        subsidyPercentage,
        creditScore: creditScore?.score || 700,
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
        creditScore: creditScore?.score || 700,
      },
    });

    const monthlyEMI = calculateEMI(eligibleAmount, interestRate, 5);

    res.status(200).json({
      success: true,
      message: 'Loan eligibility checked successfully',
      eligibility: {
        farmerId,
        eligibleLoanAmount: Math.round(eligibleAmount),
        interestRate: parseFloat(interestRate.toFixed(2)),
        maxLoanTerm: 5,
        subsidyPercentage: parseFloat(subsidyPercentage.toFixed(2)),
        monthlyEMI: Math.round(monthlyEMI),
        recommendation: generateLoanRecommendation(eligibleAmount, primaryCrop),
      },
    });
  } catch (error) {
    console.error('Error checking loan eligibility:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get loan eligibility for a farmer
 * GET /api/financial/loan/eligibility/:farmerId
 */
exports.getLoanEligibility = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const eligibility = await prisma.loanEligibility.findFirst({
      where: { farmerId: parseInt(farmerId) },
    });

    if (!eligibility) {
      return res.status(404).json({
        success: false,
        message: 'No eligibility data. Please complete assessment first.',
      });
    }

    res.status(200).json({
      success: true,
      eligibility,
    });
  } catch (error) {
    console.error('Error fetching loan eligibility:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// LOAN APPLICATION CONTROLLER
// ==========================================

/**
 * Apply for a loan
 * POST /api/financial/loan/apply/:farmerId
 */
exports.applyForLoan = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { loanAmount, loanPurpose, repaymentPeriod, collateral, documents } = req.body;

    // Validate input
    if (!loanAmount || !loanPurpose) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount and purpose are required',
      });
    }

    // Verify eligibility
    const eligibility = await prisma.loanEligibility.findFirst({
      where: { farmerId: parseInt(farmerId) },
    });

    if (!eligibility) {
      return res.status(400).json({
        success: false,
        message: 'Must complete loan eligibility assessment first',
      });
    }

    if (loanAmount > eligibility.eligibleLoanAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds eligible amount of ₹${eligibility.eligibleLoanAmount}`,
      });
    }

    // Create loan application
    const application = await prisma.loanApplication.create({
      data: {
        farmerId: parseInt(farmerId),
        loanAmount: parseFloat(loanAmount),
        loanPurpose,
        repaymentPeriod: parseInt(repaymentPeriod) || 60,
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
    console.error('Error applying for loan:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all loan applications for a farmer
 * GET /api/financial/loan/applications/:farmerId
 */
exports.getLoanApplications = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const applications = await prisma.loanApplication.findMany({
      where: { farmerId: parseInt(farmerId) },
      orderBy: { createdAt: 'desc' },
      include: {
        repayments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      totalApplications: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get specific loan application details
 * GET /api/financial/loan/application/:applicationId
 */
exports.getLoanApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.loanApplication.findFirst({
      where: { id: parseInt(applicationId) },
      include: {
        repayments: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error('Error fetching loan application detail:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// SUBSIDY CONTROLLER
// ==========================================

/**
 * Get available subsidies for a farmer
 * GET /api/financial/subsidies/available/:farmerId
 */
exports.getAvailableSubsidies = async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Get farmer details
    const farmer = await prisma.farmerInfo.findFirst({
      where: { id: parseInt(farmerId) },
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

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
      const isLandSizeEligible =
        (!subsidy.minLandSize || farmer.LandSize >= subsidy.minLandSize) &&
        (!subsidy.maxLandSize || farmer.LandSize <= subsidy.maxLandSize);

      const isCategoryEligible = !subsidy.farmerCategory || subsidy.farmerCategory.length === 0 || subsidy.farmerCategory.includes(farmer.Farmertype);

      const isRegionEligible = !subsidy.regionRestriction || subsidy.regionRestriction === farmer.District;

      return isLandSizeEligible && isCategoryEligible && isRegionEligible;
    });

    res.status(200).json({
      success: true,
      totalAvailable: eligibleSubsidies.length,
      subsidies: eligibleSubsidies,
    });
  } catch (error) {
    console.error('Error fetching available subsidies:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get specific subsidy details
 * GET /api/financial/subsidy/:subsidyId
 */
exports.getSubsidyDetails = async (req, res) => {
  try {
    const { subsidyId } = req.params;

    const subsidy = await prisma.subsidyRecord.findFirst({
      where: { id: parseInt(subsidyId) },
    });

    if (!subsidy) {
      return res.status(404).json({
        success: false,
        message: 'Subsidy not found',
      });
    }

    res.status(200).json({
      success: true,
      subsidy,
    });
  } catch (error) {
    console.error('Error fetching subsidy details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Apply for subsidy
 * POST /api/financial/subsidy/apply/:farmerId
 */
exports.applyForSubsidy = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { subsidyId, documents } = req.body;

    const subsidy = await prisma.subsidyRecord.findFirst({
      where: { id: parseInt(subsidyId) },
    });

    if (!subsidy) {
      return res.status(404).json({
        success: false,
        message: 'Subsidy not found',
      });
    }

    // Create or update subsidy record with "Applied" status
    const subsidyApplication = await prisma.subsidyRecord.create({
      data: {
        farmerId: parseInt(farmerId),
        subsidyName: subsidy.subsidyName,
        subsidyType: subsidy.subsidyType,
        amount: subsidy.amount,
        crops: subsidy.crops,
        minLandSize: subsidy.minLandSize,
        maxLandSize: subsidy.maxLandSize,
        status: 'Applied',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Subsidy application submitted successfully',
      application: subsidyApplication,
    });
  } catch (error) {
    console.error('Error applying for subsidy:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// APY (PENSION) CONTROLLER
// ==========================================

/**
 * Get APY details for a farmer
 * GET /api/financial/apy/:farmerId
 */
exports.getAPYDetails = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const apySubscription = await prisma.aPY.findFirst({
      where: { farmerId: parseInt(farmerId) },
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
            'Spouse gets 50% of pension after death',
          ],
          features: [
            'Flexible contribution options',
            'Portable across India',
            'Tax benefits under Section 80CCD',
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
    console.error('Error fetching APY details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Enroll farmer in APY
 * POST /api/financial/apy/enroll/:farmerId
 */
exports.enrollAPY = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { monthlyContribution, pensionAge } = req.body;

    // Validate input
    if (!monthlyContribution || !pensionAge) {
      return res.status(400).json({
        success: false,
        message: 'Monthly contribution and pension age are required',
      });
    }

    // Validate contribution amount (minimum ₹1000)
    if (monthlyContribution < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum monthly contribution is ₹1000',
      });
    }

    // Get farmer details
    const farmer = await prisma.farmerInfo.findFirst({
      where: { id: parseInt(farmerId) },
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // Calculate pension amount based on contribution and age
    const pensionAmount = calculateAPYPension(monthlyContribution, pensionAge);

    const subscription = await prisma.aPY.create({
      data: {
        farmerId: parseInt(farmerId),
        contributionAmount: parseFloat(monthlyContribution),
        pensionAmount: Math.round(pensionAmount),
        subscriberName: farmer.Name,
        subscriberContact: farmer.Mobilenum.toString(),
        status: 'Active',
        enrollmentDate: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in APY',
      subscription: {
        ...subscription,
        accountNumber: generateAccountNumber(),
        pensionAge,
      },
      nextSteps: [
        'Your enrollment has been recorded',
        'Monthly contribution will be deducted from your bank account',
        'You will receive pension starting at age ' + pensionAge,
      ],
    });
  } catch (error) {
    console.error('Error enrolling in APY:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// CREDIT SCORE CONTROLLER
// ==========================================

/**
 * Get credit score for a farmer
 * GET /api/financial/credit-score/:farmerId
 */
exports.getCreditScore = async (req, res) => {
  try {
    const { farmerId } = req.params;

    let creditScore = await prisma.creditScore.findFirst({
      where: { farmerId: parseInt(farmerId) },
    });

    if (!creditScore) {
      // Calculate initial credit score if not exists
      creditScore = await calculateAndSaveCreditScore(parseInt(farmerId));
    }

    res.status(200).json({
      success: true,
      creditScore,
    });
  } catch (error) {
    console.error('Error fetching credit score:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Calculate loan amount based on income and land size
 */
function calculateLoanAmount(annualIncome, landSize, farmerType) {
  // Formula: Loan Amount = (Annual Income * 2) + (Land Size * 50,000)
  let baseAmount = annualIncome * 2 + landSize * 50000;

  // Apply multiplier based on farmer type
  const multiplier = {
    'Marginal': 1.0,
    'Small': 1.25,
    'Medium': 1.5,
    'Large': 1.75,
  };

  return baseAmount * (multiplier[farmerType] || 1.0);
}

/**
 * Calculate interest rate based on land size and farmer type
 */
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

/**
 * Calculate subsidy percentage
 */
function calculateSubsidy(farmerType, landSize) {
  if (farmerType === 'Marginal' && landSize <= 1) return 5; // 5% subsidy
  if (farmerType === 'Small' && landSize <= 2) return 3; // 3% subsidy
  return 0;
}

/**
 * Calculate EMI (Equated Monthly Installment)
 */
function calculateEMI(principal, rate, years) {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

/**
 * Generate loan recommendation text
 */
function generateLoanRecommendation(amount, crop) {
  return `Based on your profile, we recommend using this loan for: Buying quality seeds and fertilizers for ${crop}, Farm equipment maintenance, or Labor costs during peak season.`;
}

/**
 * Calculate APY pension amount
 */
function calculateAPYPension(monthlyContribution, pensionAge) {
  // Simplified calculation (actual is complex and depends on government contribution)
  // Monthly Pension = Monthly Contribution × Annuity Factor
  const annuityFactor = {
    60: 12.5,
    65: 11.2,
    70: 10.5,
  };
  return monthlyContribution * (annuityFactor[pensionAge] || 10);
}

/**
 * Generate unique account number
 */
function generateAccountNumber() {
  return 'APY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Calculate and save credit score based on loan history
 */
async function calculateAndSaveCreditScore(farmerId) {
  try {
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

      const paymentRate = totalRepayments > 0 ? paidRepayments / totalRepayments : 0.5;

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
  } catch (error) {
    console.error('Error calculating credit score:', error);
    // Return default score if calculation fails
    return {
      farmerId,
      score: 700,
      scoreGrade: 'Good',
      defaultCount: 0,
    };
  }
}

module.exports = exports;
