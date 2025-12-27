const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/* ==========================================================
   FEED – Kullanıcı + Takip Ettikleri
   Sayfalama: page=1,2,3… limit=15
========================================================== */

router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("userId", userId)
      .input("limit", limit)
      .input("offset", offset)
      .query(`
        SELECT 
          a.id AS activity_id,
          a.type,
          a.created_at,

          /* --- Aktiviteyi yapan kullanıcı --- */
          u.id AS user_id,
          u.username,
          u.avatar_url,

          /* --- İçerik bilgisi --- */
          c.id AS content_id,
          c.title AS content_title,
          c.type AS content_type,
          c.cover_url,

          /* --- Yorum --- */
          r.id AS review_id,
          r.body AS review_body,
          r.user_id AS review_author_id,
          ru.username AS review_author_username,

          /* --- Puanlama --- */
          ra.rating,

          /* --- Yoruma cevap --- */
          rep.body AS reply_body,
          rep.user_id AS reply_user_id,
          repu.username AS reply_username,

          /* --- Beğenilen Aktivite (reaction_id) --- */
          liked_act.type AS liked_type,
          liked_act.content_id AS liked_content_id,
          liked_act.review_id AS liked_review_id,
          liked_act.rating_id AS liked_rating_id

        FROM activities a
        
        JOIN users u ON u.id = a.user_id

        LEFT JOIN contents c ON c.id = a.content_id
        LEFT JOIN reviews r ON r.id = a.review_id
        LEFT JOIN users ru ON ru.id = r.user_id

        LEFT JOIN ratings ra ON ra.id = a.rating_id

        LEFT JOIN review_replies rep ON rep.id = a.reply_id
        LEFT JOIN users repu ON repu.id = rep.user_id

        LEFT JOIN activities liked_act ON liked_act.id = a.reaction_id

        WHERE 
          a.user_id = @userId
          OR a.user_id IN (
            SELECT followed_id FROM follows WHERE follower_id = @userId
          )

        ORDER BY a.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("FEED PAGINATION ERROR:", err);
    res.status(500).json({ message: "Akış getirilemedi" });
  }
});


/* ==========================================================
   AKTİVİTE BEĞENME
========================================================== */

/* ==========================================================
   AKTİVİTE BEĞENME  (FEED LIKE)
========================================================== */
router.post("/:activityId/like", verifyToken, async (req, res) => {
  const activityId = parseInt(req.params.activityId, 10);
  const userId = req.user.id;

  if (isNaN(activityId)) {
    return res.status(400).json({ message: "Geçersiz activityId" });
  }

  try {
    const pool = await connectDB();

    /* ---------------------------------------------------
       1) DAHA ÖNCE BEĞENMİŞ Mİ → EVETSE BEĞENİYİ SİL
    -----------------------------------------------------*/
    const check = await pool.request()
      .input("activity_id", activityId)
      .input("user_id", userId)
      .query(`
        SELECT id FROM activity_likes
        WHERE activity_id = @activity_id AND user_id = @user_id
      `);

    if (check.recordset.length > 0) {
      await pool.request()
        .input("activity_id", activityId)
        .input("user_id", userId)
        .query(`
          DELETE FROM activity_likes
          WHERE activity_id = @activity_id AND user_id = @user_id
        `);

      return res.json({ liked: false });
    }

    /* ---------------------------------------------------
       2) BEĞENİ EKLE
    -----------------------------------------------------*/
    await pool.request()
      .input("activity_id", activityId)
      .input("user_id", userId)
      .query(`
        INSERT INTO activity_likes (activity_id, user_id, created_at)
        VALUES (@activity_id, @user_id, GETDATE())
      `);

    /* ---------------------------------------------------
       3) BEĞENİLEN AKTİVİTEYİ GETİR
    -----------------------------------------------------*/
    const liked = await pool.request()
      .input("id", activityId)
      .query(`
        SELECT type, review_id, rating_id, content_id
        FROM activities
        WHERE id = @id
      `);

    const target = liked.recordset[0];

    /* ---------------------------------------------------
       4) EĞER BU BEĞENİ BİR YORUMA AİTSE → review_like ACTIVITI OLUŞTUR
    -----------------------------------------------------*/
    if (target && target.review_id) {
      await pool.request()
        .input("user_id", userId)
        .input("review_id", target.review_id)
        .input("content_id", target.content_id)
        .query(`
          INSERT INTO activities (user_id, type, review_id, content_id, created_at)
          VALUES (@user_id, 'review_like', @review_id, @content_id, GETDATE())
        `);
    }

    /* ---------------------------------------------------
       5) PUANLAMAYI BEĞENMEK (İSTERSEN AKTİVİTE OLUŞTUR)
       Şimdilik eklemedim ama istersen rating_like da yapabiliriz.
    -----------------------------------------------------*/

    return res.json({ liked: true });

  } catch (err) {
    console.error("LIKE ERROR:", err);
    return res.status(500).json({ message: "Beğeni işlemi başarısız" });
  }
});



/* ==========================================================
   AKTİVİTE YORUMU
========================================================== */

router.post("/:activityId/comment", verifyToken, async (req, res) => {
  const activityId = parseInt(req.params.activityId, 10);
  const { body } = req.body;
  const userId = req.user.id;

  if (!body || !body.trim()) {
    return res.status(400).json({ message: "Yorum boş olamaz" });
  }

  try {
    const pool = await connectDB();

    await pool.request()
      .input("activity_id", activityId)
      .input("user_id", userId)
      .input("body", body)
      .query(`
        INSERT INTO activity_comments (activity_id, user_id, body)
        VALUES (@activity_id, @user_id, @body)
      `);

    res.json({ message: "Yorum eklendi" });

  } catch (err) {
    console.error("COMMENT ERROR:", err);
    res.status(500).json({ message: "Yorum eklenemedi" });
  }
});


/* ==========================================================
   AKTİVİTE YORUMLARINI GETİR
========================================================== */

router.get("/:activityId/comments", verifyToken, async (req, res) => {
  const activityId = parseInt(req.params.activityId, 10);

  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("activity_id", activityId)
      .query(`
        SELECT ac.id,
               ac.body,
               ac.created_at,
               u.id AS user_id,
               u.username,
               u.avatar_url
        FROM activity_comments ac
        JOIN users u ON u.id = ac.user_id
        WHERE ac.activity_id = @activity_id
        ORDER BY ac.created_at ASC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("COMMENTS GET ERROR:", err);
    res.status(500).json({ message: "Yorumlar alınamadı" });
  }
});

module.exports = router;
