import express from 'express'
import path from 'path'
import { EventEmitter } from 'events'
import mongoose from 'mongoose'
const __dirname = process.cwd()
class APIRouter extends EventEmitter {
  constructor (apis = []) {
    super()
    Object.defineProperty(this, 'apis', {
      value: apis
    })
    Object.defineProperty(this, 'router', {
      value: express.Router(),
      writable: true
    })
    this.router.route('/describe').get((req, res) => {
      let apis = []
      for (let api of this.apis) {
        if (this[api].description.displayApi !== false) {
          apis.push(this[api].description)
        }
      }
      res.send(apis)
    })
  }
  cleanSchema (schema) {
    for (let key in schema) {
      if (Array.isArray(schema[key].type)) {
        if (schema[key].type[0] instanceof mongoose.Schema) {
          schema[key].type[0] = this.cleanSchema(schema[key].type[0].obj)
        }
      }
    }
    return schema
  }
  async init (sioserver) {
    this.sioserver = sioserver
    for (let api of this.apis) {
      let apiDir = path.join(
        'file:///',
        __dirname,
        'server',
        'apis',
        `${api}.api.js`
      )
      let apiModule = await import(apiDir)
      Object.defineProperty(this, api, {
        value: apiModule.default
      })
      this[api].sioserver = this.sioserver
      this[api].on('change', data => {
        data.api = this[api].description.name
        this.emit('change', data)
      })
      this.router
        .route(`/describe/${this[api].description.name}`)
        .get((req, res) => {
          res.send(this[api].description)
        })
      this.router
        .route(`/paths/${this[api].description.name}`)
        .get((req, res) => {
          res.send(this[api].paths)
        })
      this.router
        .route(`/schema/${this[api].description.name}`)
        .get(async (req, res) => {
          let schema = this[api].schema
          if (typeof this[api].afterSchema === 'function') {
            await this[api].afterSchema(req, res, schema)
          }
          schema = this.cleanSchema(schema)
          res.send(schema)
        })
      let paths = this[api].paths
      for (let path in paths) {
        let route = this.router.route(`/${this[api].description.name}${path}`)
        let methods = paths[path]
        for (let method in methods) {
          route[method](methods[method].action.bind(this[api]))
        }
      }
    }
  }
  getRouter (app) {
    // console.log(this.router)
    app.use('/api', express.json(), this.router)
  }
}
export default APIRouter
