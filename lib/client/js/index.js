import API from './api'
import user from './user'
import '/socket.io/socket.io.js'
class SIO {
  constructor () {
    this.socket = io()
    this.user = user
  }
  async request (url, options = {}) {
    return await fetch(url, options)
      .then(async response => {
        let contentType = response.headers.get('content-type')
        let responseVal = null
        if (contentType && contentType.indexOf('application/json') !== -1) {
          responseVal = await response.json()
        } else {
          responseVal = await response.text()
        }
        if (response.status >= 200 && response.status < 300) {
          return responseVal
        } else {
          return {
            error: responseVal,
            body: response.statusText,
            status: response.status
          }
        }
      })
      .catch(error => {
        console.error(error)
      })
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
      options.body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    } else {
      options.body = body
    }
    options.method = 'POST'
    return this.request(url, options)
  }
  async put (url, body, options = {}) {
    if (!options.headers) {
      options.headers = {}
    }
    if (typeof body === 'object') {
      options.body = JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    } else {
      options.body = body
    }
    options.method = 'PUT'
    return this.request(url, options)
  }
  async delete (url, options = {}) {
    options.method = 'DELETE'
    return this.request(url, options)
  }
  async init () {
    this.apis = await API()
  }
}
const sio = new SIO()
globalThis.sio = sio
await sio.init()
export default sio
