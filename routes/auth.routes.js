const router = require("express").Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isLoggedOut and isLoggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/auth/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

router.post("/auth/signup", isLoggedOut, (req, res) => {

  const { email, passwordHash, isAdmin } = req.body;
  

  if (!email) {
    return res.status(400).render("auth/signup", {
      errorMessage: "Please provide your email.",
    });
  }

  if (passwordHash.length < 8) {
    return res.status(400).render("auth/signup", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });
  }

  //   ! This use case is using a regular expression to control for special characters and min length

   const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

  if (!regex.test(passwordHash)) {
    return res.status(400).render("auth/signup", {
      errorMessage:
        "Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });
  }
 

  // Search the database for a user with the email submitted in the form
  User.findOne({ email }).then((found) => {
    // If the user is found, send the message email is taken
    if (found) {
      return res
        .status(400)
        .render("auth/signup", { errorMessage: "email already taken." });
    }

    // if user is not found, create a new user - start with hashing the password
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => {        
        return bcrypt.hash(passwordHash, salt);
      })
      .then((hashedPassword) => {
        // Create a user and save it in the database        

        const newUser = {
          email: email,
          passwordHash: hashedPassword,
          isAdmin: isAdmin,
        };       

        return User.create(newUser);
      })
      .then((user) => {
        // Bind the user to the session object        
        req.session.user = user;
        res.redirect("/");
      })
      .catch((error) => {
        if (error instanceof mongoose.Error.ValidationError) {
          return res
            .status(400)
            .render("auth/signup", { errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res
            .status(400)
            .render("auth/signup", {
              errorMessage:
                "email need to be unique. The email you chose is already in use.",
            });
        }
        return res
          .status(500)
          .render("auth/signup", { errorMessage: error.message });
      });
  });
});

router.get("/auth/login", isLoggedOut, (req, res) => {  
  res.render("auth/login");
});

router.post("/auth/login", isLoggedOut, (req, res, next) => {

  const { email, passwordHash } = req.body;

  if (!email) {
    return res
      .status(400)
      .render("auth/login", { errorMessage: "Please provide your email." });
  }
  
  

  // Search the database for a user with the email submitted in the form
  User.findOne({ email })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res
          .status(400)
          .render("auth/login", { errorMessage: "Wrong Email Address." });
      }

      // If user is found based on the email, check if the in putted password matches the one saved in the database
      bcrypt.compare(passwordHash, user.passwordHash).then((isSamePassword) => {
        if (!isSamePassword) {
          return res
            .status(400)
            .render("auth/login", { errorMessage: "Wrong password." });
        }

        req.session.user = user;
        // req.session.user = user._id; // ! better and safer but in this case we saving the entire user object
        return res.redirect("/");
      });
    })

    .catch((err) => {
      // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
      // you can just as easily run the res.status that is commented out below
      next(err);
      return res
        .status(500)
        .render("auth/login", { errorMessage: err.message });
    });
});

router.get("/auth/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .render("auth/logout", { errorMessage: err.message });
    }

    res.redirect("/");
  });
});

module.exports = router;
