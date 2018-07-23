const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// DB Model
const Post = require("../../models/Posts");
// validation
const validatePostInput = require("../../validation/post");

// @route       GET api/posts/test
// @desc        Tests posts route
// @access      Public
router.get("/test", (req, res) =>
    res.json({
        msg: "Posts Works"
    })
);

// @route       POST api/posts
// @desc        Create posts
// @access      Private
router.post("/", passport.authenticate("jwt", {session: false}), (req, res) => {

    const { errors, isValid } = validatePostInput(req.body);

    // check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    // Create post
    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post));
});


// @route       DELETE api/posts
// @desc        Delete posts
// @access      Private
router.delete("/", passport.authenticate("jwt", {session: false}), (req, res) => {


});


module.exports = router;
