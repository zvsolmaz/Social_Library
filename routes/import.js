// routes/import.js
const express = require("express");
const axios = require("axios");
const { connectDB } = require("../config/db");

const router = express.Router();

// TMDb -> SQL Server'a film kaydeden endpoint
router.post("/movies", async (req, res) => {
  const query = req.query.q || "harry";

  // Kaç tane film çekelim? (max 50)
  const limit = Math.min(parseInt(req.query.limit) || 50, 50);

  try {
    const pool = await connectDB();

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "TMDB_API_KEY tanımlı değil ❌" });
    }

    let allMovies = [];
    let page = 1;

    // Birden fazla sayfa isteyerek ilk 'limit' kadar filmi topla
    while (allMovies.length < limit && page <= 5) {
      const resp = await axios.get(
        "https://api.themoviedb.org/3/search/movie",
        {
          params: {
            api_key: apiKey,
            language: "tr-TR",
            query,
            page,
          },
        }
      );

      const results = resp.data.results || [];
      if (!results.length) break; // sonuç bitti

      allMovies = allMovies.concat(results);
      page++;
    }

    // Sadece ilk 'limit' tanesini kullan
    const movies = allMovies.slice(0, limit);

    let eklenen = 0;

    for (let movie of movies) {
      const externalId = movie.id.toString();

      // Bu film zaten var mı?
      const kontrol = await pool
        .request()
        .input("external_id", externalId)
        .query(`
          SELECT id FROM contents WHERE external_id = @external_id
        `);

      if (kontrol.recordset.length === 0) {
        const year = movie.release_date
          ? movie.release_date.split("-")[0]
          : null;

        const coverUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null;

        await pool
          .request()
          .input("type", "movie")
          .input("external_id", externalId)
          .input("title", movie.title || "")
          .input("description", movie.overview || "")
          .input("year", year)
          .input("cover_url", coverUrl)
          .query(`
            INSERT INTO contents
              (type, external_id, title, description, year, cover_url, created_at)
            VALUES
              (@type, @external_id, @title, @description, @year, @cover_url, GETDATE())
          `);

        eklenen++;
      }
    }

    return res.json({
      message: `${eklenen} film başarıyla veritabanına kaydedildi ✅`,
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    return res
      .status(500)
      .json({ message: "Film aktarımı başarısız ❌", detail: err.message });
  }
});

module.exports = router;
