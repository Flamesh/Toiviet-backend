var router = require("express").Router();
const { article_module } = require("../../const/model");

const { validate } = require("../../models/Article");
var mongoose = require("mongoose");
var Article = mongoose.model(article_module);
var Comment = mongoose.model("Comment");
var User = mongoose.model("User");
var auth = require("../auth");

// Preload article objects on routes with ':article'
router.param("article", function (req, res, next, slug) {
  Article.findOne({ slug: slug })
    .populate("author") // join trong sql
    .then(function (article) {
      if (!article) {
        return res.sendStatus(404);
      }

      req.article = article;

      return next();
    })
    .catch(next);
});

//Preload comment object on router with ':comment'
router.param("comment", function (req, res, next, id) {
  Comment.findById(id)
    .then(function (comment) {
      if (!comment) {
        return res.sendStatus(404);
      }

      req.comment = comment;

      return next();
    })
    .catch(next);
});

// return all article
router.get("/", auth.optional, function (req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if (typeof req.query.limit !== "undefined") {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== "undefined") {
    offset = req.query.offset;
  }

  if (typeof req.query.tag !== "undefined") {
    query.tagList = { $in: [req.query.tag] };
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited
      ? User.findOne({ username: req.query.favorited })
      : null,
  ])
    .then(function (results) {
      var author = results[0];
      var favoriter = results[1];

      if (author) {
        query.author = author._id;
      }

      if (favoriter) {
        query._id = { $in: favoriter.favorites };
      } else if (req.query.favorited) {
        query._id = { $in: [] };
      }

      return Promise.all([
        Article.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: "desc" })
          .populate("author")
          .exec(),
        Article.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
      ]).then(function (results) {
        var articles = results[0];
        var articlesCount = results[1];
        var user = results[2];

        return res.json({
          articles: articles.map(function (article) {
            return article.toJSONFor(user);
          }),
          articlesCount: articlesCount,
        });
      });
    })
    .catch(next);
});

router.post("/", auth.require, function (req, res, next) {
  // const { error } = validate(req.body.article);
  // if (error) return res.status(400).send("bad request");
  User.findById(req.payload.id)
    .then(function (user) {
      if (!user) {
        return res.sendStatus(401);
      }

      if (!req.body.article) res.status(400).send("Sai định dạng");

      const { error } = validate(req.body.article);
      if (error) res.status(400).send(error.details[0].message);
      var article = new Article(req.body.article);

      article.author = user;

      return article.save().then(function () {
        // console.log(article.author);
        return res.json({ article: article.toJSONFor(user) });
      });
    })
    .catch(next);
});

// return an article
router.get("/:article", auth.optional, function (req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.article.populate("author").execPopulate(),
  ])
    .then(function (results) {
      const user = results[0];

      return res.json({ article: req.article.toJSONFor(user) });
    })
    .catch(next);
});

//update article
router.put("/:article", auth.require, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (req.article.author._id.toString() === req.payload.id.toString()) {
      if (typeof req.body.article.title !== "undefined") {
        req.article.title = req.body.article.title;
      }

      if (typeof req.body.article.description !== "undefined") {
        req.article.description = req.body.article.description;
      }

      if (typeof req.body.article.body !== "undefined") {
        req.article.body = req.body.article.body;
      }

      if (typeof req.body.article.tagList !== "undefined") {
        req.article.tagList = req.body.article.tagList;
      }

      req.article
        .save()
        .then(function () {
          return res.sendStatus(200);
        })
        .catch(next);
    } else {
      return res.sendStatus(400);
    }
  });
});

//delete article
router.delete("/:delete", auth.require, function (req, res, next) {
  User.findById(res.payload.id)
  .then(function (user) {
    if (!user) return res.sendStatus(404);
    if (req.article.author._id.toString() === req.payload.id.toString()) {
      return req.article.remove().then(function () {
        return res.sendStatus(200);
      });
    } else {
      return res.sendStatus(400);
    }
  })
  .catch(next)
});

// Favorite an article
router.post("/:article/favorite", auth.require, function (req, res, next) {
  const articleId = req.article._id;

  User.findById(req.payload.id)
  .then(function(user) {
    if(!user) res.sendStatus(404)

    return user.favorited(articleId)
    .then(function() {
      return req.article.updateFavoriteCount().then(function() {
        res.sendStatus(200)
      })
    })
  }).catch(next)
});

// Unfavorite 
router.delete("/:article/favorite", auth.require, function(req, res, next){
  const articleId = req.article._id;
  User.findById(req.payload.id)
  .then(function(user) {
    if(!user) res.sendStatus(404)

    return user.unfavorite(articleId).then(function() {
      return req.article.updateFavoriteCount().then(function() {
        res.sendStatus(200)
      })
    })
  })
})

router.get("/:article/comments", auth.optional, function (req, res, next) {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
    .then(function (user) {
      return req.article
        .populate({
          path: "comments",
          populate: {
            path: "author",
          },
          options: {
            sort: {
              createdAt: "desc",
            },
          },
        })
        .execPopulate()
        .then(function (article) {
          return res.json({
            comments: req.article.comments.map(function (comment) {
              return comment.toJSONFor(user);
            }),
          });
        });
    })
    .catch(next);
});

module.exports = router;
