'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { apiUrl } from '../config/api';

function LoadingDots({
  className = '',
  color = '#1f2937',
}: { className?: string; color?: string }) {
  const style = { '--loader-dot-color': color } as CSSProperties;
  return (
    <>
      <span className={`vercel-loading-dots ${className}`} style={style} role="status" aria-live="polite">
        <span className="sr-only">AI is generating</span>
        <span className="dot" aria-hidden="true" style={{ animationDelay: '0s' }} />
        <span className="dot" aria-hidden="true" style={{ animationDelay: '0.2s' }} />
        <span className="dot" aria-hidden="true" style={{ animationDelay: '0.4s' }} />
      </span>
    </>
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
    <path d="m402-654 118 117v-89h80v226H374v-80h90L346-598l56-56Zm358 494q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm-600 0q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v240h-80v-240H160v480h400v80H160Z" />
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
    <path d="m357-384 123-123 123 123 57-56-180-180-180 180 57 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
  </svg>
);

export default function FloatingChat() {
  const [progressUpdate, setProgressUpdate] = useState('');
  const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: apiUrl('/chat_stream'),
        }), 
        onError: (error) => {
        console.error('Chat error:', error);
        },
        onFinish: (message) => {
        console.log('Message finished:', message);
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
    if (isClearing) {
        return;
    }

    try {
        setIsClearing(true);
        await fetch(apiUrl('/chat_clear'), {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        });
        setMessages([]);
    } catch (err) {
        console.error('Failed to clear chat history', err);
    } finally {
        setIsClearing(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4 sm:gap-5">
      <button
        onClick={() => setOpen(!open)}
        className="mb-2 bg-yellow-400 text-black rounded-full shadow w-16 h-16 flex items-center justify-center border border-black/20 transition hover:scale-105 hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500"
        aria-label={open ? 'Close chat panel' : 'Open chat panel'}
      >
        <span className="sr-only">{open ? 'Close chat panel' : 'Open chat panel'}</span>
        {open ? <CloseChatIcon className="w-8 h-8" /> : <OpenChatIcon className="w-8 h-8" />}
    </button>
        {open && (
            <div className='fixed inset-x-3 bottom-24 sm:bottom-28 sm:right-12 sm:left-auto sm:inset-x-auto w-full sm:w-[26rem] max-w-[calc(100vw-1.5rem)] sm:max-w-none h-[70vh] sm:h-[75vh] min-h-[320px] flex flex-col bg-[#E8EDF3] border border-yellow-400 border-3 dark:bg-slate-800 shadow-m rounded-md'>
                <div className='flex flex-row items-center justify-between w-full bg-yellow-400 py-1 pl-5 font-semibold text-2xl flex-shrink-0'>
                    <div className='flex items-center gap-3'>
                        <span>Control Panel</span>
                    </div>
                    <div className='flex items-center gap-2 pr-3'>
                        <button
                            type='button'
                            onClick={handleClearChat}
                            disabled={isClearing || status !== 'ready'}
                            aria-label='Clear chat history'
                            aria-busy={isClearing}
                            className='relative flex items-center justify-center w-12 h-12 rounded-full bg-black text-yellow-400 border border-black/40 shadow transition hover:scale-105 hover:bg-black/80 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black'
                        >
                            <span className="sr-only">{isClearing ? 'Clearing chat' : 'Clear chat'}</span>
                            <NewChatIcon className={`w-6 h-6 transition-opacity ${isClearing ? 'opacity-0' : 'opacity-100'}`} />
                            {isClearing && (
                                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                                    <span className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className='flex items-center justify-center w-12 h-12 text-yellow-400 rounded-full bg-black border-2 border-black/60 transition hover:scale-105 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black'
                            aria-label='Close chat panel'
                        >
                            <CloseChatIcon className='w-6 h-6' />
                        </button>
                    </div>
                </div>
                <div className='px-2 pb-2 min-h-0 flex flex-col flex-1'>
                        <div
                        ref={scrollContainerRef}
                        className="flex flex-col flex-1 overflow-y-auto w-full py-2"
                    >
                        {renderableMessages.map((message, index) => {
                            const isUser = message.role === 'user';
                            return (
                            <div key={message.id} className="flex flex-col w-full">
                                {index > 0}
                                <div
                                className={`whitespace-pre-wrap break-words hyphens-auto leading-relaxed max-w-[85%] px-3 py-2 ${
                                    isUser
                                    ? 'rounded-2xl bg-white dark:bg-zinc-900 self-end ml-auto'
                                    : 'self-start mr-auto text-gray-900 dark:text-gray-100'
                                }`}
                                >
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                    case 'text':
                                        return (
                                        <div key={`${message.id}-${i}`} className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeHighlight]}
                                            components={{
                                                // Customize components for your chat bubble style
                                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">{children}</h3>,
                                                p: ({children}) => <p className="mb-2 last:mb-0 text-gray-800 dark:text-gray-200">{children}</p>,
                                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-800 dark:text-gray-200">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-800 dark:text-gray-200">{children}</ol>,
                                                li: ({children}) => <li className="text-sm">{children}</li>,
                                                code: ({inline, children}) =>
                                                inline
                                                    ? <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono text-red-600 dark:text-red-400">{children}</code>
                                                    : <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>,
                                                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-700 dark:text-gray-300 mb-2">{children}</blockquote>,
                                                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                                                em: ({children}) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
                                            }}
                                            >
                                            {part.text}
                                            </ReactMarkdown>
                                        </div>
                                        );
                                    default:
                                        return null;
                                    }
                                })}
                                </div>
                            </div>
                        )})}
                        {shouldShowLoader && (
                            <div className="flex flex-col w-full">
                                {renderableMessages.length > 0 && <hr className="border-t border-gray-300/60 my-2" />}
                                <div className="max-w-[60%] px-3 py-2 self-start flex items-center gap-3 text-sm text-gray-800 dark:text-gray-100">
                                    <span>{progressUpdate}  <LoadingDots color="#1f2937" /></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <form 
                    className='mt-auto pt-2'
                    onSubmit={e => {
                        e.preventDefault();
                        if (input.trim()) {
                            setProgressUpdate('Loading...');
                            sendMessage({ text: input});
                            setInput('');
                        }
                    }
                    }>
                        <input
                            className="w-full flex-shrink-0 dark:bg-zinc-900 bg-white p-2 mb-2 border border-yellow-400 border-1 dark:border-zinc-800 rounded-full shadow-xl text-gray-700 dark:text-gray-200"
                            value={input}
                            placeholder="Make a passage plan..."
                            onChange={e => setInput(e.target.value)}
                            disabled={status !== 'ready'}
                        />
                    </form>
                </div>
            </div>
            )
        }
    </div>
  );
}
