import React, { useState, useRef, useEffect } from 'react';
import { CHAT_DATA } from '../data';
import { SparkIcon } from '../../../components/ui/Icons';
import { ChatMessage } from '../types';

export function ChatView() {
  const [msgs, setMsgs] = useState<ChatMessage[]>(CHAT_DATA);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input.trim() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMsgs(prev => [...prev, {
        role: 'ai',
        text: 'Based on your uploaded sources, that\'s a great question. Let me cross reference the lecture slides with the tutorial recording to give you a complete answer. The key insight is that <strong>multiple encoding strategies</strong> working together produce the strongest memory traces.',
        cite: 'Lecture Slides + Tutorial'
      }]);
    }, 800);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      send(); 
    } 
  };

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className="chat-msg">
            <div className={`chat-avatar ${m.role}`}>
              {m.role === 'ai'
                ? <SparkIcon size={18}/>
                : 'You'}
            </div>
            <div>
              <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }}/>
              {m.cite && <span className="notes-cite" style={{ marginTop: 6, display: 'inline-block' }}>{m.cite}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="chat-input-row">
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
               onKeyDown={handleKey} placeholder="Ask about your sources..."/>
        <button className="chat-send" onClick={send}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
        </button>
      </div>
    </div>
  );
}
