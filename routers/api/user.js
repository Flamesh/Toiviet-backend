const mongoose = require('mongoose')
const router = require('express').Router()
const passport= require('passport')
const User = mongoose.model('User')
const auth = require('../auth')


