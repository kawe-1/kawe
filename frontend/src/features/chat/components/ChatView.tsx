import React, { useEffect, useRef, useState } from 'react';
import { CHAT_DATA } from '../data';
import { SparkIcon } from '../../../components/ui/Icons';
import { ChatMessage } from '../types';
import { SessionDetail } from '../../../services/endpoints/sessions';
import { getChatHistory, sendChatMessage } from '../../../services/endpoints/chat';
import { resolveAudioUrl, sendVoiceQuery } from '../../../services/endpoints/voice';

const makeMessageId = () => `msg_${Math.random().toString(36).slice(2, 10)}`;

export function ChatView({ session }: { session?: SessionDetail | null }) {
  const [msgs, setMsgs] = useState<ChatMessage[]>(CHAT_DATA);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  useEffect(() => {
    if (!session?.id) {
      setMsgs(CHAT_DATA);
      return;
    }

    const loadHistory = async () => {
      try {
        const history = await getChatHistory(session.id);
        if (!history.length) {
          setMsgs(CHAT_DATA);
          return;
        }

        setMsgs(
          history.map((entry) => ({
            id: makeMessageId(),
            role: entry.role === 'assistant' ? 'ai' : 'user',
            text: entry.message,
          })),
        );
      } catch {
        setMsgs(CHAT_DATA);
      }
    };

    loadHistory();
  }, [session?.id]);

  const send = async () => {
    if (!input.trim() || !session?.id || sending) return;

    const content = input.trim();
    const userMsg: ChatMessage = { id: makeMessageId(), role: 'user', text: content };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const response = await sendChatMessage(session.id, content);
      const aiMsg: ChatMessage = {
        id: makeMessageId(),
        role: 'ai',
        text: response.answer,
        cite: response.sources?.length ? response.sources.join(' + ') : undefined,
      };
      setMsgs((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMsgs((prev) => [
        ...prev,
        {
          id: makeMessageId(),
          role: 'ai',
          text: 'There was a problem sending your message. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const sendVoice = async (blob: Blob) => {
    if (!session?.id) return;

    setVoiceLoading(true);
    const pendingId = makeMessageId();
    setMsgs((prev) => [...prev, { id: pendingId, role: 'user', text: '🎤 Voice message…' }]);

    try {
      const res = await sendVoiceQuery(session.id, blob);
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, text: res.transcript || '(no transcript)' }
            : m,
        ),
      );

      const audioUrl = res.audio_url ? resolveAudioUrl(res.audio_url) : undefined;
      const aiMsg: ChatMessage = {
        id: makeMessageId(),
        role: 'ai',
        text: res.answer,
        audioUrl,
      };
      setMsgs((prev) => [...prev, aiMsg]);

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {
          // ignore autoplay errors
        });
      }
    } catch {
      setMsgs((prev) => prev.filter((m) => m.id !== pendingId));
      setMsgs((prev) => [
        ...prev,
        {
          id: makeMessageId(),
          role: 'ai',
          text: 'Voice query failed. Please try again.',
        },
      ]);
    } finally {
      setVoiceLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendVoice(blob);
      };

      mediaRecorder.start();
      recorderRef.current = mediaRecorder;
      setRecording(true);
    } catch {
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
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
        {msgs.map((m) => (
          <div key={m.id ?? `${m.role}-${Math.random()}`} className="chat-msg">
            <div className={`chat-avatar ${m.role}`}>
              {m.role === 'ai' ? <SparkIcon size={18} /> : 'You'}
            </div>
            <div>
              <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
              {m.cite && (
                <span className="notes-cite" style={{ marginTop: 6, display: 'inline-block' }}>{m.cite}</span>
              )}
              {m.audioUrl && (
                <audio controls style={{ marginTop: 8, width: '100%' }} src={m.audioUrl} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your sources..."
          disabled={!session?.id || sending || voiceLoading}
        />
        <button
          type="button"
          onClick={toggleRecording}
          disabled={sending || voiceLoading}
          title={recording ? 'Stop recording' : 'Voice query'}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: 'none',
            flexShrink: 0,
            cursor: 'pointer',
            background: recording ? 'var(--coral)' : 'var(--bg2)',
            color: recording ? '#fff' : 'var(--muted)',
            display: 'grid',
            placeItems: 'center',
            transition: 'all .2s',
            animation: recording ? 'pulse-ring 1.2s infinite' : 'none',
          }}
        >
          <style>{`@keyframes pulse-ring{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--coral) 50%,transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}`}</style>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {recording ? (
              <>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </>
            ) : (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
              </>
            )}
          </svg>
        </button>
        <button className="chat-send" type="button" onClick={send} disabled={!session?.id || sending || voiceLoading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
        </button>
      </div>
    </div>
  );
}
