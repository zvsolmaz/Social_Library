// auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();
const { connectDB } = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

/* ======================
   REGISTER
====================== */
router.post("/register", async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  if (!username || !email || !password || !passwordConfirm) {
    return res.status(400).json({ message: "Tüm alanları doldurun" });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ message: "Şifreler eşleşmiyor" });
  }

  try {
    const pool = await connectDB();

    const userCheck = await pool
      .request()
      .input("email", email)
      .input("username", username)
      .query(`
        SELECT id FROM users
        WHERE email = @email OR username = @username
      `);

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ message: "Kullanıcı zaten var" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("username", username)
      .input("email", email)
      .input("password_hash", hashedPassword)
      .query(`
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (@username, @email, @password_hash, GETDATE())
      `);

    res.status(201).json({ message: "Kayıt başarılı ✅" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server hatası ❌" });
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre gerekli" });
  }

  try {
    const pool = await connectDB();

    const userResult = await pool
      .request()
      .input("email", email)
      .query(`SELECT * FROM users WHERE email = @email`);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }

    const user = userResult.recordset[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Şifre yanlış" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Giriş başarılı ✅",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası ❌" });
  }
});

/* ======================
   PROFIL BILGILERI GETIR
====================== */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", req.user.id)
      .query(`
        SELECT id, username, email, avatar_url, bio
        FROM users
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({ user: result.recordset[0] });

  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası ❌" });
  }
});

/* ======================
   PROFIL GÜNCELLE
====================== */
router.patch("/profile", verifyToken, async (req, res) => {
  const { username, bio, avatar_url } = req.body;

  try {
    const pool = await connectDB();

    await pool
      .request()
      .input("id", req.user.id)
      .input("username", username)
      .input("bio", bio || "")
      .input("avatar", avatar_url || "")
      .query(`
        UPDATE users
        SET username = @username,
            bio = @bio,
            avatar_url = @avatar
        WHERE id = @id
      `);

    // Güncellenmiş kullanıcıyı tekrar çek
    const updatedUser = await pool
      .request()
      .input("id", req.user.id)
      .query(`
        SELECT id, username, email, avatar_url, bio
        FROM users
        WHERE id = @id
      `);

    res.json({ user: updatedUser.recordset[0] });

  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası ❌" });
  }
});

/* ======================
   ŞİFREMİ UNUTTUM
/* ======================
   ŞİFREMİ UNUTTUM
====================== */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "E-posta gerekli" });

  try {
    const pool = await connectDB();

    const userResult = await pool
      .request()
      .input("email", email)
      .query(`SELECT * FROM users WHERE email = @email`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "Bu e-posta ile kullanıcı yok" });
    }

    const user = userResult.recordset[0];

   const token = crypto.randomBytes(32).toString("hex");
// 5 saat geçerli olsun:
const expiry = new Date(Date.now() + 5 * 60 * 60 * 1000);

    await pool
      .request()
      .input("token", token)
      .input("expiry", expiry)
      .input("email", email)
      .query(`
        UPDATE users
        SET reset_token = @token,
            reset_token_expiry = @expiry
        WHERE email = @email
      `);

    // ⚠️ HATA BURADAYDI — transporter eksikti!
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

   const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const resetLink = `${frontendUrl}/reset-password/${token}`;


    await transporter.sendMail({
      from: `"Social Library" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Şifre Sıfırlama",
      html: `<p>Şifre sıfırlamak için tıklayın: 
             <a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.json({ message: "Şifre sıfırlama maili gönderildi!" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası ❌" });
  }
});

/* ======================
   ŞİFRE SIFIRLAMA
====================== */
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Yeni şifre gerekli" });
  }

  try {
    const pool = await connectDB();

    const userResult = await pool
      .request()
      .input("token", token)
      .query(`
        SELECT * FROM users
        WHERE reset_token = @token
          AND reset_token_expiry > GETDATE()
      `);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: "Link geçersiz veya süresi dolmuş" });
    }

    const user = userResult.recordset[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool
      .request()
      .input("password", hashedPassword)
      .input("email", user.email)
      .query(`
        UPDATE users
        SET password_hash = @password,
            reset_token = NULL,
            reset_token_expiry = NULL
        WHERE email = @email
      `);

    res.json({ message: "Şifre güncellendi!" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Sunucu hatası ❌" });
  }
});

module.exports = router;
