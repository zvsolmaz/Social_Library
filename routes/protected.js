const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { connectDB } = require("../config/db");

const router = express.Router();

console.log("🔥 PROTECTED.JS YÜKLENDİ 🔥");


/* ============================================
   1) KENDİ PROFİLİM
============================================ */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("id", req.user.id)
      .query(`
        SELECT id, username, email, bio, avatar_url
        FROM users
        WHERE id = @id
      `);

    res.json({ user: result.recordset[0] });

  } catch (err) {
    console.log("PROFILE GET ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


/* ============================================
   2) BAŞKA KULLANICININ PROFİLİ
   GET /protected/profile/:id
============================================ */
router.get("/profile/:id", verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = await connectDB();

    const result = await pool.request()
      .input("id", userId)
      .query(`
        SELECT id, username, email, bio, avatar_url
        FROM users
        WHERE id = @id
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    res.json({ user: result.recordset[0] });

  } catch (err) {
    console.error("PROFILE ID ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


/* ============================================
   3) PROFİL GÜNCELLE (KENDİ)
============================================ */
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { username, bio, avatar_url } = req.body;

    const pool = await connectDB();

    await pool.request()
      .input("id", req.user.id)
      .input("username", username)
      .input("bio", bio)
      .input("avatar_url", avatar_url)
      .query(`
        UPDATE users
        SET username=@username, bio=@bio, avatar_url=@avatar_url
        WHERE id=@id
      `);

    const updated = await pool.request()
      .input("id", req.user.id)
      .query(`
        SELECT id, username, email, bio, avatar_url
        FROM users
        WHERE id = @id
      `);

    res.json({ message: "Profil güncellendi", user: updated.recordset[0] });

  } catch (err) {
    console.error("PROFILE PATCH ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

/* ============================================
   MEVCUT KULLANICI (React için gerekli)
   GET /protected/me
============================================ */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("id", req.user.id)
      .query(`
        SELECT id, username, email, bio, avatar_url
        FROM users
        WHERE id = @id
      `);

    res.json(result.recordset[0]);  // { id, username, ... }
  } catch (err) {
    console.log("ME ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

/* ============================================
   4) TAKİP ET
============================================ */
router.post("/follow/:id", verifyToken, async (req, res) => {
  try {
    const follower_id = req.user.id;
    const followed_id = parseInt(req.params.id);

    if (follower_id === followed_id)
      return res.status(400).json({ message: "Kendinizi takip edemezsiniz" });

    const pool = await connectDB();

    await pool.request()
      .input("follower_id", follower_id)
      .input("followed_id", followed_id)
      .query(`
        IF NOT EXISTS (
          SELECT * FROM follows WHERE follower_id=@follower_id AND followed_id=@followed_id
        )
        INSERT INTO follows (follower_id, followed_id, created_at)
        VALUES (@follower_id, @followed_id, GETDATE())
      `);

    res.json({ message: "Takip edildi" });

  } catch (err) {
    console.error("FOLLOW ERROR:", err);
    res.status(500).json({ message: "Takip edilemedi" });
  }
});


/* ============================================
   5) TAKİPTEN ÇIK
============================================ */
router.delete("/follow/:id", verifyToken, async (req, res) => {
  try {
    const follower_id = req.user.id;
    const followed_id = parseInt(req.params.id);

    const pool = await connectDB();

    await pool.request()
      .input("follower_id", follower_id)
      .input("followed_id", followed_id)
      .query(`
        DELETE FROM follows
        WHERE follower_id=@follower_id AND followed_id=@followed_id
      `);

    res.json({ message: "Takipten çıkıldı" });

  } catch (err) {
    console.error("UNFOLLOW ERROR:", err);
    res.status(500).json({ message: "Takipten çıkılamadı" });
  }
});


/* ============================================
   6) TAKİP DURUMU
============================================ */
router.get("/follow-status/:id", verifyToken, async (req, res) => {
  try {
    const follower_id = req.user.id;
    const followed_id = parseInt(req.params.id);

    const pool = await connectDB();

    const result = await pool.request()
      .input("follower_id", follower_id)
      .input("followed_id", followed_id)
      .query(`
        SELECT * FROM follows
        WHERE follower_id=@follower_id AND followed_id=@followed_id
      `);

    res.json({ following: result.recordset.length > 0 });

  } catch (err) {
    console.error("FOLLOW STATUS ERROR:", err);
    res.status(500).json({ message: "Takip durumu alınamadı" });
  }
});


/* ============================================
   7) İZLEDİKLER / OKUNAN / LİSTELER (ÇAĞIRIYOR)
============================================ */
router.get("/watched", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", req.user.id)
    .query(`
      SELECT c.id, c.title, c.type, c.cover_url
      FROM user_library ul
      JOIN contents c ON c.id = ul.content_id
      WHERE ul.user_id = @user_id AND ul.status='watched'
    `);

  res.json(result.recordset);
});

router.get("/to-watch", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", req.user.id)
    .query(`
      SELECT c.id, c.title, c.type, c.cover_url
      FROM user_library ul
      JOIN contents c ON c.id = ul.content_id
      WHERE ul.user_id = @user_id AND ul.status='to_watch'
    `);

  res.json(result.recordset);
});

router.get("/read", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", req.user.id)
    .query(`
      SELECT c.id, c.title, c.type, c.cover_url
      FROM user_library ul
      JOIN contents c ON c.id = ul.content_id
      WHERE ul.user_id = @user_id AND ul.status='read'
    `);

  res.json(result.recordset);
});

router.get("/to-read", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", req.user.id)
    .query(`
      SELECT c.id, c.title, c.type, c.cover_url
      FROM user_library ul
      JOIN contents c ON c.id = ul.content_id
      WHERE ul.user_id = @user_id AND ul.status='to_read'
    `);

  res.json(result.recordset);
});
// ==============================
// BAŞKA KULLANICININ LİSTELERİ
// ==============================

// 1) Başkasının izledikleri
router.get("/user/:id/watched", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("user_id", req.params.id)
      .query(`
        SELECT c.id, c.title, c.type, c.cover_url
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @user_id AND ul.status = 'watched'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("USER WATCHED ERROR:", err);
    res.status(500).json({ message: "İzlenenler alınamadı" });
  }
});

// 2) Başkasının izleyecekleri
router.get("/user/:id/to-watch", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("user_id", req.params.id)
      .query(`
        SELECT c.id, c.title, c.type, c.cover_url
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @user_id AND ul.status = 'to_watch'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("USER TO WATCH ERROR:", err);
    res.status(500).json({ message: "İzlenecekler alınamadı" });
  }
});

// 3) Başkasının okudukları
router.get("/user/:id/read", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("user_id", req.params.id)
      .query(`
        SELECT c.id, c.title, c.type, c.cover_url
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @user_id AND ul.status = 'read'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("USER READ ERROR:", err);
    res.status(500).json({ message: "Okunanlar alınamadı" });
  }
});

