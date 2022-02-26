import express from 'express'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import http from 'http'
import path from 'path'
import APIRouter from './APIRouter.js'
import ModelsRouter from './ModelsRouter.js'
import File from './File.js'
import Database from './Database.js'
import OAuth from './OAuth.js'
import Templater from './Templater.js'
import Mailer from './Mailer.js'
console.clear()
const __dirname = process.cwd()
let url = new URL(import.meta.url)
let __dirsio = path.dirname(url.pathname)
if (/^\/\w\:/.test(__dirsio)) {
  __dirsio = __dirsio.substring(1)
}
const config = File.read(path.join(__dirname, '.config.json'), 'json').content
class SioServer {
  constructor () {
    this.__dirsio = __dirsio
    this.__dirname = __dirname
    this.config = config
    this.app = express()
    this.express = express
    this.server = http.createServer(this.app)
    this.io = new Server(this.server)
    this.apis = new APIRouter(config.apis)
    this.models = new ModelsRouter(config.models)
    this.oauth = new OAuth()
    this.mailer = new Mailer()
    this.templater = Templater
    this.io.on('connection', socket => {
      socket.on('subscribe', data => {
        socket.join(data)
      })
    })
    this.apis.on('change', data => {
      this.io.to(`api:${data.api}`).emit(`api:${data.api}`, data)
    })
    this.loaded = false
  }
  async startServices () {
    await this.models.init(this)
    await this.apis.init(this)
    await this.oauth.init(this)
    await this.mailer.init(this)
    this.apis.getRouter(this.app)
    /**Export lib/client/js as /sio */
    this.app.use(
      '/sio',
      express.static(path.join(__dirsio, 'client', 'js'), {
        extensions: ['js'],
        index: 'index.js'
      })
    )
    /** Add lit */
    this.app.use(
      '/lit',
      express.static(path.join(__dirname, 'node_modules', 'lit-html'), {
        extensions: ['js']
      })
    )
    /**Set tue public directory */
    this.app.use(
      express.static(path.join(__dirname, 'public'), {
        extensions: ['html']
      })
    )
    this.loaded = true
    return this
  }
  async listen () {
    if (!this.loaded) {
      await this.startServices()
    }

    this.server.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`)
    })
  }
}
const sioserver = new SioServer()
export default sioserver
export { mongoose }
