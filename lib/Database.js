import mongoose from 'mongoose'
const database = mongoose.createConnection(process.env.DBURL)
export default database
