const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Vercel'den (ve diğer dış kaynaklardan) gelen istek engellerini (CORS) kaldırıyoruz
app.use(cors());

// Tarih formatlama fonksiyonu (Sunucu logları ve API istekleri için)
function suAnkiTarihiGetir() {
    const simdi = new Date();
    const gun = String(simdi.getDate()).padStart(2, '0');
    const ay = String(simdi.getMonth() + 1).padStart(2, '0');
    const yil = simdi.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

// 1. İSKİ (Su Kesintileri) Verilerini Çeken Fonksiyon
async function IskiKesintileriGetir() {
    try {
        const response = await axios.get('https://iski.gov.tr/web/api/v1/kesintiler');
        // İSKİ API'sinden dönen ham veriyi kendi formatımıza çeviriyoruz
        if (response.data && Array.isArray(response.data)) {
            return response.data.map(k => ({
                tur: 'su',
                ilce: k.ilceAdi || 'Bilinmiyor',
                mahalle: k.mahalleAdi || 'Tüm Mahalleler',
                tarih: k.kesintiTarihi || suAnkiTarihiGetir(),
                aciklama: k.aciklama || 'Arıza onarım çalışması.'
            }));
        }
        return [];
    } catch (error) {
        console.error('İSKİ API hatası:', error.message);
        return [];
    }
}

// 2. BEDAŞ (Elektrik Kesintileri) Verilerini Çeken Fonksiyon
async function BedasKesintileriGetir() {
    try {
        const response = await axios.get('https://api.bedas.com.tr/v1/kesintiler/guncel');
        if (response.data && Array.isArray(response.data)) {
            return response.data.map(k => ({
                tur: 'elektrik',
                ilce: k.ilce || 'Bilinmiyor',
                mahalle: k.mahalle || 'Tüm Mahalleler',
                tarih: k.tarih || suAnkiTarihiGetir(),
                aciklama: k.neden || 'Planlı bakım veya arıza çalışması.'
            }));
        }
        return [];
    } catch (error) {
        console.error('BEDAŞ API hatası:', error.message);
        return [];
    }
}

// 3. Frontend'in (Vercel) Veri Çekeceği Ortak API Rotası
app.get('/api/kesintiler', async (req, res) => {
    console.log(`[${suAnkiTarihiGetir()}] Yeni bir veri isteği geldi, veriler toplanıyor...`);
    
    // İki API'yi de aynı anda tetikliyoruz
    const [suKesintileri, elektrikKesintileri] = await Promise.all([
        IskiKesintileriGetir(),
        BedasKesintileriGetir()
    ]);

    // İki veriyi tek bir listede birleştiriyoruz
    const tumKesintiler = [...suKesintileri, ...elektrikKesintileri];
    
    res.json(tumKesintiler);
});

// Sunucuyu Başlatma
app.listen(PORT, () => {
    console.log(`[BAŞARILI] Kesinti Takip Sunucusu http://localhost:${PORT} portunda aktif!`);
});
