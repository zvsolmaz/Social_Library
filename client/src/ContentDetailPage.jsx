// ContentDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5001";

export default function ContentDetailPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  // Content
  const [content, setContent] = useState(null);

  // Reviews
  const [reviews, setReviews] = useState([]);

  // Rating
  const [rating, setRating] = useState(0);

  // Messages
  const [message, setMessage] = useState("");

  // Reply
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Add review
  const [reviewForm, setReviewForm] = useState({
    title: "",
    body: "",
  });

  // Current User
  const [currentUser, setCurrentUser] = useState(null);

  // Edit Modal
  const [editModal, setEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [editId, setEditId] = useState(null);

  // Lists
  const [myLists, setMyLists] = useState([]);
  const [showListModal, setShowListModal] = useState(false);

  /* ------------------------------------------------------ */
  /*                SAYFA YÜKLENİNCE VERİLERİ ÇEK           */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!id) return;
    fetchUser();
    fetchDetail();
    fetchReviews();
    fetchMyLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ------------------------------------------------------ */
  /*                   MEVCUT KULLANICI                     */
  /* ------------------------------------------------------ */
  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/protected/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data && data.id) {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("ME ERROR:", err);
    }
  }

  /* ------------------------------------------------------ */
  /*                     İÇERİK DETAY                       */
  /* ------------------------------------------------------ */
  async function fetchDetail() {
    try {
      const res = await fetch(`${API_BASE}/protected/${id}`);
      const data = await res.json();
      setContent(data);
    } catch (err) {
      console.error("Detail Error:", err);
    }
  }

  /* ------------------------------------------------------ */
  /*                     YORUMLARI ÇEK                      */
  /* ------------------------------------------------------ */
  async function fetchReviews() {
    try {
      const res = await fetch(`${API_BASE}/contents/${id}/reviews`);
      const data = await res.json();

      if (Array.isArray(data)) setReviews(data);
    } catch (err) {
      console.error("REVIEW ERROR:", err);
    }
  }

  /* ------------------------------------------------------ */
  /*                ÖZEL LİSTELERİ ÇEK                      */
  /* ------------------------------------------------------ */
  async function fetchMyLists() {
    try {
      const res = await fetch(`${API_BASE}/protected/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (Array.isArray(data)) setMyLists(data);
    } catch (err) {
      console.error("LIST FETCH ERROR:", err);
    }
  }

  /* ------------------------------------------------------ */
  /*             İÇERİĞİ BELİRLİ LİSTEYE EKLE               */
  /* ------------------------------------------------------ */
  async function addToList(list_id) {
    try {
      const res = await fetch(
        `${API_BASE}/protected/lists/${list_id}/add-item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content_id: id }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("İçerik listeye eklendi ✔");
      setShowListModal(false);
    } catch (err) {
      console.error("ADD LIST ERROR:", err);
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                    PUAN VERME                          */
  /* ------------------------------------------------------ */
  async function handleRate() {
    if (!token) return setMessage("Puan vermek için giriş yapın.");
    if (!rating) return setMessage("Önce bir puan seçin.");

    try {
      const res = await fetch(`${API_BASE}/contents/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Puan kaydedildi ✔");
      fetchDetail();
    } catch (err) {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                     YORUM EKLEME                       */
  /* ------------------------------------------------------ */
  async function handleAddReview(e) {
    e.preventDefault();

    if (!token) return setMessage("Yorum için giriş yapın.");
    if (!reviewForm.body.trim())
      return setMessage("Yorum boş olamaz.");

    try {
      const res = await fetch(`${API_BASE}/contents/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });

      const data = await res.json();
      if (!res.ok) return setMessage(data.message);

      setReviewForm({ title: "", body: "" });
      fetchReviews();
      setMessage("Yorum eklendi ✔");
    } catch (err) {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                  YORUMU BEĞENME                       */
  /* ------------------------------------------------------ */
  async function handleLikeReview(reviewId) {
    if (!token) return setMessage("Giriş yapın.");

    try {
      const res = await fetch(
        `${API_BASE}/contents/reviews/${reviewId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) return setMessage(data.message);

      fetchReviews();
    } catch {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                     CEVAP EKLEME                       */
  /* ------------------------------------------------------ */
  async function handleReply(e, reviewId) {
    e.preventDefault();

    if (!token) return setMessage("Giriş yapın.");
    if (!replyText.trim()) return setMessage("Cevap boş olamaz.");

    try {
      const res = await fetch(
        `${API_BASE}/contents/reviews/${reviewId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: replyText }),
        }
      );

      const data = await res.json();
      if (!res.ok) return setMessage(data.message);

      const newText = replyText;
      setReplyText("");
      setReplyOpen(null);

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                replies: [
                  ...(r.replies || []),
                  {
                    id: Date.now(),
                    username: currentUser?.username || "Sen",
                    body: newText,
                  },
                ],
              }
            : r
        )
      );
    } catch (err) {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*               YORUMU SİLME (SADECE SAHİBİ)             */
  /* ------------------------------------------------------ */
  async function deleteReview(reviewId) {
    if (!window.confirm("Bu yorumu silmek istiyor musun?")) return;

    try {
      await fetch(`${API_BASE}/contents/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchReviews();
    } catch {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                     DÜZENLEME AÇ                       */
  /* ------------------------------------------------------ */
  function openEditModal(id, text) {
    setEditId(id);
    setEditText(text);
    setEditModal(true);
  }

  /* ------------------------------------------------------ */
  /*                 YORUMU GÜNCELLE                        */
  /* ------------------------------------------------------ */
  async function updateReview() {
    try {
      await fetch(`${API_BASE}/contents/reviews/${editId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: editText }),
      });

      setEditModal(false);
      fetchReviews();
    } catch {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*              KÜTÜPHANE DURUM BUTONLARI                */
  /* ------------------------------------------------------ */
  async function setLibrary(status) {
    if (!token) return setMessage("Giriş yapın.");

    try {
      const res = await fetch(`${API_BASE}/contents/${id}/library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Sunucu hatası");
    }
  }

  /* ------------------------------------------------------ */
  /*                 EĞER YÜKLENMEDİYSE                     */
  /* ------------------------------------------------------ */
  if (!content) return <div>Yükleniyor...</div>;

  /* ------------------------------------------------------ */
  /*                    SAYFA TASARIMI                      */
  /* ------------------------------------------------------ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #22c55e22, transparent 60%), radial-gradient(circle at bottom right, #0f766e33, #020617 70%)",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,78,59,0.88))",
          padding: "28px",
          borderRadius: "22px",
          border: "1px solid rgba(34,197,94,0.28)",
          boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
          color: "#d1fae5",
        }}
      >
        {/* Mesaj alanı */}
        {message && (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(37,99,235,0.2)",
              border: "1px solid rgba(59,130,246,0.5)",
              color: "#bfdbfe",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {/* ÜST BÖLÜM */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <img
            src={content.cover_url}
            alt={content.title}
            style={{
              width: "260px",
              height: "380px",
              objectFit: "cover",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#bbf7d0",
                marginBottom: "4px",
              }}
            >
              {content.title}
            </h1>

            <p style={{ color: "#9ca3af", marginTop: 0 }}>
              {content.year} •{" "}
              {content.type === "book" ? "📖 Kitap" : "🎬 Film"}
            </p>

            {content.description && (
              <p
                style={{
                  marginTop: "12px",
                  color: "#e5e7eb",
                  lineHeight: 1.5,
                }}
              >
                {content.description}
              </p>
            )}

            {/* ⭐ PUAN ALANI */}
            <div style={{ marginTop: "18px" }}>
              <StarRating
                value={rating ? rating / 2 : 0}
                onChange={(val) => setRating(val)}
              />

              <button
                onClick={handleRate}
                style={{
                  marginTop: "10px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(34,197,94,0.4)",
                }}
              >
                Puan Ver
              </button>
            </div>

            {/* 📌 Özel Listeye Ekle */}
            <button
              onClick={() => setShowListModal(true)}
              style={{
                marginTop: "12px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(59,130,246,0.4)",
                background: "rgba(59,130,246,0.15)",
                color: "#bfdbfe",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📌 Özel Listeye Ekle
            </button>

            {/* 🎬/📚 Kütüphane */}
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {content.type === "movie" && (
                <>
                  <button
                    onClick={() => setLibrary("watched")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "rgba(34,197,94,0.15)",
                      color: "#86efac",
                      border: "1px solid rgba(34,197,94,0.4)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🎬 İzledim
                  </button>
                  <button
                    onClick={() => setLibrary("to_watch")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "rgba(34,197,94,0.08)",
                      color: "#bbf7d0",
                      border: "1px solid rgba(34,197,94,0.3)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⏳ İzlenecek
                  </button>
                </>
              )}

              {content.type === "book" && (
                <>
                  <button
                    onClick={() => setLibrary("read")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "rgba(34,197,94,0.15)",
                      color: "#86efac",
                      border: "1px solid rgba(34,197,94,0.4)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📚 Okudum
                  </button>
                  <button
                    onClick={() => setLibrary("to_read")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "rgba(34,197,94,0.08)",
                      color: "#bbf7d0",
                      border: "1px solid rgba(34,197,94,0.3)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📖 Okunacak
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* YORUM YAZ */}
        <div
          style={{
            marginTop: "26px",
            padding: "18px",
            borderRadius: "18px",
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(31,41,55,0.9)",
          }}
        >
          <h3 style={{ marginBottom: "12px", color: "#bbf7d0" }}>
            Yorum Yap
          </h3>

          <input
            type="text"
            placeholder="Başlık (isteğe bağlı)"
            value={reviewForm.title}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, title: e.target.value })
            }
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#bbf7d0",
              marginBottom: "8px",
              outline: "none",
            }}
          />

          <textarea
            placeholder="Düşüncelerini yaz..."
            value={reviewForm.body}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, body: e.target.value })
            }
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#bbf7d0",
              marginBottom: "10px",
              outline: "none",
            }}
          />

          <button
            onClick={handleAddReview}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
            }}
          >
            Yorum Gönder
          </button>
        </div>

        {/* YORUM LİSTESİ */}
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ marginBottom: "12px", color: "#bbf7d0" }}>
            Yorumlar
          </h3>

          {reviews.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>Henüz yorum yok.</p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  marginBottom: "14px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#e5e7eb",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                }}
              >
                <b style={{ color: "#a7f3d0" }}>{rev.username}</b>

                {rev.title && (
                  <div
                    style={{
                      fontWeight: 600,
                      marginTop: 2,
                      marginBottom: 4,
                    }}
                  >
                    {rev.title}
                  </div>
                )}

                <p style={{ marginTop: 4 }}>{rev.body}</p>

                {/* Beğenme / cevap / düzenle-sil */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleLikeReview(rev.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "none",
                      background: "rgba(148,163,184,0.25)",
                      color: "#e5e7eb",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    👍 {rev.like_count || 0}
                  </button>

                  <button
                    onClick={() =>
                      setReplyOpen(
                        replyOpen === rev.id ? null : rev.id
                      )
                    }
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "none",
                      background: "rgba(59,130,246,0.25)",
                      color: "#bfdbfe",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    💬 Cevapla
                  </button>

                  {currentUser?.id === rev.user_id && (
                    <>
                      <button
                        onClick={() =>
                          openEditModal(rev.id, rev.body)
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "none",
                          background: "rgba(37,99,235,0.2)",
                          color: "#bfdbfe",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        ✏ Düzenle
                      </button>

                      <button
                        onClick={() => deleteReview(rev.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "none",
                          background: "rgba(248,113,113,0.18)",
                          color: "#fecaca",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        🗑 Sil
                      </button>
                    </>
                  )}
                </div>

                {/* Cevaplar */}
                {rev.replies &&
                  rev.replies.map((rp) => (
                    <div
                      key={rp.id}
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        background: "rgba(6,78,59,0.5)",
                        borderRadius: "10px",
                        border:
                          "1px solid rgba(34,197,94,0.25)",
                        color: "#d1fae5",
                      }}
                    >
                      <b>{rp.username}:</b> {rp.body}
                    </div>
                  ))}

                {/* Cevap formu */}
                {replyOpen === rev.id && (
                  <form
                    onSubmit={(e) => handleReply(e, rev.id)}
                    style={{ marginTop: "8px" }}
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) =>
                        setReplyText(e.target.value)
                      }
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "10px",
                        border: "1px solid #1f2937",
                        background: "#020617",
                        color: "#bbf7d0",
                        marginBottom: "6px",
                        outline: "none",
                      }}
                    />

                    <button
                      type="submit"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "10px",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Gönder
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>

        {/* 📌 ÖZEL LİSTE MODALI */}
        {showListModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.85)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <div
              style={{
                width: "380px",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,78,59,0.85))",
                padding: "24px",
                borderRadius: "18px",
                color: "#d1fae5",
                border:
                  "1px solid rgba(34,197,94,0.3)",
                boxShadow:
                  "0 15px 40px rgba(0,0,0,0.6)",
              }}
            >
              <h3 style={{ marginBottom: "12px" }}>
                📌 Hangi listeye eklemek istersin?
              </h3>

              {myLists.length === 0 ? (
                <p>Henüz özel listen yok.</p>
              ) : (
                myLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => addToList(list.id)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: "8px",
                      textAlign: "left",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(31,41,55,0.9)",
                      background: "#020617",
                      color: "#e5e7eb",
                      cursor: "pointer",
                    }}
                  >
                    {list.name}
                  </button>
                ))
              )}

              <button
                onClick={() => setShowListModal(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  marginTop: "8px",
                  cursor: "pointer",
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* ✏ YORUM DÜZENLEME MODALI */}
        {editModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.85)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.8))",
                padding: "22px",
                borderRadius: "16px",
                width: "420px",
                boxShadow:
                  "0 18px 45px rgba(0,0,0,0.7)",
                border: "1px solid #1d4ed8",
                color: "#e5e7eb",
              }}
            >
              <h3>Yorumu Düzenle</h3>

              <textarea
                value={editText}
                onChange={(e) =>
                  setEditText(e.target.value)
                }
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #1f2937",
                  marginTop: "10px",
                  background: "#020617",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={updateReview}
                  style={{
                    flex: 1,
                    background: "#4ade80",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Kaydet
                </button>

                <button
                  onClick={() => setEditModal(false)}
                  style={{
                    flex: 1,
                    background: "#6b7280",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================================== */
/*                      STAR RATING                      */
/* ===================================================== */
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ fontSize: "24px", cursor: "pointer" }}>
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;

        return (
          <span
            key={i}
            onClick={() => onChange(starValue * 2)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(null)}
            style={{
              color:
                (hover || value) >= starValue
                  ? "#facc15"
                  : "#4b5563",
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
