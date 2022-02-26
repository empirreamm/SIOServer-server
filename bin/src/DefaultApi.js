import API from 'sioserver/API'
class {Name} extends API {
  get paths () {
    return {
      '/': {
        get: {
          action: this.getAll,
          level: ['root']
        },
        post: {
          action: this.create,
          level: ['admin']
        }
      },
      '/:id': {
        get: {
          action: this.find,
          level: ['all']
        },
        put: {
          action: this.update,
          level: ['all']
        },
        delete: {
          action: this.delete,
          level: ['admin']
        }
      }
    }
  }
  get description () {
    return {
      name: '{name}',
      icon: 'block',
      displayName: '{Name}'
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
  async find (req, res) {
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
}
const api = new {Name}()
export default api
