/**
 * Expert Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 */

const { prisma } = require('../config/prisma');

// ==================== EXPERT REGISTRATION ====================
module.exports.registration = async function (req, res) {
  try {
    // Accept both Mobile_no (frontend) and Mobilenumber, Contact for flexibility
    const { Email, Name, Password, Mobile_no, Mobilenumber, Contact, Qualification, Qualifications, Expertise, Specialization, Category, District } = req.body;
    
    // Use whichever mobile field was provided
    const mobileNum = Mobile_no || Mobilenumber || Contact;

    // Validation
    if (!Email || !Name || !Password || !mobileNum) {
      return res.status(400).json({
        status: "error",
        error: "Missing required fields: Email, Name, Password, Mobile Number"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        status: "error",
        error: "Invalid email format"
      });
    }

    // Validate password strength
    if (Password.length < 6) {
      return res.status(400).json({
        status: "error",
        error: "Password must be at least 6 characters long"
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(String(mobileNum).replace(/\D/g, ''))) {
      return res.status(400).json({
        status: "error",
        error: "Invalid mobile number format"
      });
    }

    // Check if expert already exists
    const expertExists = await prisma.expertsRegistration.findUnique({
      where: { Email }
    });

    if (expertExists) {
      return res.status(409).json({
        status: "error",
        error: "Expert with this email already exists"
      });
    }

    // Check if mobile number is already used
    const mobileExists = await prisma.expertsRegistration.findFirst({
      where: { Contact: BigInt(mobileNum) }
    });

    if (mobileExists) {
      return res.status(409).json({
        status: "error",
        error: "Expert with this mobile number already exists"
      });
    }

    // Generate unique Expert ID
    const uniqueId = require('generate-unique-id');
    const expertId = 'EXP' + uniqueId({ length: 8, useLetters: false });

    // Create new expert (match schema fields)
    const newExpert = await prisma.expertsRegistration.create({
      data: {
        ExpertId: expertId,
        Email,
        Name: Name.trim(),
        Password, // TODO: Hash password using bcrypt in production
        Contact: BigInt(mobileNum),
        Qualification: Qualification || Qualifications || null,
        Specialization: Specialization || Expertise || null,
        Category: Category || null,
        District: District || null
      }
    });

    const { Password: _, ...expertObj } = newExpert;
    // Convert BigInt to string for JSON serialization
    if (expertObj.Contact) {
      expertObj.Contact = expertObj.Contact.toString();
    }
    return res.status(201).json({
      status: "ok",
      message: "Expert registration successful!",
      expert: expertObj
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      status: "error",
      error: "Something went wrong during registration",
      message: err.message
    });
  }
};

// ==================== EXPERT LOGIN ====================
module.exports.expertlogin = async function (req, res) {
  try {
    const { Email, Password } = req.body;

    // Validation
    if (!Email || !Password) {
      return res.status(400).json({
        status: "error",
        error: "Email and password are required"
      });
    }

    const expertData = await prisma.expertsRegistration.findUnique({
      where: { Email }
    });

    if (!expertData) {
      return res.status(401).json({
        status: "error",
        error: "Expert not found. Please register first."
      });
    }

    // TODO: Use bcrypt for password comparison in production
    if (expertData.Password !== Password) {
      return res.status(401).json({
        status: "error",
        error: "Invalid email or password"
      });
    }

    // Check if expert status is active
    if (expertData.Status !== "active") {
      return res.status(403).json({
        status: "error",
        error: "Your account is not active. Please contact support."
      });
    }

    const { Password: _, ...expertObj } = expertData;
    return res.status(200).json({
      status: "ok",
      message: "Login successful!",
      expert: expertObj,
      Email: expertObj.Email // Include for compatibility
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      status: "error",
      error: "Something went wrong during login",
      message: err.message
    });
  }
};

// ==================== LIST OF EXPERTS ====================
module.exports.list_of_experts = async function (req, res) {
  try {
    const { expertise, district, search, limit = 50, skip = 0 } = req.query;

    // Build where clause for filtering
    const whereClause = {
      Status: "active"
    };

    // Add expertise filter
    if (expertise && expertise !== "All") {
      whereClause.Expertise = {
        contains: expertise,
        mode: 'insensitive'
      };
    }

    // Add district filter
    if (district) {
      whereClause.District = {
        contains: district,
        mode: 'insensitive'
      };
    }

    // Add search filter (name or expertise)
    if (search) {
      whereClause.OR = [
        {
          Name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          Expertise: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get total count for pagination
    const total = await prisma.expertsRegistration.count({ where: whereClause });

    // Get paginated experts
    const experts = await prisma.expertsRegistration.findMany({
      where: whereClause,
      select: {
        Email: true,
        Name: true,
        Expertise: true,
        Qualifications: true,
        District: true,
        Mobilenumber: true,
        Bio: true,
        Status: true
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { Name: 'asc' }
    });

    if (!experts || experts.length === 0) {
      return res.json({
        status: "ok",
        count: 0,
        total: 0,
        experts: [],
        message: "No experts found matching your criteria"
      });
    }

    return res.json({
      status: "ok",
      count: experts.length,
      total: total,
      hasMore: parseInt(skip) + experts.length < total,
      experts
    });

  } catch (err) {
    console.error("Error fetching experts:", err);
    return res.status(500).json({
      status: "error",
      error: "Failed to fetch experts list",
      message: err.message
    });
  }
};

// ==================== LIST OF FARMERS FOR EXPERT ====================
module.exports.list_of_farmers = async function (req, res) {
  try {
    const { Email } = req.params;

    if (!Email) {
      return res.json({
        error: "Expert email is required",
        status: "error"
      });
    }

    // Get distinct farmers who have communicated with this expert
    const farmerIds = await prisma.expertMessage.findMany({
      where: { expertEmail: Email },
      distinct: ['farmerId'],
      select: { farmerId: true }
    });

    // Get farmer details
    const farmers = await prisma.farmerInfo.findMany({
      where: {
        id: {
          in: farmerIds.map(f => f.farmerId)
        }
      },
      select: {
        id: true,
        Farmerid: true,
        Name: true,
        Mobilenum: true,
        Email: true,
        District: true
      }
    });

    return res.json({
      status: "ok",
      count: farmers.length,
      farmers
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== SEND MESSAGE TO FARMER ====================
module.exports.send_message_to_farmer = async function (req, res) {
  try {
    const { farmerId, expertEmail, message, subject } = req.body;

    if (!farmerId || !expertEmail || !message) {
      return res.json({
        error: "Missing required fields",
        status: "error"
      });
    }

    const newMessage = await prisma.expertMessage.create({
      data: {
        farmerId,
        expertEmail,
        message,
        subject: subject || "Expert Consultation",
        messageStatus: "unread"
      }
    });

    return res.json({
      status: "ok",
      message: "Message sent successfully!",
      data: newMessage
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== GET MESSAGES FOR FARMER ====================
module.exports.get_messages_for_farmer = async function (req, res) {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.json({
        error: "Farmer ID is required",
        status: "error"
      });
    }

    const messages = await prisma.expertMessage.findMany({
      where: { farmerId: parseInt(farmerId) },
      include: {
        expert: {
          select: {
            Name: true,
            Email: true,
            Expertise: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      status: "ok",
      count: messages.length,
      messages
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== GET MESSAGES FOR EXPERT ====================
module.exports.get_messages_for_expert = async function (req, res) {
  try {
    const { expertEmail } = req.params;

    if (!expertEmail) {
      return res.json({
        error: "Expert email is required",
        status: "error"
      });
    }

    const messages = await prisma.expertMessage.findMany({
      where: { expertEmail },
      include: {
        farmer: {
          select: {
            Name: true,
            Mobilenum: true,
            Email: true,
            District: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      status: "ok",
      count: messages.length,
      messages
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== UPDATE EXPERT PROFILE ====================
module.exports.updateExpertProfile = async function (req, res) {
  try {
    const { Email } = req.params;
    const updateData = { ...req.body };

    if (!Email) {
      return res.json({
        error: "Expert email is required",
        status: "error"
      });
    }

    // Remove sensitive/readonly fields
    delete updateData.Email;
    delete updateData.id;
    delete updateData._id;

    const updatedExpert = await prisma.expertsRegistration.update({
      where: { Email },
      data: updateData
    });

    const { Password: _, ...expertObj } = updatedExpert;
    return res.json({
      status: "ok",
      message: "Expert profile updated successfully!",
      expert: expertObj
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== SEARCH EXPERTS BY EXPERTISE ====================
module.exports.searchExpertsByExpertise = async function (req, res) {
  try {
    const { expertise } = req.query;

    if (!expertise) {
      return res.json({
        error: "Expertise keyword is required",
        status: "error"
      });
    }

    const experts = await prisma.expertsRegistration.findMany({
      where: {
        Expertise: {
          contains: expertise,
          mode: 'insensitive'
        }
      },
      select: {
        Name: true,
        Email: true,
        Expertise: true,
        Qualifications: true,
        District: true,
        Mobilenumber: true
      }
    });

    return res.json({
      status: "ok",
      count: experts.length,
      experts
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== GET EXPERT BY EMAIL ====================
module.exports.getExpertByEmail = async function (req, res) {
  try {
    const { Email } = req.params;

    if (!Email) {
      return res.json({
        error: "Expert email is required",
        status: "error"
      });
    }

    const expert = await prisma.expertsRegistration.findUnique({
      where: { Email },
      include: {
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!expert) {
      return res.json({
        error: "Expert not found",
        status: "error"
      });
    }

    const { Password: _, ...expertObj } = expert;
    return res.json({
      status: "ok",
      expert: expertObj
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};

// ==================== DELETE EXPERT ====================
module.exports.deleteExpert = async function (req, res) {
  try {
    const { Email } = req.params;

    if (!Email) {
      return res.json({
        error: "Expert email is required",
        status: "error"
      });
    }

    // Delete all messages first (cascade)
    await prisma.expertMessage.deleteMany({
      where: { expertEmail: Email }
    });

    // Delete expert
    const deletedExpert = await prisma.expertsRegistration.delete({
      where: { Email }
    });

    return res.json({
      status: "ok",
      message: "Expert deleted successfully!"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong",
      status: "error"
    });
  }
};
