const express = require("express");
const app = express();
// const endpoints = require("./endpoints.json");
const { getApis, getTopics, getAllArticles } = require("./controllers/api");
const { getArticleByID } = require("./controllers/api");

// Task 1: GET /api
// returns all other available endpoints
app.get("/api", getApis);

// Task 2: GET /api/topics
// returns all topics
app.get("/api/topics", getTopics);

// Task 3: GET /api/articles/:id
// returns an article object of given id
app.get("/api/articles/:article_id", getArticleByID);

// Task 4: GET /api/articles
// returns an array of article objects
app.get("/api/articles", getAllArticles);


module.exports = app;
