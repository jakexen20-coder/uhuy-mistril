"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from './LanguageContext';
import { AdBanner } from './AdBanner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string, text?: string, imageUrl?: string }[];
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string, image?: string) => void;
  isLoading: boolean;
  currentMode: string;
}

export function ChatArea({ messages, onSendMessage, isLoading, currentMode }: ChatAreaProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    onSendMessage(input, selectedImage || undefined);
    setInput('');
    setSelectedImage(null);
  };

  const renderContent = (content: any) => {
    if (typeof content === 'string') {
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
    }
    if (Array.isArray(content)) {
        return content.map((part, idx) => {
            if (part.type === 'text') return <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>;
            if (part.type === 'image_url') {
                const url = part.image_url?.url || part.imageUrl;
                return <img key={idx} src={url} alt="User upload" className="max-w-xs rounded-lg my-2" />;
            }
            return null;
        });
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-50">
                <div className="text-4xl mb-4">✨</div>
                <h2 className="text-2xl font-bold mb-2">Mistral Large 3</h2>
                <p>Mode: {t(`modes.${currentMode}`)}</p>
            </div>
        )}

        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-700 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'}
            `}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderContent(msg.content)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Ad Placeholder after some messages could go here if logic permits, putting one at the bottom for now */}
        {messages.length > 3 && (
            <div className="flex justify-center">
                 <div className="w-[300px] h-[50px]"><AdBanner slotId="in-chat-ad" label={t('adSpace')} /></div>
            </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200 dark:border-gray-600 flex items-center gap-2 text-gray-500 dark:text-gray-300">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">{t('loading')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-2 relative inline-block">
                    <img src={selectedImage} alt="Preview" className="h-20 rounded border border-gray-300 dark:border-gray-600" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                    >
                        <span className="sr-only">Remove</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                {/* Image Upload Button (Visible only in Vision or Chat mode, but Mistral handles images in chat too) */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={t('uploadImage')}
                >
                    <ImageIcon size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                />

                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('inputPlaceholder')}
                        className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>

                <button
                    type="submit"
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
            </form>
            <div className="text-center mt-2">
                 <span className="text-xs text-gray-400">Mistral Large 3 can make mistakes. Check important info.</span>
            </div>
        </div>
      </div>
    </div>
  );
}
