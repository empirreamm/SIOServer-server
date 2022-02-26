import { Console } from 'console'
import { EventEmitter } from 'events'
import sioserver from 'sioserver'
class API extends EventEmitter {
  constructor () {
    super()
    this.name = this.constructor.name
    this.model = sioserver.models[this.name]
    this.model.watch().on('change', change => {
      this.emit(`change`, {
        operation: change.operationType,
        _id: change.documentKey._id
      })
    })
    this.sioserver = null
  }
  get schema () {
    return this.model.schema.obj
  }
}
export default API
