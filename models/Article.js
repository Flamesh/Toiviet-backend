var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
var slug = require("slug");
var User = mongoose.model("User");
const Joi = require("joi");

var ArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

function validateArticle(article) {
  const Schema = {
    title: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(5).required(),
    body: Joi.string().min(5).required(),
    tagList: Joi.array(),
  };
  return Joi.validate(article, Schema);
}

ArticleSchema.plugin(uniqueValidator, { message: "is already taken" });

ArticleSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slugify();
  }

  next();
});

ArticleSchema.methods.slugify = function () {
  this.slug =
    slug(this.title) +
    "-" +
    ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

ArticleSchema.methods.updateFavoriteCount = function () {
  let article = this;
  return User.count({ favorited: { $in: [article._id] } })
  .then(function (count) {
    article.favoritesCount = count;
    return article.save();
  });
};

ArticleSchema.methods.toJSONFor = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user),
  };
};



mongoose.model("Article", ArticleSchema);
exports.validate = validateArticle;
