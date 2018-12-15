var express = require("express");

var axios = require("axios");
var cheerio = require("cheerio");

// Import the models to use database functions
// ===========================================================
var db = require("../models");

// Initialize Express
// ===========================================================
var router = express.Router();

// Routes
// ===========================================================

// A GET route for the root using index.handlebars
router.get("/", (req, res) => {
    db.Article
        .find({
            saved: false
        })
        .then(function (dbArticle) {
            var hbsObject = {
                articles: dbArticle
            };
            res.render("index", hbsObject);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// A GET route for scraping the PBS NewsHour's latest headlines
router.get("/scrape", function (req, res) {
    // Remove previously scraped articles
    
    // First, we grab the body of the html with axios
    axios.get("https://www.pbs.org/newshour/latest").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        $("article a.card-timeline__title").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("span").text();
            result.link = $(this).attr("href");
            console.log(result);

            // Create a new Article using the `result` object built from scraping

            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    console.log("You have a scrape error: " + err);
                    return res.json(err);
                });
        });

        // Reload the page so that newly scraped articles will be shown on the page
        res.redirect("/");
    });
});

module.exports = router;