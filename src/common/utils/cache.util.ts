import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
});

export class CacheUtil {
  static get(key: string) {
    try {
      return cache.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static set(key: string, value: unknown, ttl = 300) {
    try {
      return cache.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static del(key: string) {
    try {
      return cache.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return 0;
    }
  }

  static delPattern(pattern: string) {
    try {
      const keys = cache
        .keys()
        .filter((key) =>
          key.includes(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        );
      return cache.del(keys);
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  static flush() {
    try {
      cache.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  static getCampaignRelationsKey(equityId: string, relation: string) {
    return `campaign:${equityId}:${relation}`;
  }

  static getCampaignListKey(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    return `campaign:list:user:${userId}:page:${page}:limit:${limit}`;
  }

  static getPublicCampaignsKey(page: number = 1, limit: number = 10) {
    return `campaign:public:page:${page}:limit:${limit}`;
  }

  static getCampaignKey(campaignId: string) {
    return `campaign:${campaignId}`;
  }

  static getStats() {
    return cache.getStats();
  }
}
