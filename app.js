const express = require('express')
const errorhandler = require('errorhandler')
const mongoose = require('mongoose')
const logger = require('morgan')
const cors = require('cors')
require('dotenv').config()
const swaggerUi = require('swagger-ui-express')
const helmet = require('helmet')
// const swaggerDocument = require('./swagger.json')


const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

const app = express()


app.use(helmet())
app.use(cors())

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

mongoose.set('useNewUrlParser', true) // đặt trình phân tích cú pháp
mongoose.set('useCreateIndex', true) // tạo nhiều index trong collection của mongodb
mongoose.set('useUnifiedTopology', true) //

if(!isProduction) {
  app.use(errorhandler())
}


if (isTest) {
  mongoose.connect(process.env.MONGODB_URI_TEST)
}

if (isProduction) {
  mongoose.connect(process.env.MONGODB_URI)
}

if (isDevelopment) {
  mongoose.connect(process.env.MONGODB_URI)
  mongoose.set('debug', true)
}


require('./models/User')
require('./models/Type')


app.use(require('./routes'))
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})



app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  })
})
const server = app.listen(process.env.PORT || 8000, function() {
  console.log('Listening on port ' + server.address().port)
})