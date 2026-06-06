const API_URL = 'https://kesintivar-backend.onrender.com/api/kesintiler';
let tumKesintiler = [];
let harita;
let markerGrup;

// İstanbul İlçelerinin Harita Koordinat Sözlüğü (Pinlerin doğru yere düşmesi için)
const ilceKoordinatlari = {
    'BEYKOZ': [41.1321, 29.1054],
    'USKUDAR': [41.0264, 29.0152],
    'ÜSKÜDAR': [41.0264, 29.0152],
    'KADIKOY': [40.9912, 29.0274],
    'KADIKÖY': [40.9912, 29.0274],
    'UMRANIYE': [41.0253, 29.1232],
    'ÜMRANİYE': [41.0253, 29.1232],
    'SISLI': [41.0602, 28.9877],
    'ŞİŞLİ': [41.0602, 28.9877],
    'BESIKTAS': [41.0428, 29.0074],
    'BEŞİKTAŞ': [41.0428, 29.0074],
    'FATIH': [41.0165, 28.9497],
    'FATİH': [41.0165, 28.9497],
    'MALTEPE': [40.9242, 29.1311],
    'PENDIK': [40.8769, 29.2341],
    'PENDİK': [40.8769, 29.2341],
    'KARTAL': [40.8891, 29.1856],
    'ATASEHIR': [40.9841, 29.1064],
    'ATAŞEHİR': [40.9841, 29.1064],
    'SANCAKTEPE': [41.0055, 29.2244],
    'CEKMEKOY': [41.0351, 29.2882],
    'ÇEKMEKÖY': [41.0351, 29.2882],
    'SARIYER': [41.1682, 29.0454]
};

document.addEventListener('DOMContentLoaded', () => {
    haritayiBaslat();
    verileriGetir();
});

// 1. Haritayı İstanbul Merkezli Oluşturma Fonksiyonu
function haritayiBaslat() {
    // Haritayı İstanbul koordinatlarına odklıyoruz (Zoom derecesi: 10.5)
    harita = L.map('map').setView([41.0082, 28.9784], 10);
    
    // Harita tasarım stilini giydiriyoruz (Karanlık tema harita altlığı)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(harita);

    // Marker'ları toplu yönetmek için grup oluşturuyoruz
    markerGrup = L.layerGroup().addTo(harita);
}

// 2. Sunucudan Verileri Çeken Fonksiyon
async function verileriGetir() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Hata kodu: ${response.status}`);
        
        tumKesintiler = await response.json();
        verileriYansit(tumKesintiler);
        haritayaMarkerEkle(tumKesintiler);
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        document.getElementById('kesinti-listesi').innerHTML = `
            <div class="loading" style="color: #ef4444;">
                <i class="fa-solid fa-triangle-exclamation"></i> Bağlantı kesildi. Lütfen sayfayı yenileyin!
            </div>
        `;
    }
}

// 3. Sağ Taraftaki Detay Listesini Basma Fonksiyonu
function verileriYansit(liste) {
    const listeAlani = document.getElementById('kesinti-listesi');
    listeAlani.innerHTML = '';

    if (liste.length === 0) {
        listeAlani.innerHTML = '<div class="loading">Aktif bir kesinti kaydı bulunamadı.</div>';
        return;
    }

    liste.forEach(k => {
        const icon = k.tur === 'elektrik' ? 'fa-bolt' : 'fa-droplet';
        const kart = `
            <div class="card ${k.tur}">
                <div class="card-header">
                    <span class="card-title">${k.ilce}</span>
                    <span class="badge"><i class="fa-solid ${icon}"></i> ${k.tur.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <p><strong>Bölge:</strong> ${k.mahalle}</p>
                    <p><strong>Zaman:</strong> ${k.tarih}</p>
                    <p class="desc"><strong>Detay:</strong> ${k.aciklama}</p>
                </div>
            </div>
        `;
        listeAlani.innerHTML += kart;
    });
}

// 4. BÜYÜK GÜNCELLEME: Kesintileri Haritada İşaretleme Fonksiyonu
function haritayaMarkerEkle(liste) {
    // Önce haritadaki eski pinleri temizle
    markerGrup.clearLayers();

    liste.forEach(k => {
        const ilceTemiz = k.ilce.toUpperCase().trim();
        const koordinat = ilceKoordinatlari[ilceTemiz];

        // Eğer ilçenin koordinatı sözlüğümüzde varsa haritaya ekle
        if (koordinat) {
            const renk = k.tur === 'elektrik' ? '#eab308' : '#0ea5e9';
            const emoji = k.tur === 'elektrik' ? '⚡' : '💧';

            // Özel yuvarlak renkli marker oluşturuyoruz
            const marker = L.circleMarker(koordinat, {
                radius: 10,
                fillColor: renk,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            // Pine tıklandığında açılacak şık bilgi penceresi (Popup)
            const popupIcerik = `
                <div style="color: #0f172a; font-family: 'Poppins', sans-serif; min-width: 150px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">
                        ${emoji} ${k.ilce} - ${k.tur.toUpperCase()}
                    </h3>
                    <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Mahalle:</strong> ${k.mahalle}</p>
                    <p style="margin: 0; font-size: 11px; color: #64748b;">${k.tarih}</p>
                </div>
            `;

            marker.bindPopup(popupIcerik);
            markerGrup.addLayer(marker);
        }
    });
}
