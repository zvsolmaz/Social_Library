import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <nav
      style={{
        width: "100%",
        background: "#d1fae5",
        padding: "10px 18px",         // 🔹 daha az yatay padding
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid #a7f3d0",
      }}
    >
      {/* LOGO */}
      <Link
        to="/feed"
        style={{
          fontSize: "22px",
          fontWeight: "700",
          textDecoration: "none",
          color: "#064e3b",
          whiteSpace: "nowrap",
        }}
      >
        Social Library
      </Link>

      {/* MENÜ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",                 // 🔹 butonlar arası mesafe azaldı
          fontSize: "15px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <Link to="/feed" style={navBtn}>
          Ana Sayfa
        </Link>

        <Link to="/kesfet" style={navBtn}>
          İçerik Keşfet
        </Link>

        <Link to="/kullanicilar" style={navBtn}>
          Kullanıcılar
        </Link>

        <Link to="/profile" style={navBtn}>
          Profilim
        </Link>

        <button onClick={logout} style={logoutBtn}>
          Çıkış Yap
        </button>
      </div>
    </nav>
  );
}

/* 🌿 Ortak buton görünümü */
const navBtn = {
  padding: "6px 10px",               // 🔹 biraz inceldi
  background: "#ffffff",
  color: "#065f46",
  textDecoration: "none",
  borderRadius: "999px",
  fontWeight: 500,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  transition: "0.2s",
  whiteSpace: "nowrap",
};

const logoutBtn = {
  background: "#dc2626",
  color: "white",
  padding: "6px 12px",               // 🔹 küçüldü, daha rahat sığar
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "600",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  transition: "0.2s",
};
