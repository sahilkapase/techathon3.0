# Controller Update Guide: MongoDB to Prisma

## Quick Reference for Common Patterns

### 1. Creating a Record

#### MongoDB Way:
```javascript
const farmer = new FarmerInfo({
  Farmerid: farmerId,
  Name: name,
  Mobilenum: phone
});
await farmer.save();
```

#### Prisma Way:
```javascript
const farmer = await prisma.farmerInfo.create({
  data: {
    Farmerid: farmerId,
    Name: name,
    Mobilenum: phone
  }
});
```

---

### 2. Finding Records

#### MongoDB Way:
```javascript
const farmer = await FarmerInfo.findOne({ Farmerid: farmerId });
const farms = await Farm.find({ farmerId });
const all = await FarmerInfo.find();
```

#### Prisma Way:
```javascript
const farmer = await prisma.farmerInfo.findUnique({
  where: { Farmerid: farmerId }
});

const farms = await prisma.farm.findMany({
  where: { farmerId }
});

const all = await prisma.farmerInfo.findMany();
```

---

### 3. Finding with Relationships

#### MongoDB Way:
```javascript
const farmer = await FarmerInfo.findOne({ Farmerid: farmerId })
  .populate('farms')
  .populate('cropHistories');
```

#### Prisma Way:
```javascript
const farmer = await prisma.farmerInfo.findUnique({
  where: { Farmerid: farmerId },
  include: {
    farms: true,
    cropHistories: true
  }
});
```

---

### 4. Updating Records

#### MongoDB Way:
```javascript
const updated = await FarmerInfo.findOneAndUpdate(
  { Farmerid: farmerId },
  { Name: newName },
  { new: true }
);
```

#### Prisma Way:
```javascript
const updated = await prisma.farmerInfo.update({
  where: { Farmerid: farmerId },
  data: { Name: newName }
});
```

---

### 5. Updating with Relationships

#### MongoDB Way:
```javascript
const farmer = await FarmerInfo.findOne({ Farmerid })
  .populate('farms');
farmer.farms.push(newFarmId);
await farmer.save();
```

#### Prisma Way:
```javascript
const farmer = await prisma.farmerInfo.update({
  where: { Farmerid },
  data: {
    farms: {
      connect: { id: newFarmId }
    }
  },
  include: { farms: true }
});
```

---

### 6. Deleting Records

#### MongoDB Way:
```javascript
await FarmerInfo.findOneAndDelete({ Farmerid });
await Farm.deleteMany({ farmerId });
```

#### Prisma Way:
```javascript
await prisma.farmerInfo.delete({
  where: { Farmerid }
});

// Cascade deletes are automatic (defined in schema)
```

---

### 7. Counting Records

#### MongoDB Way:
```javascript
const count = await FarmerInfo.countDocuments({ State: "Maharashtra" });
```

#### Prisma Way:
```javascript
const count = await prisma.farmerInfo.count({
  where: { State: "Maharashtra" }
});
```

---

### 8. Complex Queries

#### MongoDB Way:
```javascript
const results = await FarmerInfo.find({
  $or: [
    { District: "Pune" },
    { Category: "Small" }
  ],
  State: "Maharashtra"
});
```

#### Prisma Way:
```javascript
const results = await prisma.farmerInfo.findMany({
  where: {
    AND: [
      {
        OR: [
          { District: "Pune" },
          { Category: "Small" }
        ]
      },
      { State: "Maharashtra" }
    ]
  }
});
```

---

### 9. Pagination

#### MongoDB Way:
```javascript
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;
const farmers = await FarmerInfo.find().skip(skip).limit(limit);
```

#### Prisma Way:
```javascript
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;
const farmers = await prisma.farmerInfo.findMany({
  skip,
  take: limit
});
```

---

### 10. Transactions

#### MongoDB Way:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await FarmerInfo.create([{ ... }], { session });
  await Farm.create([{ ... }], { session });
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
}
```

#### Prisma Way:
```javascript
try {
  await prisma.$transaction([
    prisma.farmerInfo.create({ data: { ... } }),
    prisma.farm.create({ data: { ... } })
  ]);
} catch (e) {
  console.error(e);
}
```

---

## Key Changes to Remember

1. **ID Field**: Change `_id` to `id`
2. **Field Names**: Case-sensitive in Prisma
3. **Data Types**: Int, String, BigInt, Float (no mixed types)
4. **Relationships**: Use `include` instead of `populate`
5. **Connections**: Use `where` for conditions
6. **Defaults**: Use `@default()` in schema instead of code

---

## Migration Checklist for Each Controller

- [ ] Replace all model imports with `prisma`
- [ ] Update all `.findOne()` to `findUnique()` with `where`
- [ ] Update all `.find()` to `findMany()` with `where`
- [ ] Update all `.create()` with `data` wrapper
- [ ] Update all `.findOneAndUpdate()` to `update()`
- [ ] Update all `.findOneAndDelete()` to `delete()`
- [ ] Update all `populate()` to `include`
- [ ] Update all `._id` references to `.id`
- [ ] Update numeric type validations
- [ ] Test endpoint with Postman/cURL

---

## Example Controller Update

### Before (MongoDB):
```javascript
exports.getFarmerProfile = async (req, res) => {
  try {
    const farmer = await FarmerInfo.findOne({
      Farmerid: req.body.Farmerid
    }).populate('farms');
    
    if (!farmer) return res.status(404).json({ status: "error", message: "Not found" });
    
    res.status(200).json({ status: "success", farmer });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
};
```

### After (Prisma):
```javascript
exports.getFarmerProfile = async (req, res) => {
  try {
    const farmer = await prisma.farmerInfo.findUnique({
      where: { Farmerid: req.body.Farmerid },
      include: { farms: true }
    });
    
    if (!farmer) return res.status(404).json({ status: "error", message: "Not found" });
    
    res.status(200).json({ status: "success", farmer });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
};
```

---

## Need Help?

Refer to Prisma Documentation: https://www.prisma.io/docs/reference/api-reference
