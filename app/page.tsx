"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { SettingsModal } from '@/components/SettingsModal';
import { Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Mistral } from '@mistralai/mistralai';

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

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('chat'); // chat, vision, code, translate
  const [showSettings, setShowSettings] = useState(false);
  const [clientApiKey, setClientApiKey] = useState('');

  // Load from LocalStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('mistral_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    const savedKey = localStorage.getItem('mistral_api_key');
    if (savedKey) setClientApiKey(savedKey);
  }, []);

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('mistral_chats', JSON.stringify(sessions));
  }, [sessions]);

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      timestamp: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const handleSendMessage = async (content: string, image?: string) => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewChat();
    }

    const newMessage: Message = {
        role: 'user',
        content: image 
            ? [
                { type: 'text', text: content },
                { type: 'image_url', image_url: { url: image } }
              ]
            : content
    };

    // Optimistic Update
    setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
            return {
                ...s,
                messages: [...s.messages, newMessage],
                // Update title if it's the first message
                title: s.messages.length === 0 ? (typeof content === 'string' ? content.slice(0, 30) : "Image Chat") : s.title
            };
        }
        return s;
    }));

    setIsLoading(true);

    try {
        // Prepare messages for API (exclude system messages if we handled them locally, but here we just send user/assistant)
        // We need to fetch the *updated* session messages to send context
        const currentSession = sessions.find(s => s.id === sessionId);
        // Note: state update in React is async, so 'sessions' here might be stale.
        // Better to construct the payload explicitly.
        
        // Find existing messages (excluding the one we just added optimistically, but we need it)
        const existingMessages = currentSession?.messages || [];
        const payloadMessages = [...existingMessages, newMessage];
        
        let botMessageContent = "";

        // Strategy: Try Client-Side First if Key exists (for GitHub Pages), otherwise Server-Side
        if (clientApiKey) {
            try {
                // Client-side call
                const client = new Mistral({ apiKey: clientApiKey });
                
                // System Prompt Logic (Duplicated from server for client-side)
                let systemPrompt = "You are a helpful AI assistant powered by Mistral Large 3.";
                if (currentMode === 'code') systemPrompt = "You are an expert software engineer. Provide clean, efficient, and well-documented code.";
                if (currentMode === 'translate') systemPrompt = "You are a professional translator.";
                if (currentMode === 'vision') systemPrompt = "You are an expert image analyst.";

                const finalMessages = [
                     { role: 'system', content: systemPrompt },
                     ...payloadMessages
                ] as any; // Cast to any to avoid strict type mismatch with SDK if any

                const chatResponse = await client.chat.complete({
                  model: 'mistral-large-latest',
                  messages: finalMessages,
                });
                botMessageContent = chatResponse.choices?.[0]?.message?.content || "No response.";
            } catch (err: any) {
                console.error("Client API Error:", err);
                throw new Error("Client-side API call failed. Check your Key or CORS settings. " + (err.message || ""));
            }
        } else {
            // Server-side call (Fallback or Default)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: payloadMessages,
                    mode: currentMode
                }),
            });

            if (!response.ok) {
                 if (response.status === 404) {
                     throw new Error("Server API not found (are you on GitHub Pages?). Please enter your API Key in Settings.");
                 }
                 throw new Error('Failed to fetch from server.');
            }
            const data = await response.json();
            botMessageContent = data.content;
        }

        // Add Bot Response
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [...s.messages, { role: 'assistant', content: botMessageContent }]
                };
            }
            return s;
        }));

    } catch (error: any) {
        console.error(error);
        // Add error message to chat
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [...s.messages, { role: 'assistant', content: `Error: ${error.message || "Unknown error"}` }]
                };
            }
            return s;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const deleteChat = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const clearHistory = () => {
      if(confirm("Are you sure you want to delete all history?")) {
          setSessions([]);
          setCurrentSessionId(null);
      }
  };

  const saveApiKey = (key: string) => {
      setClientApiKey(key);
      localStorage.setItem('mistral_api_key', key);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSave={saveApiKey}
        initialApiKey={clientApiKey}
      />

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-10 bg-gray-800 p-2 rounded-lg"
      >
        <Menu size={24} />
      </button>

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewChat}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={deleteChat}
        onClearHistory={clearHistory}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentMode={currentMode}
        setMode={setCurrentMode}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col md:ml-64 relative">
        <ChatArea 
          messages={getCurrentSession()?.messages || []}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentMode={currentMode}
        />
      </div>
    </div>
  );
}
