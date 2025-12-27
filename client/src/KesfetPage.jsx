// KesfetPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function KesfetPage() {
  const navigate = useNavigate();

  const [allContents, setAllContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("hepsi");

  // TÜM İÇERİKLERİ ÇEK
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API}/contents/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAllContents(data);
        setFilteredContents(data);
      });
  }, []);

  // FİLTRE
  const applyFilters = () => {
    let temp = [...allContents];

    if (search.trim() !== "")
      temp = temp.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase())
      );

    if (year) temp = temp.filter((i) => i.year == year);
    if (type !== "hepsi") temp = temp.filter((i) => i.type === type);

    setFilteredContents(temp);
  };

  // Vitrin listeleri
  const topRated = [...allContents]
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 10);

  const mostPopular = [...allContents]
    .sort(
      (a, b) =>
        (b.review_count || 0) +
        (b.list_count || 0) -
        ((a.review_count || 0) + (a.list_count || 0))
    )
    .slice(0, 10);

  return (
    <div style={page}>
      {/* --- SOL SİDEBAR --- */}
      <aside style={sidebar}>
        <h3 style={sideTitle}>⭐ En Yüksek Puanlılar</h3>
        {topRated.map((i) => (
          <div
            key={i.id}
            style={sideItem}
            onClick={() => navigate(`/content/${i.id}`)}
          >
            <img src={i.cover_url} style={sideImg} />
            <p>{i.title}</p>
          </div>
        ))}

        <h3 style={sideTitle}>🔥 En Popüler</h3>
        {mostPopular.map((i) => (
          <div
            key={i.id}
            style={sideItem}
            onClick={() => navigate(`/content/${i.id}`)}
          >
            <img src={i.cover_url} style={sideImg} />
            <p>{i.title}</p>
          </div>
        ))}
      </aside>

      {/* --- ANA GRID ALANI --- */}
      <main style={main}>
        <h1 style={{ marginBottom: 20 }}>🔍 Keşfet</h1>

        {/* Arama & Filtre */}
        <div style={filterBar}>
          <input
            style={input}
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            style={inputSmall}
            placeholder="Yıl"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <select
            style={inputSmall}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="hepsi">Hepsi</option>
            <option value="book">Kitap</option>
            <option value="movie">Film</option>
          </select>

          <button style={btn} onClick={applyFilters}>
            Filtrele
          </button>
        </div>

        {/* Grid içerikler */}
        <div style={grid}>
          {filteredContents.map((i) => (
            <div
              key={i.id}
              style={card}
              onClick={() => navigate(`/content/${i.id}`)}
            >
              <img src={i.cover_url} style={cardImg} />
              <h4>{i.title}</h4>
              <small>{i.year}</small>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* --- DARK GREEN LETTERBOXD DISCOVER STYLES --- */

const page = {
  display: "flex",
  padding: "30px",
  background:
    "radial-gradient(circle at top left, #22c55e22, transparent 60%), radial-gradient(circle at bottom right, #0f766e33, #020617 70%)",
  minHeight: "100vh",
};

/* --- SOL PANEL --- */
const sidebar = {
  width: "260px",
  marginRight: "30px",
  background: "rgba(15,23,42,0.92)",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
  height: "90vh",
  overflowY: "auto",
  position: "sticky",
  top: "20px",
  border: "1px solid rgba(34,197,94,0.25)",
};

const sideTitle = {
  margin: "14px 0",
  fontWeight: "700",
  color: "#a7f3d0",
  fontSize: "18px",
  letterSpacing: "0.5px",
};

const sideItem = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "14px",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "10px",
  transition: "0.2s",
  color: "#d1fae5",
};

const sideImg = {
  width: "40px",
  height: "60px",
  objectFit: "cover",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
};

/* --- HOVER --- */
sideItem["&:hover"] = {
  background: "rgba(34,197,94,0.15)",
};

/* --- ANA ALAN --- */
const main = {
  flex: 1,
  color: "#d1fae5",
};

const filterBar = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
};

/* --- Arama Barı --- */
const input = {
  padding: "12px",
  borderRadius: "14px",
  border: "1px solid #1f2937",
  flex: 1,
  background: "#020617",
  color: "#bbf7d0",
  fontSize: "15px",
  outline: "none",
  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
};

const inputSmall = {
  padding: "12px",
  borderRadius: "14px",
  border: "1px solid #1f2937",
  width: "120px",
  background: "#020617",
  color: "#bbf7d0",
  fontSize: "15px",
  outline: "none",
};

/* --- Filtre Butonu --- */
const btn = {
  padding: "12px 18px",
  background: "#22c55e",
  color: "white",
  borderRadius: "14px",
  border: "none",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(34,197,94,0.4)",
};

/* --- GRID KISMI --- */
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "22px",
};

/* --- KARTLAR --- */
const card = {
  background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,78,59,0.85))",
  padding: "14px",
  borderRadius: "18px",
  border: "1px solid rgba(34,197,94,0.35)",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
  color: "#d1fae5",
  transition: "0.25s",
};

const cardImg = {
  width: "100%",
  height: "230px",
  objectFit: "cover",
  borderRadius: "12px",
  marginBottom: "12px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.55)",
};
