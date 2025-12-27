// FeedPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatActivity } from "./utils/activityFormatter";

// eğer dosya yolu farklıysa: "../utils/activityFormatter" şeklinde düzelt

const API_BASE = import.meta.env.VITE_API_URL;

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [end, setEnd] = useState(false);

  const token = localStorage.getItem("token");

  // 🔹 İlk sayfayı yükle
  useEffect(() => {
    loadFeed(1, true);
    // eslint-disable-next-line
  }, []);

  async function loadFeed(pageNum, reset = false) {
    if (end && !reset) return;

    setLoadingMore(true);

    try {
      const res = await fetch(
        `${API_BASE}/protected/feed?page=${pageNum}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("FEED ERROR:", data);
        return;
      }

      if (!data || data.length === 0) {
        setEnd(true);
        return;
      }

      if (reset) {
        setFeed(data);
        setEnd(false);
        setPage(pageNum);
      } else {
        setFeed((prev) => [...prev, ...data]);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("FEED LOAD ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    loadFeed(page + 1);
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.headerTop}>
          <div>
            <h2 style={styles.title}>Sosyal Akış</h2>
            <p style={styles.subtitle}>
             
            </p>
          </div>
        </div>

        {/* FEED LİSTESİ */}
        {feed.length === 0 && !loadingMore && (
          <p style={{ textAlign: "center", marginTop: 20, opacity: 0.7 }}>
            Henüz gösterilecek aktivite yok. Birkaç içerik puanlayıp yorum yapmayı dene ✨
          </p>
        )}

        {feed.map((a) => (
          <ActivityCard key={a.activity_id} a={a} />
        ))}

        {/* ALTA BUTONLAR */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          {loadingMore && <p>Yükleniyor...</p>}

          {!end && !loadingMore && feed.length > 0 && (
            <button style={styles.loadMoreBtn} onClick={handleLoadMore}>
              Daha Fazla Göster
            </button>
          )}

          {end && feed.length > 0 && (
            <p style={{ opacity: 0.6, fontSize: 13, marginTop: 8 }}>
              Tüm aktiviteler yüklendi ✔
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   AKTİVİTE KARTI
=========================== */
function ActivityCard({ a }) {
  const timeAgo = formatTimeAgo(a.created_at);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  const token = localStorage.getItem("token");

  
  
  async function handleFeedLike() {
    try {
      const res = await fetch(
        `${API_BASE}/protected/feed/${a.activity_id}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Beğeni başarısız");
      } else {
        // İleride beğeni sayısı göstermek istersen burada state güncelleyebiliriz
        alert(data.liked ? "Beğenildi ❤️" : "Beğeni kaldırıldı ❌");
      }
    } catch (err) {
      console.error("FEED LIKE ERROR:", err);
    }
  }

  async function loadComments() {
    try {
      const res = await fetch(
        `${API_BASE}/protected/feed/${a.activity_id}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setComments(data);
      setShowComments(true);
    } catch (err) {
      console.error("LOAD COMMENTS ERROR:", err);
    }
  }

  async function handleFeedComment() {
    if (!replyText.trim()) {
      alert("Yorum boş olamaz");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/protected/feed/${a.activity_id}/comment`,
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

      if (!res.ok) {
        alert(data.message || "Yorum başarısız");
      } else {
        setReplyText("");
        setShowReply(false);
        // İstersen yeni yorumu comments'e de ekleyebiliriz
        loadComments();
      }
    } catch (err) {
      console.error("FEED COMMENT ERROR:", err);
    }
  }

  return (
    <div style={styles.card}>
      {/* ÜST BİLGİ */}
      <div style={styles.cardHeader}>
        <img
          src={a.avatar_url || "/default-avatar.png"}
          style={styles.avatar}
          alt="avatar"
        />

        <div>
          <Link to={`/profile/${a.user_id}`} style={styles.username}>
            {a.username}
          </Link>

          <div style={styles.actionRow}>
            <span style={styles.actionText}>{formatActivity(a)}</span>

            <span style={styles.dot}>•</span>
            <span style={styles.date}>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* GÖVDE */}
      {renderBody(a)}

      {/* BUTONLAR */}
      {(a.type === "review" || a.type === "rating") && (
        <div style={styles.footer}>
          <button style={styles.footerBtn} onClick={handleFeedLike}>
            ❤️ Beğen
          </button>

          <button
            style={styles.footerBtn}
            onClick={() => {
              loadComments();
              setShowReply((prev) => !prev);
            }}
          >
            💬 Yorum Yap
          </button>
        </div>
      )}

      {/* YORUM ALANI */}
      {showReply && (
        <div style={styles.replyArea}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={styles.textarea}
            placeholder="Düşüncelerini yaz..."
          />
          <button style={styles.replyBtn} onClick={handleFeedComment}>
            Gönder
          </button>
        </div>
      )}

      {/* YORUM LİSTESİ */}
      {showComments && comments.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <h4 style={styles.commentsTitle}>Yorumlar</h4>
          {comments.map((c) => (
            <div key={c.id} style={styles.commentBox}>
              <img
                src={c.avatar_url || "/default-avatar.png"}
                style={styles.commentAvatar}
                alt="yorum-avatar"
              />
              <div>
                <b style={styles.commentName}>{c.username}</b>
                <p style={styles.commentText}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================
   BODY RENDER
=========================== */
function renderBody(a) {
  if (a.type === "rating") {
    return (
      <div style={styles.body}>
        <img src={a.cover_url} style={styles.cover} alt="poster" />
        <div>
          <p style={styles.contentTitle}>{a.content_title}</p>
          <p style={{ marginTop: 6 }}>
            Puanı: <b>{a.rating}/10</b> ⭐
          </p>
        </div>
      </div>
    );
  }

  if (a.type === "review") {
    return (
      <div style={styles.body}>
        <img src={a.cover_url} style={styles.cover} alt="poster" />
        <div>
          <p style={styles.contentTitle}>{a.content_title}</p>
          <p style={styles.reviewBody}>
            {(a.review_body || "").slice(0, 180)}...
            <Link to={`/content/${a.content_id}`} style={styles.readMore}>
              devamını oku →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (a.type === "review_like") {
    return (
      <div style={styles.infoBoxLike}>
        <p style={styles.infoLabel}>Beğenilen yorum:</p>
        <p style={styles.infoText}>{a.review_body?.slice(0, 150)}</p>
      </div>
    );
  }

  if (a.type === "review_reply") {
    return (
      <div style={styles.infoBoxReply}>
        <p style={styles.infoLabel}>Verilen cevap:</p>
        <p style={styles.infoText}>{a.reply_body?.slice(0, 150)}</p>
      </div>
    );
  }

  return null;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  let diff = (now - date) / 1000;

  if (diff < 0) diff = 0;

  // 0–59 saniye arası
  if (diff < 60) return "şimdi";

  if (diff < 3600) return Math.floor(diff / 60) + " dk önce";
  if (diff < 86400) return Math.floor(diff / 3600) + " saat önce";

  return Math.floor(diff / 86400) + " gün önce";
}

/* ===========================
   DARK GREEN LETTERBOXD FEED STYLES
=========================== */

const styles = {
  wrapper: {
    background:
      "radial-gradient(circle at top left, #22c55e22, transparent 60%), radial-gradient(circle at bottom right, #0f766e33, #020617 70%)",
    minHeight: "100vh",
    paddingTop: 40,
    paddingBottom: 40,
  },

  container: {
    width: "900px",
    margin: "auto",
    padding: 30,
    background: "rgba(15,23,42,0.92)", // slate-900
    borderRadius: 26,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    border: "1px solid rgba(34,197,94,0.20)",
    color: "#e5e7eb",
  },

  /* =================== TITLE =================== */

  title: {
    textAlign: "center",
    fontSize: "32px",
    fontWeight: 700,
    color: "#bbf7d0",
    marginBottom: 30,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  contentTitle: {
    fontWeight: 700,
    fontSize: 17,
    color: "#d1fae5", // açık yeşil
    marginBottom: 4,
  },

  /* =================== CARD =================== */

  card: {
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,78,59,0.85))",
    padding: 22,
    borderRadius: 18,
    border: "1px solid rgba(34,197,94,0.35)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
    marginBottom: 25,
    transition: "0.25s ease",
  },

  cardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 14px 40px rgba(0,0,0,0.7)",
  },

  /* =================== HEADER =================== */

  header: {
    display: "flex",
    gap: 14,
    marginBottom: 14,
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid rgba(52,211,153,0.65)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
  },

  username: {
    fontWeight: 700,
    fontSize: 17,
    color: "#a7f3d0",
    textDecoration: "none",
  },

  actionRow: {
    display: "flex",
    gap: 6,
    marginTop: 2,
    fontSize: 14,
  },

  actionText: {
    color: "#4ade80",
    fontWeight: 500,
  },

  date: {
    fontSize: 13,
    color: "#9ca3af",
  },

  dot: {
    color: "#64748b",
  },

  /* =================== BODY =================== */

  body: { display: "flex", gap: 18, marginTop: 10 },

  cover: {
    width: 120,
    height: 170,
    borderRadius: 12,
    objectFit: "cover",
    boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
  },

  /* =================== FOOTER =================== */

  footer: {
    display: "flex",
    gap: 14,
    marginTop: 16,
  },

  footerBtn: {
    padding: "9px 16px",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid #15803d",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    color: "#bbf7d0",
    transition: "0.25s",
  },

  footerBtnHover: {
    background: "#064e3b",
  },

  /* =================== COMMENT REPLY AREA =================== */

  replyArea: {
    marginTop: 12,
    display: "flex",
    gap: 10,
  },

  textarea: {
    flex: 1,
    minHeight: 70,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #1f2937",
    fontSize: 14,
    background: "#020617",
    color: "#d1fae5",
    outline: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
  },

  replyBtn: {
    padding: "9px 16px",
    borderRadius: 12,
    background: "#22c55e",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    fontSize: 14,
    boxShadow: "0 6px 18px rgba(34,197,94,0.5)",
  },

  /* =================== COMMENT BOX =================== */

  commentBox: {
    display: "flex",
    gap: 10,
    padding: 12,
    background: "rgba(15,23,42,0.7)",
    borderRadius: 12,
    border: "1px solid #1f2937",
    alignItems: "center",
    marginTop: 8,
  },

  commentAvatar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #22c55e",
  },

  commentName: {
    color: "#a7f3d0",
  },

  commentText: {
    color: "#d1d5db",
    fontSize: 14,
  },

  /* =================== LIKE & REPLY BOXES =================== */

  likeBox: {
    marginTop: 10,
    padding: 14,
    background: "rgba(236,253,245,0.1)",
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.3)",
    fontSize: 14,
    color: "#d1fae5",
  },

  replyBox: {
    marginTop: 10,
    padding: 14,
    background: "rgba(59,130,246,0.08)",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.3)",
    fontSize: 14,
    color: "#dbeafe",
  },

  readMore: {
    marginLeft: 4,
    color: "#4ade80",
    fontWeight: 600,
    textDecoration: "none",
  },
};
