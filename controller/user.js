const mongoose = require('mongoose')
const passport = require('passport')
const { json } = require('express')

const User = mongoose.model('User')

const getCurrentUser = (req, res, next) => {
    return res.json({ user: req.user.toAuthJSON() })
  }

const updateUser = (req, res, next) => {
    const {user} = req

    Object.keys(req.body.user).map((key) => {
        if(key==='password'){
            user.hash = req.body.password
        }
        user[key] = req.body.user[key]
    })

    return user.save().then(function() {
        return res.json({user: user.toAuthJSON()})
    })
}

const login = (req, res, next) => {
    Object.keys(req, res, next).map((key) => {
        if(key !== 'email'&& key !== 'password') {
            return res.status(422).json({
                errors: {
                    message: 'Thiếu tên đăng nhập hoặc mật khẩu'
                }
            })
        }
    })

    passport.authenticate('local', {session: false}, function(err, user, info) {
        if(err) return next(err)

        if(user){
            return res.json({user: user.toAuthJSON()})
        }
        else {
            return res.status(422).json(info)
        }

    })(req, res, next)
}


const register = (req, res, next) => {
    const user = new User()

    user.username = req.body.user.username,
    user.email = req.body.user.email,
    user.hash = req.body.user.hashm

    user.save().then(function() {
        return res.json({user: user.toAuthJSON()})
    }).catch(next)
}

const deleteUser = (req, res, next) => {
    if (req.payload.admin === true || req.user.username === req.payload.username) {
        return req.user.deleteOne().then(function () {
          return res.sendStatus(204)
        })
      } else {
        const err = new Error('Only an admin can delete another user')
        err.status = 403
        err.name = 'Forbidden'
        return next(err)
      }
}

const preloadUser = async (req, res, next) => {
    const user = await User.findOne({user: user.name})

    if(!user) {
        const err = new Error('Không có người dùng')
        err.status = 404
        err.name = 'Not Found'
        return next(err)
    }

    req.user = user
    return next()
}

module.exports = {
    getCurrentUser,
    updateUser,
    login,
    register,
    deleteUser,
    preloadUser,
}