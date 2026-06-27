const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalModel {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading fallback file: ${this.filePath}`, e);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing fallback file: ${this.filePath}`, e);
    }
  }

  async find(query = {}) {
    const list = this.read();
    return list.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined) {
          // Handle simple matching
          if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const list = this.read();
    const found = list.find(item => {
      for (let key in query) {
        if (query[key] !== undefined) {
          if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
    return found || null;
  }

  async findById(id) {
    const list = this.read();
    const found = list.find(item => item._id === id || item.id === id);
    return found || null;
  }

  async create(data) {
    const list = this.read();
    const newItem = {
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    list.push(newItem);
    this.write(list);
    return newItem;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const list = this.read();
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const updated = {
      ...list[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.write(list);
    return updated;
  }

  async findByIdAndDelete(id) {
    const list = this.read();
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const deleted = list[index];
    list.splice(index, 1);
    this.write(list);
    return deleted;
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }
}

function createDualModel(modelName, mongooseSchema, mongoose) {
  let mongoModel;
  try {
    mongoModel = mongoose.model(modelName, mongooseSchema);
  } catch (e) {
    mongoModel = mongoose.model(modelName);
  }
  
  const localModel = new LocalModel(modelName.toLowerCase() + 's');

  return new Proxy({}, {
    get(target, prop) {
      // Dynamic evaluation of global.dbFallback
      if (global.dbFallback) {
        if (typeof localModel[prop] === 'function') {
          return localModel[prop].bind(localModel);
        }
        return localModel[prop];
      } else {
        const value = mongoModel[prop];
        if (typeof value === 'function') {
          return value.bind(mongoModel);
        }
        return value;
      }
    }
  });
}

module.exports = {
  LocalModel,
  createDualModel
};
