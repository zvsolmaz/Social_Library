// routes/contents.js
const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   1) KEŞFET + YORUMLU İÇERİKLER (with-reviews)
===================================================== */
// routes/contents.js içinde
router.get("/top-rated", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 10
        c.id,
        c.title,
        c.cover_url,
        c.year,
        AVG(r.rating) AS avg_rating,
        COUNT(r.id) AS rating_count
      FROM contents c
      LEFT JOIN ratings r ON r.content_id = c.id
      GROUP BY c.id, c.title, c.cover_url, c.year
      HAVING COUNT(r.id) > 0
      ORDER BY avg_rating DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("TOP RATED ERROR:", err);
    res.status(500).json({ message: "Top rated alınamadı" });
  }
});
router.get("/most-popular", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 10
        c.id,
        c.title,
        c.cover_url,
        c.year,
        COUNT(rv.id) AS review_count
      FROM contents c
      LEFT JOIN reviews rv ON rv.content_id = c.id
      GROUP BY c.id, c.title, c.cover_url, c.year
      ORDER BY review_count DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("MOST POPULAR ERROR:", err);
    res.status(500).json({ message: "Most popular alınamadı" });
  }
});
router.get("/filter", async (req, res) => {
  const { genre, year, rating } = req.query;

  try {
    const pool = await connectDB();
    let query = `
      SELECT c.id, c.title, c.cover_url, c.year
      FROM contents c
      LEFT JOIN ratings r ON r.content_id = c.id
      WHERE 1 = 1
    `;

    if (genre) query += ` AND c.genre LIKE '%${genre}%'`;
    if (year) query += ` AND c.year = ${year}`;
    if (rating) query += ` AND r.rating >= ${rating}`;

    query += `
      GROUP BY c.id, c.title, c.cover_url, c.year
      ORDER BY c.year DESC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error("FILTER ERROR:", err);
    res.status(500).json({ message: "Filtreleme başarısız" });
  }
});

/* =====================================================  
   TÜM İÇERİKLER
===================================================== */
router.get("/all", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.year,
        c.type,
        c.cover_url,
        c.created_at,
        ISNULL(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS rating_count,
        (SELECT COUNT(*) FROM reviews rv WHERE rv.content_id = c.id) AS review_count
      FROM contents c
      LEFT JOIN ratings r ON r.content_id = c.id
      GROUP BY 
        c.id, c.title, c.description,
        c.year, c.type, c.cover_url, c.created_at
      ORDER BY c.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("CONTENTS ALL ERROR:", err);
    res.status(500).json({ message: "İçerikler alınamadı" });
  }
});



router.get("/with-reviews", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT 
        c.id AS content_id,
        c.title,
        c.type,
        c.year,
        c.cover_url,

        r.id AS review_id,
        r.body AS review_body,
        r.created_at AS review_date,

        u.id AS user_id,
        u.username,
        u.avatar_url

      FROM contents c
      LEFT JOIN reviews r ON r.content_id = c.id
      LEFT JOIN users u ON u.id = r.user_id

      ORDER BY c.id, r.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("WITH-REVIEWS ERROR:", err);
    res.status(500).json({ message: "Veriler alınamadı" });
  }
});

/* =====================================================
   2) TÜM İÇERİKLER
===================================================== */
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT id, type, title, description, year, cover_url
      FROM contents
      ORDER BY created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("CONTENTS ERROR:", err);
    res.status(500).json({ message: "İçerikler alınamadı" });
  }
});
router.get("/:id/reviews", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT
          r.id,
          r.title,
          r.body,
          r.created_at,
          r.user_id,  
          u.username,

          -- ✅ BEĞENİ SAYISI (review_reactions üzerinden)
          (
            SELECT COUNT(*) 
            FROM review_reactions 
            WHERE review_id = r.id AND type = 'like'
          ) AS like_count,

          -- ✅ CEVAPLAR
          (
            SELECT
              rr.id,
              rr.body,
              rr.created_at,
              u2.username
            FROM review_replies rr
            JOIN users u2 ON rr.user_id = u2.id
            WHERE rr.review_id = r.id
            FOR JSON PATH
          ) AS replies

        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.content_id = @id
        ORDER BY r.created_at DESC
      `);

    const reviews = result.recordset.map((r) => ({
      ...r,
      replies: r.replies ? JSON.parse(r.replies) : [],
    }));

    res.json(reviews);

  } catch (err) {
    console.error("REVIEWS ERROR:", err);
    res.status(500).json({ message: "Yorumlar alınamadı" });
  }
});

