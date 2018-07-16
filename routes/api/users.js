const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require("../../models/User");

// @route       GET api/users/test
// @desc        Tests user route
// @access      Public
router.get("/test", (req, res) =>
    res.json({
        msg: "Users Works"
    })
);

// @route       POST api/users/register
// @desc        Register user
// @access      Public
router.post("/register", (req, res) => {
    const {errors, isValid} = validateRegisterInput(req.body);

    // Check basic data validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    // Check user existence in data base
    User.findOne({email: req.body.email}).then(user => {
        if (user) {
            errors.email = "Email already exists";
            return res.status(400).json(errors);
        } else {
            // get avatar from gravatar using email
            const avatar = gravatar.url(req.body.email, {
                s: 200, // Size
                r: "pg", // Rating
                d: "mm" // Default image
            });

            // create new user instance
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
            });
            // hash the password and save the user
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                });
            });
        }
    });
});

// @route       POST api/users/login
// @desc        Login user and return JWT Token
// @access      Public
router.post("/login", (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);

    // Check basic data validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);

    // Find user by email
    User.findOne({email: req.body.email})
        .then(user => {
            console.log(user);
            if (!user) {
                errors.email = "User not found";
                return res.status(404).json(errors);
            }

            // check password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        // User Matched. Create JWT payload
                        const payload = {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar
                        };

                        // Sign JWT
                        jwt.sign(
                            payload,
                            keys.secretOrKey,
                            {expiresIn: 3600},
                            (err, token) => {
                                res.json({
                                    success: true,
                                    token: "Bearer " + token
                                })
                            });
                    } else {
                        errors.password = "Password incorrect";
                        return res.status(400).json(errors);
                    }
                });
        }).catch(err => console.log(err));
});

// @route       POST api/users/current
// @desc        Return current JWT Token user holder
// @access      Private
router.get("/current", passport.authenticate("jwt", {session: false}), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});


module.exports = router;
