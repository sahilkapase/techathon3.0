/**
 * Prisma MongoDB Adapter
 * Provides MongoDB-like query methods for Prisma
 * Allows gradual migration from MongoDB to PostgreSQL
 */

const { prisma } = require('../config/prisma');

class PrismaAdapter {
  constructor(model) {
    this.model = model;
  }

  // MongoDB-style: Model.findOne()
  async findOne(query) {
    const where = this._buildWhere(query);
    return await this.model.findFirst({ where });
  }

  // MongoDB-style: Model.find()
  async find(query = {}) {
    const where = this._buildWhere(query);
    return await this.model.findMany({ where });
  }

  // MongoDB-style: Model.findById()
  async findById(id) {
    return await this.model.findUnique({ where: { id: parseInt(id) } });
  }

  // MongoDB-style: Model.create()
  async create(data) {
    return await this.model.create({ data });
  }

  // MongoDB-style: Model.findByIdAndUpdate()
  async findByIdAndUpdate(id, update) {
    return await this.model.update({
      where: { id: parseInt(id) },
      data: update,
    });
  }

  // MongoDB-style: Model.findByIdAndDelete()
  async findByIdAndDelete(id) {
    return await this.model.delete({
      where: { id: parseInt(id) },
    });
  }

  // MongoDB-style: Model.updateMany()
  async updateMany(query, update) {
    const where = this._buildWhere(query);
    return await this.model.updateMany({ where, data: update });
  }

  // MongoDB-style: Model.deleteMany()
  async deleteMany(query) {
    const where = this._buildWhere(query);
    return await this.model.deleteMany({ where });
  }

  // MongoDB-style: Model.countDocuments()
  async countDocuments(query = {}) {
    const where = this._buildWhere(query);
    return await this.model.count({ where });
  }

  // Helper: Convert MongoDB operators to Prisma
  _buildWhere(query) {
    const where = {};
    
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue;
      
      // Handle $regex operator
      if (typeof value === 'object' && value.$regex) {
        where[key] = {
          contains: value.$regex,
          mode: 'insensitive',
        };
      }
      // Handle $gt, $lt, etc.
      else if (typeof value === 'object') {
        if (value.$gt) where[key] = { gt: value.$gt };
        else if (value.$lt) where[key] = { lt: value.$lt };
        else if (value.$gte) where[key] = { gte: value.$gte };
        else if (value.$lte) where[key] = { lte: value.$lte };
        else if (value.$in) where[key] = { in: value.$in };
        else if (value.$nin) where[key] = { notIn: value.$nin };
        else where[key] = value;
      } else {
        where[key] = value;
      }
    }
    
    return where;
  }
}

module.exports = PrismaAdapter;
