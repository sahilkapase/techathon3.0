/**
 * Farm Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 * Handles farm information and management
 */

const { prisma } = require('../config/prisma');

// ==================== GET ALL FARM INFO ====================
module.exports.allfarminfo = async function (req, res) {
  try {
    const farms = await prisma.farm.findMany({
      include: {
        farmer: {
          select: {
            Farmerid: true,
            Name: true,
            Mobilenum: true
          }
        },
        irrigationSources: true,
        bills: true,
        cropHistories: true
      }
    });

    return res.json({
      status: "ok",
      count: farms.length,
      farms
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET FARM INFO BY AADHAAR ====================
module.exports.farminfo = async function (req, res) {
  try {
    const { Adharnum } = req.params;

    if (!Adharnum) {
      return res.json([]);
    }

    // Get farmer with matching aadhaar - look up directly on FarmerInfo.Adharnum
    let farmer = null;
    try {
      farmer = await prisma.farmerInfo.findFirst({
        where: { Adharnum: BigInt(Adharnum) }
      });
    } catch (e) {
      // If BigInt conversion fails, try string-based lookup via Farmerid
      farmer = await prisma.farmerInfo.findFirst({
        where: { Farmerid: Adharnum }
      });
    }

    if (!farmer) {
      return res.json([]);
    }

    // Get farms for this farmer
    const farms = await prisma.farm.findMany({
      where: {
        farmerId: farmer.id
      },
      include: {
        irrigationSources: true,
        bills: true,
        cropHistories: true
      }
    });

    // Return plain array (frontend expects array directly)
    return res.json(farms);

  } catch (err) {
    console.log('farminfo error:', err);
    return res.json([]);
  }
};

// ==================== UPDATE FARMER TYPE ====================
module.exports.updatefarmertype = async function (req, res) {
  try {
    const { Farmerid, Adharnum } = req.params;

    if (!Farmerid || !Adharnum) {
      return res.json({
        status: "error",
        error: "Farmer ID and Aadhaar number are required"
      });
    }

    // Get farmer
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Get all farms for this farmer with aadhaar
    const farms = await prisma.farm.findMany({
      where: {
        farmerId: farmer.id
      }
    });

    // Calculate total hectares
    let totalHectares = 0;
    farms.forEach(farm => {
      totalHectares += farm.Hectare || 0;
    });

    // Determine farmer type based on land size
    let farmerType = "Marginal";
    if (totalHectares < 1) {
      farmerType = "Marginal";
    } else if (totalHectares < 2) {
      farmerType = "Small";
    } else if (totalHectares < 4) {
      farmerType = "Semi-Medium";
    } else if (totalHectares < 10) {
      farmerType = "Medium";
    } else {
      farmerType = "Large";
    }

    // Update farmer type
    const updatedFarmer = await prisma.farmerInfo.update({
      where: { Farmerid },
      data: { Farmertype: farmerType }
    });

    return res.json({
      status: "ok",
      message: "Farmer type updated successfully",
      farmerType: updatedFarmer.Farmertype,
      totalHectares
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET FARMS BY FARMER ID ====================
module.exports.getFarmsByFarmerId = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    if (!Farmerid) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid },
      include: {
        farms: {
          include: {
            irrigationSources: true,
            cropHistories: true,
            bills: true
          }
        }
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    return res.json({
      status: "ok",
      count: farmer.farms.length,
      farms: farmer.farms
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== CREATE FARM ====================
module.exports.createFarm = async function (req, res) {
  try {
    const { Farmerid, FarmName, Hectare, SoilType, Village, Taluka, District } = req.body;

    if (!Farmerid || !FarmName || !Hectare) {
      return res.json({
        status: "error",
        error: "Missing required fields"
      });
    }

    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    const newFarm = await prisma.farm.create({
      data: {
        farmerId: farmer.id,
        FarmName,
        Hectare: parseFloat(Hectare),
        SoilType: SoilType || "Unknown",
        Village,
        Taluka,
        District
      }
    });

    // Update farmer type after adding farm
    await module.exports.updatefarmertype({
      params: { Farmerid, Adharnum: "" }
    }, res);

    return res.json({
      status: "ok",
      message: "Farm created successfully",
      farm: newFarm
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== UPDATE FARM ====================
module.exports.updateFarm = async function (req, res) {
  try {
    const { farmId } = req.params;
    const updateData = { ...req.body };

    if (!farmId) {
      return res.json({
        status: "error",
        error: "Farm ID is required"
      });
    }

    // Remove protected fields
    delete updateData.id;
    delete updateData._id;
    delete updateData.farmerId;

    // Parse numeric fields
    if (updateData.Hectare) {
      updateData.Hectare = parseFloat(updateData.Hectare);
    }

    const updatedFarm = await prisma.farm.update({
      where: { id: parseInt(farmId) },
      data: updateData
    });

    return res.json({
      status: "ok",
      message: "Farm updated successfully",
      farm: updatedFarm
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== DELETE FARM ====================
module.exports.deleteFarm = async function (req, res) {
  try {
    const { farmId } = req.params;

    if (!farmId) {
      return res.json({
        status: "error",
        error: "Farm ID is required"
      });
    }

    await prisma.farm.delete({
      where: { id: parseInt(farmId) }
    });

    return res.json({
      status: "ok",
      message: "Farm deleted successfully"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET IRRIGATION SOURCES ====================
module.exports.getIrrigationSources = async function (req, res) {
  try {
    const { farmId } = req.params;

    if (!farmId) {
      return res.json({
        status: "error",
        error: "Farm ID is required"
      });
    }

    const farm = await prisma.farm.findUnique({
      where: { id: parseInt(farmId) },
      include: {
        irrigationSources: true
      }
    });

    if (!farm) {
      return res.json({
        status: "error",
        error: "Farm not found"
      });
    }

    return res.json({
      status: "ok",
      count: farm.irrigationSources.length,
      irrigationSources: farm.irrigationSources
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET FARM STATISTICS ====================
module.exports.getFarmStatistics = async function (req, res) {
  try {
    const totalFarms = await prisma.farm.count();
    
    const farmsByDistrict = await prisma.farm.groupBy({
      by: ['District'],
      _count: { id: true },
      _sum: { Hectare: true }
    });

    const farmsBySoilType = await prisma.farm.groupBy({
      by: ['SoilType'],
      _count: { id: true },
      _sum: { Hectare: true }
    });

    const avgHectares = await prisma.farm.aggregate({
      _avg: { Hectare: true },
      _max: { Hectare: true },
      _min: { Hectare: true }
    });

    return res.json({
      status: "ok",
      summary: {
        totalFarms,
        avgHectares: avgHectares._avg.Hectare,
        maxHectares: avgHectares._max.Hectare,
        minHectares: avgHectares._min.Hectare
      },
      farmsByDistrict,
      farmsBySoilType
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};
