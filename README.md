# 👨‍🍳 Şef Fora - Yapay Zeka Destekli Mutfak Asistanı

Şef Fora, mutfaktaki en yakın dostunuz olması için tasarlandı. Elinizdeki malzemeleri söyleyin, Şef Fora size en lezzetli tarifleri anında hazırlasın!

![Şef Fora Preview]

## ✨ Özellikler

- 🎙️ **Sesli Etkileşim:** Malzemelerinizi sesli olarak söyleyin, Şef Fora sizi dinlesin.
- 🤖 **Yapay Zeka (Gemini 3.1):** Google'ın en gelişmiş yapay zeka modelleriyle kişiselleştirilmiş tarifler.
- 🥗 **Detaylı Tarifler:** Hazırlanma süresi, zorluk derecesi, besin değerleri ve adım adım talimatlar.
- 📱 **Modern Arayüz:** Minimalist, şık ve mobil uyumlu tasarım.
- 📧 **Geri Bildirim Sistemi:** Formspree entegrasyonu ile doğrudan iletişim.

## 🛠️ Teknoloji Yığını

- **Frontend:** React 19, Vite, Tailwind CSS
- **Animasyon:** Motion (Framer Motion)
- **Yapay Zeka:** @google/genai (Gemini API)
- **İkonlar:** Lucide React
- **Form:** Formspree

## 🚀 Kurulum

Projeyi yerel bilgisayarınızda çalıştırmak için:

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/kullaniciadi/sef-fora.git
   ```

2. Proje dizinine gidin:
   ```bash
   cd sef-fora
   ```

3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

4. `.env` dosyası oluşturun ve Gemini API anahtarınızı ekleyin:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

5. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## 🌐 Dağıtım (Deployment)

Bu proje **Vercel** veya **Netlify** üzerinde kolayca yayınlanabilir. 

**Vercel için:**
1. GitHub deponuzu Vercel'e bağlayın.
2. Environment Variables kısmına `VITE_GEMINI_API_KEY` anahtarınızı ekleyin.
3. "Deploy" butonuna basın!

## 📄 Lisans

Bu proje Apache-2.0 lisansı ile lisanslanmıştır.

---
**Finora** tarafından ❤️ ile geliştirildi.
[Instagram](https://www.instagram.com/__finora__/) | [Twitter](https://x.com/Furkan_Denizzz)