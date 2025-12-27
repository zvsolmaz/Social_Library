import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5001";

export default function UsersExplorePage() {
  const [token, setToken] = useState(null);

  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  /* ----------------------------------------
        TOKEN AL
  ---------------------------------------- */
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  /* ----------------------------------------
        TOKEN GELDİKTEN SONRA BAŞLA
  ---------------------------------------- */
  useEffect(() => {
    if (!token) return;

    fetchUsers();
    fetchFollowing();
    fetchCurrentUser();
  }, [token]);

  /* ----------------------------------------
        MEVCUT USER
  ---------------------------------------- */
  async function fetchCurrentUser() {
    try {
      const res = await fetch(`${API_BASE}/protected/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data?.id) setCurrentUser(data);

    } catch (err) {
      console.error("ME FETCH ERROR:", err);
    }
  }

  /* ----------------------------------------
        TÜM KULLANICILAR
  ---------------------------------------- */
  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUsers(data);

    } catch (err) {
      console.error("Users fetch error:", err);
    }
  }

  /* ----------------------------------------
        TAKİP EDİLENLER
  ---------------------------------------- */
  async function fetchFollowing() {
    try {
      const res = await fetch(`${API_BASE}/follows/following`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setFollowing(data.map((u) => u.id));
      }

    } catch (err) {
      console.error("Follow error:", err);
    }
  }

  /* ----------------------------------------
        TAKİP / BIRAK
  ---------------------------------------- */
  async function toggleFollow(userId) {
    const isFollowing = following.includes(userId);

    try {
      await fetch(`${API_BASE}/follows/${userId}`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchFollowing();

    } catch (err) {
      console.error("Toggle follow error:", err);
    }
  }

  /* ----------------------------------------
        TASARIM (YENİ PREMIUM DARK-GREEN UI)
  ---------------------------------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background:
          "radial-gradient(circle at top left, #22c55e22, transparent 60%), radial-gradient(circle at bottom right, #0f766e33, #020617 70%)",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#bbf7d0",
        }}
      >
        👥 Kullanıcıları Keşfet
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "26px",
        }}
      >
        {users.map((user) => {
          if (!user) return null;

          const isFollowing = following.includes(user.id);
          const initial = user.username?.[0]?.toUpperCase() ?? "?";

          return (
            <div
              key={user.id}
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(6,78,59,0.88))",
                padding: "24px",
                borderRadius: "22px",
                border: "1px solid rgba(34,197,94,0.25)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "0.25s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 48px rgba(0,0,0,0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(0,0,0,0.55)";
              }}
            >
              {/* Avatar */}
              {/* Avatar */}
<div
  style={{
    width: 80,
    height: 80,
    borderRadius: "50%",
    overflow: "hidden",
    background: "rgba(34,197,94,0.15)",
    border: "2px solid rgba(34,197,94,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 6px 18px rgba(34,197,94,0.3)",
  }}
>
  {user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt="avatar"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span
      style={{
        fontSize: "32px",
        fontWeight: "700",
        color: "#86efac",
      }}
    >
      {initial}
    </span>
  )}
</div>

              {/* Username */}
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginTop: "12px",
                  color: "#bbf7d0",
                }}
              >
                {user.username}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#a1a1aa",
                  marginBottom: "14px",
                }}
              >
                {user.email}
              </div>

              {/* Follow Button */}
              {currentUser?.id !== user.id && (
                <button
                  onClick={() => toggleFollow(user.id)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid rgba(34,197,94,0.35)",
                    background: isFollowing
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(34,197,94,0.2)",
                    color: isFollowing ? "#fecaca" : "#bbf7d0",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "0.25s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isFollowing
                      ? "rgba(239,68,68,0.35)"
                      : "rgba(34,197,94,0.35)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isFollowing
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(34,197,94,0.2)";
                    e.currentTarget.style.color = isFollowing
                      ? "#fecaca"
                      : "#bbf7d0";
                  }}
                >
                  {isFollowing ? "Takibi Bırak" : "Takip Et"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
