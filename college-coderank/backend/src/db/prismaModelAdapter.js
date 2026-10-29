import { prisma } from "./prisma.js";

/**
 * Maps model relation fields for .populate() resolution
 */
const POPULATE_MAP = {
  directorId: "admin",
  tpoId: "admin",
  hodId: "admin",
  directorateId: "directorate",
  departmentId: "department",
  classTeacherId: "admin",
  primaryClassroomId: "classroom",
  teacherId: "admin",
  sectionId: "section",
  subjectId: "subject",
  classroomId: "classroom",
  invitedBy: "admin",
  userId: "admin",
  createdUserId: "admin"
};

/**
 * Convert MongoDB / Mongoose-style filter object into a Prisma where clause.
 */
export function convertFilter(filter = {}) {
  if (!filter || typeof filter !== "object") return {};
  const where = {};

  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined) continue;

    // Handle $or
    if (key === "$or" && Array.isArray(val)) {
      where.OR = val.map(convertFilter);
      continue;
    }

    // Handle $and
    if (key === "$and" && Array.isArray(val)) {
      where.AND = val.map(convertFilter);
      continue;
    }

    // Handle _id -> id
    const targetKey = key === "_id" ? "id" : key;

    // Handle RegExp
    if (val instanceof RegExp) {
      where[targetKey] = {
        contains: val.source,
        mode: val.flags.includes("i") ? "insensitive" : "default"
      };
      continue;
    }

    // Handle operators object like { $ne: ..., $gte: ..., $in: ... }
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      const condition = {};
      let isOperator = false;

      if ("$exists" in val) {
        isOperator = true;
        if (val.$exists === false) {
          condition.equals = null;
        } else {
          condition.not = null;
        }
      }
      if ("$ne" in val) {
        isOperator = true;
        condition.not = val.$ne;
      }
      if ("$in" in val && Array.isArray(val.$in)) {
        isOperator = true;
        const nonNulls = val.$in.filter(x => x !== null);
        if (nonNulls.length === val.$in.length) {
          condition.in = nonNulls;
        } else if (nonNulls.length > 0) {
          condition.in = nonNulls;
        } else {
          condition.equals = null;
        }
      }
      if ("$nin" in val && Array.isArray(val.$nin)) {
        isOperator = true;
        const nonNulls = val.$nin.filter(x => x !== null);
        if (nonNulls.length === 1) {
          condition.not = nonNulls[0];
        } else if (nonNulls.length > 1) {
          condition.notIn = nonNulls;
        } else {
          condition.not = null;
        }
      }
      if ("$gte" in val) {
        isOperator = true;
        condition.gte = val.$gte;
      }
      if ("$lte" in val) {
        isOperator = true;
        condition.lte = val.$lte;
      }
      if ("$gt" in val) {
        isOperator = true;
        condition.gt = val.$gt;
      }
      if ("$lt" in val) {
        isOperator = true;
        condition.lt = val.$lt;
      }
      if ("$regex" in val) {
        isOperator = true;
        const flags = val.$options || "";
        condition.contains = val.$regex instanceof RegExp ? val.$regex.source : String(val.$regex);
        condition.mode = flags.includes("i") ? "insensitive" : "default";
      }

      if (isOperator) {
        where[targetKey] = condition;
        continue;
      }
    }

    // Case-insensitive match for emails
    if (targetKey === "email" && typeof val === "string") {
      where.email = { equals: val.trim().toLowerCase(), mode: "insensitive" };
      continue;
    }

    // Direct scalar equality
    where[targetKey] = val;
  }

  return where;
}

/**
 * Convert Mongoose sort object or string into Prisma orderBy.
 */
function convertSort(sortCriteria) {
  if (!sortCriteria) return undefined;

  if (typeof sortCriteria === "string") {
    const fields = sortCriteria.trim().split(/\s+/);
    const orderBy = [];
    for (const f of fields) {
      if (!f) continue;
      if (f.startsWith("-")) {
        const fieldName = f.substring(1) === "_id" ? "id" : f.substring(1);
        orderBy.push({ [fieldName]: "desc" });
      } else {
        const fieldName = f.startsWith("+") ? f.substring(1) : f;
        const resolvedName = fieldName === "_id" ? "id" : fieldName;
        orderBy.push({ [resolvedName]: "asc" });
      }
    }
    return orderBy.length === 1 ? orderBy[0] : orderBy;
  }

  if (typeof sortCriteria === "object") {
    const orderBy = [];
    for (const [k, v] of Object.entries(sortCriteria)) {
      const fieldName = k === "_id" ? "id" : k;
      const dir = v === -1 || v === "desc" || v === "descending" ? "desc" : "asc";
      orderBy.push({ [fieldName]: dir });
    }
    return orderBy.length === 1 ? orderBy[0] : orderBy;
  }

  return undefined;
}

/**
 * Filter object properties based on Mongoose select string
 */
