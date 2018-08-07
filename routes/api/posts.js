const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// DB Model
const Post = require("../../models/Posts");
const Profile = require("../../models/Profile");
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

// @route       GET api/posts
// @desc        Get all posts
// @access      Public
router.get("/", (req, res) => {
   Post.find()
       .sort({date: -1})
       .then(posts => res.json(posts))
       .catch(err => res.status(404).json({error: "No posts found"}));
});

// @route       GET api/posts/:id
// @desc        Get post by id
// @access      Public
router.get("/:id", (req, res) => {
    Post.findById(req.params.id)
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({error: "No post found with that Id"}));
});

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


// @route       DELETE api/posts/:id
// @desc        Delete post by id
// @access      Private
router.delete("/:id", passport.authenticate("jwt", {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id})
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check post owner
                    if (post.user.toString() !== req.user.id) {
                        return res.status(401).json({error: "Unauthorized"})
                    }
                    // Delete the post
                    post.remove().then(() => res.json({success: true}));
                })
                .catch(err => res.status(404).json({error: "Not found"}))
        })

});


// @route       POST api/posts/like/:id
// @desc        Like a post by id
// @access      Private
router.post("/like/:id", passport.authenticate("jwt", {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id})
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check if user already liked the post
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
                        return res.status(400).json({error: "User already liked this post"})
                    }

                    // Add user Id to likes array
                    post.likes.unshift({ user: req.user.id });

                    // Save the post
                    post.save().then(post => res.json(post));
                })
                .catch(err => res.status(404).json({error: "Not found"}))
        })
});

// @route       POST api/posts/unlike/:id
// @desc        Unlike a post by id
// @access      Private
router.post("/unlike/:id", passport.authenticate("jwt", {session: false}), (req, res) => {
    Profile.findOne({user: req.user.id})
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check if user already liked the post
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
                        return res.status(400).json({error: "User have not liked this post"})
                    }

                    // Get the index
                    const removeIndex = post.likes
                        .map(item => item.user.toString())
                        .indexOf(req.user.id);
                    // Remove user Id from likes array
                    post.likes.splice(removeIndex, 1);

                    // Save the post
                    post.save().then(post => res.json(post));
                })
                .catch(err => res.status(404).json({error: "Not found"}))
        })
});

// @route       POST api/posts/comment/:id
// @desc        Comment a post by id
// @access      Private
router.post("/comment/:id", passport.authenticate("jwt", {session: false}), (req, res) => {


    const { errors, isValid } = validatePostInput(req.body);
    // check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    
    
    Post.findById(req.params.id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name: req.body.name,
                avatar: req.body.avatar,
                user: req.user.id
            };

            // Add to comments array
            post.comments.unshift(newComment);

            // Save
            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({error: "Post not found"}));
});

// @route       DELETE api/posts/comment/:id
// @desc        Delete a comment post by id
// @access      Private
router.delete("/comment/:id/:comment_id", passport.authenticate("jwt", {session: false}), (req, res) => {
    
    Post.findById(req.params.id)
        .then(post => {
            // Check if comment exists
            if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){
                return res.status(404).json({error: "Not found"})
            }

            // Get the remove index
            const removeIndex = post.comments
                .map(item => item._id.toString())
                .indexOf(req.params.comment_id);

            // Check if it is from the user
            if (post.comments[removeIndex].user.toString() !== req.user.id) {
                return res.status(401).json({error: "Unauthorized. Can't delete a post from a different user"})
            }

            // remove it
            post.comments.splice(removeIndex, 1);

            // Save
            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({error: "Post not found"}))
});

module.exports = router;
