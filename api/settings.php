<?php
/*
 * Ardahan Taksi — Yorum sistemi ayarları
 * Bu dosya PHP olduğu için tarayıcıdan içeriği görüntülenemez.
 */

// Yönetim paneli şifresi. Yayına almadan önce MUTLAKA değiştirin (en az 10 karakter).
const ADMIN_PASSWORD = '';

// Aynı kişinin (IP) iki yorum arasında beklemesi gereken süre (saniye).
const REVIEW_COOLDOWN = 600;

// Yorum uzunluk sınırları.
const REVIEW_MIN_LEN = 10;
const REVIEW_MAX_LEN = 600;
const NAME_MAX_LEN = 40;
