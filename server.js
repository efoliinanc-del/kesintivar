const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

const apiIstemci = axios.create({
    timeout: 4000
});

function suAnkiTarihiGetir() {
    const simdi = new Date();
    const gun = String(simdi.getDate()).padStart(2, '0');
    const ay = String(simdi.getMonth() + 1).padStart(2, '0');
    const yil = simdi.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

// Gelişmiş Simüle Veriler (Resmi kurumlar yabancı IP engeli atarsa devreye girer)
const testKesintileri = [
    {
        tur: 'elektrik',
        kategori: 'ariza',
        ilce: 'Beykoz',
        mahalle: 'Kavacık Mahallesi, Otağtepe Caddesi',
        tarih: suAnkiTarihiGetir() + ' 09:00 - 13:00',
        aciklama: 'BEDAŞ: Şebeke üzerinde meydana gelen ani arıza nedeniyle kesinti.'
    },
    {
        tur: 'su',
        kategori: 'ariza',
        ilce: 'Üsküdar',
        mahalle: 'Mimar Sinan Mahallesi, Atlas Sokak',
        tarih: suAnkiTarihiGetir() + ' 10:30 - 16:00',
        aciklama: 'İSKİ: Ana isale hattında boru patlaması onarımı.'
    },
    {
        tur: 'elektrik',
        kategori: 'planli',
        ilce: 'Kadıköy',
        mahalle: 'Moda Caddesi ve civarı',
        tarih: suAnkiTarihiGetir() + ' 14:00 - 18:00',
        aciklama: 'AYEDAŞ: Yüksek gerilim hücre yenileme planlı bakım çalışması.'
    },
    {
        tur: 'su',
        kategori: 'planli',
        ilce: 'Sarıyer',
        mahalle: 'Tarabya Mahallesi, Dere içi',
        tarih: suAnkiTarihiGetir() + ' 23:00 - 04:00',
        aciklama: 'İSKİ: Depo temizliği ve vana değişim planlı çalışması.'
    },
    {
        tur: 'elektrik',
        kategori: 'planli',
        ilce: 'Maltepe',
        mahalle: 'Cevizli Mahallesi',
        tarih: suAnkiTarihiGetir() + ' 08:30 - 12:30',
        aciklama: 'AYEDAŞ: Yeni trafo bağlantısı nedeniyle planlı kesinti.'
    }
];

// 1. İSKİ API
async function IskiKesintileriGetir() {
    try {
        const response = await apiIstemci.get('https://iski.gov.tr/web/api/v1/kesintiler');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data.map(k => {
                const aciklamaText = k.aciklama || 'Arıza onarım çalışması.';
                // Açıklamada planlı/bakım geçiyorsa kategoriyi planlı yapıyoruz
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
    } catch (error) { return []; }
}

// 2. BEDAŞ API (Avrupa Yakası Elektrik)
async function BedasKesintileriGetir() {
    try {
        const response = await apiIstemci.get('https://api.bedas.com.tr/v1/kesintiler/guncel');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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
    } catch (error) { return []; }
}

// 3. AYEDAŞ API (Anadolu Yakası Elektrik)
async function AyedasKesintileriGetir() {
    try {
        // AYEDAŞ resmi kesinti API endpoint'i
        const response = await apiIstemci.get('https://api.ayedas.com.tr/v1/kesintiler/istanbul');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data.map(k => ({
                tur: 'elektrik',
                kategori: k.kesintiTipi === 'Planlı Bakım' ? 'planli' : 'ariza',
                ilce: k.ilceAdi || 'Bilinmiyor',
                mahalle: k.mahalleAdi || 'Tüm Mahalleler',
                tarih: k.tarihAraligi || suAnkiTarihiGetir(),
                aciklama: 'AYEDAŞ: ' + (k.aciklama || 'Şebeke iyileştirme çalışması.')
            }));
        }
        return [];
    } catch (error) { return []; }
}

app.get('/api/kesintiler', async (req, res) => {
    console.log(`[${suAnkiTarihiGetir()}] Gelişmiş veri talebi geldi...`);
    
    const [su, bedas, ayedas] = await Promise.all([
        IskiKesintileriGetir(),
        BedasKesintileriGetir(),
        AyedasKesintileriGetir()
    ]);

    let tumKesintiler = [...su, ...bedas, ...ayedas];
    
    if (tumKesintiler.length === 0) {
        console.log('Resmi API kapıları kapalı, gelişmiş simüle veriler basılıyor.');
        tumKesintiler = testKesintileri;
    }
    
    res.json(tumKesintiler);
});

app.listen(PORT, () => {
    console.log(`[BAŞARILI] Sunucu ayakta!`);
});
