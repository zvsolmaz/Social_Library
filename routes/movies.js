//movies.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

// Movie search endpoint
router.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ message: "Arama kelimesi gerekli" });
  }

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: query,
          language: "tr-TR"
        }
      }
    );

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      year: movie.release_date?.split("-")[0],
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null
    }));

    res.json(movies);
  } catch (err) {
    console.error("TMDB ERROR:", err.message);
    res.status(500).json({ message: "Film verisi alınamadı" });
  }
});

module.exports = router;
