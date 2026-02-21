require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const schemes = [
  {
    SchemeId: "SCH001",
    SchemeName: "PM-KISAN Samman Nidhi",
    Description: "Financial assistance of Rs 6000 per year to small and marginal farmer families having combined land holding up to 2 hectares.",
    Status: "Active",
    BenefitAmount: "Rs 6,000 per year (Rs 2,000 every 4 months)",
    ApplicationDeadline: new Date("2026-12-31"),
    LaunchDate: new Date("2019-02-01"),
    ApprovalProcess: "Apply through local agriculture office or online portal. Verification by state/district officials.",
    EligibilityCriteria: "Small and marginal farmers with combined land holding up to 2 hectares.",
    Category: "Central Government,Direct Benefit",
    Farmertype: "Small,Marginal",
    Region: ["Maharashtra", "All India"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Land Records", "Bank Account Details"],
    SectorFocus: "Agriculture"
  },
  {
    SchemeId: "SCH002",
    SchemeName: "Pradhan Mantri Fasal Bima Yojana",
    Description: "Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests & diseases.",
    Status: "Active",
    BenefitAmount: "Premium subsidy up to 98% for Kharif and 97% for Rabi crops",
    ApplicationDeadline: new Date("2026-09-30"),
    LaunchDate: new Date("2016-04-01"),
    ApprovalProcess: "Apply through bank, CSC or online portal before sowing season deadline.",
    EligibilityCriteria: "All farmers growing notified crops in notified areas.",
    Category: "Central Government,Insurance",
    Farmertype: "Small,Marginal,Medium,Large",
    Region: ["Maharashtra", "All India"],
    CropTypes: ["Kharif", "Rabi"],
    Season: ["Kharif", "Rabi"],
    DocumentsRequired: ["Aadhaar Card", "Land Records", "Sowing Certificate", "Bank Account"],
    SectorFocus: "Crop Insurance"
  },
  {
    SchemeId: "SCH003",
    SchemeName: "Soil Health Card Scheme",
    Description: "Provides soil health cards to farmers carrying crop-wise recommendations on nutrients and fertilizers required for individual farms.",
    Status: "Active",
    BenefitAmount: "Free soil testing and recommendations",
    ApplicationDeadline: new Date("2026-12-31"),
    LaunchDate: new Date("2015-02-19"),
    ApprovalProcess: "Contact local agriculture department. Soil samples collected and tested at government labs.",
    EligibilityCriteria: "All farmers with agricultural land.",
    Category: "Central Government,Advisory",
    Farmertype: "Small,Marginal,Medium,Large",
    Region: ["Maharashtra", "All India"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Land Records"],
    SectorFocus: "Soil Health"
  },
  {
    SchemeId: "SCH004",
    SchemeName: "Maharashtra Shetkari Sanman Yojana",
    Description: "State government scheme providing additional financial support of Rs 6000 per year to farmers in Maharashtra on top of PM-KISAN.",
    Status: "Active",
    BenefitAmount: "Rs 6,000 per year",
    ApplicationDeadline: new Date("2026-12-31"),
    LaunchDate: new Date("2019-06-01"),
    ApprovalProcess: "Apply through Taluka agriculture office with required documents.",
    EligibilityCriteria: "Farmers residing in Maharashtra with valid land records.",
    Category: "State Government,Direct Benefit",
    Farmertype: "Small,Marginal,Medium",
    Region: ["Maharashtra"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "7/12 Extract", "Bank Account Details"],
    SectorFocus: "Agriculture"
  },
  {
    SchemeId: "SCH005",
    SchemeName: "Krishi Sinchan Yojana",
    Description: "Subsidy for micro-irrigation (drip and sprinkler) systems to improve water use efficiency in agriculture.",
    Status: "Active",
    BenefitAmount: "Subsidy 55% to 80% depending on farmer category",
    ApplicationDeadline: new Date("2026-10-31"),
    LaunchDate: new Date("2015-07-01"),
    ApprovalProcess: "Apply through agriculture department. Equipment inspection and verification required.",
    EligibilityCriteria: "Farmers with minimum 0.5 hectare irrigated land.",
    Category: "Central Government,Subsidy",
    Farmertype: "Small,Marginal,Medium,Large",
    Region: ["Maharashtra", "All India"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Land Records", "Water Source Proof", "Bank Account"],
    SectorFocus: "Irrigation"
  },
  {
    SchemeId: "SCH006",
    SchemeName: "National Mission on Sustainable Agriculture",
    Description: "Promotes sustainable agriculture through climate change adaptation, soil health management, and water use efficiency.",
    Status: "Active",
    BenefitAmount: "Varies by component - up to Rs 50,000 for organic farming",
    ApplicationDeadline: new Date("2026-12-31"),
    LaunchDate: new Date("2014-04-01"),
    ApprovalProcess: "Apply through district agriculture office or online portal.",
    EligibilityCriteria: "All farmers practicing or willing to adopt sustainable farming.",
    Category: "Central Government,Subsidy",
    Farmertype: "Small,Marginal,Medium,Large",
    Region: ["All India"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Land Records", "Farm Plan"],
    SectorFocus: "Sustainable Agriculture"
  },
  {
    SchemeId: "SCH007",
    SchemeName: "Kisan Credit Card Scheme",
    Description: "Provides affordable credit to farmers for crop production, post-harvest expenses, and farm maintenance at subsidized interest rates.",
    Status: "Active",
    BenefitAmount: "Credit limit up to Rs 3 lakh at 4% interest rate",
    ApplicationDeadline: new Date("2026-12-31"),
    LaunchDate: new Date("1998-08-01"),
    ApprovalProcess: "Apply at any nationalized bank with required documents. Processing within 15 days.",
    EligibilityCriteria: "All farmers, tenant farmers, and sharecroppers.",
    Category: "Central Government,Loan",
    Farmertype: "Small,Marginal,Medium,Large",
    Region: ["All India"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Land Records", "Passport Photo", "Identity Proof"],
    SectorFocus: "Credit"
  },
  {
    SchemeId: "SCH008",
    SchemeName: "Mahatma Jyotirao Phule Shetkari Karj Mukti Yojana",
    Description: "Farm loan waiver scheme for Maharashtra farmers with outstanding crop loans up to Rs 2 lakh.",
    Status: "Active",
    BenefitAmount: "Loan waiver up to Rs 2,00,000",
    ApplicationDeadline: new Date("2026-06-30"),
    LaunchDate: new Date("2019-07-01"),
    ApprovalProcess: "Automatic identification through bank records. Farmers can check status online.",
    EligibilityCriteria: "Maharashtra farmers with crop loans up to Rs 2 lakh taken before March 2019.",
    Category: "State Government,Loan Waiver",
    Farmertype: "Small,Marginal",
    Region: ["Maharashtra"],
    CropTypes: [],
    Season: [],
    DocumentsRequired: ["Aadhaar Card", "Bank Loan Details", "Land Records"],
    SectorFocus: "Debt Relief"
  }
];

async function seedSchemes() {
  console.log("Seeding SchemeDetails...");
  
  for (const scheme of schemes) {
    try {
      await prisma.schemeDetails.upsert({
        where: { SchemeId: scheme.SchemeId },
        update: scheme,
        create: scheme
      });
      console.log(`  ✅ ${scheme.SchemeId}: ${scheme.SchemeName}`);
    } catch (err) {
      console.log(`  ❌ ${scheme.SchemeId}: ${err.message}`);
    }
  }
  
  const count = await prisma.schemeDetails.count();
  console.log(`\nTotal schemes in DB: ${count}`);
  
  await prisma.$disconnect();
}

seedSchemes();
