import NodeCache from 'node-cache';

const DEFAULT_PREFIX = 'annotation:';
const DEFAULT_TTL = 3600;

class StorageUtil {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 120,
      useClones: false,
    });
  }

  set<T>(key: string, value: T, ttl = DEFAULT_TTL): boolean {
    return this.cache.set(this.prefixKey(key), value, ttl);
  }

  get<T>(key: string, defaultValue: T | null = null): T | null {
    const val = this.cache.get<T>(this.prefixKey(key));
    return val !== undefined ? val : defaultValue;
  }

  del(key: string): number {
    return this.cache.del(this.prefixKey(key));
  }

  has(key: string): boolean {
    return this.cache.has(this.prefixKey(key));
  }

  getOrSet<T>(key: string, fn: () => Promise<T> | T, ttl = DEFAULT_TTL): Promise<T> | T {
    const fullKey = this.prefixKey(key);
    const val = this.cache.get<T>(fullKey);
    if (val !== undefined) return val;
    const result = fn();
    if (result instanceof Promise) {
      return result.then((res) => {
        this.cache.set(fullKey, res, ttl);
        return res;
      });
    }
    this.cache.set(fullKey, result, ttl);
    return result;
  }

  clear(prefix?: string): void {
    if (!prefix) {
      this.cache.flushAll();
      return;
    }
    const fullPrefix = this.prefixKey(prefix);
    this.cache.keys().forEach((key) => {
      if (key.startsWith(fullPrefix)) this.cache.del(key);
    });
  }

  ttl(key: string, ttl: number): boolean {
    return this.cache.ttl(this.prefixKey(key), ttl);
  }

  getTtl(key: string): number | undefined {
    return this.cache.getTtl(this.prefixKey(key));
  }

  keys(): string[] {
    const prefix = this.prefixKey('');
    return this.cache.keys().map((key) => key.replace(prefix, ''));
  }

  private prefixKey(key: string): string {
    return DEFAULT_PREFIX + key;
  }
}

export const storageUtil = new StorageUtil();
export default storageUtil;