// 4) Başkasının okuyacakları
router.get("/user/:id/to-read", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("user_id", req.params.id)
      .query(`
        SELECT c.id, c.title, c.type, c.cover_url
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @user_id AND ul.status = 'to_read'
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("USER TO READ ERROR:", err);
    res.status(500).json({ message: "Okunacaklar alınamadı" });
  }
});

router.get("/lists", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("user_id", req.user.id)
    .query(`
      SELECT id, name, description
      FROM lists
      WHERE user_id = @user_id
    `);

  res.json(result.recordset);
});
/* ============================
   YENİ ÖZEL LİSTE OLUŞTUR
   POST /protected/lists
============================ */
router.post("/lists", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Liste adı zorunludur" });
    }

    const pool = await connectDB();

    const insertResult = await pool.request()
      .input("user_id", req.user.id)
      .input("name", name.trim())
      .input("description", "") // istersen burada tip vs tutabilirsin
      .query(`
        INSERT INTO lists (user_id, name, description, created_at)
        OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.name, INSERTED.description, INSERTED.created_at
        VALUES (@user_id, @name, @description, GETDATE())
      `);

    const newList = insertResult.recordset[0];
    res.status(201).json({ list: newList });
  } catch (err) {
    console.error("CREATE LIST ERROR:", err);
    res.status(500).json({ message: "Liste oluşturulamadı" });
  }
});
// 🔥 Özel listeye içerik ekle
router.post("/lists/:list_id/add-item", verifyToken, async (req, res) => {
  try {
    const { content_id } = req.body;
    const list_id = parseInt(req.params.list_id);
    const user_id = req.user.id;

    if (!content_id)
      return res.status(400).json({ message: "content_id eksik" });

    const pool = await connectDB();

    // ▶ önce liste gerçekten bu kullanıcıya mı ait kontrol et
    const checkList = await pool.request()
      .input("list_id", list_id)
      .input("user_id", user_id)
      .query(`
        SELECT id FROM lists
        WHERE id = @list_id AND user_id = @user_id
      `);

    if (checkList.recordset.length === 0)
      return res.status(403).json({ message: "Bu liste size ait değil" });

    // ▶ içerik zaten listede mi?
    const exists = await pool.request()
      .input("list_id", list_id)
      .input("content_id", content_id)
      .query(`
        SELECT id FROM list_items
        WHERE list_id = @list_id AND content_id = @content_id
      `);

    if (exists.recordset.length > 0)
      return res.status(400).json({ message: "İçerik zaten listede" });

    // ▶ ekle
    await pool.request()
      .input("list_id", list_id)
      .input("content_id", content_id)
      .query(`
        INSERT INTO list_items (list_id, content_id, created_at)
        VALUES (@list_id, @content_id, GETDATE())
      `);

    res.json({ message: "İçerik listeye eklendi" });

  } catch (err) {
    console.error("LIST ADD ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

/* ============================
   BİR LİSTENİN İÇERİKLERİ
   GET /protected/lists/:id/items
============================ */
router.get("/lists/:id/items", verifyToken, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    if (isNaN(listId)) {
      return res.status(400).json({ message: "Geçersiz liste ID" });
    }

    const pool = await connectDB();

    const result = await pool.request()
      .input("list_id", listId)
      .input("user_id", req.user.id)
      .query(`
        SELECT li.id AS list_item_id,
               c.id,
               c.title,
               c.type,
               c.year,
               c.cover_url
        FROM list_items li
        JOIN lists l ON l.id = li.list_id
        JOIN contents c ON c.id = li.content_id
        WHERE li.list_id = @list_id
          AND l.user_id = @user_id
        ORDER BY li.position ASC, li.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("LIST ITEMS GET ERROR:", err);
    res.status(500).json({ message: "Liste içerikleri alınamadı" });
  }
});

