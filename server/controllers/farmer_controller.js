/**
 * Farmer Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 */

const { prisma } = require('../config/prisma');
const uniqueid = require('generate-unique-id');
const otpGenerator = require('otp-generator');

const sid = process.env.TWILIO_ACCOUNT_SID || "YOUR_ACCOUNT_SID";
const auth_token = process.env.TWILIO_AUTH_TOKEN || "YOUR_AUTH_TOKEN";
const twilio = require("twilio")(sid, auth_token);

// ==================== FARMER SIGNUP ====================
module.exports.farmer_signup = async function (req, res) {
  try {
    // Check if farmer already exists
    const olduser = await prisma.farmerInfo.findUnique({
      where: { Mobilenum: BigInt(req.body.Mobilenum) }
    });

    if (olduser) {
      return res.json({
        error: "User Already Exists",
        status: "error"
      });
    }

    // Generate unique Farmer ID
    const generatedId = uniqueid({
      length: 12,
      useLetters: false
    });

    // Determine farmer type based on land size
    let typeoffarmer = "Marginal";
    
    // For now, default to Marginal (farm data structure differs in Prisma)
    // Can be enhanced later with actual farm lookup
    if (req.body.LandSize < 1) {
      typeoffarmer = "Marginal";
    } else if (req.body.LandSize < 2) {
      typeoffarmer = "Small";
    } else if (req.body.LandSize < 4) {
      typeoffarmer = "Semi-Medium";
    } else if (req.body.LandSize < 10) {
      typeoffarmer = "Medium";
    } else {
      typeoffarmer = "Large";
    }

    // Create new farmer
    const farmer = await prisma.farmerInfo.create({
      data: {
        Farmerid: generatedId,
        Name: req.body.Name,
        Mobilenum: BigInt(req.body.Mobilenum),
        Email: req.body.Email || null,
        Gender: req.body.Gender || "Female",
        Category: req.body.Category || null,
        District: req.body.District || null,
        Taluka: req.body.Taluka || null,
        Village: req.body.Village || null,
        Address: req.body.Address || null,
        Pincode: req.body.Pincode || null,
        Adharnum: req.body.Adharnum ? BigInt(req.body.Adharnum) : null,
        Password: req.body.Password,
        Farmertype: typeoffarmer,
        LandSize: req.body.LandSize || 0,
        State: "Maharashtra",
        Qualification: req.body.Qualification || null,
        Bankname: req.body.Bankname || null,
        IFSC: req.body.IFSC || null,
        Accountnum: req.body.Accountnum ? BigInt(req.body.Accountnum) : null,
        CropTypes: req.body.CropTypes || [],
      }
    });

    console.log('✅ Farmer registered successfully!');
    console.log('Farmer ID:', farmer.Farmerid);
    console.log('Mobile:', req.body.Mobilenum);

    return res.json({
      status: "ok",
      Farmerid: farmer.Farmerid
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong! Please try again after some time"
    });
  }
};

// ==================== TEST OTP (Development Only) ====================
module.exports.testOtp = async function (req, res) {
  const { mobile, otp } = req.body;
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║           🔐  OTP VERIFICATION CODE  🔐                    ║');
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log(`║   📱  Mobile:  +91 ${mobile}                          ║`);
  console.log('║                                                            ║');
  console.log(`║   🔢  OTP:     ${otp}                                   ║`);
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║         Enter this OTP in the application                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  return res.json({ status: "ok", message: "OTP logged to terminal" });
};

// ==================== FARMER LOGIN ====================
module.exports.farmer_login = async function (req, res) {
  try {
    let farmer = null;

    // Login by Farmer ID
    if (req.body.Farmerid && req.body.Password) {
      farmer = await prisma.farmerInfo.findUnique({
        where: { Farmerid: req.body.Farmerid }
      });
    }
    // Login by Mobile Number
    else if (req.body.Mobilenum && req.body.Password) {
      farmer = await prisma.farmerInfo.findUnique({
        where: { Mobilenum: BigInt(req.body.Mobilenum) }
      });
    }
    else {
      return res.json({
        error: "Some problem in required fields!",
        status: "error"
      });
    }

    if (!farmer) {
      return res.json({
        error: "Farmer not found!",
        status: "error"
      });
    }

    if (req.body.Password !== farmer.Password) {
      return res.json({
        error: "Password is incorrect!",
        status: "error"
      });
    }

    // Return farmer info without password
    const { Password, ...farmerObj } = farmer;
    return res.status(200).json(farmerObj);

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong! Please try again after some time"
    });
  }
};

