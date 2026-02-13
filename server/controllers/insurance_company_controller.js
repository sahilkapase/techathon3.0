/**
 * Insurance Company Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 * Handles insurance company operations
 */

const { prisma } = require('../config/prisma');

// ==================== INSURANCE COMPANY LOGIN ====================
module.exports.insurance_company_login = async function (req, res) {
  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.json({
        error: "Username and password are required",
        status: "error"
      });
    }

    const insuranceCompany = await prisma.insuranceCompany.findUnique({
      where: { Username }
    });

    if (!insuranceCompany) {
      return res.json({
        error: "User not found",
        status: "error"
      });
    }

    if (insuranceCompany.Password !== Password) {
      return res.json({
        error: "Password is incorrect!",
        status: "error"
      });
    }

    const { Password: _, ...companyObj } = insuranceCompany;
    return res.status(200).json(companyObj);

  } catch (err) {
    console.log(err);
    return res.json({
      error: "User not found",
      status: "error"
    });
  }
};

// ==================== GET ALL INSURANCE COMPANIES ====================
module.exports.getAllInsuranceCompanies = async function (req, res) {
  try {
    const companies = await prisma.insuranceCompany.findMany({
      select: {
        id: true,
        CompanyName: true,
        Username: true,
        Email: true,
        Contact: true,
        Address: true
      }
    });

    return res.json({
      status: "ok",
      count: companies.length,
      companies
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== GET INSURANCE COMPANY BY ID ====================
module.exports.getInsuranceCompanyById = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.json({
        error: "Company ID is required",
        status: "error"
      });
    }

    const company = await prisma.insuranceCompany.findUnique({
      where: { id: parseInt(id) }
    });

    if (!company) {
      return res.json({
        error: "Company not found",
        status: "error"
      });
    }

    const { Password, ...companyObj } = company;
    return res.json({
      status: "ok",
      company: companyObj
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== CREATE INSURANCE COMPANY ====================
module.exports.createInsuranceCompany = async function (req, res) {
  try {
    const { CompanyName, Username, Password, Email, Contact, Address } = req.body;

    if (!CompanyName || !Username || !Password || !Email) {
      return res.json({
        error: "Missing required fields",
        status: "error"
      });
    }

    // Check if username already exists
    const usernameExists = await prisma.insuranceCompany.findUnique({
      where: { Username }
    });

    if (usernameExists) {
      return res.json({
        error: "Username already exists",
        status: "error"
      });
    }

    const newCompany = await prisma.insuranceCompany.create({
      data: {
        CompanyName,
        Username,
        Password, // TODO: Hash password in production
        Email,
        Contact,
        Address
      }
    });

    const { Password: _, ...companyObj } = newCompany;
    return res.json({
      status: "ok",
      message: "Insurance company created successfully",
      company: companyObj
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== UPDATE INSURANCE COMPANY ====================
module.exports.updateInsuranceCompany = async function (req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!id) {
      return res.json({
        error: "Company ID is required",
        status: "error"
      });
    }

    // Remove sensitive fields
    delete updateData.id;
    delete updateData._id;

    const updatedCompany = await prisma.insuranceCompany.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    const { Password, ...companyObj } = updatedCompany;
    return res.json({
      status: "ok",
      message: "Insurance company updated successfully",
      company: companyObj
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== DELETE INSURANCE COMPANY ====================
module.exports.deleteInsuranceCompany = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.json({
        error: "Company ID is required",
        status: "error"
      });
    }

    await prisma.insuranceCompany.delete({
      where: { id: parseInt(id) }
    });

    return res.json({
      status: "ok",
      message: "Insurance company deleted successfully"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== GET INSURANCE POLICIES ====================
module.exports.getInsurancePolicies = async function (req, res) {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.json({
        error: "Company ID is required",
        status: "error"
      });
    }

    const policies = await prisma.insuranceCompany.findUnique({
      where: { id: parseInt(companyId) },
      include: {
        policies: true
      }
    });

    if (!policies) {
      return res.json({
        error: "Company not found",
        status: "error"
      });
    }

    return res.json({
      status: "ok",
      policies: policies.policies || []
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== VERIFY INSURANCE ELIGIBILITY ====================
module.exports.verifyInsuranceEligibility = async function (req, res) {
  try {
    const { farmerId } = req.body;

    if (!farmerId) {
      return res.json({
        error: "Farmer ID is required",
        status: "error"
      });
    }

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: farmerId },
      include: {
        farms: true,
        adhars: true
      }
    });

    if (!farmer) {
      return res.json({
        error: "Farmer not found",
        status: "error"
      });
    }

    // Check eligibility criteria
    const isEligible = {
      hasAdhar: farmer.adhars && farmer.adhars.length > 0,
      hasFarms: farmer.farms && farmer.farms.length > 0,
      isVerified: farmer.Fake === false,
      category: farmer.Category
    };

    return res.json({
      status: "ok",
      eligible: isEligible.hasAdhar && isEligible.hasFarms && isEligible.isVerified,
      details: isEligible
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};
