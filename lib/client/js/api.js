class Service {
  constructor (api, info) {
    Object.defineProperty(this, '_listeners', {
      value: {}
    })
    this.api = api
    this.info = info
    this.path = this.info.name
    this.headers = {}
    sio.socket.emit('subscribe', `api:${this.info.name}`)
    sio.socket.on(`api:${this.info.name}`, data => {
      this.emit('change', data)
    })
  }
  async request (url, options = {}) {
    options.headers = { ...this.headers, ...options.headers }
    return this.api.request(`${this.path}${url}`, options)
  }
  async get (url, options = {}) {
    options.method = 'GET'
    return this.request(url, options)
  }
  async post (url, body, options = {}) {
    if (!options.headers) {
      options.headers = {}
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    }
    options.body = body
    options.method = 'POST'
    return this.request(url, options)
  }
  async put (url, body, options = {}) {
    if (!options.headers) {
      options.headers = {}
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    }
    options.body = body
    options.method = 'PUT'
    return this.request(url, options)
  }
  async delete (url, options = {}) {
    options.method = 'DELETE'
    return this.request(url, options)
  }
  async on (event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(callback)
  }
  emit (event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(callback => {
        callback(data)
      })
    }
  }
}
class API {
  constructor (baseUrl) {
    this.baseUrl = baseUrl
    this.headers = {}
    this.list = []
  }
  async request (url, options = {}) {
    options.headers = { ...this.headers, ...options.headers }
    url = url.replace(/^\//, '')
    return await sio.request(`${this.baseUrl}/${url}`, options)
  }
  async post (url, body, options = {}) {
    if (!options.headers) {
      options.headers = {}
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    }
    options.body = body
    options.method = 'POST'
    return this.request(url, options)
  }
  async get (url, options = {}) {
    options.method = 'GET'
    return this.request(url, options)
  }
  async put (url, body, options = {}) {
    if (!options.headers) {
      options.headers = {}
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    }
    options.body = body
    options.method = 'PUT'
    return this.request(url, options)
  }
  async delete (url, options = {}) {
    options.method = 'DELETE'
    return this.request(url, options)
  }
  async init () {
    let data = await this.get('/describe')
    for (let service of data) {
      service.paths = await this.get(`/paths/${service.name}`)
      service.schema = await this.get(`/schema/${service.name}`)
      this[service.name] = new Service(this, service)
      this.list.push(this[service.name])
    }
  }
}
export default async baseUrl => {
  if (!baseUrl) {
    baseUrl = `${location.protocol}//${location.hostname}:${location.port}/api`
  }
  const api = new API(baseUrl)
  await api.init()
  return api
}
