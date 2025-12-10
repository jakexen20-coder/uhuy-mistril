"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Plus, Trash2, MessageSquare, Menu, X, Globe, Image as ImageIcon, Code, Languages, FileText, Settings } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string, text?: string, image_url?: { url: string }, imageUrl?: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentMode: string;
  setMode: (mode: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onClearHistory,
  isOpen,
  setIsOpen,
  currentMode,
  setMode,
  onOpenSettings
}: SidebarProps) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-30 transition-transform duration-300 ease-in-out w-64 flex flex-col border-r border-gray-700
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header / New Chat */}
        <div className="p-4 border-b border-gray-700">
          <button 
            onClick={() => { onNewChat(); if (window.innerWidth < 768) setIsOpen(false); }}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            {t('newChat')}
          </button>
        </div>

        {/* Modes Selection */}
        <div className="p-4 border-b border-gray-700 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setMode('chat')}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${currentMode === 'chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <MessageSquare size={16} /> {t('modes.chat')}
                </button>
                <button 
                    onClick={() => setMode('vision')}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${currentMode === 'vision' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <ImageIcon size={16} /> {t('modes.vision')}
                </button>
                <button 
                    onClick={() => setMode('code')}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${currentMode === 'code' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <Code size={16} /> {t('modes.code')}
                </button>
                <button 
                    onClick={() => setMode('translate')}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${currentMode === 'translate' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <Languages size={16} /> {t('modes.translate')}
                </button>
            </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase">
            {t('history')}
          </div>
          {sessions.length === 0 && (
             <div className="text-gray-500 text-sm p-4 text-center italic">
                No history yet.
             </div>
          )}
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`
                group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-sm
                ${currentSessionId === session.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'}
              `}
              onClick={() => { onSelectChat(session.id); if (window.innerWidth < 768) setIsOpen(false); }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="shrink-0 text-gray-500" />
                <span className="truncate">{session.title || t('untitledChat')}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                title={t('deleteChat')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Ad Space in Sidebar */}
        <div className="p-2">
            <AdBanner slotId="sidebar-ad" label={t('adSpace')} />
        </div>

        {/* Footer / Language Switch */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
           {/* Settings Button */}
           <button 
             onClick={onOpenSettings}
             className="w-full flex items-center gap-2 text-gray-400 hover:text-white mb-4 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
           >
              <Settings size={16} />
              <span>Settings / API Key</span>
           </button>

           <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-2">
                 <Globe size={16} />
                 <span>Language</span>
              </div>
              <div className="flex gap-1 bg-gray-800 rounded p-1">
                 <button 
                   data-testid="lang-id"
                   onClick={() => { console.log("Switching to ID"); setLanguage('id'); }}
                   className={`px-2 py-0.5 rounded ${language === 'id' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
                 >ID</button>
                 <button 
                   data-testid="lang-en"
                   onClick={() => { console.log("Switching to EN"); setLanguage('en'); }}
                   className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
                 >EN</button>
              </div>
           </div>
           <button 
             onClick={onClearHistory} 
             className="w-full mt-4 text-xs text-red-400 hover:text-red-300 underline"
           >
             {t('clearHistory')}
           </button>
        </div>
      </div>
    </>
  );
}
