#!/usr/bin/env node
import inquirer from 'inquirer'
import File from '../lib/File.js'
import path from 'path'
console.clear()
const prompt = inquirer.createPromptModule()
const __dirname = process.cwd()
const __createDir = path.dirname(import.meta.url.replace(/^file:\/+/, ''))
let configFile = File.read(path.join(__dirname, '.config.json'), 'json')
let answers = await prompt([
  {
    type: 'input',
    name: 'name',
    message: 'What is the name of your API?'
  },
  {
    type: 'confirm',
    name: 'model',
    message: 'Do you want to create a model?'
  }
])
let name = answers.name.toLowerCase()
let Name = name.charAt(0).toUpperCase() + name.slice(1)
let apiFile = File.read(path.join(__createDir, 'src', 'DefaultApi.js'), 'text')
  .content
let newContent = apiFile.replace(/\{Name\}/g, Name).replace(/\{name\}/g, name)
let apiPath = File.read(
  path.join(__dirname, 'server', 'apis', `${Name}.api.js`),
  'text'
)
if (!apiPath.content) {
  apiPath.content = newContent
  apiPath.save()
}
if (!configFile.content.apis[Name]) {
  configFile.content.apis.push(Name)
}
if (answers.model) {
  let modelFile = File.read(
    path.join(__createDir, 'src', 'DefaultModel.js'),
    'text'
  ).content
  let newModelContent = modelFile
    .replace(/\{Name\}/g, Name)
    .replace(/\{name\}/g, name)
  let modelPath = File.read(
    path.join(__dirname, 'server', 'models', `${Name}.model.js`),
    'text'
  )
  if (!modelPath.content) {
    modelPath.content = newModelContent
    modelPath.save()
  }
  if (!configFile.content.models[Name]) {
    configFile.content.models.push(Name)
  }
}
configFile.save()
console.log('Created API:', name)
