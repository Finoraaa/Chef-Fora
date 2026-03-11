/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

declare const process: any;
import { useForm, ValidationError } from '@formspree/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Mic, 
  MicOff, 
  ChefHat, 
  Youtube, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  ListChecks,
  X,
  Instagram,
  Twitter,
  Github,
  Globe,
  ExternalLink,
  ArrowLeft,
  Timer,
  Activity,
  Clock,
  MessageSquare,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Ingredient {
  isim: string;
  miktar: string;
}

interface Nutrition {
  kalori: string;
  protein: string;
  karbonhidrat: string;
  yag: string;
}

interface Recipe {
  baslik: string;
  aciklama: string;
  adimlarlar: string[];
  youtube_sorgu: string;
  besin_degerleri: Nutrition;
}

interface AIResponse {
  tanimlama_ekrani: {
    malzemeler: Ingredient[];
  };
  tarifler: Recipe[];
  finora_notu: string;
}

// --- Constants ---

const SYSTEM_INSTRUCTION = `# ROL
Sen "Finora Projesi"nin Akıllı Mutfak Şefisin (v3.0). Kullanıcıların dağınık, duraksamalı veya tekrarlı sesli komutlarını analiz eder, malzemeleri ayıklar ve ASLA KESİNTİYE UĞRAMAYAN, tam metinli profesyonel tarifler üretirsin.

# 1. TAM METİN GARANTİSİ (Kritik)
- Ürettiğin tarif açıklamaları (aciklama) ve hazırlık adımları (adimlarlar) ASLA yarım kalmamalı.
- Üç nokta (...) kullanımı KESİNLİKLE YASAKTIR.
- Her adımı ve her açıklamayı sonuna kadar, tam ve anlamlı cümlelerle yaz.
- "Ve 2 adım daha" gibi belirsiz ifadeler kullanma, tüm süreci liste olarak ver.

# 2. VERİ YÖNETİMİ VE SÜREKLİLİK
- Kullanıcıdan gelen metin sesli konuşma hataları içerebilir (ııı, şey, tekrar edilen kelimeler). Bunları temizle.
- SANA MEVCUT MALZEMELER LİSTESİ VERİLEBİLİR. Görevin, yeni gelen metindeki malzemeleri bu listeye EKLEMEKTİR.
- Mevcut listedeki malzemeleri ASLA silme (kullanıcı açıkça "şunu çıkar" demediği sürece).
- Aynı malzeme tekrar söylenirse miktarını güncelle veya mükerrer kayıt oluşturma.

# 3. TARİF ÜRETİMİ
- Elindeki malzemelere en uygun 3 farklı profesyonel tarif öner.
- YouTube arama sorgularını "Nefis Yemek Tarifleri [Yemek Adı]" formatında oluştur.
- Her tarif için porsiyon başına yaklaşık besin değerlerini (kalori, protein, karbonhidrat, yağ) hesapla.

# ÇIKTI FORMATI (SADECE JSON)
Yanıtını SADECE aşağıdaki JSON yapısında ver. JSON dışında hiçbir metin ekleme.

{
  "tanimlama_ekrani": {
    "malzemeler": [
      { "isim": "Malzeme Adı", "miktar": "Miktar (örn: 2 adet, 500gr)" }
    ]
  },
  "tarifler": [
    {
      "baslik": "Tarif Adı",
      "aciklama": "Tarifin hikayesi ve çekici, tam metinli açıklaması.",
      "adimlarlar": [
        "1. Adımın tam metni...",
        "2. Adımın tam metni..."
      ],
      "youtube_sorgu": "Nefis Yemek Tarifleri [Yemek Adı]",
      "besin_degerleri": {
        "kalori": "450 kcal",
        "protein": "25g",
        "karbonhidrat": "40g",
        "yag": "15g"
      }
    }
  ],
  "finora_notu": "Bu tarifler senin için özel olarak hazırlandı. Afiyet olsun!"
}

# ÖNEMLİ: Eğer kullanıcı "Mevcut Malzemeler" ile birlikte yeni bir girdi gönderirse, çıktıdaki "malzemeler" listesi her ikisinin birleşimi olmalıdır.`;

