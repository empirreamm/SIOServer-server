import API from 'sioserver/API'
import crypto from 'crypto'
import sioserver from 'sioserver'
import path from 'path'
class User extends API {
  get paths () {
    return {
      '/': {
        get: {
          action: this.getAll,
          level: ['root', 'admin'],
          displayName: 'getAll'
        },
        post: {
          action: this.create,
          level: ['user'],
          displayName: 'create'
        }
      },
      '/:id': {
        get: {
          action: this.getById,
          level: ['all'],
          displayName: 'getById'
        },
        put: {
          action: this.update,
          level: ['all'],
          displayName: 'update'
        },
        delete: {
          action: this.delete,
          level: ['admin'],
          displayName: 'delete'
        }
      },
      '/setPassword': {
        post: {
          action: this.setPassword,
          level: ['all'],
          displayName: 'setPassword'
        }
      },
      '/resetPassword': {
        post: {
          action: this.resetPassword,
          level: ['all'],
          displayName: 'resetPassword'
        }
      }
    }
  }
  get description () {
    return {
      name: 'user',
      icon: 'people',
      displayName: 'Usuarios'
    }
  }
  async getAll (req, res) {
    res.send(await this.model.find({}))
  }
  async create (req, res) {
    try {
      let element = new this.model(req.body)
      await element.save()
      res.send(element)
    } catch (error) {
      res.status(400).send({ error })
    }
  }
  async getById (req, res) {
    res.send(await this.model.findOne({ _id: req.params.id }))
  }
  async update (req, res) {
    let element = await this.model.findOne({ _id: req.params.id })
    if (!element) {
      res.status(404).send({ error: 'Not found' })
    }
    for (let key in req.body) {
      element[key] = req.body[key]
    }
    await element.save()
    res.send(element)
  }
  async delete (req, res) {
    await this.model.findOneAndDelete({ _id: req.params.id })
    res.send({ ok: true })
  }
  async resetPassword (req, res) {
    let user = await this.model.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).send({ error: 'Not found' })
    }
    user.password = crypto.randomBytes(3).toString('hex')
    await user.save()
    res.send({ ok: true })
    let html = sioserver.templater(
      path.join(sioserver.__dirsio, 'templates', 'resetPassword.html'),
      { code: user.password }
    )
    let mailSend = await sioserver.mailer.send(
      user.email,
      'Cambio de contraseña',
      html
    )
  }
  async setPassword (req, res) {
    if (!req.body.password) {
      return res.status(400).send({ error: 'Password is required' })
    }
    let user = await this.model.findOne({
      email: req.body.email,
      password: req.body.code
    })
    if (!user) {
      return res.status(404).send({ error: 'Not found' })
    }
    let salt = crypto.randomBytes(16).toString('hex')
    let hash = crypto
      .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
      .toString(`hex`)
    let password = `${salt}$${hash}`
    user.password = password
    await user.save()
    res.send({ ok: true })
  }
}
const user = new User()
export default user
