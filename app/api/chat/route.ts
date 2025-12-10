import { NextRequest, NextResponse } from 'next/server';
import { mistral } from '@/lib/mistral';

export const maxDuration = 60; // Allow longer timeouts for complex reasoning

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // System Prompt Injection based on Mode
    let systemPrompt = "You are a helpful AI assistant powered by Mistral Large 3.";
    if (mode === 'code') {
        systemPrompt = "You are an expert software engineer. Provide clean, efficient, and well-documented code. Explain your logic clearly.";
    } else if (mode === 'translate') {
        systemPrompt = "You are a professional translator. Translate the given text accurately while preserving tone and context. If the user provides a language pair, follow it. If not, auto-detect and translate to the other likely intended language (e.g. English <-> Indonesian).";
    } else if (mode === 'vision') {
        systemPrompt = "You are an expert image analyst. Describe images in detail, read text from them, and answer questions about the visual content.";
    }

    // Prepend system prompt if not present or just ensure it's there as context
    // Mistral API expects the system prompt usually as the first message or handled via specific role if supported. 
    // Mistral supports 'system' role.
    const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    const chatResponse = await mistral.chat.complete({
      model: 'mistral-large-latest', // or 'mistral-large-2402' etc, checking docs 'mistral-large-latest' is often valid or specific version. 
      // Based on recent docs, 'mistral-large-latest' points to the latest large model. 
      // The user mentioned Mistral Large 3. 'mistral-large-latest' should route to it if released, or we use specific if known. 
      // Safest is 'mistral-large-latest'.
      messages: finalMessages,
    });

    const botMessage = chatResponse.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ 
        role: 'assistant', 
        content: botMessage 
    });

  } catch (error: any) {
    console.error("Mistral API Error:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
