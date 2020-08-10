const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const User = mongoose.model("User");
const auth = require("../auth");

router.get("/user", auth.require, function (req, res, next) {
  User.findById(req.payload.id)
  .then(function (user) {
    if (!user) {
      return res.sendStatus(401);
    }
    return res.json({ user: user.toAuthJSON() });
  }).catch(next)
});

router.put('/user', auth.required, function(req, res, next) {
    User.findById(res.payload.id).then(function(user){
        if(!user) {return res.sendStatus(401)}
    })

    // only update fields that were actually passed...
    
})
