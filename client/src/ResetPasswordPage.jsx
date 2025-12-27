import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL;



export default function ResetPasswordPage() {

  console.log("🎯 API_BASE:", API_BASE);

  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (newPassword !== newPasswordConfirm) {
      setMessage("Şifreler eşleşmiyor ❌");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Şifre güncellenemedi");
        return;
      }

      setMessage("Şifre başarıyla güncellendi ✅ Giriş sayfasına yönlendiriliyorsunuz...");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage("Sunucu hatası oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <div
        style={{
          width: "420px",
          background: "#ffffff",
          padding: "24px 28px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
        }}
      >
        <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>
          Yeni Şifre Belirle
        </h1>
        <p style={{ marginBottom: "16px", color: "#6b7280" }}>
          Lütfen yeni şifrenizi girin.
        </p>

        {message && (
          <div
            style={{
              padding: "8px 10px",
              marginBottom: "16px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "14px"
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "14px", display: "block" }}>
              Yeni Şifre
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "14px", display: "block" }}>
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  marginTop: "4px",
  fontSize: "14px"
};

const buttonStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer"
};
