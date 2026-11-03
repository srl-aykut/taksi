# Ardahan Taksi — Ardahan Ticari Taksi Web Sitesi

Geliştirici: **AS Yazılım**

Derleme adımı ve veritabanı gerektirmeyen site. Müşteri yorumları için hostingde
**PHP 7.4 veya üstü** gerekir (cPanel hostinglerin neredeyse hepsinde vardır).

## Dosya yapısı

```
Ardahan-taksi/
├── index.html            Ana sayfa (semantik HTML, SEO meta, JSON-LD TaxiService)
├── robots.txt            /admin/ dizinini arama motorlarından gizler
├── sitemap.xml
├── assets/
│   ├── css/style.css     Mobile-first koyu tema (sarı/siyah)
│   ├── js/config.js      ← Telefon, adres, rotalar, araçlar
│   ├── js/main.js        config'i uygular, WhatsApp konum gönderimi, yorumlar
│   └── img/
├── api/
│   ├── reviews.php       Yorum API'si (gönderme, listeleme, onay, yanıt)
│   ├── settings.php      ← Yönetici şifresi ve yorum kuralları
│   └── data/             Yorumlar burada saklanır (tarayıcıdan erişilemez)
└── admin/
    ├── index.html        Site ayarları (config.js üretir)
    └── yorumlar.html     Yorum yönetimi: onayla, gizle, sil, yanıt yaz
```

## Müşteri yorumları nasıl çalışır?

1. Müşteri sitedeki "Siz de yorum yazın" formundan yıldız, ad ve yorum gönderir.
2. Yorum **onay bekler**; sitede hemen görünmez.
3. Siz `/admin/yorumlar.html` sayfasından şifreyle girip yorumu **onaylarsınız**.
   İsterseniz altına **işletme yanıtı** yazarsınız; yanıt sitede yorumun altında görünür.
4. Sitede onaylı yorumlar, ortalama puan ve yorum sayısıyla listelenir.

Spam koruması: gizli tuzak alan, çok hızlı gönderim engeli, aynı kişiden 10 dakikada
en fazla 1 yorum, bağlantı (link) içeren yorumların reddi. Ayarlar `api/settings.php` içinde.

## İçerik nasıl güncellenir?

**Elle:** `assets/js/config.js` dosyasını düzenleyin.

**Panel:** `/admin/` sayfasını açın, formu doldurun, **config.js indir** butonuna basın,
indirilen dosyayı sunucuda `assets/js/config.js` yerine yükleyin.

> Telefon numarası değişince `index.html` içindeki JSON-LD `"telephone"` alanını da güncelleyin.

## Yayına almadan önce yapılacaklar

1. **`api/settings.php` içinde `ADMIN_PASSWORD` alanına güçlü bir şifre yazın**
   (en az 10 karakter). Boş bırakılırsa yorum paneline giriş yapılamaz.
2. `api/data/` klasörünün PHP tarafından **yazılabilir** olduğundan emin olun
   (cPanel'de genelde varsayılan olarak öyledir; değilse izinleri 755 yapın).
3. Sitenin **HTTPS** ile açıldığından emin olun (yönetici oturumu ve konum özelliği için).
4. Alan adı `www.ardahantaksi.com` varsayıldı; farklıysa `index.html` (canonical, og:url,
   JSON-LD), `robots.txt` ve `sitemap.xml` içinde değiştirin.
5. İsterseniz `/admin/` klasörüne ek olarak sunucu şifresi koyun. Apache/cPanel için `admin/.htaccess`:

   ```apache
   AuthType Basic
   AuthName "Yonetim"
   AuthUserFile /home/KULLANICI/.htpasswds/admin
   Require valid-user
   ```

6. Google Search Console'a siteyi ekleyip `sitemap.xml` gönderin; ayrıca
   **Google İşletme Profili** açın — yerel "Ardahan taksi" aramalarında en büyük etki buradan gelir.

## Yerelde deneme

PHP kuruluysa proje klasöründe:

```
php -S localhost:8090
```

sonra `http://localhost:8090` adresini açın. PHP olmadan da site açılır, yalnızca yorum
bölümü "Yorumlar şu an yüklenemedi" der.
