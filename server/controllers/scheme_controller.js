/**
 * Scheme Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 * Handles government scheme management and farmer applications
 */

require('dotenv').config();

const { prisma } = require('../config/prisma');
const uniqueid = require('generate-unique-id');

// Twilio Configuration for WhatsApp Notifications
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// ==================== ADD NEW SCHEME ====================
module.exports.add = async function (req, res) {
  try {
    const { Title, Description, How, More, Expired, Category, Farmertype } = req.body;

    if (!Title) {
      return res.json({
        error: "Scheme title is required",
        status: "error"
      });
    }

    // Check if scheme already exists
    const schemeExists = await prisma.schemeDetails.findFirst({
      where: { Title }
    });

    if (schemeExists) {
      return res.json({
        error: "Scheme is already present!",
        status: "error"
      });
    }

    // Generate unique scheme ID
    const generatedId = uniqueid({
      length: 8,
      useLetters: false
    });

    // Create new scheme
    const newScheme = await prisma.schemeDetails.create({
      data: {
        Schemeid: generatedId,
        Title,
        Description,
        How,
        More,
        Expired: new Date(Expired),
        Category,
        Farmertype,
        Status: "Active",
        Applied: 0,
        Approved: 0,
        Reject: 0
      }
    });

    // Find eligible farmers and send WhatsApp notifications
    const eligibleFarmers = await prisma.farmerInfo.findMany({
      where: {
        Category: Category,
        Farmertype: Farmertype,
        Fake: false
      }
    });

    // Send WhatsApp messages to eligible farmers
    eligibleFarmers.forEach(farmer => {
      if (farmer.Mobilenum) {
        client.messages
          .create({
            body: `${Title}\nDescription:\n${Description}\nHow to get benefits of the Scheme\n${How}\nFor more details click on the link: ${More}\nExpired date: ${Expired}`,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:+91${farmer.Mobilenum}`
          })
          .then(message => console.log(`WhatsApp sent to farmer: ${message.sid}`))
          .catch(err => console.log(`WhatsApp error: ${err}`));
      }
    });

    return res.json({
      status: "ok",
      result: "Scheme added successfully!",
      scheme: newScheme
    });

  } catch (error) {
    console.log(error);
    return res.json({
      error: "Something went wrong please try again after some time",
      status: "error"
    });
  }
};

// ==================== DELETE SCHEME ====================
module.exports.deletescheme = async function (req, res) {
  try {
    const { Schemeid } = req.params;

    const scheme = await prisma.schemeDetails.findFirst({
      where: { Schemeid }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found!"
      });
    }

    // Update status to deleted instead of deleting
    const updatedScheme = await prisma.schemeDetails.update({
      where: { id: scheme.id },
      data: { Status: "Deleted" }
    });

    return res.json({
      status: "ok",
      result: "Scheme has been deleted successfully!"
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong, please try again after some time!"
    });
  }
};

// ==================== ALL ACTIVE SCHEMES ====================
module.exports.allactivescheme = async function (req, res) {
  try {
    const today = new Date();

    const schemes = await prisma.schemeDetails.findMany({
      where: {
        Status: "Active",
        Expired: {
          gte: today
        }
      },
      select: {
        Title: true,
        Expired: true,
        Applied: true,
        Approved: true,
        Reject: true,
        Schemeid: true,
        Description: true,
        Category: true,
        Farmertype: true
      }
    });

    return res.json({
      status: "ok",
      count: schemes.length,
      schemes
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== ALL EXPIRED SCHEMES ====================
module.exports.allexscheme = async function (req, res) {
  try {
    const today = new Date();

    const schemes = await prisma.schemeDetails.findMany({
      where: {
        Status: "Active",
        Expired: {
          lt: today
        }
      },
      select: {
        Title: true,
        Expired: true,
        Applied: true,
        Approved: true,
        Reject: true,
        Schemeid: true
      }
    });

    return res.json({
      status: "ok",
      count: schemes.length,
      schemes
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== ALL DELETED SCHEMES ====================
module.exports.alldeletedschemes = async function (req, res) {
  try {
    const schemes = await prisma.schemeDetails.findMany({
      where: { Status: "Deleted" },
      select: {
        Title: true,
        Schemeid: true,
        Expired: true,
        Applied: true
      }
    });

    return res.json({
      status: "ok",
      count: schemes.length,
      schemes
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== SCHEME INFO ====================
module.exports.schemeinfo = async function (req, res) {
  try {
    const { Schemeid } = req.params;

    const scheme = await prisma.schemeDetails.findFirst({
      where: { Schemeid },
      include: {
        notifications: true
      }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found!"
      });
    }

    return res.json({
      status: "ok",
      scheme
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== APPLIED SCHEMES ====================
module.exports.appliedschemes = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    const schemes = await prisma.schemeDetails.findMany({
      where: {
        Applied: {
          gt: 0
        }
      },
      include: {
        notifications: {
          where: {
            farmer: {
              Farmerid: Farmerid
            }
          }
        }
      }
    });

    return res.json({
      status: "ok",
      count: schemes.length,
      schemes
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== APPLICATIONS OF SCHEME ====================
module.exports.applicationsofscheme = async function (req, res) {
  try {
    const { Schemeid } = req.params;

    const scheme = await prisma.schemeDetails.findFirst({
      where: { Schemeid },
      include: {
        notifications: {
          include: {
            farmer: {
              select: {
                Farmerid: true,
                Name: true,
                Mobilenum: true,
                Email: true,
                District: true
              }
            }
          },
          where: {
            status: "pending"
          }
        }
      }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found!"
      });
    }

    return res.json({
      status: "ok",
      applications: scheme.notifications
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== APPROVE SCHEME APPLICATION ====================
module.exports.approve = async function (req, res) {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.json({
        status: "error",
        error: "Notification ID is required"
      });
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "approved" }
    });

    // Update scheme approved count
    const scheme = await prisma.schemeDetails.findFirst({
      where: { id: notification.schemeId }
    });

    if (scheme) {
      await prisma.schemeDetails.update({
        where: { id: scheme.id },
        data: { Approved: scheme.Approved + 1 }
      });
    }

    return res.json({
      status: "ok",
      result: "Application approved successfully!"
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== LIST OF APPROVED APPLICATIONS ====================
module.exports.listofapprovedapplications = async function (req, res) {
  try {
    const { Schemeid } = req.params;

    const scheme = await prisma.schemeDetails.findFirst({
      where: { Schemeid },
      include: {
        notifications: {
          where: {
            status: "approved"
          },
          include: {
            farmer: {
              select: {
                Farmerid: true,
                Name: true,
                Mobilenum: true,
                Email: true,
                District: true
              }
            }
          }
        }
      }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found!"
      });
    }

    return res.json({
      status: "ok",
      applications: scheme.notifications
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== REJECT SCHEME APPLICATION ====================
module.exports.reject = async function (req, res) {
  try {
    const { notificationId, reason } = req.body;

    if (!notificationId) {
      return res.json({
        status: "error",
        error: "Notification ID is required"
      });
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "rejected",
        message: reason || "Your application was rejected"
      }
    });

    // Update scheme rejected count
    const scheme = await prisma.schemeDetails.findFirst({
      where: { id: notification.schemeId }
    });

    if (scheme) {
      await prisma.schemeDetails.update({
        where: { id: scheme.id },
        data: { Reject: scheme.Reject + 1 }
      });
    }

    return res.json({
      status: "ok",
      result: "Application rejected successfully!"
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== LIST OF REJECTED APPLICATIONS ====================
module.exports.listofrejectedapplications = async function (req, res) {
  try {
    const { Schemeid } = req.params;

    const scheme = await prisma.schemeDetails.findFirst({
      where: { Schemeid },
      include: {
        notifications: {
          where: {
            status: "rejected"
          },
          include: {
            farmer: {
              select: {
                Farmerid: true,
                Name: true,
                Mobilenum: true,
                Email: true,
                District: true
              }
            }
          }
        }
      }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found!"
      });
    }

    return res.json({
      status: "ok",
      applications: scheme.notifications
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== FARMER DETAILS FOR SCHEME ====================
module.exports.farmerdetailsforscheme = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid },
      include: {
        farms: {
          include: {
            irrigationSources: true,
            cropHistories: true
          }
        },
        adhars: true,
        notifications: {
          include: {
            scheme: true
          }
        }
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found!"
      });
    }

    const { Password, ...farmerObj } = farmer;
    return res.json({
      status: "ok",
      farmer: farmerObj
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== LIST OF DISTRICTS ====================
module.exports.listofdistrict = async function (req, res) {
  try {
    const districts = await prisma.district.findMany({
      select: {
        id: true,
        DistrictName: true,
        StateID: true
      }
    });

    return res.json({
      status: "ok",
      count: districts.length,
      districts
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== LIST OF VILLAGES ====================
module.exports.listofvillage = async function (req, res) {
  try {
    const { districtId } = req.params;

    if (!districtId) {
      return res.json({
        error: "District ID is required",
        status: "error"
      });
    }

    // Get villages from farmer data distinct by village
    const villages = await prisma.farmerInfo.findMany({
      where: {
        District: districtId
      },
      distinct: ['Village'],
      select: {
        Village: true
      }
    });

    return res.json({
      status: "ok",
      count: villages.length,
      villages: villages.map(v => v.Village)
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== LIST OF TALUKAS ====================
module.exports.listoftaluka = async function (req, res) {
  try {
    const { districtId } = req.params;

    if (!districtId) {
      return res.json({
        error: "District ID is required",
        status: "error"
      });
    }

    // Get talukas from farmer data distinct by taluka
    const talukas = await prisma.farmerInfo.findMany({
      where: {
        District: districtId
      },
      distinct: ['Taluka'],
      select: {
        Taluka: true
      }
    });

    return res.json({
      status: "ok",
      count: talukas.length,
      talukas: talukas.map(t => t.Taluka)
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== MAP DATA ====================
module.exports.mapdata = async function (req, res) {
  try {
    const schemeAnalytics = await prisma.schemeDetails.findMany({
      where: { Status: "Active" },
      select: {
        Title: true,
        Applied: true,
        Approved: true,
        Reject: true,
        Category: true,
        Farmertype: true
      }
    });

    return res.json({
      status: "ok",
      data: schemeAnalytics
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};

// ==================== ANALYSIS ====================
module.exports.analysis = async function (req, res) {
  try {
    // Total schemes analysis
    const totalSchemes = await prisma.schemeDetails.count();
    const activeSchemes = await prisma.schemeDetails.count({
      where: { Status: "Active" }
    });

    // Total applications
    const totalApplications = await prisma.notification.count();
    const approvedApps = await prisma.notification.count({
      where: { status: "approved" }
    });
    const rejectedApps = await prisma.notification.count({
      where: { status: "rejected" }
    });

    // Scheme statistics
    const schemeStats = await prisma.schemeDetails.groupBy({
      by: ['Category'],
      _sum: {
        Applied: true,
        Approved: true,
        Reject: true
      }
    });

    return res.json({
      status: "ok",
      summary: {
        totalSchemes,
        activeSchemes,
        deletedSchemes: totalSchemes - activeSchemes,
        totalApplications,
        approvedApps,
        rejectedApps,
        pendingApps: totalApplications - approvedApps - rejectedApps
      },
      schemeStats
    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time!"
    });
  }
};
