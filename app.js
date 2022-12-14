// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv/config");

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");

const path = require('path');

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const capitalized = require("./utils/capitalized");
const projectName = "modern-restaurant-application";

app.locals.appTitle = `${capitalized(projectName)}`;

// Register the location for handlebars partials here:
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Handlebar helper for preselecting the correct category when editing a product
hbs.registerHelper("select", function(value, options) {
    return options.fn(this)
      .split('\n')
      .map(function(v) {
        var t = 'value="' + value + '"'
        return ! RegExp(t).test(v) ? v : v.replace(t, t + ' selected="selected"')
      })
      .join('\n')
  });


// 👇 Start handling routes here

app.use("/", require("./routes/index.routes"));
app.use("/", require("./routes/item.routes"));
app.use("/", require("./routes/auth.routes"));

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
