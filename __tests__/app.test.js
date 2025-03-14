const endpointsJson = require("../endpoints.json");
/* Set up your test imports here */
const seed = require("../db/seeds/seed"); // db seeding function
const data = require("../db/data/test-data/index"); // test seed data
const db = require("../db/connection"); // db connection
const supertest = require("supertest"); // supertest suite
const app = require("../app");

/* Set up your beforeEach & afterAll functions here */

beforeEach(() => {
  return seed(data);
});

afterAll(() => {
  return db.end();
});

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return supertest(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});

describe("GET /api/topics", () => {
  test("200: Responds with an array of objects, with slug and description properties", () => {
    return supertest(app)
      .get("/api/topics")
      .expect(200)
      .then((response) => {
        const result = response.body.topics;
        expect(result.length).toBe(3);
        result.forEach((topic) => {
          expect(topic).toHaveProperty("slug");
          expect(topic).toHaveProperty("description");
        });
      });
  });
});

describe("GET /api/articles:article_id", () => {
  test("200: Responds with an article object", () => {
    return supertest(app)
      .get("/api/articles/3")
      .expect(200)
      .then((response) => {
        const article = response.body.article;
        expect(typeof article).toBe("object");
        expect(article.author).toBe("icellusedkars");
        expect(article.title).toBe("Eight pug gifs that remind me of mitch");
        expect(article.article_id).toBe(3);
        expect(article.body).toBe("some gifs");
        expect(article.topic).toBe("mitch");
        expect(article).toHaveProperty("created_at");
        expect(article.votes).toBe(0);
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("404: Responds with error when no records are found", () => {
    return supertest(app)
      .get("/api/articles/8888")
      .expect(404)
      .then((response) => {
        const error = response.body;
        expect(error.message).toBe("Not found");
        expect(error.status).toBe(404);
      });
  });
});

describe("GET /api/articles", () => {
  test("200: responds with an array of article objects with the specified properties", () => {
    return supertest(app)
      .get("/api/articles")
      .expect(200)
      .then((response) => {
        const articles = response.body.articles;
        expect(articles.length).toBe(13);
        articles.forEach((article) => {
          //  test for existence of required properties
          expect(article).toHaveProperty("author");
          expect(article).toHaveProperty("title");
          expect(article).toHaveProperty("article_id");
          expect(article).toHaveProperty("topic");
          expect(article).toHaveProperty("created_at");
          expect(article).toHaveProperty("votes");
          expect(article).toHaveProperty("article_img_url");
          expect(article).toHaveProperty("comment_count");
        });
      });
  });
  test("404: Responds with an error when no articles are found", async () => {
    // because db is populated, must first, delete all articles to generate error
    await db.query(`DELETE FROM articles`);

    // Then, make the request
    const response = await supertest(app).get("/api/articles").expect(404);

    // Check the response
    const error = response.body;
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
  });
});

describe("GET /api/articles/:article_id/comments", () => {
  test("200: Responds with an array of comments for a given article", () => {
    return supertest(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then((response) => {
        const { comments } = response.body;
        expect(comments.length).toBe(11);
        comments.forEach((comment) => {
          expect(comment.article_id).toBe(1);
          expect(comment).toHaveProperty("comment_id");
          expect(comment).toHaveProperty("votes");
          expect(comment).toHaveProperty("created_at");
          expect(comment).toHaveProperty("author");
          expect(comment).toHaveProperty("body");
        });
      });
  });
  test("400: Responds with 'bad request' when passed an invalid articleID", () => {
    return supertest(app)
      .get("/api/articles/dog/comments")
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("404: Responds with an error when no articles are found", () => {
    return supertest(app)
      .get("/api/articles/9999/comments")
      .expect(404)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(404);
        expect(body.message).toBe("Not found");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: Adds a comment to the specified article_id", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({ username: "rogersop", body: "my first comment" })
      .expect(201)
      .then((response) => {
        const body = response.body;
        expect(body).toHaveProperty("comment_id");
        expect(body).toHaveProperty("created_at");
        expect(body.article_id).toBe(1);
        expect(body.body).toBe("my first comment");
        expect(body.author).toBe("rogersop");
        expect(body.votes).toBe(0);
      });
  });
  test("400: responds with bad request when no username given", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({ body: "my first comment" })
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("400: responds with bad request when no comment provided", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({ username: "rogersop" })
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("400: responds with bad request when empty object submitted", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({})
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("400: responds with bad request when username too long", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({ username: "dobbydobbydobbydobby", body: "mt first comment" })
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("404: responds with Not found when article_id doesn't exist", () => {
    return supertest(app)
      .post("/api/articles/9999/comments")
      .send({ username: "rogersop", body: "my first comment" })
      .expect(404)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(404);
        expect(body.message).toBe("Not found");
      });
  });
  test("404: responds with Not found when user_id doesn't exist", () => {
    return supertest(app)
      .post("/api/articles/1/comments")
      .send({ username: "dobbin", body: "my first comment" })
      .expect(404)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(404);
        expect(body.message).toBe("Not found");
      });
  });
});
describe("PATCH /api/articles/:article_id", () => {
  test("200: modifies vote count and responds with an updated article object when {inc_votes} passed a positive value", () => {
    return supertest(app)
      .patch("/api/articles/2")
      .send({ inc_votes: 10 })
      .expect(200)
      .then((response) => {
        const article = response.body;
        expect(article.article_id).toBe(2);
        expect(article.votes).toBe(10);
        expect(article.topic).toBe("mitch");
        expect(article.title).toBe("Sony Vaio; or, The Laptop");
        expect(article.author).toBe("icellusedkars");
        expect(article.body).toBe("Call me Mitchell. Some years ago..");
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("200: reduces vote count when passed a negative number", () => {
    return supertest(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -25 })
      .expect(200)
      .then((response) => {
        const article = response.body;
        expect(article.article_id).toBe(1);
        expect(article.votes).toBe(75);
        expect(article.topic).toBe("mitch");
        expect(article.title).toBe("Living in the shadow of a great man");
        expect(article.author).toBe("butter_bridge");
        expect(article.body).toBe("I find this existence challenging");
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("200: sets vote count to zero when given a negative number exceeding current votes", () => {
    return supertest(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -150 })
      .expect(200)
      .then((response) => {
        const article = response.body;
        expect(article.article_id).toBe(1);
        expect(article.votes).toBe(0);
        expect(article.topic).toBe("mitch");
        expect(article.title).toBe("Living in the shadow of a great man");
        expect(article.author).toBe("butter_bridge");
        expect(article.body).toBe("I find this existence challenging");
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("400: bad request when empty object is submitted", () => {
    return supertest(app)
      .patch("/api/articles/1")
      .send({})
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("400: bad request when article_id is Nan", () => {
    return supertest(app)
      .patch("/api/articles/article1")
      .send({ inc_votes: 1 })
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("400: bad request when inc_votes is NaN", () => {
    return supertest(app)
      .patch("/api/articles/1")
      .send({ inc_votes: "ten" })
      .expect(400)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(400);
        expect(body.message).toBe("Bad request");
      });
  });
  test("404: not found when passed article_id doesn't exist", () => {
    return supertest(app)
      .patch("/api/articles/9999")
      .send({ inc_votes: 1 })
      .expect(404)
      .then((response) => {
        const body = response.body;
        expect(body.status).toBe(404);
        expect(body.message).toBe("Not found");
      });
  });
});
describe.only("DELETE /api/comments/:comment_id", () => {
  test("204: deletes the given comment and responds with no content", () => {
    return supertest(app).delete("/api/comments/1").expect(204);
  });
  test.todo("404: comment not found");
  test.todo("400: comment_id is invalid");
});
