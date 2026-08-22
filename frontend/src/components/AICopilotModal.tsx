import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCw,
  ExternalLink
} from 'lucide-react';
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
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your **Dayflow AI Copilot** powered by **Gemini & ChromaDB RAG**.\n\nAsk me about leave rules, working hours, attendance policies, salary breakdowns, or apply for leave directly.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const suggestedPrompts = [
    '🌴 How many leave days do I have left?',
    '⏱️ What are the company working hours & grace period?',
    '💵 Explain my payroll and tax deductions',
    '🤒 Apply sick leave for tomorrow',
  ];

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

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
        sources: res.sources || [],
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
        text: '⚠️ **Couldn\'t generate a response.**\n\nPlease check your network connection or verify your `GEMINI_API_KEY` configuration and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-white border-l border-zinc-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-zinc-100 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                Dayflow AI Copilot
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                  Gemini RAG Active
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Grounded with ChromaDB Vector Search & Live DB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition"
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
                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-zinc-900 text-white shadow-sm font-medium'
                    : 'bg-zinc-50 border border-zinc-200/90 text-zinc-900 shadow-sm'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-line text-xs font-normal">
                  {m.text}
                </div>

                {/* Collapsible RAG Source Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/80">
                    <button
                      onClick={() => toggleSources(m.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 text-[11px] font-bold transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-600" />
                        <span>{m.sources.length} Knowledge Sources & Policy Citations</span>
                      </span>
                      {expandedSources[m.id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedSources[m.id] && (
                      <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                        {m.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-xl bg-white border border-zinc-200 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 block truncate">
                                {src.title || `Source ${sIdx + 1}`}
                              </span>
                              {src.score !== undefined && (
                                <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  {Math.round(src.score * 100)}% match
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-600 line-clamp-3 text-[10px] leading-normal font-sans">
                              {src.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Leave Payload */}
                {m.action_type === 'show_leave_balance' && m.action_payload && (
                  <div className="mt-2 p-3 rounded-2xl bg-white border border-zinc-200 space-y-1">
                    <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-700" /> Leave Quotas
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-semibold">
                      <div className="p-2 rounded-xl bg-zinc-50">
                        <span className="text-[10px] block text-zinc-500 font-bold uppercase">Paid</span>
                        <span className="text-sm text-zinc-900 font-extrabold">{m.action_payload.paid}d</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-50">
                        <span className="text-[10px] block text-zinc-500 font-bold uppercase">Sick</span>
                        <span className="text-sm text-emerald-600 font-extrabold">{m.action_payload.sick}d</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-50">
                        <span className="text-[10px] block text-zinc-500 font-bold uppercase">Unpaid</span>
                        <span className="text-sm text-amber-600 font-extrabold">{m.action_payload.unpaid}d</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leave auto-application confirmation */}
                {m.action_type === 'leave_applied' && (
                  <div className="mt-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Auto-submitted to HR approval workflow</span>
                  </div>
                )}

                <span
                  className={`block text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-zinc-400' : 'text-zinc-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-800 shrink-0 mt-1 font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-2 text-xs text-zinc-600">
                <RotateCw className="w-4 h-4 animate-spin text-zinc-900" />
                <span className="font-medium">Retrieving policy knowledge & generating with Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="p-3.5 border-t border-zinc-100 bg-zinc-50/80 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.replace(/^[^\w]+/, '').trim())}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition active:scale-95 shadow-sm"
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
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about policies, leaves, or salary..."
              className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-white border border-zinc-200 focus:outline-none focus:border-zinc-500 text-zinc-900 placeholder-zinc-400 shadow-sm font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white disabled:opacity-50 shadow-sm active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
