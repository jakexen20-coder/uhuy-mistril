"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'id' | 'en';

type Translations = {
  [key in Language]: {
    newChat: string;
    history: string;
    inputPlaceholder: string;
    send: string;
    uploadImage: string;
    deleteChat: string;
    untitledChat: string;
    clearHistory: string;
    loading: string;
    modes: {
        chat: string;
        vision: string;
        code: string;
        translate: string;
    },
    adSpace: string;
  };
};

const translations: Translations = {
  id: {
    newChat: "Obrolan Baru",
    history: "Riwayat",
    inputPlaceholder: "Kirim pesan ke Mistral...",
    send: "Kirim",
    uploadImage: "Unggah Gambar",
    deleteChat: "Hapus",
    untitledChat: "Obrolan Tanpa Judul",
    clearHistory: "Hapus Semua Riwayat",
    loading: "Sedang berpikir...",
    modes: {
        chat: "Obrolan",
        vision: "Analisis Gambar",
        code: "Koding",
        translate: "Penerjemah"
    },
    adSpace: "Iklan Disini (Monetisasi)",
  },
  en: {
    newChat: "New Chat",
    history: "History",
    inputPlaceholder: "Message Mistral...",
    send: "Send",
    uploadImage: "Upload Image",
    deleteChat: "Delete",
    untitledChat: "Untitled Chat",
    clearHistory: "Clear All History",
    loading: "Thinking...",
    modes: {
        chat: "Chat",
        vision: "Vision",
        code: "Coding",
        translate: "Translator"
    },
    adSpace: "Ad Space (Monetization)",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations['en'] | string) => any; 
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('id'); // Default to Indonesian

  const t = (path: string) => {
    const keys = path.split('.');
    let value: any = translations[language];
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key as keyof typeof value];
      } else {
        return path;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
