# Social_Library
NOVASHELF – SOSYAL KÜTÜPHANE PLATFORMU
NovaShelf – Social Library Platform
===================================


====================
TÜRKÇE
====================

PROJE TANIMI
NovaShelf, kullanıcıların kitap ve film içeriklerini kişisel
kütüphanelerinde takip edebildiği, puanlayabildiği, yorum yapabildiği
ve diğer kullanıcılarla sosyal bir akış üzerinden etkileşime
girebildiği web tabanlı bir sosyal kütüphane platformudur.

Platform; kişisel içerik takibi ile sosyal medya dinamiklerini
birleştirerek kullanıcıların okudukları ve izledikleri içerikleri
yalnızca arşivlemekle kalmayıp, bu içerikler üzerine etkileşim
kurmalarını sağlar.


PROJENİN AMAÇLARI
- Kitap ve film içeriklerini tek bir platformda toplamak
- Kullanıcıların içerikleri puanlayıp yorumlayabilmesini sağlamak
- Kişisel kütüphane ve özel listeler oluşturmak
- Sosyal akış üzerinden kullanıcı etkileşimini artırmak
- Harici API’ler ile zengin ve güncel içerik verisi sunmak
- Modern ve kullanıcı dostu bir arayüz geliştirmek


TEMEL ÖZELLİKLER
- Kullanıcı kayıt ve giriş sistemi (JWT tabanlı doğrulama)
- Kitap ve film keşfetme (arama & filtreleme)
- Harici API entegrasyonu (TMDb, Google Books, Open Library)
- İçerik puanlama ve yorum yapma
- Beğeni (like) ve yorumlara cevap verme
- Kişisel kütüphane (okuduklarım / izlediklerim)
- Özel listeler oluşturma
- Kullanıcı takip et / takibi bırak sistemi
- Sosyal akış (feed) yapısı
- Profil ve aktivite geçmişi görüntüleme


KULLANILAN TEKNOLOJİLER
Frontend:
- React
- Modern CSS (dark theme UI)

Backend:
- Node.js
- Express.js
- JWT Authentication

Database:
- Microsoft SQL Server

Harici Servisler:
- TMDb API (Film verileri)
- Google Books API
- Open Library API


SİSTEM MİMARİSİ
- Frontend ve Backend katmanları ayrılmıştır
- RESTful API mimarisi kullanılmıştır
- Kullanıcı kimlik doğrulama JWT ile sağlanır
- Sosyal akış, kullanıcı aktiviteleri üzerinden dinamik olarak üretilir
- İçerik verileri harici API’lerden otomatik çekilir ve önbelleklenir


UYGULAMA AKIŞI
1) Kullanıcı kayıt olur veya giriş yapar
2) Kitap / film içerikleri keşfet bölümünde listelenir
3) Kullanıcı içerikleri puanlar, yorum yapar veya listesine ekler
4) Yapılan tüm aktiviteler sosyal akışta paylaşılır
5) Diğer kullanıcılar bu aktiviteleri beğenebilir veya yorumlayabilir
6) Kullanıcılar birbirini takip edebilir
7) Profil sayfasında kişisel kütüphane ve aktiviteler görüntülenir


PROJE KAPSAMI
Bu proje, Kocaeli Üniversitesi Bilgisayar Mühendisliği
Yazılım Laboratuvarı I dersi kapsamında geliştirilmiştir.


GELİŞTİRİCİLER
- Zeynep Vuslat Solmaz
- Ayşenur Karaaslan



====================
ENGLISH
====================

PROJECT DESCRIPTION
NovaShelf is a web-based social library platform where users can
track books and movies in their personal libraries, rate content,
write comments, and interact with other users through a social feed.

The platform combines personal content management with social media
features, enabling users not only to archive what they read or watch,
but also to engage with content and other users.


PROJECT OBJECTIVES
- Combine book and movie tracking in a single platform
- Enable users to rate and comment on content
- Allow users to create personal libraries and custom lists
- Increase user interaction through a social feed
- Provide rich and up-to-date content using external APIs
- Deliver a modern and user-friendly interface


KEY FEATURES
- User registration and authentication (JWT-based)
- Book and movie discovery (search & filtering)
- External API integration (TMDb, Google Books, Open Library)
- Content rating and commenting
- Like system and comment replies
- Personal library management
- Custom list creation
- Follow / unfollow users
- Social activity feed
- Profile and activity history pages


TECHNOLOGIES USED
Frontend:
- React
- Modern CSS with dark theme design

Backend:
- Node.js
- Express.js
- JWT Authentication

Database:
- Microsoft SQL Server

External Services:
- TMDb API (Movies)
- Google Books API
- Open Library API


SYSTEM ARCHITECTURE
- Separated frontend and backend layers
- RESTful API architecture
- JWT-based authentication and authorization
- Dynamic social feed based on user activities
- Automatic content fetching from external APIs


APPLICATION FLOW
1) User registers or logs in
2) Books and movies are displayed in the explore section
3) User rates, comments on, or adds content to their library
4) All activities appear in the social feed
5) Other users can like or comment on activities
6) Users can follow each other
7) Profile page displays personal library and activity history


PROJECT CONTEXT
This project was developed as part of the
Software Laboratory I course at Kocaeli University,
Department of Computer Engineering.


DEVELOPERS
- Zeynep Vuslat Solmaz
- Ayşenur Karaaslan


NOTE
NovaShelf is an academic and portfolio project.
The platform can be extended with recommendation systems,
advanced search features, and performance optimizations.

SOSYAL KÜTÜPHANE PLATFORMU – EKRAN GÖRÜNTÜLERİ
====================

Giriş Ekranı
------------
Kullanıcıların e-posta ve şifre ile sisteme giriş yapabildiği,
modern ve karanlık temalı giriş arayüzü.

![Giriş Ekranı](screenshots/login.png)


Kayıt Olma Ekranı
----------------
Yeni kullanıcıların hesap oluşturabildiği,
şifre doğrulamalı kayıt ekranı.

![Kayıt Ol](screenshots/register.png)


Kullanıcı Profili
-----------------
Kullanıcının okuduğu / izlediği içerikleri, özel listelerini
ve son aktivitelerini görüntüleyebildiği profil sayfası.

![Profil](screenshots/profile.png)


İçerik Keşfet
-------------
Kitap ve filmlerin harici API’lerden alınarak listelendiği,
filtreleme ve arama özelliklerine sahip keşfet sayfası.

![Keşfet](screenshots/explore.png)


Sosyal Akış
-----------
Kullanıcıların puanlama, yorum ve listeleme aktivitelerinin
kart yapılarıyla sunulduğu sosyal akış ekranı.

![Sosyal Akış](screenshots/feed.png)


Kullanıcıları Keşfet
-------------------
Diğer kullanıcıların listelendiği, takip et / takibi bırak
özelliklerini içeren kullanıcı keşfet ekranı.

![Kullanıcılar](screenshots/users.png)
