import Database from 'sioserver/Database'
import { mongoose } from 'sioserver'
const schema = {
  name: {
    type: 'string',
    description: 'Nombre del usuario',
    example: 'Jhon Doe',
    displayName: 'Nombre completo',
    required: true
  },
  email: {
    type: 'string',
    description: 'Email del usuario',
    example: 'example@example.com',
    displayName: 'Email',
    required: true
  },
  password: {
    type: 'string',
    description: 'Contraseña del usuario',
    example: '123456',
    displayName: 'Contraseña'
  },
  roles: {
    type: ['string'],
    description: 'Nivel de acceso del usuario',
    example: ['admin', 'user'],
    default: ['user'],
    displayName: 'Roles'
  }
}
const userSchema = new mongoose.Schema(schema, { timestamps: true })
export default Database.model('User', userSchema)
