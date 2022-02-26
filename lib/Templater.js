import File from './File.js'
export default function (path, variables) {
  let file = File.read(path, 'text')
  let content = file.content
  if (!content) {
    return ''
  }
  let contentReplaced = content.replace(
    /\{\{(?<named>\w+)\}\}/g,
    (match, named) => {
      let value = variables[named]
      if (value) {
        return value
      }
      return ''
    }
  )
  return contentReplaced
}
