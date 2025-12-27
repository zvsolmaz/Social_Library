// reviewActions.js
const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/* -------------------------------------------------------
    1) YORUMA CEVAP EKLEME
--------------------------------------------------------*/
router.post("/reviews/:reviewId/reply", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  console.log("✅ REPLY ROUTE'A GİRDİM");
  console.log("PARAM:", req.params.reviewId);
  console.log("BODY:", req.body);
  console.log("USER:", req.user);

  if (!body || body.trim() === "") {
    return res.status(400).json({ message: "Cevap boş olamaz" });
  }

  try {
    const pool = await connectDB();

    // Yorum var mı?
    const check = await pool.request()
      .input("review_id", reviewId)
      .query(`SELECT id FROM reviews WHERE id = @review_id`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: "Yorum bulunamadı" });
    }

    // Cevabı ekle
    await pool.request()
      .input("review_id", reviewId)
      .input("user_id", userId)
      .input("body", body)
      .query(`
        INSERT INTO review_replies (review_id, user_id, body)
        VALUES (@review_id, @user_id, @body)
      `);

    res.json({ message: "Cevap eklendi ✅" });

  } catch (err) {
    console.error("REPLY ERROR:", err);
    res.status(500).json({ message: "Cevap eklenemedi" });
  }
});


/* -------------------------------------------------------
    2) YORUM SİLME (SADECE SAHİBİ)
--------------------------------------------------------*/
router.delete("/reviews/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const pool = await connectDB();

    // Yorumu kimin yazdığını bul
    const check = await pool.request()
      .input("review_id", reviewId)
      .query(`
        SELECT user_id 
        FROM reviews 
        WHERE id = @review_id
      `);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: "Yorum bulunamadı" });
    }

    // Başkasının yorumu → yasak
    if (check.recordset[0].user_id !== userId) {
      return res.status(403).json({
        message: "Bu yorumu silmeye yetkiniz yok."
      });
    }

    // Silme işlemi
    await pool.request()
      .input("review_id", reviewId)
      .query(`DELETE FROM reviews WHERE id = @review_id`);

    res.json({ message: "Yorum başarıyla silindi" });

  } catch (err) {
    console.error("DELETE REVIEW ERROR:", err);
    res.status(500).json({ message: "Yorum silinemedi" });
  }
});


/* -------------------------------------------------------
    3) YORUM DÜZENLEME (SADECE SAHİBİ)
--------------------------------------------------------*/
router.put("/reviews/:reviewId", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  if (!body || body.trim() === "") {
    return res.status(400).json({ message: "Yorum boş bırakılamaz" });
  }

  try {
    const pool = await connectDB();

    // Yorumu kimin yazdığını bul
    const check = await pool.request()
      .input("review_id", reviewId)
      .query(`
        SELECT user_id 
        FROM reviews 
        WHERE id = @review_id
      `);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: "Yorum bulunamadı" });
    }

    // Başkasının yorumu → düzenleyemez
    if (check.recordset[0].user_id !== userId) {
      return res.status(403).json({
        message: "Bu yorumu düzenlemeye yetkiniz yok."
      });
    }

    // Güncelleme
    await pool.request()
      .input("review_id", reviewId)
      .input("body", body)
      .query(`
        UPDATE reviews
        SET body = @body
        WHERE id = @review_id
      `);

    res.json({ message: "Yorum başarıyla güncellendi" });

  } catch (err) {
    console.error("UPDATE REVIEW ERROR:", err);
    res.status(500).json({ message: "Yorum güncellenemedi" });
  }
});


// -------------------------------------------------------

module.exports = router;
