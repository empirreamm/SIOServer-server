import path from 'path'
const __dirname = process.cwd()
class ModelsRouter {
  constructor (models) {
    this.models = models
  }
  async init () {
    for (let model of this.models) {
      let modelDir = path.join(
        'file:///',
        __dirname,
        'server',
        'models',
        `${model}.model.js`
      )
      let modelModule = await import(modelDir)
      Object.defineProperty(this, model, {
        value: modelModule.default
      })
    }
  }
}
export default ModelsRouter
