const API_URL = 'http://localhost:5000/api/kesintiler';
let tumKesintiler = []; // Verileri hafızada tutmak için

// Backend'den canlı verileri çeken fonksiyon
async function verileriGetir() {
    try {
        const response = await fetch(API_URL);
        tumKesintiler = await response.json();
        verileriYansit(tumKesintiler);
    } catch (error) {
        console.error("Veriler backend'den çekilemedi:", error);
        document.getElementById('kesinti-listesi').innerHTML = 
            '<div class="loading" style="color: #ef4444;">Sunucuya bağlanılamadı. Lütfen backend uygulamasının çalıştığından emin olun!</div>';
    }
}

function verileriYansit(liste) {
    const listeAlani = document.getElementById('kesinti-listesi');
    listeAlani.innerHTML = '';

    if(liste.length === 0) {
        listeAlani.innerHTML = '<div class="loading">Şu anda bildirilen aktif bir kesinti bulunamadı.</div>';
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
                    <p><strong>Neden:</strong> ${k.neden}</p>
                    <p><strong>Başlangıç:</strong> ${k.baslangic}</p>
                    <p><strong>Tahmini Bitiş:</strong> ${k.bitis}</p>
                </div>
            </div>
        `;
        listeAlani.innerHTML += kart;
    });
}

function filterKesinti(tur) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Tıklanan butonu aktif yap
    event.target.classList.add('active');

    if(tur === 'all') {
        verileriYansit(tumKesintiler);
    } else {
        const filtrelenmis = tumKesintiler.filter(k => k.tur === tur);
        verileriYansit(filtrelenmis);
    }
}

// Sayfa yüklendiğinde canlı veriyi çek
document.addEventListener('DOMContentLoaded', () => {
    verileriGetir();
});