function applySelect(doc, selectStr) {
  if (!doc || !selectStr || typeof selectStr !== "string") return doc;

  const tokens = selectStr.trim().split(/\s+/).filter(Boolean);
  const includeTokens = tokens.filter(t => !t.startsWith("-") && !t.startsWith("+"));
  const excludeTokens = tokens.filter(t => t.startsWith("-")).map(t => t.substring(1));
  const forceIncludeTokens = tokens.filter(t => t.startsWith("+")).map(t => t.substring(1));

  // If specific positive fields are requested (e.g. "name email score")
  if (includeTokens.length > 0) {
    const projected = { id: doc.id, _id: doc._id || doc.id };
    for (const token of includeTokens) {
      const key = token === "_id" ? "id" : token;
      if (doc[key] !== undefined) {
        projected[key] = doc[key];
      }
    }
    for (const token of forceIncludeTokens) {
      if (doc[token] !== undefined) {
        projected[token] = doc[token];
      }
    }
    return projected;
  }

  // If excluding fields (e.g. "-password")
  if (excludeTokens.length > 0) {
    for (const token of excludeTokens) {
      delete doc[token];
    }
  }

  return doc;
}

/**
 * Prisma Document Wrapper Class.
 * Emulates Mongoose Document behavior including ._id, .save(), .toObject(), .toJSON().
 */
export class PrismaDocument {
  constructor(data, modelName) {
    Object.assign(this, data);
    this._modelName = modelName;
    if (this.id) {
      this._id = this.id;
    }
  }

  toObject() {
    const copy = { ...this };
    delete copy._modelName;
    if (copy.id && !copy._id) copy._id = copy.id;
    return copy;
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    const id = this.id || this._id;
    if (!id) {
      throw new Error(`Cannot save ${this._modelName} document without an id.`);
    }

    const payload = { ...this };
    delete payload._modelName;
    delete payload._id;
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    // Filter out undefined and function fields
    const cleanData = {};
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v !== "function" && v !== undefined) {
        cleanData[k] = v;
      }
    }

    const updated = await prisma[this._modelName].update({
      where: { id },
      data: cleanData
    });

    Object.assign(this, updated);
    this._id = this.id;
    return this;
  }
}

/**
 * Chainable Query class mimicking Mongoose Query interface.
 */
export class PrismaQuery {
  constructor(modelName, type, initialFilter = {}) {
    this.modelName = modelName;
    this.type = type; // "find", "findOne", "findById"
    this.filter = initialFilter;
    this._selectStr = null;
    this._sortCriteria = null;
    this._limitCount = null;
    this._skipCount = null;
    this._populates = [];
    this._isLean = false;
  }

  select(fields) {
    this._selectStr = fields;
    return this;
  }

  sort(sortCriteria) {
    this._sortCriteria = sortCriteria;
    return this;
  }

  limit(count) {
    if (count !== undefined && count !== null) {
      this._limitCount = Number(count);
    }
    return this;
  }

  skip(count) {
    if (count !== undefined && count !== null) {
      this._skipCount = Number(count);
    }
    return this;
  }

