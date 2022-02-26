import sio from '/sio'
import Events from './Events'
class User extends Events {
  constructor () {
    super()
    Object.defineProperty(this, '_me', {
      value: null,
      writable: true
    })
    Object.defineProperty(this, '_exp', {
      value: Number.MAX_SAFE_INTEGER,
      writable: true
    })
    Object.defineProperty(this, '_first', {
      value: true,
      writable: true
    })
    Object.defineProperty(this, 'status', {
      value: 'logedout',
      writable: true
    })
  }
  async login (email, password) {
    let log = await sio.post('/login', { email, password })
    this.me()
    return this._me
  }
  async resetPass (email) {
    let log = await sio.apis.user.post('/resetPassword', { email })
    return log
  }
  async setPass (_id, otc, password) {
    let log = await sio.apis.user.post('/setPassword', { _id, otc, password })
    return log
  }
  async logout () {
    let log = await sio.get('/logout')
    this._me = null
    this.me()
    return this._me
  }
  async me () {
    if (this._me && this._me._id !== 0) {
      return this._me
    }
    this._me = await sio.get('/me')
    if (this._me._id === 0) {
      this.emit('logout', null, true)
      this.deleteSavedEvent('login')
      this.status = 'logedout'
    } else {
      this.emit('login', this._me, true)
      this.deleteSavedEvent('logout')
      this.status = 'logedin'
    }
    this._first = false
    return this._me
  }
}
const user = new User()
export default user
