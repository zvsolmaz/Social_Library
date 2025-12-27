// ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatActivity } from "./utils/activityFormatter";

// eğer dosya yolu farklıysa: "../utils/activityFormatter" şeklinde düzelt

const API_BASE = "http://localhost:5001";

export default function ProfilePage() {
  const { id } = useParams();

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [watched, setWatched] = useState([]);
  const [toWatch, setToWatch] = useState([]);
  const [read, setRead] = useState([]);
  const [toRead, setToRead] = useState([]);
  const [lists, setLists] = useState([]);
  const [activities, setActivities] = useState([]);

  const [activeTab, setActiveTab] = useState("watched");

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  });

  const [showListModal, setShowListModal] = useState(false);
  const [newList, setNewList] = useState({
    type: "genel",
    name: "",
  });

  const [listItems, setListItems] = useState({});
  const [openListId, setOpenListId] = useState(null);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [targetList, setTargetList] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  /* ============================================================
     PROFİL + TÜM VERİLERİ YÜKLE
  ============================================================ */
  useEffect(() => {
    async function loadAll() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const meRes = await fetch(`${API_BASE}/protected/profile`, { headers });
        const meData = await meRes.json();
        if (!meRes.ok) {
          setLoading(false);
          return;
        }

        setMe(meData.user);

        let profileUser = meData.user;
        let own = true;

        if (id && Number(id) !== meData.user.id) {
          const profileRes = await fetch(
            `${API_BASE}/protected/profile/${id}`,
            { headers }
          );
          const profileData = await profileRes.json();
          if (!profileRes.ok) {
            setLoading(false);
            return;
          }

          profileUser = profileData.user;
          own = false;

          const followRes = await fetch(
            `${API_BASE}/protected/follow-status/${id}`,
            { headers }
          );
          const followData = await followRes.json();
          setIsFollowing(!!followData.following);
        }

        setUser(profileUser);
        setIsOwnProfile(own);

        if (own) {
          const resWatched = await fetch(`${API_BASE}/protected/watched`, {
            headers,
          });
          if (resWatched.ok) setWatched(await resWatched.json());

          const resToWatch = await fetch(`${API_BASE}/protected/to-watch`, {
            headers,
          });
          if (resToWatch.ok) setToWatch(await resToWatch.json());

          const resRead = await fetch(`${API_BASE}/protected/read`, {
            headers,
          });
          if (resRead.ok) setRead(await resRead.json());

          const resToRead = await fetch(`${API_BASE}/protected/to-read`, {
            headers,
          });
          if (resToRead.ok) setToRead(await resToRead.json());

          const resLists = await fetch(`${API_BASE}/protected/lists`, {
            headers,
          });
          if (resLists.ok) setLists(await resLists.json());

          const resAct = await fetch(`${API_BASE}/protected/activities`, {
            headers,
          });
          if (resAct.ok) setActivities(await resAct.json());
        }

        if (!own) {
          const resWatched = await fetch(
            `${API_BASE}/protected/user/${id}/watched`,
            { headers }
          );
          if (resWatched.ok) setWatched(await resWatched.json());

          const resToWatch = await fetch(
            `${API_BASE}/protected/user/${id}/to-watch`,
            { headers }
          );
          if (resToWatch.ok) setToWatch(await resToWatch.json());

          const resRead = await fetch(
            `${API_BASE}/protected/user/${id}/read`,
            { headers }
          );
          if (resRead.ok) setRead(await resRead.json());

          const resToRead = await fetch(
            `${API_BASE}/protected/user/${id}/to-read`,
            { headers }
          );
          if (resToRead.ok) setToRead(await resToRead.json());
        }
      } catch (err) {
        console.log("Profil verisi alınamadı:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [id]);

  /* ============================================================
     TAKİP ET / TAKİPTEN ÇIK
  ============================================================ */
  async function followUser() {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/protected/follow/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFollowing(true);
    } catch (err) {
      console.log("FOLLOW ERROR:", err);
    }
  }

  async function unfollowUser() {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/protected/follow/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFollowing(false);
    } catch (err) {
      console.log("UNFOLLOW ERROR:", err);
    }
  }

  /* ============================================================
     PROFİL DÜZENLE → KAYDET
  ============================================================ */
  async function handleSaveProfile() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/protected/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Profil güncellenemedi");
        return;
      }

      setUser(data.user);
      setShowEdit(false);
      alert("Profil güncellendi!");
    } catch (err) {
      alert("Sunucu hatası");
    }
  }

  /* ============================================================
     YENİ ÖZEL LİSTE OLUŞTUR
  ============================================================ */
  async function createList() {
    if (!newList.name.trim()) {
      alert("Liste adı boş olamaz!");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/protected/lists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newList.name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Liste oluşturulamadı");
        return;
      }

      const created = data.list || data;

      setLists((prev) => [...prev, created]);
      setShowListModal(false);
      setNewList({ type: "genel", name: "" });
      alert("Liste başarıyla oluşturuldu!");
    } catch (err) {
      console.log("LIST CREATE ERROR:", err);
      alert("Sunucu hatası");
    }
  }

  /* ============================================================
     LİSTE İÇERİKLERİNİ YÜKLE
  ============================================================ */
  async function loadListItems(listId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/protected/lists/${listId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.log("LIST ITEMS ERROR:", data);
        return;
      }

      setListItems((prev) => ({ ...prev, [listId]: data }));
    } catch (err) {
      console.log("LIST ITEMS ERROR:", err);
    }
  }

  function toggleListOpen(listId) {
    if (openListId === listId) {
      setOpenListId(null);
      return;
    }
    setOpenListId(listId);
    if (!listItems[listId]) {
      loadListItems(listId);
    }
  }

  /* ============================================================
     ARAMA → LİSTEYE İÇERİK EKLEME MODALI
  ============================================================ */
  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/protected/search?q=` + encodeURIComponent(q),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Arama hatası");
        return;
      }
      setSearchResults(data);
    } catch (err) {
      console.log("SEARCH ERROR:", err);
      alert("Sunucu hatası");
    } finally {
      setSearchLoading(false);
    }
  }
  async function addContentToList(contentId) {
    if (!targetList) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/protected/lists/${targetList.id}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content_id: contentId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Listeye eklenemedi");
        return;
      }

      const addedContent = searchResults.find((c) => c.id === contentId);
      if (addedContent) {
        setListItems((prev) => {
          const current = prev[targetList.id] || [];
          if (current.some((x) => x.id === addedContent.id)) return prev;
          return {
            ...prev,
            [targetList.id]: [...current, addedContent],
          };
        });
      }

      alert("Listeye eklendi!");
    } catch (err) {
      console.log("ADD CONTENT ERROR:", err);
      alert("Sunucu hatası");
    }
  }

  async function removeListItem(listId, listItemId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/protected/lists/${listId}/items/${listItemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Silinemedi");
        return;
      }

      setListItems((prev) => {
        const current = prev[listId] || [];
        return {
          ...prev,
          [listId]: current.filter((it) => it.list_item_id !== listItemId),
        };
      });
    } catch (err) {
      console.log("DELETE ITEM ERROR:", err);
      alert("Sunucu hatası");
    }
  }

  /* ============================================================
     DURUMLAR
  ============================================================ */
  if (loading) return <p style={{ padding: 40 }}>Yükleniyor...</p>;
  if (!user) return <p style={{ padding: 40 }}>Profil bulunamadı.</p>;

  /* ============================================================
     SAYFA
  ============================================================ */
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>
          {isOwnProfile ? "Profilim" : `${user.username} Profili`}
        </h2>

        {/* PROFİL KARTI */}
        <div style={styles.card}>
          <img
            src={user.avatar_url || "https://via.placeholder.com/120"}
            alt="avatar"
            style={styles.avatar}
          />

          <div>
            <h3 style={{ marginBottom: 6 }}>{user.username}</h3>
            <p style={{ margin: 0 }}>
              <b>Email:</b> {user.email}
            </p>

            {user.bio && (
              <p style={{ marginTop: 8 }}>
                <b>Bio:</b> {user.bio}
              </p>
            )}

            {/* KENDİ PROFİLİM */}
            {isOwnProfile && (
              <>
                <button
                  style={styles.editBtn}
                  onClick={() => {
                    setEditForm({
                      username: user.username,
                      bio: user.bio || "",
                      avatar_url: user.avatar_url || "",
                    });
                    setShowEdit(true);
                  }}
                >
                  Profili Düzenle
                </button>

                <button
                  style={styles.newListBtn}
                  onClick={() => setShowListModal(true)}
                >
                  Yeni Özel Liste Oluştur
                </button>
              </>
            )}

            {/* BAŞKA PROFİL */}
            {!isOwnProfile && (
              <button
                style={{
                  marginTop: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: isFollowing ? "#ef4444" : "#16a34a",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                }}
                onClick={isFollowing ? unfollowUser : followUser}
              >
                {isFollowing ? "Takipten Çık" : "Takip Et"}
              </button>
            )}
          </div>
        </div>

        {/* SEKMELER */}
        <div style={styles.tabs}>
          {tabBtn("İzlediklerim", "watched")}
          {tabBtn("İzlenecekler", "toWatch")}
          {tabBtn("Okuduklarım", "read")}
          {tabBtn("Okunacaklar", "toRead")}
          {isOwnProfile && tabBtn("Özel Listeler", "lists")}
          {isOwnProfile && tabBtn("Son Aktiviteler", "activities")}
        </div>

        <div style={styles.contentBox}>
          {activeTab === "watched" && renderListWithImages(watched)}
          {activeTab === "toWatch" && renderListWithImages(toWatch)}
          {activeTab === "read" && renderListWithImages(read)}
          {activeTab === "toRead" && renderListWithImages(toRead)}

          {isOwnProfile &&
            activeTab === "lists" &&
            renderLists(lists, listItems, openListId)}

          {isOwnProfile &&
            activeTab === "activities" &&
            renderActivities(activities)}
        </div>

        {/* PROFİL DÜZENLE MODAL */}
        {showEdit && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ marginBottom: 14 }}>Profili Düzenle</h3>

              <label>Kullanıcı Adı</label>
              <input
                style={styles.input}
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
              />

              <label style={{ marginTop: 12 }}>Bio</label>
              <textarea
                style={styles.textarea}
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
              />

              <label style={{ marginTop: 12 }}>Avatar URL</label>
              <input
                style={styles.input}
                value={editForm.avatar_url}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatar_url: e.target.value })
                }
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button style={styles.saveBtn} onClick={handleSaveProfile}>
                  Kaydet
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setShowEdit(false)}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* YENİ ÖZEL LİSTE MODAL */}
        {showListModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ marginBottom: 14 }}>Yeni Özel Liste Oluştur</h3>

              <label>Liste Türü</label>
              <select
                style={styles.select}
                value={newList.type}
                onChange={(e) =>
                  setNewList({ ...newList, type: e.target.value })
                }
              >
                <option value="genel">Genel</option>
                <option value="film">Film Listesi</option>
                <option value="kitap">Kitap Listesi</option>
                <option value="dizi">Dizi Listesi</option>
              </select>

              <label style={{ marginTop: 10 }}>Liste Adı</label>
              <input
                style={styles.input}
                value={newList.name}
                onChange={(e) =>
                  setNewList({ ...newList, name: e.target.value })
                }
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button style={styles.saveBtn} onClick={createList}>
                  Oluştur
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setShowListModal(false)}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LİSTEYE İÇERİK EKLEME MODALI */}
        {showAddItemModal && targetList && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ marginBottom: 10 }}>
                “{targetList.name}” listesine içerik ekle
              </h3>

              <label>İçerik Ara (başlık)</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button style={styles.saveBtn} onClick={handleSearch}>
                  Ara
                </button>
              </div>

              {searchLoading && <p>Aranıyor...</p>}
              {!searchLoading && searchResults.length === 0 && (
                <p>Henüz sonuç yok.</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div
                  style={{
                    maxHeight: 250,
                    overflowY: "auto",
                    marginTop: 8,
                  }}
                >
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 8,
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      <img
                        src={c.cover_url || "https://via.placeholder.com/40x60"}
                        alt={c.title}
                        style={{
                          width: 40,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          {c.type} · {c.year}
                        </div>
                      </div>
                      <button
                        style={styles.saveBtn}
                        onClick={() => addContentToList(c.id)}
                      >
                        Ekle
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowAddItemModal(false);
                    setTargetList(null);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  /* ============================================================
     RENDER YARDIMCI FONKSİYONLAR
  ============================================================ */
 function renderActivities(list) {
  if (!list || list.length === 0) return <p>Henüz aktivite yok.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {list.map((a, i) => {
        const t = timeAgo(a.created_at);

        return (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 14,
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            {/* ÜST BİLGİ */}
            <p style={{ marginBottom: 6 }}>
              <b>{activityTitle(a)}</b> – {t}
            </p>

            {/* GÖVDE — aktiviteler */}
            {a.type === "rating" && (
              <>
                <p>{a.content_title}</p>
                <p>⭐ {a.rating}/10</p>
              </>
            )}

            {a.type === "review" && (
              <>
                <p>{a.content_title}</p>
                <p>“{a.review_body}”</p>
              </>
            )}

            {a.type === "review_like" && (
              <>
                <p>Beğendiği yorum:</p>
                <p style={{ opacity: 0.8 }}>“{a.review_body}”</p>
              </>
            )}

            {a.type === "review_reply" && (
              <>
                <p>Verdiği cevap:</p>
                <p style={{ opacity: 0.8 }}>“{a.reply_body}”</p>
              </>
            )}

            {a.type === "watch_add" && (
              <p>{a.content_title} — izlediklerime ekledi</p>
            )}

            {a.type === "to_watch_add" && (
              <p>{a.content_title} — izleneceklerine ekledi</p>
            )}

            {a.type === "read_add" && (
              <p>{a.content_title} — okuduklarına ekledi</p>
            )}

            {a.type === "to_read_add" && (
              <p>{a.content_title} — okunacaklarına ekledi</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Aktivite başlığı üreten fonksiyon */
function activityTitle(a) {
  switch (a.type) {
    case "rating":
      return "⭐ Puan Verdi";
    case "review":
      return "💬 Yorum Yaptı";
    case "review_like":
      return "❤️ Yorumu Beğendi";
    case "review_reply":
      return "💬 Yoruma Cevap Verdi";
    case "watch_add":
      return "🎬 İzlediklerine Ekledi";
    case "to_watch_add":
      return "👀 İzleneceklerine Ekledi";
    case "read_add":
      return "📚 Okuduklarına Ekledi";
    case "to_read_add":
      return "📖 Okunacaklara Ekledi";
    default:
      return "Bir aktivite gerçekleştirdi";
  }
}


  function renderLists(listArr, itemsMap, openId) {
    if (!listArr || listArr.length === 0)
      return <p>Henüz özel listen yok.</p>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {listArr.map((l) => {
          const isOpen = openId === l.id;
          const items = itemsMap[l.id] || [];

          return (
            <div
              key={l.id}
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div>
                  <b>{l.name}</b>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={styles.newListBtn}
                    onClick={() => {
                      setTargetList(l);
                      setShowAddItemModal(true);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    İçerik Ekle
                  </button>
                  <button
                    style={styles.editBtn}
                    onClick={() => toggleListOpen(l.id)}
                  >
                    {isOpen ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <>
                  {items.length === 0 && (
                    <p style={{ marginTop: 6 }}>
                      Bu listede henüz içerik yok.
                    </p>
                  )}

                  {items.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 14,
                        marginTop: 8,
                      }}
                    >
                      {items.map((it) => (
                        <div
                          key={it.list_item_id || it.id}
                          style={{ width: 140, position: "relative" }}
                        >
                          <img
                            src={
                              it.cover_url ||
                              "https://via.placeholder.com/120x180"
                            }
                            alt={it.title}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                              borderRadius: 10,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                            }}
                          />
                          <button
                            onClick={() =>
                              removeListItem(l.id, it.list_item_id)
                            }
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              borderRadius: "50%",
                              border: "none",
                              width: 26,
                              height: 26,
                              background: "#ef4444",
                              color: "white",
                              cursor: "pointer",
                              fontWeight: "bold",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                          >
                            ×
                          </button>
                          <p
                            style={{
                              textAlign: "center",
                              marginTop: 6,
                              fontSize: 13,
                            }}
                          >
                            {it.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderListWithImages(list) {
    if (!list || list.length === 0)
      return <p>Bu bölümde içerik yok.</p>;

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {list.map((item) => (
          <div key={item.id} style={{ width: 150 }}>
            {item.cover_url ? (
              <img
                src={item.cover_url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: 210,
                  objectFit: "cover",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 210,
                  borderRadius: 10,
                  background: "#1f2937",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Görsel yok
              </div>
            )}

            <p
              style={{
                textAlign: "center",
                marginTop: 6,
                fontSize: 13,
              }}
            >
              {item.title}
            </p>
          </div>
        ))}
      </div>
    );
  }

  function tabBtn(title, key) {
    const active = activeTab === key;
    return (
      <button
        onClick={() => setActiveTab(key)}
        style={{
          ...styles.tabBtn,
          background: active
            ? "linear-gradient(135deg,#14532d,#0f3d28)"
            : "transparent",
          color: active ? "#ecfdf5" : "#a7f3d0",
          borderColor: active ? "#166534" : "#134e4a",
          boxShadow: active
            ? "0 6px 18px rgba(20,83,45,0.45)"
            : "none",
        }}
      >
        {title}
      </button>
    );
  }
}

/* ============================================================
   ZAMAN FORMATLAMA
============================================================ */
function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  let diff = Math.floor((now - past) / 1000);

  // negatifse 0 yap
  if (diff < 0) diff = 0;

  // 0–59 saniye arası
  if (diff < 60) return "şimdi";

  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;

  return new Intl.DateTimeFormat("tr-TR").format(past);
}

/* ============================================================
   STYLES — PREMIUM DARK GREEN LETTERBOXD TEMA
============================================================ */
const styles = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    paddingTop: "40px",
    paddingBottom: "40px",
    background:
      "linear-gradient(135deg, #01211b 0%, #001713 60%, #00110f 100%)",
    backgroundAttachment: "fixed",
  },

  container: {
    maxWidth: "980px",
    margin: "auto",
    background: "rgba(15,23,42,0.96)",
    padding: "38px",
    borderRadius: "26px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
    color: "#f9fafb",
  },

  title: {
    textAlign: "center",
    fontSize: "26px",
    marginBottom: "25px",
    color: "#bbf7d0",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  card: {
    display: "flex",
    gap: "20px",
    padding: "20px",
    borderRadius: "18px",
    background:
      "linear-gradient(90deg, rgba(1,33,27,0.9), rgba(2,60,45,0.85), rgba(1,33,27,0.9))",
    marginBottom: "22px",
    border: "1px solid rgba(34,197,94,0.35)",
  },

  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
    border: "3px solid rgba(52,211,153,0.65)",
  },

  editBtn: {
    marginTop: 10,
    marginRight: 8,
    padding: "8px 14px",
    background: "#16a34a",
    color: "white",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 8px 22px rgba(22,163,74,0.55)",
  },

  newListBtn: {
    marginTop: 10,
    padding: "8px 14px",
    background: "#0ea5e9",
    color: "white",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 8px 22px rgba(14,165,233,0.45)",
  },

  tabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 10,
  },

  tabBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid #22c55e",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.22s ease",
  },

  contentBox: {
    padding: 20,
    background: "#020617",
    borderRadius: 16,
    marginTop: 20,
    border: "1px solid #1f2937",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modal: {
    width: 420,
    maxWidth: "90vw",
    background: "#020617",
    padding: 26,
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.8)",
    border: "1px solid #22c55e55",
    color: "#e5e7eb",
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: 10,
    minHeight: 80,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    outline: "none",
  },

  select: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    outline: "none",
  },

  saveBtn: {
    flex: 1,
    padding: 10,
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 8px 22px rgba(34,197,94,0.6)",
  },

  cancelBtn: {
    flex: 1,
    padding: 10,
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
  },
};
