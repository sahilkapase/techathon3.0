/**
 * Crop Data Controller - Migrated to Prisma ORM
 * Replaces MongoDB with PostgreSQL via Prisma
 * Handles crop history and recommendations
 */

const { prisma } = require('../config/prisma');

// ==================== CROP HISTORY FORM ====================
module.exports.crop_history_form = async function (req, res) {
  try {
    const { Sow_date, Season, UPIN, Soil_type, Crop, Ratio, Irigation_sources_used, Harvest_date, Pro, Farmerid } = req.body;

    if (!Farmerid || !UPIN || !Season || !Crop) {
      return res.json({
        status: "error",
        error: "Missing required fields"
      });
    }

    const sowDate = new Date(Sow_date);
    const year = sowDate.getFullYear();

    // Check if record already exists for this year/season
    const existing = await prisma.cropHistoryForm.findFirst({
      where: {
        Year: year,
        Season,
        UPIN
      }
    });

    if (existing) {
      return res.json({
        status: "error",
        error: "Form has already been filled for this year/season"
      });
    }

    // Get farm data
    const farm = await prisma.farm.findFirst({
      where: { UPIN }
    });

    if (!farm) {
      return res.json({
        status: "error",
        error: "Farm not found"
      });
    }

    // Get farmer name
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Create crop history record
    const newData = await prisma.cropHistoryForm.create({
      data: {
        Farmerid,
        Farmername: farmer.Name,
        UPIN,
        Soil_type: Soil_type || "Unknown",
        Season,
        Crop,
        Ratio: parseFloat(Ratio) || 0,
        Irigation_sources_used,
        Sow_date: new Date(Sow_date),
        Harvest_date: new Date(Harvest_date),
        Production: parseFloat(Pro) || 0,
        Year: year,
        Hectare: farm.Hectare,
        Are: farm.Are || 0,
        Square_meteres: farm.Square_meters || 0,
        District: farm.District,
        Taluka: farm.Taluka,
        Village: farm.Village
      }
    });

    return res.json({
      status: "ok",
      data: newData
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET CROP HISTORY ====================
module.exports.crop_history = async function (req, res) {
  try {
    const { UPIN } = req.params;

    if (!UPIN) {
      return res.json({
        status: "error",
        error: "UPIN is required"
      });
    }

    const history = await prisma.cropHistoryForm.findMany({
      where: { UPIN },
      orderBy: { Year: 'desc' }
    });

    return res.json({
      status: "ok",
      count: history.length,
      history
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET CROP HISTORY BY FARMER ====================
module.exports.crop_history_by_farmer = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    if (!Farmerid) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    const history = await prisma.cropHistoryForm.findMany({
      where: { Farmerid },
      orderBy: { Year: 'desc' }
    });

    return res.json({
      status: "ok",
      count: history.length,
      history
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET CROP RECOMMENDATIONS ====================
module.exports.get_recommendations = async function (req, res) {
  try {
    const { Farmerid } = req.params;

    if (!Farmerid) {
      return res.json({
        status: "error",
        error: "Farmer ID is required"
      });
    }

    // Get farmer details
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid },
      include: {
        farms: true
      }
    });

    if (!farmer) {
      return res.json({
        status: "error",
        error: "Farmer not found"
      });
    }

    // Get similar farmers' crops for recommendations
    const similarFarmers = await prisma.cropHistoryForm.findMany({
      where: {
        District: farmer.District,
        Season: {
          in: ["Kharif", "Rabi", "Summer"]
        }
      },
      distinct: ['Crop'],
      select: {
        Crop: true,
        Season: true,
        Production: true
      },
      take: 10
    });

    return res.json({
      status: "ok",
      farmerInfo: {
        name: farmer.Name,
        district: farmer.District,
        farmSize: farmer.farms.length > 0 ? farmer.farms[0].Hectare : 0
      },
      recommendations: similarFarmers
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== GET CROP STATISTICS ====================
module.exports.get_crop_statistics = async function (req, res) {
  try {
    // Most planted crops
    const topCrops = await prisma.cropHistoryForm.groupBy({
      by: ['Crop'],
      _count: { id: true },
      _avg: { Production: true },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 10
    });

    // Crops by season
    const cropsBySeason = await prisma.cropHistoryForm.groupBy({
      by: ['Season'],
      _count: { id: true },
      _avg: { Production: true }
    });

    // Crops by district
    const cropsByDistrict = await prisma.cropHistoryForm.groupBy({
      by: ['District'],
      _count: { id: true },
      _sum: { Production: true }
    });

    return res.json({
      status: "ok",
      topCrops,
      cropsBySeason,
      cropsByDistrict
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== UPDATE CROP HISTORY ====================
module.exports.updateCropHistory = async function (req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!id) {
      return res.json({
        status: "error",
        error: "Record ID is required"
      });
    }

    // Remove protected fields
    delete updateData.id;
    delete updateData._id;
    delete updateData.Farmerid;
    delete updateData.Year;

    const updated = await prisma.cropHistoryForm.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.json({
      status: "ok",
      message: "Crop history updated successfully",
      data: updated
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};

// ==================== DELETE CROP HISTORY ====================
module.exports.deleteCropHistory = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.json({
        status: "error",
        error: "Record ID is required"
      });
    }

    await prisma.cropHistoryForm.delete({
      where: { id: parseInt(id) }
    });

    return res.json({
      status: "ok",
      message: "Crop history deleted successfully"
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: "error",
      error: "Something went wrong"
    });
  }
};
