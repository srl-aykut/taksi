/* Ardahan Taksi — config.js değerlerini sayfaya uygular, WhatsApp konum gönderimini yönetir. */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG;
  if (!cfg) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waUrl(text) {
    return "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(text);
  }

  // Düz metin alanları
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var v = cfg[el.getAttribute("data-cfg")];
    if (v) el.textContent = v;
  });

  // Bağlantılar
  document.querySelectorAll('[data-href="tel"]').forEach(function (a) { a.href = "tel:" + cfg.phone; });
  document.querySelectorAll('[data-href="maps"]').forEach(function (a) { a.href = cfg.mapsUrl; });
  document.querySelectorAll('[data-href="tel2"]').forEach(function (a) {
    if (cfg.phone2) { a.href = "tel:" + cfg.phone2; a.hidden = false; }
  });

  // Listeler
  var lists = {
    routes: function (r) {
      return '<li class="route"><span class="route__tag">' + esc(r.tag) + "</span><h3>" + esc(r.title) + "</h3><p>" + esc(r.desc) + "</p></li>";
    },
    vehicles: function (v) {
      return "<li><strong>" + esc(v.name) + "</strong> <span>" + esc(v.detail) + "</span></li>";
    }
  };
  Object.keys(lists).forEach(function (key) {
    var el = document.querySelector('[data-list="' + key + '"]');
    if (el && Array.isArray(cfg[key]) && cfg[key].length) el.innerHTML = cfg[key].map(lists[key]).join("");
  });

  // WhatsApp: önce konumu almayı dener, alamazsa varsayılan mesajla açar.
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waUrl(cfg.whatsappMessage);
    a.addEventListener("click", function (e) {
      if (!("geolocation" in navigator)) return;
      e.preventDefault();
      a.classList.add("is-loading");
      var done = false;
      function go(text) {
        if (done) return;
        done = true;
        a.classList.remove("is-loading");
        window.location.href = waUrl(text);
      }
      var fallback = setTimeout(function () { go(cfg.whatsappMessage); }, 8000);
      navigator.geolocation.getCurrentPosition(
        function (p) {
          clearTimeout(fallback);
          var lat = p.coords.latitude.toFixed(6), lng = p.coords.longitude.toFixed(6);
          go(cfg.whatsappMessage + "\nKonumum: https://maps.google.com/?q=" + lat + "," + lng);
        },
        function () { clearTimeout(fallback); go(cfg.whatsappMessage); },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
      );
    });
  });

  // Müşteri yorumları: onaylı yorumları api/reviews.php'den çeker, yeni yorum gönderir.
  var API = "api/reviews.php";
  var reviewBox = document.querySelector(".js-reviews");
  var summary = document.querySelector(".js-review-summary");

  function stars(n) {
    n = Math.max(1, Math.min(5, n | 0));
    return '<p class="review__stars" aria-label="5 üzerinden ' + n + ' yıldız">' +
      "★★★★★".slice(0, n) + '<span class="review__stars-off">' + "★★★★★".slice(n) + "</span></p>";
  }
  function reviewHtml(r) {
    var date = r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) : "";
    return '<article class="review">' + stars(r.stars) +
      "<p>“" + esc(r.text) + "”</p><footer>— " + esc(r.name) +
      (date ? ' <span class="review__date">· ' + esc(date) + "</span>" : "") + "</footer>" +
      (r.reply ? '<div class="review__reply"><strong>' + esc(cfg.brand) + " yanıtı:</strong> " + esc(r.reply) + "</div>" : "") +
      "</article>";
  }

  if (reviewBox) {
    fetch(API, { headers: { Accept: "application/json" } })
      .then(function (res) { return res.json(); })
      .then(function (d) {
        if (!d.ok || !d.reviews.length) {
          reviewBox.innerHTML = '<p class="reviews__empty">Henüz yorum yok. İlk yorumu siz yazın!</p>';
          return;
        }
        reviewBox.innerHTML = d.reviews.map(reviewHtml).join("");
        summary.innerHTML = '<span class="review__stars">★</span> <strong>' +
          String(d.average).replace(".", ",") + "</strong> / 5 · " + d.count + " müşteri yorumu";
        summary.hidden = false;
      })
      .catch(function () {
        reviewBox.innerHTML = '<p class="reviews__empty">Yorumlar şu an yüklenemedi.</p>';
      });
  }

  var form = document.querySelector(".js-review-form");
  if (form) {
    var openedAt = Math.floor(Date.now() / 1000);
    var msg = form.querySelector(".js-review-msg");
    var btn = form.querySelector("button[type=submit]");
    function say(text, ok) {
      msg.textContent = text;
      msg.className = "review-form__msg js-review-msg " + (ok ? "is-ok" : "is-err");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var star = form.querySelector("input[name=stars]:checked");
      var name = form.elements.name.value.trim();
      var text = form.elements.text.value.trim();
      if (!star) return say("Lütfen yıldız seçerek puan verin.");
      if (name.length < 2) return say("Lütfen adınızı yazın.");
      if (text.length < 10) return say("Yorumunuz en az 10 karakter olmalı.");

      btn.disabled = true;
      say("Gönderiliyor…", true);
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit", name: name, text: text, stars: Number(star.value),
          website: form.elements.website.value, t: openedAt
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (d) {
          if (!d.ok) return say(d.error || "Gönderilemedi, lütfen tekrar deneyin.");
          form.reset();
          say("Teşekkürler! Yorumunuz bize ulaştı, onaylandıktan sonra burada yayınlanacak.", true);
        })
        .catch(function () { say("Gönderilemedi, lütfen tekrar deneyin."); })
        .then(function () { btn.disabled = false; });
    });
  }

  var y = document.querySelector(".js-year");
  if (y) y.textContent = new Date().getFullYear();
})();
