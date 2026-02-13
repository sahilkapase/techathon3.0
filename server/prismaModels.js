/**
 * Prisma Model Wrapper - Replace MongoDB Models
 * This file provides a unified interface for all Prisma models
 * Usage: Replace require('./models/farmer_info') with require('./prismaModels')
 */

const { prisma } = require('../config/prisma');

// Export all Prisma models
module.exports = {
  // Farmer Information
  FarmerInfo: prisma.farmerInfo,
  
  // Farm Management
  Farm: prisma.farm,
  CropHistoryForm: prisma.cropHistoryForm,
  Irigation: prisma.irigation,
  
  // Admin & Experts
  AdminDetails: prisma.adminDetails,
  ExpertsRegistration: prisma.expertsRegistration,
  ExpertMessage: prisma.expertMessage,
  
  // Schemes & Insurance
  SchemeDetails: prisma.schemeDetails,
  InsuranceCompany: prisma.insuranceCompany,
  InsuranceCompanyLogin: prisma.insuranceCompanyLogin,
  
  // Trader & APMC
  TraderDetails: prisma.traderDetails,
  Bill: prisma.bill,
  APMCLogin: prisma.aPMCLogin,
  
  // Location & Infrastructure
  District: prisma.district,
  DistrictwiseSoil: prisma.districtwiseSoil,
  CultivatedArea: prisma.cultivatedArea,
  
  // User Data
  AdhaarDetails: prisma.adhaarDetails,
  Message: prisma.message,
  Notification: prisma.notification,
  TrainingProgram: prisma.trainingProgram,
  GSTDetails: prisma.gSTDetails,
  APY: prisma.aPY,
  User: prisma.user,
  
  // Prisma client for advanced queries
  prisma,
};
