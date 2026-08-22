import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, ArrowRight, CheckCircle2, Calendar, DollarSign, Clock } from 'lucide-react';
import { aiAssistantService } from '../services/api';
import type { AIChatMessage } from '../types';
import confetti from 'canvas-confetti';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your **Dayflow AI Copilot**. How can I help you today? You can ask about your remaining leaves, check your salary breakdown, or apply for leave in natural language.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const suggestedPrompts = [
    '🌴 How many leave days do I have left?',
    '⏱️ Show my attendance for this month',
    '💵 What is my salary breakdown?',
    '🤒 Apply sick leave for tomorrow',
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAssistantService.sendMessage(textToSend);
      
      const botMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action_type: res.action_type,
        action_payload: res.action_payload,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If leave was applied by AI, trigger celebration & refresh parent components
      if (res.action_type === 'leave_applied') {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the HR services. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-l border-white/20 dark:border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-brand-600/10 via-indigo-600/10 to-purple-600/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Dayflow AI Copilot
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Powered by Gemini & Smart HR Automation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-sm'
                }`}
              >
                <div className="whitespace-pre-line prose dark:prose-invert text-xs">
                  {m.text}
                </div>

                {/* Render Rich Interactive Action Payload if present */}
                {m.action_type === 'show_leave_balance' && m.action_payload && (
                  <div className="mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-1">
                    <p className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Leave Quotas
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-semibold">
                      <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60">
                        <span className="text-[10px] block text-slate-500">Paid</span>
                        <span className="text-sm text-brand-600">{m.action_payload.paid}d</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60">
                        <span className="text-[10px] block text-slate-500">Sick</span>
                        <span className="text-sm text-emerald-600">{m.action_payload.sick}d</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60">
                        <span className="text-[10px] block text-slate-500">Unpaid</span>
                        <span className="text-sm text-amber-600">{m.action_payload.unpaid}d</span>
                      </div>
                    </div>
                  </div>
                )}

                {m.action_type === 'leave_applied' && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Auto-submitted to HR approval workflow</span>
                  </div>
                )}

                <span
                  className={`block text-[9px] mt-1.5 text-right ${
                    m.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.replace(/^[^\w]+/, '').trim())}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 mt-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or request action..."
              className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white disabled:opacity-50 shadow-md shadow-brand-500/25 active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