/* ============================
   LİSTEYE İÇERİK EKLE
   POST /protected/lists/:id/items
   body: { content_id }
============================ */
router.post("/lists/:id/items", verifyToken, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const { content_id } = req.body;

    if (isNaN(listId) || !content_id) {
      return res.status(400).json({ message: "Geçersiz veri" });
    }

    const pool = await connectDB();

    // Liste sana ait mi kontrol
    const listCheck = await pool.request()
      .input("list_id", listId)
      .input("user_id", req.user.id)
      .query(`
        SELECT id FROM lists
        WHERE id = @list_id AND user_id = @user_id
      `);

    if (listCheck.recordset.length === 0) {
      return res.status(403).json({ message: "Bu liste sana ait değil" });
    }

    // Aynı içerik zaten ekliyse tekrar ekleme
    const exists = await pool.request()
      .input("list_id", listId)
      .input("content_id", content_id)
      .query(`
        SELECT id FROM list_items
        WHERE list_id = @list_id AND content_id = @content_id
      `);

    if (exists.recordset.length > 0) {
      return res.status(200).json({ message: "Zaten listede var" });
    }

    const insertResult = await pool.request()
      .input("list_id", listId)
      .input("content_id", content_id)
      .query(`
        INSERT INTO list_items (list_id, content_id, created_at)
        OUTPUT INSERTED.id, INSERTED.list_id, INSERTED.content_id, INSERTED.created_at
        VALUES (@list_id, @content_id, GETDATE())
      `);

    res.status(201).json({ item: insertResult.recordset[0] });
  } catch (err) {
    console.error("ADD LIST ITEM ERROR:", err);
    res.status(500).json({ message: "Listeye eklenemedi" });
  }
});

