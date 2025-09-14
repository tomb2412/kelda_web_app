'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport , DefaultChatTransport} from 'ai';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

export default function FloatingChat() {
  const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: "http://localhost:8000/chat_stream",
        }), // Make sure this matches your endpoint path
        onError: (error) => {
        console.error('Chat error:', error);
        },
        onFinish: (message) => {
        console.log('Message finished:', message);
        },
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="mb-2 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-full shadow"
      >
        {open ? 'Close Chat' : 'Open Chat'}
    </button>
        {open && (
            <div className='fixed bottom-20 right-20 w-[350px] h-[500px] bg-[#E8EDF3] border border-yellow-400 border-3 dark:bg-zinc-900 shadow-m rounded-md min-h-[300px] flex flex-col'>
                <div className='w-full bg-yellow-400 py-1 pl-4 font-semibold text-xl flex-shrink-0'>Control Panel</div>
                <div className='px-2 pb-2 min-h-0 flex flex-col flex-1'>
                    <div className="flex flex-col flex-1 overflow-y-auto w-full max-w-md py-2 space-y-2">
                        {messages.map(message => (
                            <div
                            key={message.id}
                            className={`whitespace-pre-wrap break-words hyphens-auto leading-relaxed max-w-[85%] bg-[#8EA3C1]/70 rounded-2xl shadow-xl px-3 py-2 ${
                                message.role === 'user'
                                ? 'self-end bg-[#8EA3C1] ml-auto'
                                : 'self-start bg-[#8EA3C1]/70 mr-auto'
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
                        ))}
                        </div>
                    <form 
                    className='mt-auto pt-2'
                    onSubmit={e => {
                        e.preventDefault();
                        if (input.trim()) {
                            sendMessage({ text: input});
                            setInput('');
                        }
                    }
                    }>
                        <input
                            className="w-full flex-shrink-0 dark:bg-zinc-900 bg-white max-w-md p-2 mb-2 border border-yellow-400 border-1 dark:border-zinc-800 rounded-full shadow-xl text-gray-700 dark:text-gray-200"
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