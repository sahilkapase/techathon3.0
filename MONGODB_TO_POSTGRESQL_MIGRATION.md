# MongoDB to PostgreSQL (Neon) Migration Guide

## Overview
This document outlines the complete migration from MongoDB to PostgreSQL using Prisma ORM.

## What's Been Done ✅

### 1. **Prisma Installation**
- ✅ Installed `@prisma/client` and `prisma`
- ✅ Created `prisma/schema.prisma` with all models

### 2. **Database Setup**
- ✅ Created Neon PostgreSQL database connection
- ✅ Added `DATABASE_URL` to `.env`
- ✅ Ran `prisma db push` - all tables created in PostgreSQL

### 3. **Configuration**
- ✅ Created `config/prisma.js` for Prisma client initialization
- ✅ Created `prismaModels.js` for unified model exports
- ✅ Created `utils/prismaAdapter.js` for MongoDB-like compatibility

## Database Schema (PostgreSQL)

### Models Created:
1. **FarmerInfo** - Farmer profiles
2. **Farm** - Farm details
3. **CropHistoryForm** - Crop records
4. **Irigation** - Irrigation sources
5. **AdminDetails** - Admin users
6. **ExpertsRegistration** - Expert profiles
7. **ExpertMessage** - Expert-Farmer messages
8. **SchemeDetails** - Government schemes
9. **InsuranceCompany** - Insurance providers
10. **InsuranceCompanyLogin** - Insurance logins
11. **TraderDetails** - Trader profiles
12. **Bill** - APMC bills
13. **APMCLogin** - APMC logins
14. **District** - District information
15. **DistrictwiseSoil** - Soil data
16. **CultivatedArea** - Land area
17. **AdhaarDetails** - Aadhaar verification
18. **Message** - Messages
19. **Notification** - Notifications
20. **TrainingProgram** - Training programs
21. **GSTDetails** - GST information
22. **APY** - Pension scheme
23. **User** - Generic user

## Migration Steps Remaining

### Step 1: Update index.js (Remove MongoDB)
```javascript
// OLD:
// const db = require('./config/mongoose');

// NEW:
const { connectDB, prisma } = require('./config/prisma');
connectDB();

// Make prisma available globally
global.prisma = prisma;
```

### Step 2: Update All Controllers
Replace MongoDB calls with Prisma:

**Before (MongoDB):**
```javascript
const farmer = await FarmerInfo.findOne({ Farmerid: farmerId });
const farms = await Farm.find({ farmerId });
const updated = await FarmerInfo.findByIdAndUpdate(id, data);
```

**After (Prisma):**
```javascript
const farmer = await prisma.farmerInfo.findUnique({
  where: { Farmerid: farmerId }
});
const farms = await prisma.farm.findMany({
  where: { farmerId }
});
const updated = await prisma.farmerInfo.update({
  where: { id },
  data
});
```

### Step 3: Update Model Imports
Replace all model imports:

**Before:**
```javascript
const FarmerInfo = require('../models/farmer_info');
const Farm = require('../models/farm');
```

**After:**
```javascript
const { prisma } = require('../config/prisma');
// Or use:
const { FarmerInfo, Farm } = require('../prismaModels');
```

### Step 4: Data Migration (if needed)
```bash
# Export from MongoDB
mongodump --uri "mongodb+srv://..." --out ./mongo_backup

# Write migration script to import to PostgreSQL
# Script will read MongoDB documents and insert into Prisma
```

### Step 5: Test All Endpoints
```bash
npm test
# Or manually test each route
```

## Important Differences: MongoDB vs PostgreSQL

### ID Generation
- **MongoDB**: `_id` (ObjectId, auto-generated)
- **PostgreSQL**: `id` (INT, auto-increment) - Update queries to use `id` instead of `_id`

### Data Types
- **MongoDB**: Flexible schema
- **PostgreSQL**: Strict types - Numbers must be Int/Float/BigInt

### Query Syntax
- **MongoDB**: `{ field: "value" }`
- **Prisma**: `{ where: { field: "value" } }`

### Relationships
- **MongoDB**: Manual references
- **Prisma**: Automatic joins with `include` and `select`

## Prisma Query Examples

### Create
```javascript
await prisma.farmerInfo.create({
  data: {
    Farmerid: "F123",
    Name: "John Doe",
    Mobilenum: 9876543210,
    Email: "john@example.com"
  }
});
```

### Read
```javascript
// Find one
const farmer = await prisma.farmerInfo.findUnique({
  where: { Farmerid: "F123" }
});

// Find many
const farmers = await prisma.farmerInfo.findMany({
  where: { State: "Maharashtra" }
});

// With relations
const farmer = await prisma.farmerInfo.findUnique({
  where: { Farmerid: "F123" },
  include: { farms: true, cropHistories: true }
});
```

### Update
```javascript
await prisma.farmerInfo.update({
  where: { id: 1 },
  data: { Name: "Jane Doe" }
});

// Update many
await prisma.farmerInfo.updateMany({
  where: { State: "Maharashtra" },
  data: { PreferredLanguage: "Marathi" }
});
```

### Delete
```javascript
await prisma.farmerInfo.delete({
  where: { id: 1 }
});

// Delete many (CASCADE handled)
await prisma.farmerInfo.deleteMany({
  where: { Fake: true }
});
```

## Migration Checklist

- [ ] Update `server/index.js` to use Prisma
- [ ] Update all controllers (24 files)
- [ ] Update all routes
- [ ] Update socket.io event handlers
- [ ] Test login functionality
- [ ] Test CRUD operations
- [ ] Test relationships and joins
- [ ] Test file uploads/downloads
- [ ] Remove MongoDB models from `server/models/`
- [ ] Update package.json (remove mongoose, keep Prisma)
- [ ] Test production build
- [ ] Deploy to production

## Prisma Studio (Visual Database Manager)
```bash
npx prisma studio
```
Opens http://localhost:5555 for visual database management

## Common Issues & Solutions

### Issue: "relation "farmerinfo" does not exist"
- **Cause**: Table name mismatch
- **Solution**: Check `schema.prisma` table names match PostgreSQL

### Issue: "Missing required field"
- **Cause**: Field marked as required but not provided
- **Solution**: Add `@default()` or make field optional with `?`

### Issue: Unique constraint violation
- **Cause**: Duplicate value in unique field
- **Solution**: Check for existing records before create/update

## Support & Resources
- Prisma Docs: https://www.prisma.io/docs/
- Neon Docs: https://neon.tech/docs
- Migration Guide: https://www.prisma.io/docs/guides/migrate-to-prisma

## Next Steps

1. **Immediate**: Update `index.js` and test connection
2. **Priority 1**: Update farmer controller (most critical)
3. **Priority 2**: Update admin and expert controllers
4. **Priority 3**: Update remaining controllers
5. **Final**: Run full test suite and deploy

---

**Status**: PostgreSQL database ready ✅  
**Next Action**: Update server/index.js to use Prisma
