// App.jsx
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ContentDetailPage from "./pages/ContentDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import KesfetPage from "./pages/KesfetPage.jsx";
import UsersExplorePage from "./pages/UsersExplorePage.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    <Routes>
      {/* Navbar olmayan sayfalar */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      {/* Navbar bulunan sayfalar */}
      <Route element={<Layout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/kesfet" element={<KesfetPage />} />
        <Route path="/kullanicilar" element={<UsersExplorePage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}