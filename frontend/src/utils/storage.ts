interface StorageOptions {
  prefix?: string
  storage?: 'localStorage' | 'sessionStorage'
}

interface StorageValue<T> {
  value: T
  expire?: number
  timestamp: number
}

class StorageUtil {
  private prefix: string
  private storage: Storage

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'app_'
    this.storage = options.storage === 'sessionStorage' ? sessionStorage : localStorage
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get<T = unknown>(key: string): T | null {
    const fullKey = this.getKey(key)
    const value = this.storage.getItem(fullKey)
    if (!value) {
      return null
    }
    try {
      const data: StorageValue<T> = JSON.parse(value)
      if (data.expire && Date.now() - data.timestamp > data.expire) {
        this.remove(key)
        return null
      }
      return data.value
    } catch {
      return value as unknown as T
    }
  }

  set<T>(key: string, value: T, expire?: number): void {
    const fullKey = this.getKey(key)
    const data: StorageValue<T> = {
      value,
      timestamp: Date.now()
    }
    if (expire) {
      data.expire = expire
    }
    this.storage.setItem(fullKey, JSON.stringify(data))
  }

  remove(key: string): void {
    const fullKey = this.getKey(key)
    this.storage.removeItem(fullKey)
  }

  clear(): void {
    const keys: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key)
      }
    }
    keys.forEach((key) => this.storage.removeItem(key))
  }
}

export const storage = new StorageUtil({ prefix: 'hongtu_' })
export const sessionStorageUtil = new StorageUtil({ prefix: 'hongtu_', storage: 'sessionStorage' })

export default StorageUtil
