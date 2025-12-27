const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");

connectDB();

const followsRoutes = require("./routes/follows");
const importRoutes = require("./routes/import");
const importBooksRoutes = require("./routes/importBooks");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const movieRoutes = require("./routes/movies");
const contentsRoutes = require("./routes/contents");
const feedRoutes = require("./routes/feed");
const usersRoutes = require("./routes/users");   // ✔ EKLENDİ

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

/* ROUTES */
app.use("/import", importRoutes);
app.use("/import", importBooksRoutes);

app.use("/follows", followsRoutes);
app.use("/contents", contentsRoutes);
app.use("/auth", authRoutes);

app.use("/api/movies", movieRoutes);
app.use("/api/contents", contentsRoutes);

// ⭐ FEED ARTIK PROTECTED ALTINDA

// FEED ÖNCE
app.use("/protected/feed", feedRoutes);

// Sonra diğer protected rotaları
app.use("/protected", protectedRoutes);

// ✔ KULLANICI ROTALARI — EKSİK OLAN BUYDU
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("Server ayakta ✅");
});

// Express default 404
app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.url}`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server http://localhost:${PORT} + ağ bağlantıları için 0.0.0.0 adresinde çalışıyor`);
});
