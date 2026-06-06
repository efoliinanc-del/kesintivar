// Backend API adresimiz (Doğru rota eklenmiş hali)
const API_URL = 'https://kesintivar-backend.onrender.com/api/kesintiler';
let tumKesintiler = []; // Verileri hafızada tutmak için

// Sayfa yüklendiğinde verileri otomatik çekmeye başla
document.addEventListener('DOMContentLoaded', () => {
    verileriGetir();
});

// Backend'den canlı verileri çeken fonksiyon
async function verileriGetir() {
    try {
        const response = await fetch(API_URL);
        
        // Gelen yanıtın düzgün bir JSON olup olmadığını kontrol ediyoruz
        if (!response.ok) {
            throw new Error(`Sunucu hatası: ${response.status}`);
        }

        tumKesintiler = await response.json();
        verileriYansit(tumKesintiler);
    } catch (error) {
        console.error("Veriler backend'den çekilemedi:", error);
        document.getElementById('kesinti-listesi').innerHTML = `
            <div class="loading" style="color: #ef4444; text-align: center; padding: 20px;">
                Sunucuya bağlanılamadı. Lütfen backend uygulamasının çalıştığından emin olun!
            </div>
        `;
    }
}

// Gelen kesinti verilerini HTML sayfasına basan fonksiyon
function verileriYansit(liste) {
    const listeAlani = document.getElementById('kesinti-listesi');
    listeAlani.innerHTML = '';

    if (liste.length === 0) {
        listeAlani.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">Şu anda bildirilen aktif bir kesinti bulunamadı.</div>';
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
                    <p><strong>Bölge / Mahalle:</strong> ${k.mahalle}</p>
                    <p><strong>Tarih:</strong> ${k.tarih}</p>
                    <p class="desc"><strong>Açıklama:</strong> ${k.aciklama}</p>
                </div>
            </div>
        `;
        listeAlani.innerHTML += kart;
    });
}
