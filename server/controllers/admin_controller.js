/**
 * Admin Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 */

const { prisma } = require('../config/prisma');

const category = ["SC", "ST", "OBC", "EWS", "GENERAL"];

// ==================== ADMIN LOGIN ====================
module.exports.login = async function (req, res) {
  try {
    if (!req.body.Username || !req.body.Password) {
      return res.json({
        error: "Some problem in required fields!",
        status: "error"
      });
    }

    // Note: AdminDetails doesn't have Username field, using Email instead
    const admin = await prisma.adminDetails.findUnique({
      where: { Email: req.body.Username }
    });

    if (!admin) {
      return res.json({
        status: "error",
        error: "User is not found!"
      });
    }

    if (req.body.Password !== admin.Password) {
      return res.json({
        error: "Password is incorrect!",
        status: "error"
      });
    }

    const { Password, ...adminObj } = admin;
    return res.status(200).json(adminObj);

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try after some time!"
    });
  }
};

// ==================== FIND FARMER BY ID ====================
module.exports.findfarmerbyid = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid },
      include: {
        farms: true,
        cropHistories: true,
        adhars: true,
        notifications: true
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Unable to find farmer!"
      });
    }

    const { Password, ...farmerObj } = farmer;
    return res.json(farmerObj);

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FIND FARMER BY MOBILE ====================
module.exports.findfarmerbymobilenum = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Mobilenum: req.params.Mobilenum },
      include: {
        farms: true,
        cropHistories: true,
        adhars: true
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Unable to find farmer!"
      });
    }

    const { Password, ...farmerObj } = farmer;
    return res.json(farmerObj);

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FARMER INFORMATION ====================
module.exports.farmerinformation = async function (req, res) {
  try {
    if (!req.params.Farmerid) {
      return res.json({
        status: "error",
        error: "Farmer ID is required!"
      });
    }

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid },
      include: {
        farms: {
          include: {
            irrigationSources: true,
            bills: true
          }
        },
        cropHistories: true,
        adhars: true,
        messages: true,
        notifications: true,
        apyRecords: true
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Unable to find farmer!"
      });
    }

    const { Password, ...farmerObj } = farmer;
    return res.json(farmerObj);

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FIND ALL FARMERS (Alias for all_farmers) ====================
module.exports.findallfarmers = async function (req, res) {
  try {
    const farmers = await prisma.farmerInfo.findMany({
      select: {
        id: true,
        Farmerid: true,
        Name: true,
        Mobilenum: true,
        Email: true,
        District: true,
        Category: true,
        Farmertype: true,
        State: true
      }
    });

    return res.json({
      status: "ok",
      count: farmers.length,
      farmers
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FIND FARMER BY AADHAAR ====================
module.exports.findfarmerbyadharnum = async function (req, res) {
  try {
    const { Adharnum } = req.params;

    const adhaar = await prisma.adhaarDetails.findUnique({
      where: { AdhaarNumber: BigInt(Adharnum) },
      include: {
        farmer: {
          select: {
            id: true,
            Farmerid: true,
            Name: true,
            Mobilenum: true,
            Email: true,
            District: true,
            Category: true
          }
        }
      }
    });

    if (!adhaar) {
      return res.json({
        status: "error",
        error: "Farmer with this Aadhaar not found!"
      });
    }

    return res.json({
      status: "ok",
      farmer: adhaar.farmer
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FIND MANY FARMERS ====================
module.exports.findmanyfarmers = async function (req, res) {
  try {
    const { District, Taluka, Village, Category, Farmertype } = req.params;

    const farmers = await prisma.farmerInfo.findMany({
      where: {
        ...(District && { District }),
        ...(Taluka && { Taluka }),
        ...(Village && { Village }),
        ...(Category && { Category }),
        ...(Farmertype && { Farmertype })
      },
      select: {
        id: true,
        Farmerid: true,
        Name: true,
        Mobilenum: true,
        Email: true,
        District: true,
        Category: true,
        Farmertype: true
      }
    });

    return res.json({
      status: "ok",
      count: farmers.length,
      farmers
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== REGISTERED FARMER DETAILS ====================
module.exports.registeredfarmerdetails = async function (req, res) {
  try {
    const farmers = await prisma.farmerInfo.findMany({
      where: { Fake: false },
      include: {
        farms: true,
        cropHistories: true,
        adhars: true
      }
    });

    // Count farmers by category
    const SCfarmers = farmers.filter(f => f.Category === 'SC').length;
    const STfarmers = farmers.filter(f => f.Category === 'ST').length;
    const OBCfarmers = farmers.filter(f => f.Category === 'OBC').length;
    const EWSfarmers = farmers.filter(f => f.Category === 'EWS').length;
    const GENERALfarmers = farmers.filter(f => f.Category === 'GENERAL' || !f.Category).length;

    return res.json({
      status: "ok",
      count: farmers.length,
      registeredfarmers: farmers.length,
      SCfarmers,
      STfarmers,
      OBCfarmers,
      EWSfarmers,
      GENERALfarmers,
      farmers
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== GET ALL FARMERS ====================
module.exports.all_farmers = async function (req, res) {
  try {
    const farmers = await prisma.farmerInfo.findMany({
      select: {
        id: true,
        Farmerid: true,
        Name: true,
        Mobilenum: true,
        Email: true,
        District: true,
        Category: true,
        Farmertype: true,
        State: true
      }
    });

    return res.json({
      status: "ok",
      count: farmers.length,
      farmers
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== APPROVE FARMER ====================
module.exports.approveFarmer = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    const farmer = await prisma.farmerInfo.update({
      where: { Farmerid },
      data: { Fake: false }
    });

    return res.json({
      status: "ok",
      message: "Farmer approved successfully!",
      farmer
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== REJECT FARMER ====================
module.exports.rejectFarmer = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    const farmer = await prisma.farmerInfo.update({
      where: { Farmerid },
      data: { Fake: true }
    });

    return res.json({
      status: "ok",
      message: "Farmer rejected!",
      farmer
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== UPDATE FARMER ====================
module.exports.updateFarmer = async function (req, res) {
  try {
    const { Farmerid } = req.params;
    const updateData = { ...req.body };

    // Remove sensitive fields
    delete updateData.Farmerid;
    delete updateData._id;

    const farmer = await prisma.farmerInfo.update({
      where: { Farmerid },
      data: updateData
    });

    const { Password, ...farmerObj } = farmer;
    return res.json({
      status: "ok",
      message: "Farmer updated successfully!",
      farmer: farmerObj
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== GET FARMER STATISTICS ====================
module.exports.getFarmerStats = async function (req, res) {
  try {
    const totalFarmers = await prisma.farmerInfo.count();
    const farmersByType = await prisma.farmerInfo.groupBy({
      by: ['Farmertype'],
      _count: { id: true }
    });

    const farmersByDistrict = await prisma.farmerInfo.groupBy({
      by: ['District'],
      _count: { id: true }
    });

    const farmersByCategory = await prisma.farmerInfo.groupBy({
      by: ['Category'],
      _count: { id: true }
    });

    return res.json({
      status: "ok",
      totalFarmers,
      farmersByType,
      farmersByDistrict,
      farmersByCategory
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== SEND NOTIFICATION TO FARMERS ====================
module.exports.sendNotificationToFarmers = async function (req, res) {
  try {
    const { farmerId, title, message } = req.body;

    if (!farmerId || !title || !message) {
      return res.json({
        status: "error",
        error: "Missing required fields!"
      });
    }

    const notification = await prisma.notification.create({
      data: {
        farmerId,
        title,
        message,
        notificationType: "admin",
        status: "unread"
      }
    });

    return res.json({
      status: "ok",
      message: "Notification sent successfully!",
      notification
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== GET BILLS ====================
module.exports.getBills = async function (req, res) {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        farm: {
          include: {
            farmer: {
              select: {
                Farmerid: true,
                Name: true,
                Mobilenum: true
              }
            }
          }
        }
      }
    });

    return res.json({
      status: "ok",
      count: bills.length,
      bills
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== CREATE ADMIN ====================
module.exports.createAdmin = async function (req, res) {
  try {
    const { AdminName, Email, Password, AdminType } = req.body;

    if (!AdminName || !Email || !Password || !AdminType) {
      return res.json({
        status: "error",
        error: "Missing required fields!"
      });
    }

    const admin = await prisma.adminDetails.create({
      data: {
        AdminName,
        Email,
        Password, // TODO: Hash password in production
        AdminType
      }
    });

    const { Password: _, ...adminObj } = admin;
    return res.json({
      status: "ok",
      message: "Admin created successfully!",
      admin: adminObj
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

module.exports.category = category;

// Stub functions for map/analysis routes
module.exports.districtwise = async function (req, res) {
  res.json({ status: 'success', data: [] });
};
module.exports.talukawise = async function (req, res) {
  res.json({ status: 'success', data: [] });
};
module.exports.villagewise = async function (req, res) {
  res.json({ status: 'success', data: [] });
};
module.exports.mapdata = async function (req, res) {
  try {
    const { Category } = req.params;
    
    // Get farmers grouped by district
    const farmers = await prisma.farmerInfo.findMany({
      where: Category && Category !== 'undefined' ? { Category } : {},
      select: {
        District: true,
        Category: true
      }
    });

    // Group by district and count
    const districtCounts = {};
    farmers.forEach(f => {
      const dist = f.District || 'Unknown';
      districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    });

    const data = Object.entries(districtCounts).map(([district, count]) => ({
      id: district,
      label: district,
      value: count
    }));

    res.json(data);
  } catch (error) {
    console.log(error);
    res.json([]);
  }
};
module.exports.analysis = async function (req, res) {
  try {
    const { District, Taluka, Village } = req.params;
    
    // Build where clause based on params
    const where = {};
    if (District && District !== '0' && District !== 'undefined') {
      where.District = District;
    }
    if (Taluka && Taluka !== '0' && Taluka !== 'undefined') {
      where.Taluka = Taluka;
    }
    if (Village && Village !== '0' && Village !== 'undefined') {
      where.Village = Village;
    }

    const farmers = await prisma.farmerInfo.findMany({ where });

    // Count by category
    const SC = farmers.filter(f => f.Category === 'SC').length;
    const ST = farmers.filter(f => f.Category === 'ST').length;
    const OBC = farmers.filter(f => f.Category === 'OBC').length;
    const EWS = farmers.filter(f => f.Category === 'EWS').length;
    const GENERAL = farmers.filter(f => f.Category === 'GENERAL' || !f.Category).length;

    res.json({ 
      status: 'success', 
      data: [{ SC, ST, OBC, EWS, GENERAL }] 
    });
  } catch (error) {
    console.log(error);
    res.json({ status: 'success', data: [{ SC: 0, ST: 0, OBC: 0, EWS: 0, GENERAL: 0 }] });
  }
};
