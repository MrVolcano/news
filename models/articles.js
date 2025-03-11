const db = require("../db/connection");

function selectArticleByID(articleID) {
  return db.query("SELECT * FROM articles WHERE article_id = $1;", [articleID]);
}

function selectAllArticles() {
  return db.query(`
    SELECT 
    a.article_id,
    a.title,
    a.topic,
    a.author,
    a.created_at,
    a.votes,
    a.article_img_url,
    COUNT(c.comment_id) AS comment_count
FROM 
    articles a
LEFT JOIN 
    comments c ON a.article_id = c.article_id
GROUP BY 
    a.article_id
ORDER BY 
    a.created_at DESC;`);
}

module.exports = { selectArticleByID, selectAllArticles };
