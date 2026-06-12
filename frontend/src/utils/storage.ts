const PREFIX = 'APP_';

interface StorageOptions {
  prefix?: string;
  expire?: number;
}

class StorageUtil {
  private prefix: string;

  constructor(prefix = PREFIX) {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    const { expire } = options;
    const data = {
      value,
      timestamp: Date.now(),
      expire: expire ? Date.now() + expire * 1000 : null,
    };
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(data));
    } catch (e) {
      console.warn('[Storage] Set failed:', e);
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return defaultValue ?? null;
      const data = JSON.parse(raw);
      if (data.expire && Date.now() > data.expire) {
        this.remove(key);
        return defaultValue ?? null;
      }
      return data.value as T;
    } catch {
      return defaultValue ?? null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (e) {
      console.warn('[Storage] Remove failed:', e);
    }
  }

  clear(prefix?: string): void {
    try {
      const keys = Object.keys(localStorage);
      const targetPrefix = prefix ? this.getKey(prefix) : this.prefix;
      keys.forEach((k) => {
        if (k.startsWith(targetPrefix)) localStorage.removeItem(k);
      });
    } catch (e) {
      console.warn('[Storage] Clear failed:', e);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  getExpire(key: string): number | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.expire ? Math.max(0, data.expire - Date.now()) : null;
    } catch {
      return null;
    }
  }

  setSession<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (e) {
      console.warn('[Storage] Session set failed:', e);
    }
  }

  getSession<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = sessionStorage.getItem(this.getKey(key));
      if (!raw) return defaultValue ?? null;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue ?? null;
    }
  }

  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(this.getKey(key));
    } catch (e) {
      console.warn('[Storage] Session remove failed:', e);
    }
  }
}

export const storage = new StorageUtil();
export default storage;
