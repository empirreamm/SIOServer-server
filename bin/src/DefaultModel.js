import Database from 'sioserver/Database'
import { mongoose } from 'sioserver'
const schema = {
  test: {
    type: 'string',
    description: 'Test',
    example: 'Un texto',
    displayName: 'Test',
    required: true
  }
}
const Schema = new mongoose.Schema(schema, { timestamps: true })
export default Database.model('{Name}', Schema)