/* ============================
   LİSTEDEN İÇERİK SİL
   DELETE /protected/lists/:id/items/:itemId
============================ */
router.delete("/lists/:id/items/:itemId", verifyToken, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    if (isNaN(listId) || isNaN(itemId)) {
      return res.status(400).json({ message: "Geçersiz ID" });
    }

    const pool = await connectDB();

    // item ilgili kullanıcının listesine mi ait?
    const check = await pool.request()
      .input("item_id", itemId)
      .input("user_id", req.user.id)
      .query(`
        SELECT li.id
        FROM list_items li
        JOIN lists l ON l.id = li.list_id
        WHERE li.id = @item_id AND l.user_id = @user_id
      `);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: "Kayıt bulunamadı" });
    }

    await pool.request()
      .input("item_id", itemId)
      .query(`DELETE FROM list_items WHERE id = @item_id`);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE LIST ITEM ERROR:", err);
    res.status(500).json({ message: "Silinemedi" });
  }
});
// 🔍 ARAMA – contents tablosundan
router.get("/search", verifyToken, async (req, res) => {
  const { q } = req.query;

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("q", `%${q || ""}%`)
      .query(`
        SELECT 
          c.id,
          c.title,
          c.year,
          c.type,
          c.cover_url,
          ISNULL(AVG(r.rating), 0) AS avg_rating
        FROM contents c
        LEFT JOIN ratings r ON c.id = r.content_id
        WHERE c.title LIKE @q
        GROUP BY c.id, c.title, c.year, c.type, c.cover_url
        ORDER BY c.title
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Arama hatası" });
  }
});


/* ============================================
   8) SOSYAL AKIŞ (FEED)
============================================ */



// /protected/activities
router.get("/activities", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("user_id", req.user.id)
      .query(`

        /* ============ KÜTÜPHANE EKLEME ============ */
        SELECT
          CASE 
            WHEN ul.status = 'watched' THEN 'watch_add'
            WHEN ul.status = 'to_watch' THEN 'to_watch_add'
            WHEN ul.status = 'read' THEN 'read_add'
            WHEN ul.status = 'to_read' THEN 'to_read_add'
          END AS type,

          c.id AS content_id,
          c.title AS content_title,
          c.cover_url,

          NULL AS review_body,
          NULL AS reply_body,
          NULL AS rating,

          ul.created_at
        FROM user_library ul
        JOIN contents c ON c.id = ul.content_id
        WHERE ul.user_id = @user_id


        UNION ALL

        /* ============ YORUM ============ */
        SELECT
          'review' AS type,
          c.id AS content_id,
          c.title AS content_title,
          c.cover_url,

          r.body AS review_body,
          NULL AS reply_body,
          NULL AS rating,

          r.created_at
        FROM reviews r
        JOIN contents c ON c.id = r.content_id
        WHERE r.user_id = @user_id


        UNION ALL

        /* ============ PUAN ============ */
        SELECT
          'rating' AS type,
          c.id AS content_id,
          c.title AS content_title,
          c.cover_url,

          NULL AS review_body,
          NULL AS reply_body,
          rt.rating,

          rt.created_at
        FROM ratings rt
        JOIN contents c ON c.id = rt.content_id
        WHERE rt.user_id = @user_id


        UNION ALL

        /* ============ YORUM BEĞENME ============ */
        SELECT
          'review_like' AS type,
          c.id AS content_id,
          c.title AS content_title,
          c.cover_url,

          r.body AS review_body,
          NULL AS reply_body,
          NULL AS rating,

          rr.created_at
        FROM review_reactions rr
        JOIN reviews r ON r.id = rr.review_id
        JOIN contents c ON c.id = r.content_id
        WHERE rr.user_id = @user_id AND rr.type = 'like'


        UNION ALL

        /* ============ YORUMA CEVAP ============ */
        SELECT
          'review_reply' AS type,
          c.id AS content_id,
          c.title AS content_title,
          c.cover_url,

          r.body AS review_body,
          rp.body AS reply_body,
          NULL AS rating,

          rp.created_at
        FROM review_replies rp
        JOIN reviews r ON r.id = rp.review_id
        JOIN contents c ON c.id = r.content_id
        WHERE rp.user_id = @user_id


        ORDER BY created_at DESC

      `);

    res.json(result.recordset);

  } catch (error) {
    console.log("ACTIVITY ERROR:", error);
    res.status(500).json({ message: "Activities alınamadı" });
  }
});


// ⭐ EN YÜKSEK PUANLILAR
router.get("/top-rated", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 10
        c.id,
        c.title,
        c.year,
        c.type,
        c.cover_url,
        ISNULL(AVG(r.rating),0) AS avg_rating
      FROM contents c
      LEFT JOIN ratings r ON r.content_id = c.id
      GROUP BY c.id, c.title, c.year, c.type, c.cover_url
      ORDER BY avg_rating DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("TOP RATED ERROR:", err);
    res.status(500).json({ message: "En yüksek puanlılar alınamadı" });
  }
});

// 🔥 EN POPÜLERLER
router.get("/most-popular", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 10
        c.id,
        c.title,
        c.year,
        c.type,
        c.cover_url,
        ISNULL(AVG(r.rating),0) AS avg_rating,
        COUNT(DISTINCT rv.id) AS review_count,
        COUNT(DISTINCT ul.id) AS list_count
      FROM contents c
      LEFT JOIN reviews rv ON rv.content_id = c.id
      LEFT JOIN user_library ul ON ul.content_id = c.id
      LEFT JOIN ratings r ON r.content_id = c.id
      GROUP BY c.id, c.title, c.year, c.type, c.cover_url
      ORDER BY (COUNT(DISTINCT rv.id) + COUNT(DISTINCT ul.id)) DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("POPULAR ERROR:", err);
    res.status(500).json({ message: "En popülerler alınamadı" });
  }
});
// ✅ TÜM İÇERİKLER (ilk açılış için)

// 🔍 ARAMA
router.get("/search", verifyToken, async (req, res) => {
  const { q } = req.query;

  try {
    const pool = await connectDB();
    const result = await pool.request().input("q", `%${q}%`).query(`
      SELECT 
        c.id,
        c.title,
        c.year,
        c.type,
        c.cover_url,
        ISNULL(AVG(r.rating), 0) as avg_rating
      FROM contents c
      LEFT JOIN ratings r ON c.id = r.content_id
      WHERE c.title LIKE @q
      GROUP BY c.id, c.title, c.year, c.type, c.cover_url
    `);

    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Arama hatası" });
  }
});



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