/* =====================================================
   6) PUAN VERME (RATING)
===================================================== */
router.post("/:id/rate", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { rating } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 10) {
    return res.status(400).json({ message: "Puan 1-10 arasında olmalı" });
  }

  try {
    const pool = await connectDB();

    const existing = await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .query(`
        SELECT id FROM ratings 
        WHERE user_id = @user_id AND content_id = @content_id
      `);

    let ratingId;

    if (existing.recordset.length > 0) {
      ratingId = existing.recordset[0].id;

      await pool
        .request()
        .input("id", ratingId)
        .input("rating", rating)
        .query(`
          UPDATE ratings
          SET rating = @rating, updated_at = GETDATE()
          WHERE id = @id
        `);
    } else {
      const insert = await pool
        .request()
        .input("user_id", userId)
        .input("content_id", id)
        .input("rating", rating)
        .query(`
          INSERT INTO ratings (user_id, content_id, rating, created_at)
          VALUES (@user_id, @content_id, @rating, GETDATE());
          SELECT SCOPE_IDENTITY() AS id;
        `);

      ratingId = insert.recordset[0].id;
    }

    await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .query(`
        DELETE FROM activities
        WHERE user_id = @user_id AND content_id = @content_id AND type = 'rating'
      `);

    await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .input("rating_id", ratingId)
      .query(`
        INSERT INTO activities (user_id, type, content_id, rating_id, created_at)
        VALUES (@user_id, 'rating', @content_id, @rating_id, GETDATE())
      `);

    res.json({ message: "Puan kaydedildi" });
  } catch (err) {
    console.error("RATE ERROR:", err);
    res.status(500).json({ message: "Puan verilemedi" });
  }
});
router.post("/:id/reviews", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, body } = req.body;
  const userId = req.user.id;

  if (!body) {
    return res.status(400).json({ message: "Yorum boş olamaz" });
  }

  try {
    const pool = await connectDB();

    const insert = await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .input("title", title || null)
      .input("body", body)
      .query(`
        INSERT INTO reviews (user_id, content_id, title, body, created_at)
        VALUES (@user_id, @content_id, @title, @body, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const reviewId = insert.recordset[0].id;

    await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .input("review_id", reviewId)
      .query(`
        INSERT INTO activities (user_id, type, content_id, review_id, created_at)
        VALUES (@user_id, 'review', @content_id, @review_id, GETDATE())
      `);

    res.json({ message: "Yorum eklendi" });
  } catch (err) {
    console.error("REVIEW ADD ERROR:", err);
    res.status(500).json({ message: "Yorum eklenemedi" });
  }
});
/* =====================================================
   7) YORUM EKLEME
===================================================== */

router.post("/reviews/:reviewId/like", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const pool = await connectDB();

    const check = await pool.request()
      .input("review_id", reviewId)
      .input("user_id", userId)
      .query(`
        SELECT * FROM review_reactions
        WHERE review_id=@review_id AND user_id=@user_id AND type='like'
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "Zaten beğenmişsin" });
    }

    await pool.request()
      .input("review_id", reviewId)
      .input("user_id", userId)
      .query(`
        INSERT INTO review_reactions (review_id, user_id, type)
        VALUES (@review_id, @user_id, 'like')
      `);

    res.json({ message: "Beğenildi ✅" });

  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ message: "Beğeni başarısız" });
  }
});
/* ===========================
   ✅ YORUMA CEVAP VERME
   POST /reviews/:id/reply
=========================== */
router.post("/reviews/:id/reply", verifyToken, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  const { body } = req.body;
  const userId = req.user.id;

  if (!body || !body.trim()) {
    return res.status(400).json({ message: "Cevap boş olamaz" });
  }

  try {
    const pool = await connectDB();

    await pool.request()
      .input("review_id", reviewId)
      .input("user_id", userId)
      .input("body", body)
      .query(`
        INSERT INTO review_replies (review_id, user_id, body, created_at)
        VALUES (@review_id, @user_id, @body, GETDATE())
      `);

    res.json({ message: "Cevap eklendi ✅" });

  } catch (err) {
    console.error("REPLY ERROR:", err);
    res.status(500).json({ message: "Cevap eklenemedi" });
  }
});
/* =====================================================
   8) YORUM DÜZENLEME (SADECE SAHİBİ)
===================================================== */
router.put("/reviews/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { body } = req.body;
    const userId = req.user.id;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Yorum boş olamaz" });
    }

    const pool = await connectDB();

    // Bu yorum gerçekten bu kullanıcıya mı ait?
    const check = await pool
      .request()
      .input("id", reviewId)
      .input("user_id", userId)
      .query(`
        SELECT id FROM reviews
        WHERE id = @id AND user_id = @user_id
      `);

    if (check.recordset.length === 0) {
      return res
        .status(403)
        .json({ message: "Bu yorumu düzenleme yetkiniz yok" });
    }

    // Güncelle
    await pool
      .request()
      .input("id", reviewId)
      .input("body", body)
      .query(`
        UPDATE reviews
        SET body = @body, updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json({ message: "Yorum güncellendi" });
  } catch (err) {
    console.error("UPDATE REVIEW ERROR:", err);
    res.status(500).json({ message: "Yorum güncellenemedi" });
  }
});
/* =====================================================
   🗑 YORUM SİLME (SADECE SAHİBİ)
   DELETE /contents/reviews/:reviewId
===================================================== */
router.delete("/reviews/:reviewId", verifyToken, async (req, res) => {
  try {
    console.log("🔥 DELETE ROUTE'A GİRDİM:", req.params.reviewId);

    const { reviewId } = req.params;
    const userId = req.user.id;

    const pool = await connectDB();

    // 1) Bu yorum sana mı ait?
    const check = await pool
      .request()
      .input("id", reviewId)
      .input("user_id", userId)
      .query(`
        SELECT id FROM reviews
        WHERE id = @id AND user_id = @user_id
      `);

    if (check.recordset.length === 0) {
      return res.status(403).json({ message: "Bu yorumu silme yetkiniz yok" });
    }

    // --- SİLME SIRASI DOĞRU! ---
    
    // 1) Cevapları sil
    await pool
      .request()
      .input("review_id", reviewId)
      .query(`
        DELETE FROM review_replies WHERE review_id=@review_id
      `);

    // 2) Beğenileri sil
    await pool
      .request()
      .input("review_id", reviewId)
      .query(`
        DELETE FROM review_reactions WHERE review_id=@review_id
      `);

    // 3) Aktivite kaydı varsa sil
    await pool
      .request()
      .input("review_id", reviewId)
      .query(`
        DELETE FROM activities WHERE review_id=@review_id
      `);

    // 4) Yorumu sil
    await pool
      .request()
      .input("id", reviewId)
      .query(`
        DELETE FROM reviews WHERE id=@id
      `);

    return res.json({ message: "Yorum silindi" });

  } catch (err) {
    console.error("DELETE REVIEW ERROR:", err);
    res.status(500).json({ message: "Yorum silinemedi" });
  }
});

/* =====================================================
   4) KULLANICI KÜTÜPHANESİNE EKLE 
      POST /contents/:id/library
===================================================== */
router.post("/:id/library", verifyToken, async (req, res) => {
  const { id } = req.params;       // content_id
  const { status } = req.body;     // watched, to_watch, read, to_read
  const userId = req.user.id;      // user_id

  if (!["watched", "to_watch", "read", "to_read"].includes(status)) {
    return res.status(400).json({ message: "Geçersiz status" });
  }

  try {
    const pool = await connectDB();

    // Daha önce var mı?
    const check = await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .query(`
        SELECT id FROM user_library
        WHERE user_id = @user_id AND content_id = @content_id
      `);

    if (check.recordset.length > 0) {
      // Güncelle
      await pool
        .request()
        .input("user_id", userId)
        .input("content_id", id)
        .input("status", status)
        .query(`
          UPDATE user_library
          SET status = @status
          WHERE user_id = @user_id AND content_id = @content_id
        `);

      return res.json({ message: "Durum güncellendi ✅" });
    }

    // Yoksa ekle
    await pool
      .request()
      .input("user_id", userId)
      .input("content_id", id)
      .input("status", status)
      .query(`
        INSERT INTO user_library (user_id, content_id, status, created_at)
        VALUES (@user_id, @content_id, @status, GETDATE())
      `);

    res.json({ message: "Kütüphaneye eklendi ✅" });
  } catch (err) {
    console.error("LIBRARY ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});
/* =====================================================
   3) TEK İÇERİK DETAY
===================================================== */
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Geçersiz içerik ID" });
  }

  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT 
          c.id,
          c.type,
          c.title,
          c.description,
          c.year,
          c.cover_url,
          c.authors,
          c.directors,
          c.genres,

          ISNULL(AVG(r.rating), 0) AS avg_rating,
          COUNT(r.id) AS rating_count

        FROM contents c
        LEFT JOIN ratings r ON r.content_id = c.id
        WHERE c.id = @id
        GROUP BY 
          c.id, c.type, c.title, c.description,
          c.year, c.cover_url, c.authors,
          c.directors, c.genres
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "İçerik bulunamadı" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("CONTENT DETAIL ERROR:", err);
    res.status(500).json({ message: "İçerik getirilemedi" });
  }
});


module.exports = router;
