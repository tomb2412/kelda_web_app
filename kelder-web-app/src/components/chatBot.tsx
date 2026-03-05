'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { apiUrl } from '../config/api';

function LoadingDots({
  className = '',
  color = '#64748b',
  fontFamily,
}: { className?: string; color?: string; fontFamily?: string }) {
  const style = {
    '--loader-dot-color': color,
    ...(fontFamily ? { '--loader-dot-font': fontFamily } : {}),
  } as CSSProperties;
  return (
    <span className={`vercel-loading-dots ${className}`} style={style} role="status" aria-live="polite">
      <span className="sr-only">AI is generating</span>
      <span className="dot" aria-hidden="true" style={{ animationDelay: '0s' }} />
      <span className="dot" aria-hidden="true" style={{ animationDelay: '0.2s' }} />
      <span className="dot" aria-hidden="true" style={{ animationDelay: '0.4s' }} />
    </span>
  );
}

const NewChatIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M120-160v-600q0-33 23.5-56.5T200-840h480q33 0 56.5 23.5T760-760v203q-10-2-20-2.5t-20-.5q-10 0-20 .5t-20 2.5v-203H200v400h283q-2 10-2.5 20t-.5 20q0 10 .5 20t2.5 20H240L120-160Zm160-440h320v-80H280v80Zm0 160h200v-80H280v80Zm400 280v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM200-360v-400 400Z" />
  </svg>
);

const CloseChatIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
  </svg>
);

const OpenChatIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
  </svg>
);

const SendIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z" />
  </svg>
);

export default function FloatingChat() {
  const { getToken } = useAuth();

  // Stable fetch wrapper that adds a Clerk Bearer token on every request.
  // Using a ref so the function identity never changes (safe for DefaultChatTransport).
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  const authFetch = useCallback(async (url: RequestInfo | URL, init?: RequestInit) => {
    const token = await getTokenRef.current();
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  }, []);

  const [progressUpdate, setProgressUpdate] = useState('');
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl('/chat_stream'),
      fetch: authFetch,
    }),
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Chat error:', error);
    },
    onFinish: () => {
      setProgressUpdate('');
    },
    onData: (dataPart) => {
      if (dataPart.type === "data-progress") {
        const data = dataPart.data.node;
        const update = data.replace("progress_update:", "");
        setProgressUpdate(update.trim() || 'Loading...');
      }
    }
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const hasRenderableText = (message: { parts: Array<{ type: string; text?: string }> }) =>
    message.parts.some(
      part => part.type === 'text' && typeof part.text === 'string' && part.text.trim().length > 0,
    );

  const isAwaitingResponse = status === 'submitted' || status === 'streaming';
  const lastMessage = messages[messages.length - 1];
  const shouldShowLoader = isAwaitingResponse && !(lastMessage?.role === 'assistant' && hasRenderableText(lastMessage));
  const renderableMessages = messages.filter(message => message.role === 'user' || hasRenderableText(message));

  useEffect(() => {
    if (!open || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, shouldShowLoader, open]);

  const handleClearChat = async () => {
    if (isClearing) return;
    try {
      setIsClearing(true);
      const token = await getToken();
      await fetch(apiUrl('/chat_clear'), {
        method: 'GET',
        headers: {
          accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setMessages([]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to clear chat history', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setProgressUpdate('Loading...');
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-yellow-400 text-slate-900 shadow-lg flex items-center justify-center border-2 border-yellow-500/40 transition-all duration-200 hover:scale-110 hover:bg-yellow-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
        aria-label={open ? 'Close chat panel' : 'Open chat panel'}
      >
        <span className="sr-only">{open ? 'Close chat panel' : 'Open chat panel'}</span>
        {open
          ? <CloseChatIcon className="w-6 h-6" />
          : <OpenChatIcon className="w-7 h-7" />
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed inset-x-3 bottom-[5.5rem] sm:right-5 sm:left-auto sm:inset-x-auto w-full sm:w-[28rem] max-w-[calc(100vw-1.5rem)] sm:max-w-none h-[72vh] sm:h-[76vh] min-h-[340px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/60"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(203, 213, 225, 0.95)' }}
        >
          {/* Dark mode override via class */}
          <div className="flex flex-col h-full dark:bg-slate-800/90">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-yellow-400 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
                  <OpenChatIcon className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm leading-none">Control Panel</p>
                  <p className="text-slate-700 text-xs mt-0.5">
                    {isAwaitingResponse ? 'Thinking...' : 'Ready'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={isClearing || status !== 'ready'}
                  aria-label="Clear chat history"
                  aria-busy={isClearing}
                  className="relative w-9 h-9 rounded-full bg-black/10 text-slate-900 border border-black/10 flex items-center justify-center transition hover:bg-black/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                >
                  <span className="sr-only">{isClearing ? 'Clearing chat' : 'Clear chat'}</span>
                  <NewChatIcon className={`w-4 h-4 transition-opacity ${isClearing ? 'opacity-0' : 'opacity-100'}`} />
                  {isClearing && (
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full bg-black/10 text-slate-900 border border-black/10 flex items-center justify-center transition hover:bg-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                  aria-label="Close chat panel"
                >
                  <CloseChatIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              className="flex flex-col flex-1 overflow-y-auto px-4 py-3 gap-3 min-h-0"
            >
              {renderableMessages.length === 0 && !shouldShowLoader && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-full bg-[#024887]/10 dark:bg-slate-700 flex items-center justify-center">
                    <OpenChatIcon className="w-6 h-6 text-[#024887] dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">How can I help?</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Ask me about passage plans, tides, or vessel status.</p>
                  </div>
                </div>
              )}

              {renderableMessages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#024887] text-white rounded-br-sm shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {message.parts.map((part, i) => {
                        if (part.type !== 'text') return null;
                        return isUser ? (
                          <span key={`${message.id}-${i}`}>{part.text}</span>
                        ) : (
                          <div key={`${message.id}-${i}`} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:mb-1">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                h1: ({ children }) => <h1 className="text-base font-bold mb-1 text-slate-900 dark:text-slate-100">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 text-slate-900 dark:text-slate-100">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-medium mb-0.5 text-slate-900 dark:text-slate-100">{children}</h3>,
                                p: ({ children }) => <p className="mb-1.5 last:mb-0 text-slate-700 dark:text-slate-200">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-slate-700 dark:text-slate-200">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-slate-700 dark:text-slate-200">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                                  inline
                                    ? <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono text-[#024887] dark:text-blue-300">{children}</code>
                                    : <code className="block bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-xs font-mono overflow-x-auto">{children}</code>,
                                blockquote: ({ children }) => <blockquote className="border-l-3 border-[#024887]/30 pl-3 italic text-slate-600 dark:text-slate-400 mb-1.5">{children}</blockquote>,
                                strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>,
                                em: ({ children }) => <em className="italic text-slate-700 dark:text-slate-300">{children}</em>,
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {shouldShowLoader && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <LoadingDots color="#64748b" />
                    {progressUpdate && <span className="text-xs">{progressUpdate}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  className="flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#024887]/30 focus:border-[#024887]/40 dark:focus:ring-blue-500/30 transition"
                  value={input}
                  placeholder="Ask about passage, tides..."
                  onChange={e => setInput(e.target.value)}
                  disabled={status !== 'ready'}
                />
                <button
                  type="submit"
                  disabled={status !== 'ready' || !input.trim()}
                  className="w-10 h-10 rounded-full bg-[#024887] text-white flex items-center justify-center shadow-sm transition hover:bg-[#024887]/80 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#024887]/50 flex-shrink-0"
                  aria-label="Send message"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
