type StorageType = 'localStorage' | 'sessionStorage'

const createStorage = (type: StorageType) => {
  const storage = type === 'localStorage' ? localStorage : sessionStorage

  const get = <T = any>(key: string): T | null => {
    const value = storage.getItem(key)
    if (value) {
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    }
    return null
  }

  const set = (key: string, value: any) => {
    if (typeof value === 'object') {
      storage.setItem(key, JSON.stringify(value))
    } else {
      storage.setItem(key, String(value))
    }
  }

  const remove = (key: string) => {
    storage.removeItem(key)
  }

  const clear = () => {
    storage.clear()
  }

  return { get, set, remove, clear }
}

export const Storage = createStorage('localStorage')
export const SessionStorage = createStorage('sessionStorage')

export default Storage
