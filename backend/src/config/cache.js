const store = new Map();

const cache = {
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlSeconds = 3600) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key) {
    store.delete(key);
  },

  async flush() {
    store.clear();
  },
};

module.exports = cache;
