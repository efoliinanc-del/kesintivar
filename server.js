const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

// API isteklerine 5 saniyelik sınır koyan güvenli axios örneği
const apiIstemci = axios.create({
    timeout: 5000 // 5 saniyede cevap gelmezse isteği iptal et
});

function suAnkiTarihiGetir() {
    const simdi = new Date();
    const gun = String(simdi.getDate()).padStart(2, '0');
    const ay = String(simdi.getMonth() + 1).padStart(2, '0');
    const yil = simdi.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

async function IskiKesintileriGetir() {
    try {
        console.log('İSKİ API verisi isteniyor...');
        const response = await apiIstemci.get('https://iski.gov.tr/web/api/v1/kesintiler');
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
        console.error('İSKİ API ulaşılamadı veya gecikti:', error.message);
        return []; // Hata verirse boş liste dön, sistem kilitlenmesin
    }
}

async function BedasKesintileriGetir() {
    try {
        console.log('BEDAŞ API verisi isteniyor...');
        const response = await apiIstemci.get('https://api.bedas.com.tr/v1/kesintiler/guncel');
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
        console.error('BEDAŞ API ulaşılamadı veya gecikti:', error.message);
        return []; // Hata verirse boş liste dön, sistem kilitlenmesin
    }
}

app.get('/api/kesintiler', async (req, res) => {
    console.log(`[${suAnkiTarihiGetir()}] İstek geldi, veriler çekiliyor...`);
    
    // Güvenli paralel tetikleme
    const [suKesintileri, elektrikKesintileri] = await Promise.all([
        IskiKesintileriGetir(),
        BedasKesintileriGetir()
    ]);

    const tumKesintiler = [...suKesintileri, ...elektrikKesintileri];
    console.log(`Toplam ${tumKesintiler.length} kesinti verisi gönderiliyor.`);
    
    res.json(tumKesintiler);
});

app.listen(PORT, () => {
    console.log(`[BAŞARILI] Kesinti Takip Sunucusuaktif!`);
});
