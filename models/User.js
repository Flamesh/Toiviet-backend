const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const secret = require('../config').secret;
const Joi = require('joi')

const UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true, required: [true, 'Không được để trống'], match: [/^[a-zA-Z0-9]+$/, 'Không được xử  dụng ký tự đặc biệt'], index: true},
    email: {type: String, lowercase: true, unique: true, required: [true, 'Không được để trống'], match: [/^[a-zA-Z0-9]+$/, 'Không được xử  dụng ký tự đặc biệt'], index: true},
    bio: String,
    image: String,
    cover: String,
    birthday: Date,
    gender: String,
    phoneNumber: String,
    address: String,
    description: String,
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Article'}],
    following: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    typeFollowing: [{type: mongoose.Schema.Types.ObjectId, ref: 'Type'}],
    token: Number,
    hash: String,
    salt: String,
}, {timestamps: true})


function validateUser(user) {
    const schema = {
        username: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        birthday: Joi.date().required(),
        address: Joi.string().min(5).require(),
        phoneNumber: Joi.string().min(9).max(11).require(),

    }
}


UserSchema.plugin(uniqueValidator, {message: 'is already taken'})

UserSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
  };

UserSchema.methods.generateJWT = function(){
    const today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60) // time token 

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)
    }, secret)
};

UserSchema.methods.toProfileJSONFor = function(user) {
    return{
        username: this.username,
        bio: this.bio,
        image: this.image ? this.image : 'https://drive.google.com/file/d/1iiJhzjGp-9EaXiSRxaxmdE5wQHR9n-Dp/view?usp=sharing',
        cover: this.cover ? this.cover : 'https://xansan.com/wp-content/uploads/2018/10/default-cover.gif',
        birthday: this.birthday ? this.birthday : new Date(),
        phoneNumber: this.phoneNumber ? this.phoneNumber : '0123456789',
        gender: this.gender ? this.gender : 'Male',
        following: user ? user.isFollowing((this._id)) : false
    };
};

UserSchema.methods.favorite = function(id){
    if(this.favorites.indexOf(id) === -1){
      this.favorites.push(id);
    }
  
    return this.save();
  };
UserSchema.methods.unfavorites = function(id){
    this.favorites.remove(id);
    return this.save();
}

UserSchema.method.isFavorite = function(id){
    return this.favorites.some(function(favoriteId) {
        return favoriteId.toString() === id.toString();
    })
}

UserSchema.methods.follow = function(id){
    if(this.following.indexOf(id) === -1){
        this.following.push(id)
    }
    return this.save()
}


UserSchema.methods.unFollowing = function(id){
    return this.following.some(function(followingId){
        return followingId.toString() === id.toString();
    })
}


mongoose.model('User', UserSchema)