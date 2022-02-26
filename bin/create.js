#!/usr/bin/env node
import inquirer from 'inquirer'
import File from '../lib/File.js'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
console.clear()
const prompt = inquirer.createPromptModule()
const __dirname = process.cwd()
const __createDir = path.dirname(import.meta.url.replace(/^file:\/+/, ''))
/**Update package to work with sioserver */
let packagePath = path.join(__dirname, 'package.json')
let packageInfo = File.read(packagePath, 'json')
let packageContent = packageInfo.content
if (!packageContent) {
  console.log('No package.json found')
  process.exit(1)
}
if (!packageContent.dependencies) {
  packageContent.dependencies = {}
}
if (!packageContent.dependencies.sioserver) {
  packageContent.dependencies['sioserver'] = '^1.0.0'
}
if (!packageContent.dependencies['lit-html']) {
  packageContent.dependencies['lit-html'] = '^2.2.0'
}
if (!packageContent.devDependencies) {
  packageContent.devDependencies = {}
}
if (!packageContent.devDependencies.dotenv) {
  packageContent.devDependencies['dotenv'] = '^16.0.0'
}
if (!packageContent.scripts) {
  packageContent.scripts = {}
}
packageContent.scripts.dev = 'node index-dev.js'
packageContent.scripts.start = 'node index.js'
packageInfo.content = packageContent
packageInfo.save()
/**Update gitignore to ignore sioserverfiles */
let gitIgnore = File.read(path.join(__dirname, '.gitignore'), 'text')
if (!gitIgnore.content.includes('node_modules')) {
  gitIgnore.content += '\nnode_modules'
}
if (!gitIgnore.content.includes('index-dev.js')) {
  gitIgnore.content += '\nindex-dev.js'
}
if (!gitIgnore.content.includes('.env')) {
  gitIgnore.content += '\n.env'
}
gitIgnore.save()
/**Create index.js */
let index = File.read(path.join(__dirname, 'index.js'), 'text')
if (!index.content) {
  index.content = `import sioserver from "sioserver"\nawait sioserver.startServices()\nsioserver.listen()`
  index.save()
}
/**Create index-dev.js */
let indexDev = File.read(path.join(__dirname, 'index-dev.js'), 'text')
if (!indexDev.content) {
  indexDev.content = `import "dotenv/config"\nimport "./index.js"\n`.trim()
  indexDev.save()
}
/**Create User API */
/**
 * Schema
 */
let userSchema = File.read(
  path.join(__dirname, 'server', 'models', 'User.model.js'),
  'text'
)
if (!userSchema.content) {
  let userModel = File.read(path.join(__createDir, 'src', 'User.model.js'))
  userSchema.content = userModel.content
  userSchema.save()
}
/**
 * API
 */
let userAPI = File.read(
  path.join(__dirname, 'server', 'apis', 'User.api.js'),
  'text'
)
if (!userAPI.content) {
  let userAPIdefault = File.read(path.join(__createDir, 'src', 'User.api.js'))
  userAPI.content = userAPIdefault.content
  userAPI.save()
}
/**Create dotenv variables */
let dotenv = File.read(path.join(__dirname, '.env'), 'text')
if (!dotenv.content) {
  let dotenvContent = dotenv.content
  let lines = dotenvContent.split('\n')
  let variables = {}
  for (let line of lines) {
    let [key, value] = line.split('=')
    variables[key] = value
  }
  let answers = await prompt([
    {
      type: 'number',
      name: 'PORT',
      message: 'Port',
      default: variables.PORT || 80
    },
    {
      type: 'input',
      name: 'DBURL',
      message: 'Database URL',
      default: variables.DBURL || 'mongodb://localhost'
    }
  ])
  let newContent = ''
  for (let key in answers) {
    newContent += `${key}=${answers[key]}\n`
  }
  dotenv.content = newContent
  dotenv.save()
}
/**Execute the installation */
/**Config */
let config = File.read(path.join(__dirname, '.config.json'), 'json')
if (!config.content) {
  config.content = {}
}
if (!config.content.apis) {
  config.content.apis = ['User']
}
if (!config.content.models) {
  config.content.models = ['User']
}
/**Create key-pair value keys */
let createJWTpass = true
if (config.content.jwt) {
  createJWTpass = await prompt({
    type: 'confirm',
    name: 'createJWTpass',
    message: '¿Crear nueva seguridad para jwt?'
  }).then(answer => {
    console.log(answer)
    return answer.createJWTpass
  })
}
if (createJWTpass) {
  config.content.jwt = {}
  let type = await prompt({
    type: 'list',
    name: 'type',
    message: 'Tipo de seguridad para jwt',
    choices: ['RSA256', 'password']
  }).then(answers => {
    return answers.type
  })
  config.content.jwt.type = type
  console.log(type)
  if (type == 'RSA256') {
    let diffHell = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    config.content.jwt.privateKey = diffHell.privateKey
    config.content.jwt.publicKey = diffHell.publicKey
  } else {
    let password = await prompt({
      type: 'password',
      name: 'password',
      message: 'Password'
    }).then(answers => {
      return answers.password
    })
    config.content.jwt.password = password
  }
}
/**Email data */
let createEmail = true
if (config.content.email) {
  createEmail = await prompt({
    type: 'confirm',
    name: 'createEmail',
    message: '¿Desea configurar un nuevo email?'
  }).then(answers => {
    return answers.createEmail
  })
}
if (createEmail) {
  let email = await prompt([
    {
      type: 'input',
      name: 'host',
      message: 'SMTP Host'
    },
    {
      type: 'input',
      name: 'port',
      message: 'Port'
    },
    {
      type: 'input',
      name: 'user',
      message: 'User'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password'
    },
    {
      type: 'input',
      name: 'from',
      message: 'Nombre para enviar como'
    }
  ])
  config.content.email = email
}
config.save()