// --- Components ---

function StepTimer({ text }: { text: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract minutes from text (e.g., "15 dakika", "10 dk")
  const extractMinutes = (str: string) => {
    const match = str.match(/(\d+)\s*(dakika|dk|minute|min)/i);
    return match ? parseInt(match[1]) : null;
  };

  const minutes = extractMinutes(text);

  useEffect(() => {
    if (isActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Optional: Play a sound or show notification
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  if (!minutes) return null;

  const startTimer = () => {
    setTimeLeft(minutes * 60);
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-2">
      {!isActive && timeLeft === null ? (
        <button
          onClick={startTimer}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#5A5A40]/5 text-[#5A5A40] text-xs font-bold hover:bg-[#5A5A40]/10 transition-all border border-[#5A5A40]/10"
        >
          <Timer size={14} />
          {minutes} dk Zamanlayıcı Başlat
        </button>
      ) : (
        <div className={`flex items-center gap-3 px-3 py-1 rounded-lg border ${timeLeft === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#5A5A40] border-[#5A5A40] text-white'} transition-all w-fit`}>
          <Clock size={14} className={isActive ? 'animate-pulse' : ''} />
          <span className="text-xs font-mono font-bold">
            {timeLeft === 0 ? 'Süre Doldu!' : formatTime(timeLeft!)}
          </span>
          {timeLeft !== 0 && (
            <button 
              onClick={() => setIsActive(!isActive)}
              className="hover:opacity-80 transition-opacity"
            >
              {isActive ? <X size={12} /> : <Timer size={12} />}
            </button>
          )}
          {timeLeft === 0 && (
            <button onClick={() => setTimeLeft(null)} className="hover:opacity-80">
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'home' | 'about' | 'feedback'>('home');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Formspree Integration
  const [state, handleSubmit] = useForm("mlgpbdyd");

  // Feedback Form State (Local sync for UI)
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    category: 'öneri',
    message: ''
  });

  const recipesRef = useRef<HTMLDivElement>(null);
  const ingredientsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    setView('home');
    if (!result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const removeIngredient = (index: number) => {
    if (!result) return;
    const newMalzemeler = [...result.tanimlama_ekrani.malzemeler];
    newMalzemeler.splice(index, 1);
    setResult({
      ...result,
      tanimlama_ekrani: {
        ...result.tanimlama_ekrani,
        malzemeler: newMalzemeler
      }
    });
  };

  const generateRecipes = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY bulunamadı. Lütfen Vercel ayarlarından API anahtarınızı ekleyin.');
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Construct the prompt with context if existing ingredients exist
      let prompt = input;
      if (result && result.tanimlama_ekrani.malzemeler.length > 0) {
        prompt = `MEVCUT MALZEMELER: ${JSON.stringify(result.tanimlama_ekrani.malzemeler)}\n\nYENİ GİRDİ: ${input}\n\nLütfen mevcut malzemeleri koruyarak yeni girdiyi işle ve güncel listeyi oluştur.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tanimlama_ekrani: {
                type: Type.OBJECT,
                properties: {
                  malzemeler: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        isim: { type: Type.STRING },
                        miktar: { type: Type.STRING }
                      },
                      required: ["isim", "miktar"]
                    }
                  }
                },
                required: ["malzemeler"]
              },
              tarifler: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    baslik: { type: Type.STRING },
                    aciklama: { type: Type.STRING },
                    adimlarlar: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    youtube_sorgu: { type: Type.STRING },
                    besin_degerleri: {
                      type: Type.OBJECT,
                      properties: {
                        kalori: { type: Type.STRING },
                        protein: { type: Type.STRING },
                        karbonhidrat: { type: Type.STRING },
                        yag: { type: Type.STRING }
                      },
                      required: ["kalori", "protein", "karbonhidrat", "yag"]
                    }
                  },
                  required: ["baslik", "aciklama", "adimlarlar", "youtube_sorgu", "besin_degerleri"]
                }
              },
              finora_notu: { type: Type.STRING }
            },
            required: ["tanimlama_ekrani", "tarifler", "finora_notu"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
      setInput(''); // Clear input after successful processing to allow new additions
    } catch (err) {
      console.error(err);
      setError('Veri işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2926] font-sans selection:bg-[#E6D5C3]">
      {/* Header */}
      <header className="border-b border-[#E6D5C3] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView('home')}
          >
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#5A5A40]/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Şef Fora</h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#5A5A40]/70">
            <button 
              onClick={() => scrollToSection(recipesRef)}
              className="hover:text-[#5A5A40] cursor-pointer transition-colors"
            >
              Tarifler
            </button>
            <button 
              onClick={() => scrollToSection(ingredientsRef)}
              className="hover:text-[#5A5A40] cursor-pointer transition-colors"
            >
              Malzemeler
            </button>
            <button 
              onClick={() => setView('about')}
              className={`hover:text-[#5A5A40] cursor-pointer transition-colors ${view === 'about' ? 'text-[#5A5A40] font-bold' : ''}`}
            >
              Hakkında
            </button>
            <button 
              onClick={() => setView('feedback')}
              className={`hover:text-[#5A5A40] cursor-pointer transition-colors ${view === 'feedback' ? 'text-[#5A5A40] font-bold' : ''}`}
            >
              Geri Bildirim
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Hero Section */}
              <section className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5A5A40]/5 text-[#5A5A40] text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <Sparkles size={14} />
                  Mutfak Arkadaşın Fora
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl font-serif font-bold mb-4 leading-tight"
                >
                  Bugün Ne <br />
                  <span className="text-[#5A5A40] italic">Pişirsek?</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#5A5A40]/60 max-w-xl mx-auto"
                >
                  Evdeki malzemeleri söyle, sana en güzel tarifleri şipşak hazırlayalım. Artık "ne pişirsem" derdine son!
                </motion.p>
              </section>

              {/* Input Area */}
              <section className="max-w-3xl mx-auto mb-16">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#E6D5C3] to-[#5A5A40]/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white border border-[#E6D5C3] rounded-2xl shadow-xl overflow-hidden">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Dolapta ne varsa yaz veya söyle, gerisini bana bırak..."
                      className="w-full h-32 p-6 bg-transparent resize-none focus:outline-none text-lg placeholder:text-[#5A5A40]/30"
                    />
                    <div className="flex items-center justify-between p-4 bg-[#FDFCFB] border-t border-[#E6D5C3]">
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                          isRecording 
                            ? 'bg-red-50 text-red-600 animate-pulse' 
                            : 'bg-[#5A5A40]/5 text-[#5A5A40] hover:bg-[#5A5A40]/10'
                        }`}
                      >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                        <span className="text-sm font-semibold">{isRecording ? 'Dinleniyor...' : 'Sesle Anlat'}</span>
                      </button>
                      <button
                        onClick={generateRecipes}
                        disabled={loading || !input.trim()}
                        className="bg-[#5A5A40] text-white px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#4A4A35] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#5A5A40]/20"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <ChefHat size={18} />}
                        <span>Neler Yapabiliriz?</span>
                      </button>
                    </div>
                  </div>
                </div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100"
                  >
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}
              </section>

              {/* Results */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-12"
                  >
                    {/* Ingredients Section */}
                    <section ref={ingredientsRef}>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#E6D5C3] rounded-lg flex items-center justify-center text-[#5A5A40]">
                          <CheckCircle2 size={18} />
                        </div>
                        <h3 className="text-xl font-serif font-bold">Mutfaktaki Malzemelerin</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {result.tanimlama_ekrani.malzemeler.map((item, idx) => (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx}
                            className="bg-white border border-[#E6D5C3] px-4 py-2 rounded-full flex items-center gap-2 shadow-sm group/item"
                          >
                            <span className="font-semibold text-[#5A5A40]">{item.isim}</span>
                            <span className="text-xs text-[#5A5A40]/50 bg-[#5A5A40]/5 px-2 py-0.5 rounded-full">{item.miktar}</span>
                            <button 
                              onClick={() => removeIngredient(idx)}
                              className="ml-1 text-[#5A5A40]/20 hover:text-red-500 transition-colors"
                              title="Sil"
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Recipes Section */}
                    <section ref={recipesRef} className="space-y-8">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white">
                          <BookOpen size={18} />
                        </div>
                        <h3 className="text-xl font-serif font-bold">Senin İçin Harika Fikirler</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-8">
                        {result.tarifler.map((recipe, idx) => (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            key={idx}
                            className="bg-white border border-[#E6D5C3] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                          >
                            <div className="p-8 sm:p-10">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                <div className="max-w-2xl">
                                  <h4 className="text-3xl font-serif font-bold mb-4 text-[#2D2926]">{recipe.baslik}</h4>
                                  <p className="text-lg text-[#5A5A40]/80 leading-relaxed italic">
                                    {recipe.aciklama}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-3 shrink-0">
                                  <a
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.youtube_sorgu)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/10"
                                  >
                                    <Youtube size={18} />
                                    Tarifi İzle
                                  </a>
                                  
                                  {/* Nutrition Summary */}
                                  <div className="bg-[#5A5A40]/5 border border-[#5A5A40]/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-[#5A5A40]">
                                      <Activity size={16} />
                                      <span className="text-xs font-bold uppercase tracking-wider">Besin Değerleri</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-[#5A5A40]/50 uppercase font-bold">Kalori</span>
                                        <span className="text-sm font-bold text-[#5A5A40]">{recipe.besin_degerleri.kalori}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-[#5A5A40]/50 uppercase font-bold">Protein</span>
                                        <span className="text-sm font-bold text-[#5A5A40]">{recipe.besin_degerleri.protein}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-[#5A5A40]/50 uppercase font-bold">Karbonh.</span>
                                        <span className="text-sm font-bold text-[#5A5A40]">{recipe.besin_degerleri.karbonhidrat}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-[#5A5A40]/50 uppercase font-bold">Yağ</span>
                                        <span className="text-sm font-bold text-[#5A5A40]">{recipe.besin_degerleri.yag}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Steps */}
                                <div className="lg:col-span-12">
                                  <div className="flex items-center gap-2 mb-6">
                                    <ListChecks size={20} className="text-[#5A5A40]" />
                                    <h5 className="text-sm uppercase tracking-widest font-bold text-[#5A5A40]/40">Hazırlanış Adımları</h5>
                                  </div>
                                  <div className="space-y-6">
                                    {recipe.adimlarlar.map((step, sIdx) => (
                                      <motion.div 
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + sIdx * 0.05 }}
                                        key={sIdx} 
                                        className="flex gap-6 items-start group/step"
                                      >
                                        <span className="w-8 h-8 rounded-full bg-[#5A5A40]/5 flex items-center justify-center text-[#5A5A40] font-serif italic shrink-0 group-hover/step:bg-[#5A5A40] group-hover/step:text-white transition-colors">
                                          {sIdx + 1}
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-[#2D2926] leading-relaxed pt-1">
                                            {step}
                                          </p>
                                          <StepTimer text={step} />
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Finora Note */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-8 border-t border-[#E6D5C3] text-center"
                    >
                      <p className="text-sm font-medium text-[#5A5A40]/60 italic">
                        {result.finora_notu}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State */}
              {!result && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-[#5A5A40]/30"
                >
                  <div className="w-20 h-20 bg-[#5A5A40]/5 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={40} />
                  </div>
                  <p className="font-serif italic">Henüz bir şey eklemedin, hadi başlayalım!</p>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-[#E6D5C3] border-t-[#5A5A40] rounded-full mb-6"
                  />
                  <p className="font-serif italic text-[#5A5A40] animate-pulse">Şef Fora senin için en lezzetli tarifleri hazırlıyor...</p>
                </div>
              )}
            </motion.div>
          ) : view === 'about' ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto py-12"
            >
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-[#5A5A40] mb-12 hover:gap-3 transition-all font-medium"
              >
                <ArrowLeft size={20} />
                Geri Dön
              </button>

              <div className="bg-white border border-[#E6D5C3] rounded-[2.5rem] p-10 sm:p-16 shadow-xl shadow-[#5A5A40]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-[#5A5A40]/20">
                    <Sparkles size={32} />
                  </div>
                  
                  <h2 className="text-4xl font-serif font-bold mb-6">Hakkında</h2>
                  <p className="text-xl text-[#5A5A40]/80 mb-12 leading-relaxed">
                    Şef Fora, mutfakta yaratıcılığını konuşturman için tasarlandı. Elindeki malzemeleri en iyi şekilde değerlendirmen için sana rehberlik eden akıllı bir mutfak arkadaşıdır.
                  </p>
                  
                  <div className="space-y-8">
                    <div className="p-6 bg-[#FDFCFB] rounded-3xl border border-[#E6D5C3]/50">
                      <p className="text-sm font-bold uppercase tracking-widest text-[#5A5A40]/40 mb-4">Geliştirici Notu</p>
                      <p className="text-lg font-serif italic text-[#5A5A40]">"Bu bir Finora ürünüdür."</p>
                    </div>

                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-[#5A5A40]/40 mb-6">Beni Takip Et</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a 
                          href="https://www.instagram.com/__finora__/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-white border border-[#E6D5C3] rounded-2xl hover:border-[#5A5A40] hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                            <Instagram size={20} />
                          </div>
                          <span className="font-semibold">Instagram</span>
                          <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        <a 
                          href="https://x.com/Furkan_Denizzz" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-white border border-[#E6D5C3] rounded-2xl hover:border-[#5A5A40] hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                            <Twitter size={20} />
                          </div>
                          <span className="font-semibold">Twitter (X)</span>
                          <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        <a 
                          href="https://github.com/Finoraaa" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-white border border-[#E6D5C3] rounded-2xl hover:border-[#5A5A40] hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 bg-[#24292e] rounded-xl flex items-center justify-center text-white">
                            <Github size={20} />
                          </div>
                          <span className="font-semibold">GitHub</span>
                          <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        <a 
                          href="https://finora-portfolio.vercel.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-white border border-[#E6D5C3] rounded-2xl hover:border-[#5A5A40] hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white">
                            <Globe size={20} />
                          </div>
                          <span className="font-semibold">Portfolyo Sitem</span>
                          <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto py-12"
            >
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-[#5A5A40] mb-12 hover:gap-3 transition-all font-medium"
              >
                <ArrowLeft size={20} />
                Geri Dön
              </button>

              <div className="bg-white border border-[#E6D5C3] rounded-[2.5rem] p-10 sm:p-16 shadow-xl shadow-[#5A5A40]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-[#5A5A40]/20">
                    <MessageSquare size={32} />
                  </div>
                  
                  <h2 className="text-4xl font-serif font-bold mb-6">Geri Bildirim</h2>
                  <p className="text-xl text-[#5A5A40]/80 mb-12 leading-relaxed">
                    Şef Fora'yı geliştirmemize yardımcı ol! Önerilerin, karşılaştığın hatalar veya sadece merhaba demek için bize yazabilirsin.
                  </p>

                  {state.succeeded ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-100 p-10 rounded-[2rem] text-center"
                    >
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-green-900 mb-2">Teşekkürler!</h3>
                      <p className="text-green-700 mb-8">Mesajın başarıyla iletildi. Şef Fora'yı seninle birlikte geliştiriyoruz.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="text-green-700 font-bold underline underline-offset-4"
                      >
                        Yeni bir mesaj gönder
                      </button>
                    </motion.div>
                  ) : (
                    <form 
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-1">Adın</label>
                          <input 
                            required
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Furkan Deniz"
                            className="w-full p-4 bg-[#FDFCFB] border border-[#E6D5C3] rounded-2xl focus:outline-none focus:border-[#5A5A40] transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-1">E-posta</label>
                          <input 
                            required
                            id="email"
                            name="email"
                            type="email"
                            placeholder="finora@example.com"
                            className="w-full p-4 bg-[#FDFCFB] border border-[#E6D5C3] rounded-2xl focus:outline-none focus:border-[#5A5A40] transition-colors"
                          />
                          <ValidationError 
                            prefix="Email" 
                            field="email"
                            errors={state.errors}
                            className="text-red-500 text-xs mt-1 ml-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-1">Kategori</label>
                        <input type="hidden" name="category" value={feedbackForm.category} />
                        <div className="flex flex-wrap gap-3">
                          {['öneri', 'hata bildirimi', 'genel yorum'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setFeedbackForm({...feedbackForm, category: cat})}
                              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                                feedbackForm.category === cat 
                                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white' 
                                  : 'bg-white border-[#E6D5C3] text-[#5A5A40] hover:border-[#5A5A40]'
                              }`}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-1">Mesajın</label>
                        <textarea 
                          required
                          id="message"
                          name="message"
                          rows={5}
                          placeholder="Şef Fora'ya bir şeyler yaz..."
                          className="w-full p-4 bg-[#FDFCFB] border border-[#E6D5C3] rounded-2xl focus:outline-none focus:border-[#5A5A40] transition-colors resize-none"
                        />
                        <ValidationError 
                          prefix="Message" 
                          field="message"
                          errors={state.errors}
                          className="text-red-500 text-xs mt-1 ml-1"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={state.submitting}
                        className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50"
                      >
                        {state.submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        <span>Gönder</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E6D5C3] py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="text-[#5A5A40]" size={24} />
            <span className="font-serif font-bold text-lg">Şef Fora</span>
          </div>
          <p className="text-sm text-[#5A5A40]/40 max-w-md mx-auto mb-8">
            yemek yapmayı sevenler için akıllı mutfak yardımcısı.
          </p>
          <div className="flex items-center justify-center gap-8 text-[#5A5A40]/60 mb-8">
            <button 
              onClick={() => scrollToSection(recipesRef)}
              className="flex flex-col items-center gap-1 hover:text-[#5A5A40] transition-colors"
            >
              <span className="text-xl font-bold font-serif">Pratik</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Tarifler</span>
            </button>
            <div className="w-px h-8 bg-[#E6D5C3]" />
            <button 
              onClick={() => scrollToSection(ingredientsRef)}
              className="flex flex-col items-center gap-1 hover:text-[#5A5A40] transition-colors"
            >
              <span className="text-xl font-bold font-serif">Lezzetli</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Sonuçlar</span>
            </button>
            <div className="w-px h-8 bg-[#E6D5C3]" />
            <button 
              onClick={() => setView('about')}
              className="flex flex-col items-center gap-1 hover:text-[#5A5A40] transition-colors"
            >
              <span className="text-xl font-bold font-serif">Kolay</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Kullanım</span>
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-[#5A5A40]/30">
            <button onClick={() => setView('home')} className="hover:text-[#5A5A40]">Ana Sayfa</button>
            <span>•</span>
            <button onClick={() => setView('about')} className="hover:text-[#5A5A40]">Hakkında</button>
            <span>•</span>
            <button onClick={() => setView('feedback')} className="hover:text-[#5A5A40]">Geri Bildirim</button>
            <span>•</span>
            <a href="https://www.instagram.com/__finora__/" target="_blank" rel="noopener noreferrer" className="hover:text-[#5A5A40]">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
