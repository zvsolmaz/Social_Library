const express = require("express");
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ follows.js yüklendi");

/* =========================
   1) TAKİP ET
========================= */
router.post("/:userId", verifyToken, async (req, res) => {
  const followerId = req.user.id;
  const followedId = Number(req.params.userId);

  if (followerId === followedId) {
    return res.status(400).json({ message: "Kendini takip edemezsin" });
  }

  try {
    const pool = await connectDB();

    const check = await pool
      .request()
      .input("follower_id", followerId)
      .input("followed_id", followedId)
      .query(`
        SELECT * FROM follows
        WHERE follower_id = @follower_id AND followed_id = @followed_id
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "Zaten takip ediyorsun" });
    }

    await pool
      .request()
      .input("follower_id", followerId)
      .input("followed_id", followedId)
      .query(`
        INSERT INTO follows (follower_id, followed_id)
        VALUES (@follower_id, @followed_id)
      `);

    res.json({ message: "Takip edildi ✅" });

  } catch (err) {
    console.error("FOLLOW ERROR:", err);
    res.status(500).json({ message: "Takip edilemedi" });
  }
});

/* =========================
   2) TAKİP BIRAK
========================= */
router.delete("/:userId", verifyToken, async (req, res) => {
  const followerId = req.user.id;
  const followedId = Number(req.params.userId);

  try {
    const pool = await connectDB();

    await pool
      .request()
      .input("follower_id", followerId)
      .input("followed_id", followedId)
      .query(`
        DELETE FROM follows
        WHERE follower_id = @follower_id AND followed_id = @followed_id
      `);

    res.json({ message: "Takip bırakıldı ❌" });
  } catch (err) {
    console.error("UNFOLLOW ERROR:", err);
    res.status(500).json({ message: "Takip bırakılamadı" });
  }
});

/* =========================
   3) TAKİP EDİYOR MUYUM?
========================= */
router.get("/isFollowing/:userId", verifyToken, async (req, res) => {
  const followerId = req.user.id;
  const followedId = Number(req.params.userId);

  try {
    const pool = await connectDB();

    const check = await pool
      .request()
      .input("follower_id", followerId)
      .input("followed_id", followedId)
      .query(`
        SELECT * FROM follows
        WHERE follower_id=@follower_id AND followed_id=@followed_id
      `);

    res.json({ isFollowing: check.recordset.length > 0 });
  } catch (err) {
    console.error("ISFOLLOWING ERROR:", err);
    res.status(500).json({ message: "Durum kontrol edilemedi" });
  }
});

/* =========================
   4) TAKİP ETTİKLERİM
========================= */
router.get("/following", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", userId)
      .query(`
        SELECT u.id, u.username, u.email
        FROM follows f
        JOIN users u ON f.followed_id = u.id
        WHERE f.follower_id = @id
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("FOLLOWING ERROR:", err);
    res.status(500).json({ message: "Takip edilenler alınamadı" });
  }
});

/* =========================
   5) TAKİPÇİLERİM
========================= */
router.get("/followers", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", userId)
      .query(`
        SELECT u.id, u.username, u.email
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.followed_id = @id
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("FOLLOWERS ERROR:", err);
    res.status(500).json({ message: "Takipçiler alınamadı" });
  }
});

module.exports = router;
