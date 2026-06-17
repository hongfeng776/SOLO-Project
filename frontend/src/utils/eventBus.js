const listeners = {}

export default {
  on(event, callback) {
    if (!listeners[event]) {
      listeners[event] = []
    }
    listeners[event].push(callback)
  },

  off(event, callback) {
    if (!listeners[event]) return
    if (!callback) {
      listeners[event] = []
      return
    }
    const index = listeners[event].indexOf(callback)
    if (index > -1) {
      listeners[event].splice(index, 1)
    }
  },

  emit(event, data) {
    if (!listeners[event]) return
    listeners[event].forEach((callback) => {
      try {
        callback(data)
      } catch (err) {
        console.error(`EventBus error for event ${event}:`, err)
      }
    })
  }
}
