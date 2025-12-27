// src/utils/activityFormatter.js

export function formatActivity(a) {
  // ⭐ PUAN VERME
  if (a.type === "rating") {
    return `⭐ "${a.content_title}" adlı içeriğe ${a.rating}/10 puan verdi`;
  }

  // 💬 YORUM YAZMA
  if (a.type === "review") {
    return `💬 "${a.content_title}" için yorum yaptı: "${a.review_body}"`;
  }

  // ❤️ YORUMU BEĞENME
  if (a.type === "review_like") {
    // backend'den review_body geliyor
    if (a.review_body) {
      return `❤️ "${a.content_title}" içeriği için şu yorumu beğendi: "${a.review_body}"`;
    }
    return `❤️ "${a.content_title}" içeriği için bir yorumu beğendi`;
  }

  // 💬 YORUMA CEVAP VERME
  if (a.type === "review_reply") {
    if (a.reply_body) {
      return `💬 "${a.content_title}" içeriğindeki bir yoruma cevap yazdı: "${a.reply_body}"`;
    }
    return `💬 "${a.content_title}" içeriğindeki bir yoruma cevap yazdı`;
  }

  // 📚 / 🎬 KÜTÜPHANE (yeni tipler)
  if (a.type === "watch_add") {
    return `🎬 "${a.content_title}" içeriğini "İzledim" olarak işaretledi`;
  }

  if (a.type === "to_watch_add") {
    return `📺 "${a.content_title}" içeriğini "İzlenecekler" listesine ekledi`;
  }

  if (a.type === "read_add") {
    return `📚 "${a.content_title}" içeriğini "Okudum" olarak işaretledi`;
  }

  if (a.type === "to_read_add") {
    return `📘 "${a.content_title}" içeriğini "Okunacaklar" listesine ekledi`;
  }

  // ESKİ YAPI: type = "library" + library_status varsa, bozulmasın diye bırakıyoruz
  if (a.type === "library") {
    switch (a.library_status) {
      case "read":
        return `📚 ${a.content_title} kitabını 'Okudum' listesine ekledi`;
      case "to_read":
        return `📘 ${a.content_title} kitabını 'Okunacaklar' listesine ekledi`;
      case "watched":
        return `🎬 ${a.content_title} filmini 'İzledim' listesine ekledi`;
      case "to_watch":
        return `📺 ${a.content_title} filmini 'İzlenecekler' listesine ekledi`;
      default:
        return `${a.content_title} içerik listesine eklendi`;
    }
  }

  // Fallback
  return "Bir aktivite gerçekleştirdi";
}

// ZAMAN FORMATLAYICI AYNI KALSIN
export function timeAgo(date) {
  const diff = (new Date() - new Date(date)) / 1000;

  if (diff < 60) return `${Math.floor(diff)} saniye önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}
