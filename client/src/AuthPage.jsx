// AuthPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL;

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken, true);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Giriş başarısız");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/feed");

      await fetchProfile(data.token);
      setActiveTab("profile");
    } catch (err) {
      setMessage("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Kayıt başarısız");
        return;
      }

      setMessage("Kayıt başarılı!");
      setActiveTab("login");
    } catch (err) {
      setMessage("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(currentToken, silent = false) {
    try {
      const res = await fetch(`${API_BASE}/protected/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          setToken(null);
          setActiveTab("login");
        }
        if (!silent) setMessage(data.message);
        return;
      }

      setUser(data.user);
    } catch (err) {
      if (!silent) setMessage("Profil alınamadı");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setActiveTab("login");
    navigate("/");
  }

  async function handleForgotPassword() {
    if (!forgotEmail) return alert("E-posta gerekli");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      alert("Sıfırlama maili gönderildi!");
      setShowForgot(false);
      setForgotEmail("");
    } catch (err) {
      alert("Hata oluştu");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg,#051c1f 0%, #021014 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui"
      }}
    >
      {/* GRİNY NOISE */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url('https://grainy-gradients.vercel.app/noise.svg') repeat",
          opacity: 0.20,
          pointerEvents: "none"
        }}
      />

      {/* PANEL */}
      <div
        style={{
          width: "420px",
          background: "rgba(0,40,35,0.45)",
          border: "1px solid rgba(34,197,94,0.18)",
          padding: "32px",
          borderRadius: "24px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)"
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            color: "#4ade80",
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: "700",
            textShadow: "0 0 15px rgba(74,222,128,0.6)"
          }}
        >
          NovaShelf
        </h1>

        <p style={{ color: "#a7f3d0", textAlign: "center", marginBottom: 20 }}>
          {activeTab === "login"
            ? "Giriş Yap"
            : activeTab === "register"
            ? "Kayıt Ol"
            : "Profil"}
        </p>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.1)",
            padding: "4px",
            borderRadius: "999px",
            marginBottom: "20px"
          }}
        >
          <button
            onClick={() => setActiveTab("login")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "login" ? "#22c55e" : "transparent",
              color: activeTab === "login" ? "#fff" : "#a7f3d0",
              fontWeight: 600
            }}
          >
            Giriş
          </button>

          <button
            onClick={() => setActiveTab("register")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "register" ? "#22c55e" : "transparent",
              color: activeTab === "register" ? "#fff" : "#a7f3d0",
              fontWeight: 600
            }}
          >
            Kayıt
          </button>
        </div>

        {/* MESAJ */}
        {message && (
          <div
            style={{
              background: "rgba(255,60,60,0.25)",
              border: "1px solid rgba(255,60,60,0.4)",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "15px",
              color: "#fecaca",
              textAlign: "center"
            }}
          >
            {message}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === "login" && (
          <>
            <form onSubmit={handleLogin}>
              <label style={labelStyle}>E-posta</label>
              <input
                type="email"
                style={inputStyle}
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
              />

              <label style={labelStyle}>Şifre</label>
              <input
                type="password"
                style={inputStyle}
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />

              <p style={forgotStyle} onClick={() => setShowForgot(true)}>
                Şifremi Unuttum?
              </p>

              <button style={buttonStyle} type="submit">
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            {showForgot && (
              <div style={forgotBoxStyle}>
                <h3 style={{ color: "#a7f3d0" }}>Şifre Sıfırlama</h3>

                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="E-posta"
                />

                <button
                  onClick={handleForgotPassword}
                  style={{ ...buttonStyle, marginTop: 10 }}
                >
                  Mail Gönder
                </button>

                <p style={returnLoginStyle} onClick={() => setShowForgot(false)}>
                  Geri dön
                </p>
              </div>
            )}
          </>
        )}

        {/* REGISTER FORM */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister}>
            <label style={labelStyle}>Kullanıcı Adı</label>
            <input
              style={inputStyle}
              value={registerForm.username}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, username: e.target.value })
              }
              required
            />

            <label style={labelStyle}>E-posta</label>
            <input
              type="email"
              style={inputStyle}
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, email: e.target.value })
              }
              required
            />

            <label style={labelStyle}>Şifre</label>
            <input
              type="password"
              style={inputStyle}
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, password: e.target.value })
              }
              required
            />

            <label style={labelStyle}>Şifre (Tekrar)</label>
            <input
              type="password"
              style={inputStyle}
              value={registerForm.passwordConfirm}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  passwordConfirm: e.target.value
                })
              }
              required
            />

            <button style={buttonStyle} disabled={loading}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>
          </form>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div>
            {user ? (
              <>
                <p style={{ color: "#a7f3d0" }}>
                  Hoş geldin, <b>{user.username}</b>
                </p>
                <p style={{ color: "#a7f3d0" }}>{user.email}</p>
              </>
            ) : (
              <p>Profil alınamadı</p>
            )}

            <button onClick={handleLogout} style={buttonOutlineStyle}>
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */

const labelStyle = {
  color: "#d1fae5",
  fontSize: "14px",
  marginBottom: "4px",
  display: "block"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(34,197,94,0.25)",
  color: "#e5e7eb",
  marginBottom: "14px",
  outline: "none",
  boxShadow: "0 4px 14px rgba(0,0,0,0.45)"
};

const forgotStyle = {
  textAlign: "right",
  marginBottom: "14px",
  color: "#93c5fd",
  cursor: "pointer"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(135deg,#22c55e,#15803d)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(34,197,94,0.45)"
};

const forgotBoxStyle = {
  background: "rgba(0,40,35,0.35)",
  padding: "16px",
  borderRadius: "14px",
  border: "1px solid rgba(34,197,94,0.15)"
};

const returnLoginStyle = {
  marginTop: "10px",
  color: "#93c5fd",
  cursor: "pointer",
  textAlign: "center"
};

const buttonOutlineStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.05)",
  color: "#d1fae5",
  cursor: "pointer",
  marginTop: "18px"
};
