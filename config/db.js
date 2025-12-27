const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("🎉 SQL bağlantısı başarılı!");
    return pool;   // ❗ Burası ÇOK KRİTİK
  } catch (err) {
    console.error("❌ SQL bağlanamadı:", err);
    return null;   // ya da throw err
  }
}

module.exports = { sql, connectDB };