// ==================== FORGOT PASSWORD ====================
module.exports.forgotpassword = async function (req, res) {
  try {
    if (!req.body.Mobilenum || !req.body.Password) {
      return res.json({
        error: "Please enter required fields!",
        status: "error"
      });
    }

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Mobilenum: BigInt(req.body.Mobilenum) }
    });

    if (!farmer) {
      return res.json({
        error: "Farmer does not exist!",
        status: "error"
      });
    }

    // Update password
    await prisma.farmerInfo.update({
      where: { Mobilenum: BigInt(req.body.Mobilenum) },
      data: { Password: req.body.Password }
    });

    return res.json({
      result: "Password updated successfully",
      status: "ok"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong! Please try again after some time"
    });
  }
};

// ==================== MOBILE NUMBER VERIFICATION ====================
module.exports.mobilenumverify = function (req, res) {
  try {
    if (!req.params.Mobilenum) {
      return res.json({
        status: "error",
        error: "Some problem in required fields"
      });
    }

    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    console.log('\n========================================');
    console.log('📱 MOBILE OTP GENERATED');
    console.log('========================================');
    console.log('Mobile Number:', req.params.Mobilenum);
    console.log('OTP:', otp);
    console.log('========================================\n');

    return res.json({
      OTP: otp,
      status: "ok",
      message: "OTP generated (check terminal)"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};

// ==================== AADHAAR VERIFICATION ====================
module.exports.adhar = async function (req, res) {
  try {
    if (!req.body.Adharnum) {
      return res.json({
        status: "error",
        error: "Some problem in required fields!"
      });
    }

    const adhaarRecord = await prisma.adhaarDetails.findUnique({
      where: { AdhaarNumber: BigInt(req.body.Adharnum) }
    });

    if (!adhaarRecord) {
      return res.json({
        status: "error",
        error: "Please enter a valid Aadhaar card number!"
      });
    }

    // Get associated farmer
    const farmer = await prisma.farmerInfo.findUnique({
      where: { id: adhaarRecord.farmerId }
    });

    return res.json({
      status: "ok",
      Mobilenum: farmer.Mobilenum
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong! Please try again after some time!"
    });
  }
};

// ==================== SCHEME APPLICATION ====================
module.exports.applicationofscheme = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid }
    });

    if (!farmer) {
      return res.json([]);
    }

    // Get schemes the farmer actually applied for (via Notification with notificationType=application)
    const notifications = await prisma.notification.findMany({
      where: {
        farmerId: farmer.id,
        notificationType: 'application'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get scheme details for each application
    const schemeIds = notifications.map(n => n.schemeId).filter(Boolean);
    const schemes = await prisma.schemeDetails.findMany({
      where: { SchemeId: { in: schemeIds } }
    });

    // Map to frontend expected format
    const result = notifications.map(n => {
      const scheme = schemes.find(s => s.SchemeId === n.schemeId);
      return {
        Title: scheme?.SchemeName || n.title || 'Unknown Scheme',
        Schemeid: n.schemeId || scheme?.SchemeId,
        Expired: scheme?.ApplicationDeadline,
        Applieddate: n.appliedDate || n.createdAt,
        Reponcedate: n.responseDate,
        Status: n.applicationStatus || 'pending'
      };
    });

    return res.json(result);

  } catch (err) {
    console.log('applicationofscheme error:', err);
    return res.json([]);
  }
};

// ==================== ELIGIBLE SCHEMES ====================
module.exports.eligibleschemes = async function (req, res) {
  try {
    const { Category, Farmertype } = req.params;

    // Find active eligible schemes
    const schemes = await prisma.schemeDetails.findMany({
      where: {
        Status: "Active"
      }
    });

    // Filter by Category and Farmertype if provided
    let filtered = schemes;
    if (Category && Category !== 'all' && Category !== 'null' && Category !== 'undefined') {
      filtered = filtered.filter(s => {
        const cat = s.Category || (s.Region ? s.Region.join(',') : '');
        return cat.toLowerCase().includes(Category.toLowerCase());
      });
    }
    if (Farmertype && Farmertype !== 'all' && Farmertype !== 'null' && Farmertype !== 'undefined') {
      filtered = filtered.filter(s => {
        const ft = s.Farmertype || s.EligibilityCriteria || '';
        return ft.toLowerCase().includes(Farmertype.toLowerCase());
      });
    }

    // Map to frontend expected field names
    const result = filtered.map(s => ({
      Title: s.SchemeName,
      Schemeid: s.SchemeId,
      Expired: s.ApplicationDeadline,
      Start: s.LaunchDate,
      Description: s.Description,
      Benefits: s.BenefitAmount,
      How: s.ApprovalProcess,
      More: s.EligibilityCriteria,
      Category: s.Category ? s.Category.split(',').map(c => c.trim()) : (s.Region || []),
      Farmertype: s.Farmertype ? s.Farmertype.split(',').map(f => f.trim()) : [],
      Status: s.Status
    }));

    return res.json(result);

  } catch (err) {
    console.log('eligibleschemes error:', err);
    return res.json([]);
  }
};

// ==================== APPLY FOR SCHEME ====================
module.exports.applyforscheme = async function (req, res) {
  try {
    const { Schemeid, Farmerid } = req.params;

    // Get scheme details
    const scheme = await prisma.schemeDetails.findUnique({
      where: { SchemeId: Schemeid }
    });

    if (!scheme) {
      return res.json({
        status: "error",
        error: "Scheme not found"
      });
    }

    // Get farmer details
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: Farmerid }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Create notification for application
    await prisma.notification.create({
      data: {
        farmerId: farmer.id,
        title: `Applied for ${scheme.SchemeName}`,
        message: `Your application has been submitted for ${scheme.SchemeName}`,
        notificationType: "application",
        status: "unread",
        schemeId: Schemeid,
        applicationStatus: "pending",
        appliedDate: new Date()
      }
    });

    return res.json({
      status: "ok",
      result: "Your application has been submitted"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== APPROVED SCHEMES ====================
module.exports.approvedschemes = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid }
    });

    if (!farmer) {
      return res.json([]);
    }

    // Get approved applications from Notification
    const notifications = await prisma.notification.findMany({
      where: {
        farmerId: farmer.id,
        notificationType: 'application',
        applicationStatus: 'approved'
      },
      orderBy: { createdAt: 'desc' }
    });

    const schemeIds = notifications.map(n => n.schemeId).filter(Boolean);
    const schemes = await prisma.schemeDetails.findMany({
      where: { SchemeId: { in: schemeIds } }
    });

    const result = notifications.map(n => {
      const scheme = schemes.find(s => s.SchemeId === n.schemeId);
      return {
        Title: scheme?.SchemeName || n.title || 'Unknown Scheme',
        Schemeid: n.schemeId || scheme?.SchemeId,
        Expired: scheme?.ApplicationDeadline,
        Applieddate: n.appliedDate || n.createdAt,
        Reponcedate: n.responseDate,
        Status: 'approved'
      };
    });

    return res.json(result);

  } catch (err) {
    console.log('approvedschemes error:', err);
    return res.json([]);
  }
};

