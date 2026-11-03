/*
 * Ardahan Taksi — Site Yapılandırması
 * ------------------------------------------------------------
 * Telefon, WhatsApp, adres, rotalar ve araçlar burada.
 * Bu dosyayı elle düzenleyebilir ya da /admin/ panelinden yeni
 * bir config.js üretip bu dosyanın yerine koyabilirsiniz.
 *
 * Telefon formatı:
 *   phone       -> tel: bağlantısı için, ülke kodlu ve boşluksuz (+905xxxxxxxxx)
 *   phoneLabel  -> ekranda görünen hali
 *   whatsapp    -> wa.me için, + işareti OLMADAN (905xxxxxxxxx)
 */
window.SITE_CONFIG = {
  brand: "Ardahan Taksi",
  city: "Ardahan",

  phone: "+905398961963",
  phoneLabel: "0539 896 19 63",
  phone2: "",
  phone2Label: "",
  whatsapp: "905398961963",
  whatsappMessage: "Merhaba, taksi çağırmak istiyorum.",

  address: "Kaptanpaşa, Piyade Sk. No:5, 75000 Ardahan Merkez/Ardahan",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kaptanpa%C5%9Fa%2C%20Piyade%20Sk.%20No%3A5%2C%2075000%20Ardahan",
  hours: "7 gün 24 saat açık",

  heroTitle: "Ardahan'da 7/24 Güvenli ve Hızlı Taksi",
  heroSubtitle: "Güvenilir şoförler, bakımlı araçlar. Şehir içi, otogar, havalimanı ve şehirler arası transfer.",

  routes: [
    { title: "Ardahan Merkez", desc: "Şehir içi her noktaya dakikalar içinde araç.", tag: "Şehir içi" },
    { title: "Ardahan Otogarı", desc: "Otogar karşılama ve bırakma, bagaj yardımı.", tag: "Otogar" },
    { title: "Kars Harakani Havalimanı", desc: "Uçuş saatinize göre planlı havalimanı transferi.", tag: "Havalimanı" },
    { title: "Doğu Ekspresi / Kars Garı", desc: "Tren saatine göre Kars garına güvenli ulaşım.", tag: "Tren" },
    { title: "Şehirler Arası Transfer", desc: "Kars, Erzurum, Artvin, Göle, Posof, Hanak ve çevre ilçeler.", tag: "Şehirler arası" }
  ],

  vehicles: [
    { name: "Sedan Taksi", detail: "4 yolcu · geniş bagaj · klimalı" }
  ]
  // Müşteri yorumları burada değil: müşteriler sitede yazar, /admin/yorumlar.html'den onaylanır.
};
