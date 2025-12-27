const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ TEST
router.get("/test-reply", (req, res) => {
  res.send("REPLY ROUTE ÇALIŞIYOR ✅");
});

// ✅ YORUMA CEVAP
router.post("/reviews/:reviewId/reply", verifyToken, async (req, res) => {
  const { reviewId } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  console.log("✅ REPLY ROUTE'A GİRDİ");
  console.log("reviewId:", reviewId);
  console.log("userId:", userId);
  console.log("body:", body);

  if (!body || !body.trim()) {
    return res.status(400).json({ message: "Cevap boş olamaz" });
  }

  try {
    const pool = await connectDB();

    // Önce gerçekten böyle bir yorum var mı?
    const check = await pool.request()
      .input("id", reviewId)
      .query("SELECT * FROM reviews WHERE id = @id");

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

module.exports = router;
