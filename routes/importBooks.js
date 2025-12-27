// routes/importBooks.js
const express = require("express");
const axios = require("axios");
const { connectDB } = require("../config/db");

const router = express.Router();

// Open Library -> SQL Server'a kitap kaydeden endpoint
router.post("/books", async (req, res) => {
  const query = req.query.q || "harry";

  try {
    const pool = await connectDB(); // ✅ pool alıyoruz

    const response = await axios.get("https://openlibrary.org/search.json", {
      params: { q: query },
    });

    const books = response.data.docs || [];
    let eklenen = 0;

    // İlk 50 kitap
    for (const book of books.slice(0, 50)) {
      if (!book.key) continue; // koruma

      const externalId = book.key.replace("/works/", "");

      // Bu kitap zaten var mı?
      const kontrol = await pool
        .request()
        .input("external_id", externalId)
        .query(`
          SELECT id FROM contents WHERE external_id = @external_id
        `);

      if (kontrol.recordset.length > 0) continue;

      const cover = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null;

      const description = book.first_sentence
        ? typeof book.first_sentence === "string"
          ? book.first_sentence
          : book.first_sentence[0]
        : book.subject
        ? book.subject.slice(0, 5).join(", ")
        : "";

      await pool
        .request()
        .input("type", "book")
        .input("external_id", externalId)
        .input("title", book.title || "")
        .input("description", description || "")
        .input("year", book.first_publish_year || null)
        .input("cover_url", cover)
        .input("page_count", book.number_of_pages_median || null)
        .input(
          "authors",
          book.author_name ? book.author_name.join(", ") : null
        )
        .query(`
          INSERT INTO contents
            (type, external_id, title, description, year, cover_url, page_count, authors, created_at)
          VALUES
            (@type, @external_id, @title, @description, @year, @cover_url, @page_count, @authors, GETDATE())
        `);

      eklenen++;
    }

    return res.json({
      message: `${eklenen} kitap başarıyla veritabanına kaydedildi ✅`,
    });
  } catch (err) {
    console.error("BOOK IMPORT ERROR:", err);
    return res.status(500).json({
      message: "Kitap aktarımı başarısız ❌",
      detail: err.message,
    });
  }
});

module.exports = router;
