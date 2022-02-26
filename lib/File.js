import fs from 'fs'
import path from 'path'
class File {
  constructor (filePath, content = '', format = 'text') {
    Object.defineProperty(this, 'filePath', {
      value: filePath
    })
    Object.defineProperty(this, 'content', {
      value: content,
      writable: true
    })
    Object.defineProperty(this, 'format', {
      value: format
    })
  }
  save () {
    return File.write(this.filePath, this.content, this.format)
  }
  static read (filePath, format = 'text') {
    let content = null
    try {
      if (format === 'json') {
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } else {
        content = fs.readFileSync(filePath).toString('utf-8')
      }
    } catch (e) {}
    return new File(filePath, content, format)
  }
  static write (filePath, content, format) {
    let dir = filePath.split(path.sep)
    let fileName = dir.pop()
    if (dir.length > 0 && !fs.existsSync(dir.join('/'))) {
      fs.mkdirSync(dir.join('/'), { recursive: true })
    }
    if (format === 'json') {
      content = JSON.stringify(content, null, 2)
    }
    return fs.writeFileSync(filePath, content, {
      encoding: 'utf-8',
      flag: 'w',
      recursive: true
    })
  }
}
export default File
