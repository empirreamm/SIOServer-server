class Events {
  constructor () {
    Object.defineProperty(this, 'listeners', {
      value: {},
      writable: true
    })
    Object.defineProperty(this, 'saveEvent', {
      value: {},
      writable: true
    })
  }
  on (event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    if (this.saveEvent[event]) {
      callback(this.saveEvent[event])
    }
    this.listeners[event].push(callback)
  }
  emit (event, data, saveEvent = false) {
    if (!this.listeners[event]) {
      return
    }
    if (saveEvent) {
      this.saveEvent[event] = data
    }
    this.listeners[event].forEach(callback => {
      callback(data)
    })
  }
  deleteSavedEvent (event) {
    delete this.saveEvent[event]
  }
  isEventActive (event) {
    return this.saveEvent[event] !== undefined
  }
}
export default Events
