//ExplorePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = "http://localhost:5001";

export default function ExplorePage() {
  const navigate = useNavigate();

  const [contents, setContents] = useState([]);
  const [filter, setFilter] = useState("all"); // all | book | movie

  /* 🔥 ÖZEL LİSTE MODAL STATE'LERİ */
  const [showListModal, setShowListModal] = useState(false);
  const [lists, setLists] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  // 🔥 İçerik + yorumcu listesi
  async function fetchContents() {
    try {
      const res = await fetch(`${API_BASE}/contents/with-reviews`);
      const data = await res.json();

      const grouped = {};

      data.forEach((item) => {
        if (!grouped[item.content_id]) {
          grouped[item.content_id] = {
            id: item.content_id,
            title: item.title,
            type: item.type,
            year: item.year,
            cover_url: item.cover_url,
            reviewers: [],
          };
        }

        if (item.user_id) {
          grouped[item.content_id].reviewers.push({
            user_id: item.user_id,
            username: item.username,
            avatar_url: item.avatar_url,
            review_body: item.review_body,
          });
        }
      });

      setContents(Object.values(grouped));
    } catch (error) {
      console.error("Contents alınamadı:", error);
    }
  }

  /* =========================================================
      🔥 ÖZEL LİSTE MODALINI AÇ – Kullanıcı listelerini getir
  ========================================================= */
  async function openListModal(contentId) {
    setSelectedContent(contentId);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Özel listeye eklemek için giriş yapmalısınız.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/protected/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setLists(data);
      setShowListModal(true);
    } catch (err) {
      console.error("Listeler alınamadı:", err);
    }
  }

  /* =========================================================
      🔥 SEÇİLEN LİSTEYE İÇERİK EKLE
  ========================================================= */
  async function addToList(listId) {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${API_BASE}/protected/lists/${listId}/add-item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content_id: selectedContent }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Listeye eklenemedi");
        return;
      }

      alert("Başarıyla listeye eklendi!");
      setShowListModal(false);
    } catch (err) {
      console.error("ADD LIST ERROR:", err);
      alert("Sunucu hatası");
    }
  }

  // Filtreleme
  const filteredContents =
    filter === "all"
      ? contents
      : contents.filter((item) => item.type === filter);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          padding: "24px 28px",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
        }}
      >
        {/* ÜST BAR */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "25px",
            gap: "10px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📚 Social Library
          </h1>

          <p style={{ fontSize: "14px", color: "#047857" }}>Keşfet</p>

          {/* Filtre */}
          <div
            style={{
              display: "flex",
              borderRadius: "999px",
              background: "#f3f4f6",
              padding: "4px",
              marginTop: "5px",
            }}
          >
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              Hepsi
            </FilterButton>
            <FilterButton
              active={filter === "book"}
              onClick={() => setFilter("book")}
            >
              Kitaplar
            </FilterButton>
            <FilterButton
              active={filter === "movie"}
              onClick={() => setFilter("movie")}
            >
              Filmler
            </FilterButton>
          </div>
        </div>

        {/* İÇERİK GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredContents.map((item) => (
            <div
              key={item.id}
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: "16px",
                padding: "12px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* KAPAK */}
              <img
                src={item.cover_url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "240px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />

              {/* BAŞLIK */}
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  marginTop: "10px",
                }}
              >
                {item.title}
              </h3>

              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                {item.year || "Yıl yok"}
              </p>

              {/* YORUMCULAR */}
              <div style={{ marginTop: "10px" }}>
                {item.reviewers.slice(0, 3).map((u, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <img
                      src={u.avatar_url || "https://via.placeholder.com/30"}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                      }}
                    />

                    <Link
                      to={`/profile/${u.user_id}`}
                      style={{
                        fontSize: "13px",
                        color: "#065f46",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {u.username}
                    </Link>
                  </div>
                ))}

                {item.reviewers.length > 3 && (
                  <div>
                    <Link
                      to={`/content/${item.id}`}
                      style={{ fontSize: "12px", color: "#2563eb" }}
                    >
                      +{item.reviewers.length - 3} daha →
                    </Link>
                  </div>
                )}
              </div>

              {/* BUTONLAR */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "14px",
                }}
              >
                <button
                  style={{
                    border: "none",
                    background: "#f3f4f6",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ❤️ Beğen
                </button>

                <button
                  onClick={() => navigate(`/content/${item.id}`)}
                  style={{
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  💬 Yorum Yap
                </button>
              </div>

              {/* 🔥 ÖZEL LİSTEYE EKLE */}
              <button
                onClick={() => openListModal(item.id)}
                style={{
                  marginTop: "8px",
                  padding: "6px 12px",
                  background: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ➕ Özel Listeye Ekle
              </button>

              {/* DETAY */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background:
                      item.type === "book" ? "#ecfdf5" : "#eff6ff",
                    color: item.type === "book" ? "#166534" : "#1d4ed8",
                  }}
                >
                  {item.type === "book" ? "📖 Kitap" : "🎬 Film"}
                </span>

                <button
                  onClick={() => navigate(`/content/${item.id}`)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#16a34a",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Detay →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================
           🔥 ÖZEL LİSTE MODALI
      ========================================================= */}
      {showListModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginBottom: "10px" }}>Liste Seç</h3>

            {lists.length === 0 ? (
              <p>Hiç özel listen yok.</p>
            ) : (
              lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => addToList(l.id)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    marginBottom: "8px",
                    cursor: "pointer",
                    background: "#fff",
                  }}
                >
                  {l.name}
                </button>
              ))
            )}

            <button
              onClick={() => setShowListModal(false)}
              style={{
                marginTop: "10px",
                padding: "8px",
                width: "100%",
                background: "#ef4444",
                border: "none",
                color: "white",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- */
/* FILTER BUTTON */
/* -------------------- */
function FilterButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      style={{
        flex: 1,
        padding: "6px 14px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        background: active ? "#16a34a" : "transparent",
        color: active ? "#ffffff" : "#065f46",
        fontSize: "13px",
        fontWeight: 500,
        transition: "0.2s",
      }}
    >
      {children}
    </button>
  );
}

/* -------------------- */
/* MODAL STYLES */
/* -------------------- */
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modalBox = {
  width: "380px",
  background: "white",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

