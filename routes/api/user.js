const express = require('express')
const auth = require('../auth')
const userController = require('../../controller/user')
const getUserCurrent = require('../../middleware/getCurrentUser')

const userRouter = express.Router()

// Preload user object on routes with ':user'
userRouter.param('user', userController.preloadUser)
userRouter.route('/user')
  .get(auth.required, getUserCurrent, userController.getCurrentUser)
  .put(auth.required, getUserCurrent, userController.updateUser)

userRouter.post('/user/login', userController.login)

userRouter.post('/user/register', userController.register)

userRouter.delete('/user/:user', auth.required, userController.deleteUser)

module.exports = userRouter