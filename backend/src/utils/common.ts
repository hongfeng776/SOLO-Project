class CommonUtil {
  debounce<T extends (...args: any[]) => any>(fn: T, delay = 300): (...args: Parameters<T>) => void {
    let timer: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  throttle<T extends (...args: any[]) => any>(fn: T, delay = 300): (...args: Parameters<T>) => void {
    let lastTime = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        fn(...args);
      }
    };
  }

  deepClone<T>(obj: T, hash = new WeakMap()): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as any;
    if (hash.has(obj)) return hash.get(obj);
    const clone = (Array.isArray(obj) ? [] : {}) as T;
    hash.set(obj, clone);
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (clone as any)[key] = this.deepClone((obj as any)[key], hash);
      }
    }
    return clone;
  }

  generateId(prefix = 'id'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  uuid(): string {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  formatFileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }

  unique<T>(arr: T[], key?: keyof T): T[] {
    if (!key) return [...new Set(arr)];
    const seen = new Set();
    return arr.filter((item) => {
      const val = item[key];
      return seen.has(val) ? false : seen.add(val);
    });
  }

  groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
    return arr.reduce((acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((acc, key) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        (acc as any)[key] = obj[key];
      }
      return acc;
    }, {} as Pick<T, K>);
  }

  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => delete (result as any)[key]);
    return result;
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async retry<T>(fn: () => Promise<T>, max = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (max <= 1) throw e;
      await this.sleep(delay);
      return this.retry(fn, max - 1, delay * 2);
    }
  }

  truncate(str: string, maxLen: number, suffix = '...'): string {
    return str.length > maxLen ? str.slice(0, maxLen) + suffix : str;
  }

  buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
  }

  parseQueryString(query: string): Record<string, string> {
    return query
      .replace(/^\?/, '')
      .split('&')
      .filter(Boolean)
      .reduce((acc, pair) => {
        const [k, v] = pair.split('=');
        acc[decodeURIComponent(k)] = decodeURIComponent(v || '');
        return acc;
      }, {} as Record<string, string>);
  }
}

export const commonUtil = new CommonUtil();
export default commonUtil;
