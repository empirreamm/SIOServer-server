let PROCESS_UNIQUE = null
class ObjectId {
  static index = Math.floor(Math.random() * 0xffffff)
  constructor () {}
  static getInc () {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff)
  }
  static randomBytes (size) {
    const target = window.crypto || window.msCrypto
    if (target && target.getRandomValues) {
      return target.getRandomValues(new Uint8Array(size))
    }
  }
  static generate (time) {
    if ('number' !== typeof time) {
      time = Math.floor(Date.now() / 1000)
    }
    const inc = ObjectId.getInc()
    const buffer = new Uint8Array(12)
    let dataview = new DataView(buffer.buffer)
    dataview.setUint32(0, time)
    if (PROCESS_UNIQUE === null) {
      PROCESS_UNIQUE = ObjectId.randomBytes(5)
    }
    buffer[4] = PROCESS_UNIQUE[0]
    buffer[5] = PROCESS_UNIQUE[1]
    buffer[6] = PROCESS_UNIQUE[2]
    buffer[7] = PROCESS_UNIQUE[3]
    buffer[8] = PROCESS_UNIQUE[4]

    // 3-byte counter
    buffer[11] = inc & 0xff
    buffer[10] = (inc >> 8) & 0xff
    buffer[9] = (inc >> 16) & 0xff
    let hex = ''
    for (let i = 0; i < buffer.length; i += 2) {
      let data = dataview.getUint16(i)
      hex += data.toString(16).padStart(2, '0')
    }
    return hex
  }
}
export default ObjectId
