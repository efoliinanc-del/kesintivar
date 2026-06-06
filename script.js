const API_URL = 'https://kesintivar-backend.onrender.com/api/kesintiler';
let tumKesintiler = [];
let harita;
let markerGrup;
let aktifFiltre = 'tumu';

const ilceKoordinatlari = {
    'BEYKOZ': [41.1321, 29.1054], 'USKUDAR': [41.0264, 29.0152], 'ÜSKÜDAR': [41.0264, 29.0152],
    'KADIKOY': [40.9912, 29.0274], 'KADIKÖY': [40.9912, 29.0274], 'UMRANIYE': [41.0253, 29.1232],
    'ÜMRANİYE': [41.0253, 29.1232], 'SISLI': [41.0602, 28.9877], 'ŞİŞLİ': [41.0602, 28.9877],
    'BESIKTAS': [41.0428, 29.0074], 'BEŞİKTAŞ': [41.0428, 29.0074], 'FATIH': [41.0165, 28.9497],
    'FATİH': [41.0165, 28.9497], 'MALTEPE': [40.9242, 29.1311], 'PENDIK': [40.8769, 29.2341],
    'PENDİK': [40.8769, 29.2341], 'KARTAL': [40.8891, 29.1856], 'ATASEHIR': [40.9841, 29.1064],
    'ATAŞEHİR': [40.9841, 29.1064], 'SANCAKTEPE': [41.0055, 29.2244], 'CEKMEKOY': [41.0351, 29.2882],
    'ÇEKMEKÖY': [41.0351, 29.2882], 'SARIYER': [41.1682, 29.0454]
};

document.addEventListener('DOMContentLoaded', () => {
    haritayiBaslat();
    verileriGetir();
    filtreButonlariniBagla();
});

function haritayiBaslat() {
    harita = L.map('map').setView([41.0082, 28.9784], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; Efe Studios Map Data'
    }).addTo(harita);
    markerGrup = L.layerGroup().addTo(harita);
}

async function verileriGetir() {
    try {
        const response = await fetch(API_URL);
        tumKesintiler = await response.json();
        ekraniGuncelle();
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        document.getElementById('kesinti-listesi').innerHTML = '<div class="loading" style="color:#ef4444;">Sunucu bağlantı hatası!</div>';
    }
}

function filtreButonlariniBagla() {
    const butonlar = document.querySelectorAll('.filter-btn');
    butonlar.forEach(btn => {
        btn.addEventListener('click', () => {
            butonlar.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aktifFiltre = btn.getAttribute('data-filter');
            ekraniGuncelle();
        });
    });
}

function ekraniGuncelle() {
    let filtrelenmis = [];

    if (aktifFiltre === 'tumu') {
        filtrelenmis = tumKesintiler;
    } else if (aktifFiltre === 'elektrik') {
        filtrelenmis = tumKesintiler.filter(k => k.tur === 'elektrik');
    } else if (aktifFiltre === 'su') {
        filtrelenmis = tumKesintiler.filter(k => k.tur === 'su');
    } else if (aktifFiltre === 'planli') {
        filtrelenmis = tumKesintiler.filter(k => k.kategori === 'planli');
    }

    verileriYansit(filtrelenmis);
    haritayaMarkerEkle(filtrelenmis);
}

function verileriYansit(liste) {
    const listeAlani = document.getElementById('kesinti-listesi');
    listeAlani.innerHTML = '';

    if (liste.length === 0) {
        listeAlani.innerHTML = '<div class="loading">Şu an resmi bir kesinti kaydı bulunamadı.</div>';
        return;
    }

    liste.forEach((k, index) => {
        const icon = k.tur === 'elektrik' ? 'fa-bolt' : 'fa-droplet';
        const delay = index * 0.05; 
        
        let kartSinifi = `card ${k.tur}`;
        if (k.kategori === 'planli') kartSinifi = 'card planli';

        const kart = `
            <div class="${kartSinifi}" style="animation-delay: ${delay}s">
                <div class="card-header">
                    <span class="card-title">${k.ilce}</span>
                    <span class="badge"><i class="fa-solid ${icon}"></i> ${k.kategori === 'planli' ? 'PLANLI' : k.tur.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <p><strong>Bölge:</strong> ${k.mahalle}</p>
                    <p><strong>Zaman:</strong> ${k.tarih}</p>
                    <p class="desc">${k.aciklama}</p>
                </div>
            </div>
        `;
        listeAlani.innerHTML += kart;
    });
}

function haritayaMarkerEkle(liste) {
    markerGrup.clearLayers();

    liste.forEach(k => {
        const gelenIlceText = k.ilce.toUpperCase().trim();
        let bulunanKoordinat = null;

        // Akıllı ilçe metni arayıcı
        for (const anahtar in ilceKoordinatlari) {
            if (gelenIlceText.includes(anahtar)) {
                bulunanKoordinat = ilceKoordinatlari[anahtar];
                break;
            }
        }

        if (bulunanKoordinat) {
            let renk = k.tur === 'elektrik' ? '#eab308' : '#0ea5e9';
            let emoji = k.tur === 'elektrik' ? '⚡' : '💧';
            
            if (k.kategori === 'planli') {
                renk = '#a855f7'; 
                emoji = '📅';
            }

            const marker = L.circleMarker(bulunanKoordinat, {
                radius: 12,
                fillColor: renk,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            const popupIcerik = `
                <div style="color: #0f172a; font-family: 'Poppins', sans-serif; min-width: 180px;">
                    <h3 style="margin:0 0 6px 0; font-size:13px; border-bottom:1px solid #ddd; padding-bottom:3px; color:${renk === '#a855f7' ? '#7c3aed' : renk};">
                        ${emoji} ${k.ilce}
                    </h3>
                    <p style="margin:0 0 4px 0; font-size:11px;"><strong>Konum:</strong> ${k.mahalle}</p>
                    <p style="margin:0; font-size:10px; color:#475569;"><strong>Zaman:</strong> ${k.tarih}</p>
                </div>
            `;

            marker.bindPopup(popupIcerik);
            markerGrup.addLayer(marker);
        }
    });
}