// ==================== REJECTED SCHEMES ====================
module.exports.rejectedschemes = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid }
    });

    if (!farmer) {
      return res.json([]);
    }

    // Get rejected applications from Notification
    const notifications = await prisma.notification.findMany({
      where: {
        farmerId: farmer.id,
        notificationType: 'application',
        applicationStatus: 'rejected'
      },
      orderBy: { createdAt: 'desc' }
    });

    const schemeIds = notifications.map(n => n.schemeId).filter(Boolean);
    const schemes = await prisma.schemeDetails.findMany({
      where: { SchemeId: { in: schemeIds } }
    });

    const result = notifications.map(n => {
      const scheme = schemes.find(s => s.SchemeId === n.schemeId);
      return {
        Title: scheme?.SchemeName || n.title || 'Unknown Scheme',
        Schemeid: n.schemeId || scheme?.SchemeId,
        Expired: scheme?.ApplicationDeadline,
        Applieddate: n.appliedDate || n.createdAt,
        Reponcedate: n.responseDate,
        Status: 'rejected'
      };
    });

    return res.json(result);

  } catch (err) {
    console.log('rejectedschemes error:', err);
    return res.json([]);
  }
};

// ==================== FARMER BILLS ====================
module.exports.bills_farmers = async function (req, res) {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.params.Farmerid }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Get bills from farms
    const bills = await prisma.bill.findMany({
      where: {
        farm: {
          farmerId: farmer.id
        }
      }
    });

    return res.json(bills);

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time"
    });
  }
};

// ==================== DAY WISE PRICE ====================
module.exports.day_wise_price = async function (req, res) {
  try {
    // Get all unique bill dates
    const billDates = await prisma.bill.findMany({
      select: { Bill_date: true },
      distinct: ['Bill_date']
    });

    const final_data = [];

    for (const dateObj of billDates) {
      const date = dateObj.Bill_date;

      // Get bills for this date
      const bills = await prisma.bill.findMany({
        where: { Bill_date: date },
        orderBy: { Rate: 'asc' }
      });

      if (bills.length > 0) {
        const max = Math.max(...bills.map(b => b.Rate || 0));
        const min = Math.min(...bills.map(b => b.Rate || 0));
        const total_buy = bills.reduce((sum, b) => sum + (b.Bags || 0), 0);

        final_data.push({
          Date: date,
          max,
          min,
          total_buy
        });
      }
    }

    return res.json(final_data);

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong please try again after some time"
    });
  }
};

// ==================== TEMP WHATSAPP ====================
module.exports.temp = function (req, res) {
  try {
    const client = require('twilio')(sid, auth_token);

    client.messages
      .create({
        body: 'જય જવાન જય કિશાન',
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+917203955356'
      })
      .then(function (message) {
        return res.json({
          status: "ok",
          result: "Message has been sent"
        });
      })
      .catch(function (err) {
        console.log(err);
        return res.json({
          error: "Something went wrong please try again after some time",
          status: "error"
        });
      });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong!"
    });
  }
};
