const PREFIX = 'travel_admin_'

export const storage = {
  set(key, value) {
    try {
      const storageKey = PREFIX + key
      localStorage.setItem(storageKey, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  get(key, defaultValue = null) {
    try {
      const storageKey = PREFIX + key
      const value = localStorage.getItem(storageKey)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  remove(key) {
    try {
      const storageKey = PREFIX + key
      localStorage.removeItem(storageKey)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },

  clear() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }
}

export default storage
