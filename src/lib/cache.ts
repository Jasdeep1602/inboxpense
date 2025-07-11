import { CacheData } from '@/types';

export class CacheManager {
  private cacheKey: string;
  private ttl: number;

  constructor(cacheKey: string, ttl: number) {
    this.cacheKey = cacheKey;
    this.ttl = ttl;
  }

  // Get cached data with proper null checks
  get(): CacheData | null {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? (JSON.parse(cached) as CacheData) : null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  // Set cache data with type validation
  set(data: Partial<CacheData>): void {
    if (typeof window === 'undefined') return;
    try {
      const currentCache = this.get() || {
        files: [],
        transactions: [],
        lastUpdated: 0,
      };
      const newCache: CacheData = {
        files: data.files || currentCache.files,
        transactions: data.transactions || currentCache.transactions,
        lastUpdated: data.lastUpdated ?? Date.now(),
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(newCache));
      console.log('Cache updated:', {
        filesCount: newCache.files.length,
        transactionsCount: newCache.transactions.length,
        lastUpdated: new Date(newCache.lastUpdated).toISOString(),
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Clear cache
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Check if cache is valid
  isValid(): boolean {
    const cache = this.get();
    return !!(cache?.lastUpdated && Date.now() - cache.lastUpdated < this.ttl);
  }

  // Check if cache has data
  hasData(): boolean {
    const cache = this.get();
    return !!(cache?.transactions && cache.transactions.length > 0);
  }

  // Get cache status for debugging
  getStatus() {
    const cache = this.get();
    return {
      hasTransactions: !!cache?.transactions,
      transactionCount: cache?.transactions?.length || 0,
      lastUpdated: cache?.lastUpdated
        ? new Date(cache.lastUpdated).toISOString()
        : 'never',
      cacheAge: cache?.lastUpdated ? Date.now() - cache.lastUpdated : 'n/a',
      cacheTTL: this.ttl,
      isValid: this.isValid(),
      hasData: this.hasData(),
    };
  }
}
