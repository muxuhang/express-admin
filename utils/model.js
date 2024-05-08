import mongoose from 'mongoose'
import { UsersModelSchema } from './schema'

const UsersModel = mongoose.model('Users', UsersModelSchema)
new UsersModel()

export { UsersModel }
