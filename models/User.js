const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = require("../config").secret;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "Không được để trống"],
      match: [/^[a-zA-Z0-9]+$/, "Không được xử  dụng ký tự đặc biệt"],
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "Không được để trống"],
      match: [/^[a-zA-Z0-9]+$/, "Không được xử  dụng ký tự đặc biệt"],
      index: true,
    },
    bio: String,
    image: String,
    cover: String,
    birthday: Date,
    gender: String,
    phoneNumber: String,
    address: String,
    description: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    typeLike: [{ type: mongoose.Schema.Types.ObjectId, ref: "Type" }],
    token: Number,
    hash: String,
    admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// function validateUser(user) {
//     const schema = {
//         username: Joi.string().min(5).max(50).required(),
//         email: Joi.string().min(5).max(255).required().email(),
//         password: Joi.string().min(5).max(255).required(),
//         birthday: Joi.date().required(),
//         address: Joi.string().min(5).require(),
//         phoneNumber: Joi.string().min(9).max(11).require(),
//     }
// }

UserSchema.plugin(uniqueValidator, { message: "is already taken" });

UserSchema.pre("save", function (next) {
  const user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("hash")) return next();

  bcrypt.hash(user.hash, 10, function (err, hash) {
    if (err) return next(err);

    // override the cleartext password with the hashed one
    user.hash = hash;
    next();
  });
});

UserSchema.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.hash, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.generateJWT = function () {
  const today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 60); // time token

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      admin: this.admin,
      exp: parseInt(exp.getTime() / 1000),
    },
    secret
  );
};

UserSchema.methods.toProfileJSONFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image
      ? this.image
      : "https://drive.google.com/file/d/1iiJhzjGp-9EaXiSRxaxmdE5wQHR9n-Dp/view?usp=sharing",
    cover: this.cover
      ? this.cover
      : "https://xansan.com/wp-content/uploads/2018/10/default-cover.gif",
    birthday: this.birthday ? this.birthday : new Date(),
    phoneNumber: this.phoneNumber ? this.phoneNumber : "0123456789",
    gender: this.gender ? this.gender : "Male",
    amdin: this.amdin,
  };
};

UserSchema.methods.favorite = function (id) {
  if (this.favorites.indexOf(id) === -1) {
    // Chưa like bao giờ
    this.favorites.push(id);
  }

  return this.save();
};

UserSchema.methods.unfavorite = function (id) {
  this.favorites.remove(id);
  return this.save();
};

UserSchema.methods.isFavorite = function (id) {
  return this.favorites.some(function (favoriteId) {
    return favoriteId.toString() === id.toString();
  });
};

UserSchema.methods.follow = function (id) {
  if (this.following.indexOf(id) === -1) {
    this.following.push(id);
  }

  return this.save();
};

UserSchema.methods.unfollow = function (id) {
  this.following.remove(id);
  return this.save();
};

UserSchema.methods.isFollowing = function (id) {
  return this.following.some(function (followId) {
    return followId.toString() === id.toString();
  });
};

UserSchema.methods.likeType = function (id) {
  if (this.typeLike.indexOf(id) === -1) {
    this.typeLike.push(id);
  }
  return this.save();
};

UserSchema.methods.unLikeType = function (id) {
  this.typeLike.remove(id);
  return this.save()
};

mongoose.model("User", UserSchema);
