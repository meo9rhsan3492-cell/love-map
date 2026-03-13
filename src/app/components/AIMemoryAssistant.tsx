import { useState } from 'react';
import { MessageCircle, Send, Bot, X } from 'lucide-react';
import { queryMemory } from '../lib/ai';
import type { Memory } from '../types/memory';

interface AIMemoryAssistantProps {
  memories: Memory[];
  onClose?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export function AIMemoryAssistant({ memories, onClose }: AIMemoryAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '嗨！我是你们的回忆助手～ 有什么关于你们回忆的问题都可以问我哦！💕' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // 添加loading消息
    setMessages(prev => [...prev, { role: 'assistant', content: '...', isLoading: true }]);

    try {
      const response = await queryMemory(memories, userMessage);
      
      setMessages(prev => {
        const newMessages = prev.filter(m => !m.isLoading);
        if (response.error) {
          return [...newMessages, { role: 'assistant', content: response.error }];
        }
        return [...newMessages, { role: 'assistant', content: response.content }];
      });
    } catch (err) {
      setMessages(prev => {
        const newMessages = prev.filter(m => !m.isLoading);
        return [...newMessages, { role: 'assistant', content: '抱歉，出错了，请稍后再试～' }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-pink-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">回忆助手</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-pink-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-pink-500 text-white rounded-br-md'
                  : 'bg-white shadow-sm rounded-bl-md text-gray-800'
              }`}
            >
              {msg.isLoading ? (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-pink-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="问我关于你们的回忆..."
            className="flex-1 px-4 py-2 rounded-full border border-pink-200 focus:outline-none focus:border-pink-400 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Floating button version
export function AIMemoryButton({ memories }: { memories: Memory[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-[120px] w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      {isOpen && (
        <AIMemoryAssistant 
          memories={memories} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
