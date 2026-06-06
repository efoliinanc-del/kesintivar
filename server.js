const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS ayarı en üstte olmalı
app.use(cors());

// Resmi kurumların yabancı sunucuları engellememesi için gelişmiş tarayıcı başlıkları
const apiIstemci = axios.create({
    timeout: 6000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
});

function suAnkiTarihiGetir() {
    const simdi = new Date();
    const gun = String(simdi.getDate()).padStart(2, '0');
    const ay = String(simdi.getMonth() + 1).padStart(2, '0');
    const yil = simdi.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

// 1. İSKİ Canlı API İsteği
async function IskiKesintileriGetir() {
    try {
        const response = await apiIstemci.get('https://iski.gov.tr/web/api/v1/kesintiler');
        if (response.data && Array.isArray(response.data)) {
            return response.data.map(k => {
                const aciklamaText = k.aciklama || 'Arıza onarım çalışması.';
                const isPlanli = aciklamaText.includes('bakım') || aciklamaText.includes('planlı') || aciklamaText.includes('temizlik');
                return {
                    tur: 'su',
                    kategori: isPlanli ? 'planli' : 'ariza',
                    ilce: k.ilceAdi || 'Bilinmiyor',
                    mahalle: k.mahalleAdi || 'Tüm Mahalleler',
                    tarih: k.kesintiTarihi || suAnkiTarihiGetir(),
                    aciklama: 'İSKİ: ' + aciklamaText
                };
            });
        }
        return [];
    } catch (error) { 
        console.error('İSKİ API Bağlantı Sorunu:', error.message);
        return []; 
    }
}

// 2. BEDAŞ Canlı API İsteği (Avrupa Yakası)
async function BedasKesintileriGetir() {
    try {
        const response = await apiIstemci.get('https://api.bedas.com.tr/v1/kesintiler/guncel');
        if (response.data && Array.isArray(response.data)) {
            return response.data.map(k => ({
                tur: 'elektrik',
                kategori: k.tip === 'Planlı' || k.neden?.includes('Bakım') ? 'planli' : 'ariza',
                ilce: k.ilce || 'Bilinmiyor',
                mahalle: k.mahalle || 'Tüm Mahalleler',
                tarih: k.tarih || suAnkiTarihiGetir(),
                aciklama: 'BEDAŞ: ' + (k.neden || 'Arıza onarım çalışması.')
            }));
        }
        return [];
    } catch (error) { 
        console.error('BEDAŞ API Bağlantı Sorunu:', error.message);
        return []; 
    }
}

// 3. AYEDAŞ Canlı API İsteği (Anadolu Yakası)
async function AyedasKesintileriGetir() {
    try {
        const response = await apiIstemci.get('https://api.ayedas.com.tr/v1/kesintiler/istanbul');
        if (response.data && Array.isArray(response.data)) {
            return response.data.map(k => ({
                tur: 'elektrik',
                kategori: k.kesintiTipi === 'Planlı Bakım' ? 'planli' : 'ariza',
                ilce: k.ilceAdi || 'Bilinmiyor',
                mahalle: k.mahalleAdi || 'Tüm Mahalleler',
                tarih: k.tarihAraligi || suAnkiTarihiGetir(),
                aciklama: 'AYEDAŞ: ' + (k.aciklama || 'Şebeke iyileştirme/bakım çalışması.')
            }));
        }
        return [];
    } catch (error) { 
        console.error('AYEDAŞ API Bağlantı Sorunu:', error.message);
        return []; 
    }
}

// Ana API rotası
app.get('/api/kesintiler', async (req, res) => {
    console.log(`[${suAnkiTarihiGetir()}] Yeni canlı veri talebi işleniyor...`);
    
    const [su, bedas, ayedas] = await Promise.all([
        IskiKesintileriGetir(),
        BedasKesintileriGetir(),
        AyedasKesintileriGetir()
    ]);

    const tumKesintiler = [...su, ...bedas, ...ayedas];
    console.log(`Toplam ${tumKesintiler.length} resmi kesinti verisi gönderiliyor.`);
    
    res.json(tumKesintiler);
});

app.listen(PORT, () => {
    console.log(`[BAŞARILI] Gerçek Veri Sunucusu Aktif!`);
});
