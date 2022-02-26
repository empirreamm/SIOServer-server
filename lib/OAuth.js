import crypto from 'crypto'
import path from 'path'
import jsonwebtoken from 'jsonwebtoken'
import express from 'express'
import sioserver from 'sioserver'
class User {
  static get Anonymous () {
    return {
      _id: 0,
      name: 'Anonymous',
      email: '',
      roles: ['anonym']
    }
  }
  constructor (user = {}) {
    delete user.password
    if (!user._id || !user.roles) {
      user = User.Anonymous
    }
    Object.assign(this, user)
  }
  isRol (roles) {
    if (this.roles.includes('root')) {
      return true
    }
    if (typeof roles === 'string') {
      roles = roles.split(',')
    }
    for (let role of roles) {
      if (this.roles.includes(role)) {
        return true
      }
    }
    return false
  }
  async level () {
    let roles = await sioserver.models.Roles.find({
      name: {
        $in: this.roles
      }
    })
    let val = roles.reduce((prev, current) => {
      if (current.level < prev) {
        return current.level
      }
      return prev
    }, Number.POSITIVE_INFINITY)
    return val
  }
}
class OAuth {
  constructor () {
    this.sioserver = null
    this.userdb = null
  }
  async verify (token) {
    let secureData = this.sioserver.config.jwt
    let password = '123456'
    if (secureData.type === 'RSA256') {
      password = secureData.publicKey
    } else if (secureData.type === 'password') {
      password = secureData.password
    }
    try {
      let decoded = jsonwebtoken.verify(token, password)
      return decoded
    } catch (e) {
      return null
    }
  }
  async sign (user) {
    let options = {
      expiresIn: '1d'
    }
    let userToken = {
      _id: user._id
    }
    let secureData = this.sioserver.config.jwt
    let password = '123456'
    if (secureData.type === 'RSA256') {
      password = secureData.privateKey
      options.algorithm = 'RS256'
    } else if (secureData.type === 'password') {
      password = secureData.password
    }
    return jsonwebtoken.sign(userToken, password, options)
  }
  async init (sioserver) {
    this.userdb = sioserver.models.User
    this.sioserver = sioserver
    this.sioserver.app.use(this._cookies)
    this.sioserver.app.use(this._auth.bind(this))
    this.sioserver.app.post('/login', express.json(), this._login.bind(this))
    this.sioserver.app.get('/me', this._me.bind(this))
    this.sioserver.app.get('/logout', this._logout.bind(this))
  }
  _cookies (req, res, next) {
    let cookies = {}
    if (!req.headers.cookie) {
      req.cookies = cookies
      return next()
    }
    req.headers.cookie.split(';').forEach(function (cookie) {
      var parts = cookie.split('=')
      cookies[parts[0]] = (parts[1] || '').trim()
    })
    req.cookies = cookies
    next()
  }
  async _auth (req, res, next) {
    if (req.cookies.token) {
      let userToken = await this.verify(req.cookies.token)
      if (!userToken) {
        req.user = new User({})
        return next()
      }
      let user = await this.userdb.findOne({ _id: userToken._id })
      if (!user) {
        req.user = new User({})
        return next()
      }
      req.user = new User(user.toObject())
    } else {
      req.user = new User({})
    }
    next()
  }
  _me (req, res, next) {
    res.send(req.user)
  }
  async _login (req, res) {
    let user = await this.userdb.findOne({ email: req.body.email })
    if (!user) {
      res.status(401).send('Usuario o contraseña incorrectos')
      return
    }
    if (!user.password) {
      res.status(401).send('Usuario o contraseña incorrectos')
    }
    let parts = user.password.split('$')
    let salt = parts[0]
    let userPass = parts[1]
    var hash = crypto
      .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
      .toString(`hex`)
    let verified = userPass === hash
    if (!verified) {
      res.status(401).send('Usuario o contraseña incorrectos')
      return
    }
    let token = await this.sign(user)
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    })
    res.send({
      token
    })
  }
  _logout (req, res, next) {
    res
      .cookie('token', null, {
        httpOnly: true,
        maxAge: -1
      })
      .redirect('/')
  }
}
export default OAuth