  populate(path, select) {
    if (path) {
      this._populates.push({ path, select });
    }
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  async exec() {
    const where = convertFilter(this.filter);
    const orderBy = convertSort(this._sortCriteria);

    const prismaArgs = { where };
    if (orderBy) prismaArgs.orderBy = orderBy;
    if (this._limitCount !== null && this._limitCount !== undefined) prismaArgs.take = this._limitCount;
    if (this._skipCount !== null && this._skipCount !== undefined) prismaArgs.skip = this._skipCount;

    let result;
    if (this.type === "find") {
      result = await prisma[this.modelName].findMany(prismaArgs);
    } else {
      result = await prisma[this.modelName].findFirst(prismaArgs);
    }

    if (!result) {
      return this.type === "find" ? [] : null;
    }

    // Helper to process a single record
    const processRecord = async (record) => {
      let doc = { ...record, _id: record.id };

      // Apply populates
      for (const pop of this._populates) {
        const targetModel = POPULATE_MAP[pop.path];
        const refId = doc[pop.path];
        if (targetModel && refId && typeof refId === "string") {
          try {
            const populated = await prisma[targetModel].findUnique({
              where: { id: refId }
            });
            if (populated) {
              const formatted = { ...populated, _id: populated.id };
              doc[pop.path] = pop.select ? applySelect(formatted, pop.select) : formatted;
            }
          } catch {
            // Ignore populate lookup error
          }
        }
      }

      // Apply select projections
      if (this._selectStr) {
        doc = applySelect(doc, this._selectStr);
      }

      return this._isLean ? doc : new PrismaDocument(doc, this.modelName);
    };

    if (Array.isArray(result)) {
      return await Promise.all(result.map(processRecord));
    }
    return await processRecord(result);
  }

  // Thenable implementation for `await query`
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

/**
 * Creates a Mongoose-compatible Model Adapter for a Prisma model.
 */
export function createModelAdapter(modelName) {
  return {
    get modelName() {
      return modelName;
    },

    find(filter = {}) {
      return new PrismaQuery(modelName, "find", filter);
    },

    findOne(filter = {}) {
      return new PrismaQuery(modelName, "findOne", filter);
    },

    findById(id) {
      return new PrismaQuery(modelName, "findById", { id: String(id) });
    },

    async countDocuments(filter = {}) {
      const where = convertFilter(filter);
      return await prisma[modelName].count({ where });
    },

    async count(filter = {}) {
      return await this.countDocuments(filter);
    },

    async create(data) {
      const payload = Array.isArray(data) ? data : [data];
      const createdDocs = [];

      for (const item of payload) {
        const recordData = { ...item };
        delete recordData._id;
        delete recordData.id;

        // Ensure string section for Student if not provided
        if (modelName === "student" && !recordData.section) {
          recordData.section = "A";
        }

        const created = await prisma[modelName].create({
          data: recordData
        });
        createdDocs.push(new PrismaDocument({ ...created, _id: created.id }, modelName));
      }

      return Array.isArray(data) ? createdDocs : createdDocs[0];
    },

    async findByIdAndUpdate(id, update, options = {}) {
      if (!id) return null;
      let data = { ...update };
      if (data.$set) {
        data = { ...data.$set };
      }
      delete data._id;
      delete data.id;

      try {
        const updated = await prisma[modelName].update({
          where: { id: String(id) },
          data
        });
        return new PrismaDocument({ ...updated, _id: updated.id }, modelName);
      } catch (err) {
        if (err.code === "P2025") return null; // Record not found
        throw err;
      }
    },

    async findByIdAndDelete(id) {
      if (!id) return null;
      try {
        const deleted = await prisma[modelName].delete({
          where: { id: String(id) }
        });
        return new PrismaDocument({ ...deleted, _id: deleted.id }, modelName);
      } catch (err) {
        if (err.code === "P2025") return null;
        throw err;
      }
    },

    async findOneAndDelete(filter) {
      const found = await this.findOne(filter);
      if (!found) return null;
      return await this.findByIdAndDelete(found.id || found._id);
    },

    async updateOne(filter = {}, update = {}, options = {}) {
      const where = convertFilter(filter);
      let data = { ...update };
      let setOnInsert = {};
      let addToSet = {};

      if (data.$set) {
        data = { ...data, ...data.$set };
        delete data.$set;
      }
      if (data.$setOnInsert) {
        setOnInsert = data.$setOnInsert;
        delete data.$setOnInsert;
      }
      if (data.$addToSet) {
        addToSet = data.$addToSet;
        delete data.$addToSet;
      }

      delete data._id;
      delete data.id;

      // Handle department sections update with $addToSet
      if (modelName === "department" && addToSet.sections) {
        const existingDept = await prisma.department.findFirst({ where });
        if (existingDept) {
          const currentSections = existingDept.sections || [];
          const sectionToAdd = String(addToSet.sections).trim();
          if (!currentSections.includes(sectionToAdd)) {
            await prisma.department.update({
              where: { id: existingDept.id },
              data: { sections: [...currentSections, sectionToAdd] }
            });
          }
          return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
        } else if (options.upsert) {
          const deptName = filter.name || setOnInsert.name || "Default Department";
          const deptCode = deptName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
          await prisma.department.create({
            data: {
              name: deptName,
              code: deptCode,
              sections: [String(addToSet.sections).trim()]
            }
          });
          return { upsertedCount: 1, matchedCount: 0, acknowledged: true };
        }
      }

      const existing = await prisma[modelName].findFirst({ where });
      if (existing) {
        await prisma[modelName].update({
          where: { id: existing.id },
          data
        });
        return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
      }

      if (options.upsert) {
        const createData = { ...setOnInsert, ...data };
        await prisma[modelName].create({ data: createData });
        return { upsertedCount: 1, matchedCount: 0, acknowledged: true };
      }

      return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    },

    async updateMany(filter = {}, update = {}) {
      const where = convertFilter(filter);
      let data = { ...update };
      if (data.$set) {
        data = { ...data.$set };
      }
      delete data._id;
      delete data.id;

      const result = await prisma[modelName].updateMany({ where, data });
      return { modifiedCount: result.count, acknowledged: true };
    },

    async deleteMany(filter = {}) {
      const where = convertFilter(filter);
      const result = await prisma[modelName].deleteMany({ where });
      return { deletedCount: result.count, acknowledged: true };
    },

    async distinct(field, filter = {}) {
      const where = convertFilter(filter);
      const results = await prisma[modelName].findMany({
        where,
        select: { [field]: true },
        distinct: [field]
      });
      return results.map(r => r[field]).filter(Boolean);
    },

    async aggregate(pipeline = []) {
      // Handles leaderboard aggregate:
      // [{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: "$score" } } }]
      if (modelName === "student") {
        let where = {};
        for (const stage of pipeline) {
          if (stage.$match) {
            where = convertFilter(stage.$match);
          }
        }
        const agg = await prisma.student.aggregate({
          where,
          _sum: { score: true }
        });
        return [{ _id: null, total: agg._sum?.score || 0 }];
      }
      return [];
    }
  };
}
