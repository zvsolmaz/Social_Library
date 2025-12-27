const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/* ============================
   TÜM KULLANICILARI GETİR
============================ */
router.get("/all", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT id, username, email, avatar_url, bio
      FROM users
      ORDER BY username ASC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("USER LIST ERROR:", err);
    res.status(500).json({ message: "Kullanıcılar getirilemedi" });
  }
});
/* ==========================================
   PROFİL DETAYI
   GET /users/:id/detail
========================================== */
router.get("/:id/detail", verifyToken, async (req, res) => {
  const profileId = parseInt(req.params.id, 10); // profiline bakılan kişi
  const viewerId = req.user.id;                  // token'daki kullanıcı

  if (isNaN(profileId)) {
    return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
  }

  try {
    const pool = await connectDB();

    // 1) Kullanıcı temel bilgiler + takip sayıları
    const userResult = await pool
      .request()
      .input("id", profileId)
      .input("viewer_id", viewerId)
      .query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.avatar_url,
          u.bio,
          -- Kaç kişi takip ediyor
          (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
          -- Kaç kişiyi takip ediyor
          (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
          -- Ben bu kişiyi takip ediyor muyum?
          (SELECT COUNT(*) FROM follows 
             WHERE follower_id = @viewer_id AND following_id = u.id) AS is_following
        FROM users u
        WHERE u.id = @id
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const user = userResult.recordset[0];

    // 2) Kütüphane: okudukları / okuyacakları / izledikleri / izleyecekleri
    const libraryResult = await pool
      .request()
      .input("id", profileId)
      .query(`
        SELECT 
          ul.status,                -- read / to_read / watched / to_watch
          c.id   AS content_id,
          c.title,
          c.type,
          c.year,
          c.cover_url
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @id
        ORDER BY ul.created_at DESC
      `);

    const libraryRaw = libraryResult.recordset || [];

    const library = {
      read:     libraryRaw.filter((r) => r.status === "read"),
      to_read:  libraryRaw.filter((r) => r.status === "to_read"),
      watched:  libraryRaw.filter((r) => r.status === "watched"),
      to_watch: libraryRaw.filter((r) => r.status === "to_watch"),
    };

    // 3) Verdiği puanlar
    const ratingsResult = await pool
      .request()
      .input("id", profileId)
      .query(`
        SELECT
          r.id,
          r.rating,
          r.created_at,
          c.id   AS content_id,
          c.title,
          c.type,
          c.year,
          c.cover_url
        FROM ratings r
        JOIN contents c ON c.id = r.content_id
        WHERE r.user_id = @id
        ORDER BY r.created_at DESC
      `);

    // 4) Yorumlar
    const reviewsResult = await pool
      .request()
      .input("id", profileId)
      .query(`
        SELECT
          rv.id,
          rv.body,
          rv.created_at,
          c.id   AS content_id,
          c.title,
          c.type,
          c.year,
          c.cover_url
        FROM reviews rv
        JOIN contents c ON c.id = rv.content_id
        WHERE rv.user_id = @id
        ORDER BY rv.created_at DESC
      `);

    res.json({
      user,
      library,
      ratings: reviewsResult.recordset ? ratingsResult.recordset : [],
      reviews: reviewsResult.recordset ? reviewsResult.recordset : [],
    });

  } catch (err) {
    console.error("PROFILE DETAIL ERROR:", err);
    res.status(500).json({ message: "Profil verileri alınamadı" });
  }
});


module.exports = router;
