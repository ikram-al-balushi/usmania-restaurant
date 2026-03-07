import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, transcribeAudio, getTTSAudio, resetChat } from '../utils/gemini';

const LANGUAGES = [
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const QUICK_REPLIES = {
  ur: [
    { label: "Menu dikhao", text: "Apna menu dikhao" },
    { label: "Order karna hai", text: "Mujhe order karna hai" },
    { label: "Table book", text: "Mujhe table reserve karna hai" },
    { label: "Delivery", text: "Kya aap home delivery karte hain?" },
    { label: "Aaj ka special", text: "Aaj ka special kya hai?" },
    { label: "Timings", text: "Restaurant ki timing kya hai?" },
  ],
  en: [
    { label: "View Menu", text: "Show me your menu" },
    { label: "Place Order", text: "I want to place an order" },
    { label: "Book Table", text: "I want to reserve a table" },
    { label: "Delivery", text: "Do you offer home delivery?" },
    { label: "Today's Special", text: "What is today's special?" },
    { label: "Timings", text: "What are your opening hours?" },
  ],
  ar: [
    { label: "عرض القائمة", text: "أرني القائمة" },
    { label: "طلب", text: "أريد أن أطلب" },
    { label: "حجز طاولة", text: "أريد حجز طاولة" },
    { label: "التوصيل", text: "هل تقدمون خدمة التوصيل؟" },
    { label: "عرض اليوم", text: "ما هو طبق اليوم؟" },
    { label: "ساعات العمل", text: "ما هي ساعات العمل؟" },
  ],
};

const WELCOME_MSG = {
  ur: "Assalam o Alaikum! Usmania Restaurant mein khush aamdeed! Main Sofia hoon. Aaj kya khane ka dil kar raha hai? Mic daba kar mujh se baat karein!",
  en: "Hey there! Welcome to Usmania Restaurant! I'm Sofia, your personal food assistant. What are you in the mood for today? Press the mic to talk to me!",
  ar: "أهلاً وسهلاً في مطعم عثمانية! أنا صوفيا، مساعدتكم. شو تشتهون اليوم؟ اضغطوا على المايك وتكلموا معي!",
};

const STATUS_TEXT = {
  ur: { online: 'آن لائن', listening: 'سن رہی ہوں...', processing: 'سمجھ رہی ہوں...', speaking: 'بول رہی ہوں...', micError: 'مائک خرابی' },
  en: { online: 'Online', listening: 'Listening...', processing: 'Processing...', speaking: 'Speaking...', micError: 'Mic Error' },
  ar: { online: 'متصلة', listening: 'أستمع...', processing: 'أفهم...', speaking: 'أتحدث...', micError: 'خطأ الميكروفون' },
};

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

// SVG Icons
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const SpeakerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('ur');
  const [messages, setMessages] = useState([
    { role: 'bot', text: WELCOME_MSG['ur'], showQuickReplies: true, time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micError, setMicError] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(-1);
  const [volume, setVolume] = useState(0);

  const messagesEndRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const ttsAnimRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const ttsAnalyserRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const hasSpeechRef = useRef(false);
  const barsRef = useRef(null);
  const micRingRef = useRef(null);
  const orbRef = useRef(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const speakIdRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    cancelAnimationFrame(ttsAnimRef.current);
    clearInterval(recordingTimerRef.current);
  }, []);

  const currentQuickReplies = QUICK_REPLIES[lang] || QUICK_REPLIES['ur'];
  const currentWelcome = WELCOME_MSG[lang] || WELCOME_MSG['ur'];
  const st = STATUS_TEXT[lang] || STATUS_TEXT['ur'];
  const isRtl = lang === 'ar';

  const formatTime = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ─────────── STOP SPEAKING ───────────
  function stopSpeaking() {
    cancelAnimationFrame(ttsAnimRef.current);
    if (ttsSourceRef.current) {
      try { ttsSourceRef.current.stop(); } catch (e) {}
      ttsSourceRef.current = null;
    }
    if (ttsAnalyserRef.current?.src) {
      try { ttsAnalyserRef.current.src.disconnect(); } catch (e) {}
      ttsAnalyserRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    setIsSpeaking(false);
    setSpeakingMsgIndex(-1);
    setVolume(0);
  }

  // ─────────── TTS VOLUME LOOP ───────────
  function startTTSVolumeLoop(analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      if (!ttsAnalyserRef.current) return;
      analyser.getByteFrequencyData(data);
      const vol = data.reduce((a, b) => a + b, 0) / data.length / 128;
      setVolume(Math.min(vol, 1));
      ttsAnimRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  // ─────────── SPEAK (TTS) ───────────
  const speak = useCallback(async function speak(text, thenListen = false, msgIdx = -1) {
    if (!voiceEnabled || !text) return;
    stopSpeaking();

    // Each speak call gets a unique ID — if a newer speak starts before
    // the TTS fetch completes, we discard the stale audio
    const myId = ++speakIdRef.current;

    setIsSpeaking(true);
    if (msgIdx >= 0) setSpeakingMsgIndex(msgIdx);

    try {
      const arrayBuffer = await getTTSAudio(text);

      // Check if a newer speak() was called while we were fetching
      if (speakIdRef.current !== myId) return;

      if (!arrayBuffer || arrayBuffer.byteLength < 100) throw new Error('No audio');

      const ctx = getAudioCtx();
      if (!ctx) throw new Error('No AudioContext');
      if (ctx.state === 'suspended') await ctx.resume();

      // Re-check after async resume
      if (speakIdRef.current !== myId) return;

      const bufferCopy = arrayBuffer.slice(0);
      const audioBuffer = await ctx.decodeAudioData(bufferCopy);

      // Final check before playing
      if (speakIdRef.current !== myId) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // TTS Analyser for speaking visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ttsAnalyserRef.current = { analyser, src: source };
      startTTSVolumeLoop(analyser);

      ttsSourceRef.current = source;

      source.onended = () => {
        cancelAnimationFrame(ttsAnimRef.current);
        setIsSpeaking(false);
        setSpeakingMsgIndex(-1);
        setVolume(0);
        ttsSourceRef.current = null;
        ttsAnalyserRef.current = null;
        if (thenListen) setTimeout(() => startListening(), 400);
      };
      source.start(0);
    } catch (err) {
      if (speakIdRef.current !== myId) return;
      console.warn('[TTS] API failed, browser fallback:', err.message);
      setIsSpeaking(false);
      setSpeakingMsgIndex(-1);
      ttsSourceRef.current = null;
      ttsAnalyserRef.current = null;

      if (window.speechSynthesis) {
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'ur-PK';
          setIsSpeaking(true);
          if (msgIdx >= 0) setSpeakingMsgIndex(msgIdx);
          u.onend = () => {
            setIsSpeaking(false);
            setSpeakingMsgIndex(-1);
            if (thenListen) setTimeout(() => startListening(), 400);
          };
          u.onerror = () => { setIsSpeaking(false); setSpeakingMsgIndex(-1); };
          window.speechSynthesis.speak(u);
        } catch (e2) {
          setIsSpeaking(false);
          setSpeakingMsgIndex(-1);
        }
      }
    }
  }, [voiceEnabled, lang]);

  // ─────────── MIC VOLUME → DOM ───────────
  function updateVolumeDom(vol) {
    const norm = Math.min(vol / 80, 1);
    setVolume(norm);

    // Direct DOM updates for 60fps performance
    if (barsRef.current) {
      const bars = barsRef.current.children;
      for (let i = 0; i < bars.length; i++) {
        const offset = [0.9, 1, 0.85, 0.95, 0.8][i] || 1;
        const h = 4 + norm * offset * 28;
        bars[i].style.height = `${h}px`;
      }
    }
    if (micRingRef.current) {
      micRingRef.current.style.setProperty('--vol', norm);
    }
    if (orbRef.current) {
      orbRef.current.style.setProperty('--vol', norm);
    }
  }

  // ─────────── SILENCE DETECTION ───────────
  function startSilenceWatch(stream) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyserNodeRef.current = { analyser, src };

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = null;
      hasSpeechRef.current = false;

      function check() {
        if (!analyserNodeRef.current) return;
        analyser.getByteFrequencyData(data);
        const vol = data.reduce((a, b) => a + b, 0) / data.length;

        updateVolumeDom(vol);

        if (vol > 15) {
          hasSpeechRef.current = true;
          silenceStart = null;
        } else if (hasSpeechRef.current) {
          if (!silenceStart) silenceStart = Date.now();
          if (Date.now() - silenceStart > 3000) {
            console.log('[Mic] 3s silence after speech → auto-stop');
            stopListening();
            return;
          }
        }

        animRef.current = requestAnimationFrame(check);
      }
      check();
    } catch (e) {
      console.warn('[Silence]', e);
    }
  }

  function stopSilenceWatch() {
    cancelAnimationFrame(animRef.current);
    if (analyserNodeRef.current?.src) {
      try { analyserNodeRef.current.src.disconnect(); } catch (e) {}
      analyserNodeRef.current = null;
    }
    setVolume(0);
  }

  // ─────────── START LISTENING (MIC) ───────────
  async function startListening() {
    setMicError('');
    stopSpeaking();

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(lang === 'en' ? 'Mic not supported. Use HTTPS or localhost.' : 'Mic support nahi hai. HTTPS ya localhost use karein.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
    } catch (err) {
      console.error('[Mic] Error:', err.name, err.message);
      if (err.name === 'NotAllowedError') {
        setMicError(lang === 'en' ? 'Mic blocked. Allow in browser settings.' : 'Mic blocked hai. Browser settings mein allow karein.');
      } else if (err.name === 'NotFoundError') {
        setMicError(lang === 'en' ? 'No mic found. Connect a microphone.' : 'Koi mic nahi mila. Microphone connect karein.');
      } else {
        setMicError('Mic error: ' + err.message);
      }
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setMicError('Recording not supported.');
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    chunksRef.current = [];
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopSilenceWatch();
        setIsListening(false);
        setRecordingTime(0);
        setVolume(0);
        clearInterval(recordingTimerRef.current);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size < 500) {
          return;
        }

        setIsProcessing(true);
        try {
          const transcript = await transcribeAudio(blob);
          setIsProcessing(false);

          if (transcript && transcript.trim().length > 1) {
            const userMsg = { role: 'user', text: transcript.trim(), time: new Date() };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            setLoading(true);

            const currentLang = langRef.current;
            const { reply, order } = await sendMessage(transcript.trim(), currentLang);
            const replyText = reply || (currentLang === 'en' ? 'Sorry, something went wrong.' : currentLang === 'ar' ? 'عذراً، حدث خطأ.' : 'Maaf, kuch masla ho gaya.');
            setMessages(prev => {
              const newMsgs = [...prev, { role: 'bot', text: replyText, order, showQuickReplies: true, time: new Date() }];
              // Speak reply but do NOT auto-listen — user taps mic again when ready
              speak(replyText, false, newMsgs.length - 1);
              return newMsgs;
            });
            setLoading(false);
          }
        } catch (err) {
          console.error('[Process] Error:', err);
          setIsProcessing(false);
        }
      };

      recorder.onerror = () => {
        setIsListening(false);
        setRecordingTime(0);
        setVolume(0);
        clearInterval(recordingTimerRef.current);
        stopSilenceWatch();
        setMicError('Recording error. Try again.');
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsListening(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
          stopListening();
        }
      }, 30000);

      startSilenceWatch(stream);
    } catch (err) {
      console.error('[Rec] Start error:', err);
      setMicError('Could not start recording.');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }

  // ─────────── STOP LISTENING ───────────
  function stopListening() {
    stopSilenceWatch();
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    setVolume(0);
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      try { recorderRef.current.stop(); } catch (e) {}
    } else {
      setIsListening(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }

  // ─────────── SEND TEXT ───────────
  async function handleSend(overrideText) {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text, time: new Date() }]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const { reply, order } = await sendMessage(text, lang);
      setMessages(prev => {
        const newMsgs = [...prev, { role: 'bot', text: reply, order, showQuickReplies: true, time: new Date() }];
        // Don't auto-speak text replies — user can tap the speaker icon to hear it
        return newMsgs;
      });
      setLoading(false);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, error occurred.', showQuickReplies: true, time: new Date() }]);
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleReset() {
    stopSpeaking();
    stopListening();
    resetChat();
    setMessages([{ role: 'bot', text: currentWelcome, showQuickReplies: true, time: new Date() }]);
  }

  function handleLangChange(code) {
    setLang(code);
    setShowLangPicker(false);
    stopSpeaking();
    stopListening();
    resetChat();
    const welcome = WELCOME_MSG[code] || WELCOME_MSG['ur'];
    setMessages([{ role: 'bot', text: welcome, showQuickReplies: true, time: new Date() }]);
    setTimeout(() => speak(welcome, false, 0), 300);
  }

  function toggleMic() {
    try { const c = getAudioCtx(); if (c?.state === 'suspended') c.resume(); } catch (e) {}
    if (isListening) stopListening();
    else startListening();
  }

  const statusKey = micError ? 'micError' :
    isProcessing ? 'processing' :
    isListening ? 'listening' :
    isSpeaking ? 'speaking' : 'online';

  const statusText = statusKey === 'listening'
    ? `${st.listening} ${recordingTime}s`
    : st[statusKey];

  const statusClass = 'cb-status' + (
    micError ? ' st-error' :
    isProcessing ? ' st-processing' :
    isListening ? ' st-listening' :
    isSpeaking ? ' st-speaking' : ' st-online'
  );

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="cb-container">
      {isOpen && (
        <div className={`cb-window ${isRtl ? 'rtl' : ''}`}>
          {/* ── Header ── */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-avatar-wrap">
                <div className="cb-avatar">S</div>
                <span className={`cb-dot ${statusKey}`} />
              </div>
              <div>
                <strong className="cb-name">Sofia</strong>
                <span className={statusClass}>
                  <span className="cb-status-dot" />
                  {statusText}
                </span>
              </div>
            </div>
            <div className="cb-header-actions">
              <div className="cb-lang-wrap">
                <button onClick={() => setShowLangPicker(!showLangPicker)}
                  className="cb-hdr-btn" title="Language">
                  {currentLang?.flag || '🌐'}
                </button>
                {showLangPicker && (
                  <div className="cb-lang-dd">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        className={`cb-lang-opt ${lang === l.code ? 'active' : ''}`}
                        onClick={() => handleLangChange(l.code)}
                      >
                        <span>{l.flag}</span> {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setVoiceEnabled(v => { if (v) stopSpeaking(); return !v; }); }}
                className="cb-hdr-btn" title={voiceEnabled ? 'Mute' : 'Unmute'}>
                {voiceEnabled ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                )}
              </button>
              <button onClick={handleReset} className="cb-hdr-btn" title="Reset">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={() => { setIsOpen(false); stopSpeaking(); stopListening(); setShowLangPicker(false); }} className="cb-close-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="cb-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cb-msg cb-msg-${msg.role} ${speakingMsgIndex === i ? 'cb-msg-speaking' : ''}`}
                style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                {msg.role === 'bot' && (
                  <div className="cb-msg-avatar">S</div>
                )}
                <div className="cb-msg-content">
                  <div className="cb-bubble">
                    {msg.text}
                    {msg.role === 'bot' && i > 0 && (
                      <button className="cb-replay" onClick={() => speak(msg.text, false, i)} title="Replay">
                        <SpeakerIcon />
                      </button>
                    )}
                    {speakingMsgIndex === i && (
                      <span className="cb-speaking-indicator">
                        <span /><span /><span />
                      </span>
                    )}
                  </div>
                  {msg.order && (
                    <div className="cb-order-card">
                      <div className="cb-order-header">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span className="cb-order-id">{msg.order.id}</span>
                        <span className="cb-order-badge">Confirmed</span>
                      </div>
                      <div className="cb-order-items">
                        {msg.order.items.map((item, j) => (
                          <div key={j} className="cb-order-item">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{item.price * item.quantity} PKR</span>
                          </div>
                        ))}
                      </div>
                      <div className="cb-order-total">
                        <span>Total</span>
                        <span>{msg.order.total} PKR</span>
                      </div>
                    </div>
                  )}
                  <span className="cb-time">{formatTime(msg.time)}</span>
                  {msg.role === 'bot' && msg.showQuickReplies && i === messages.length - 1 && !loading && (
                    <div className="cb-quick-replies">
                      {currentQuickReplies.map((qr, j) => (
                        <button key={j} className="cb-qr-btn" onClick={() => handleSend(qr.text)}>{qr.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cb-msg cb-msg-bot">
                <div className="cb-msg-avatar">S</div>
                <div className="cb-msg-content">
                  <div className="cb-bubble cb-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Mic Error Bar ── */}
          {micError && (
            <div className="cb-error-bar">
              <p>{micError}</p>
              <button onClick={() => { setMicError(''); startListening(); }}>Retry</button>
            </div>
          )}

          {/* ── Voice Mode Overlay ── */}
          {(isListening || isProcessing) && (
            <div className="cb-voice-overlay">
              <div className="cb-voice-orb" ref={orbRef} style={{ '--vol': volume }}>
                <div className="cb-orb-ring cb-orb-ring-1" />
                <div className="cb-orb-ring cb-orb-ring-2" />
                <div className="cb-orb-ring cb-orb-ring-3" />
                <div className="cb-orb-core">
                  {isProcessing ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/></circle></svg>
                  ) : (
                    <MicIcon />
                  )}
                </div>
              </div>

              {/* Live waveform bars */}
              <div className="cb-waveform" ref={barsRef}>
                <span /><span /><span /><span /><span />
              </div>

              <p className="cb-voice-status">
                {isProcessing ? st.processing : st.listening}
              </p>
              {isListening && <p className="cb-voice-timer">{recordingTime}s</p>}

              <button className="cb-voice-stop" onClick={stopListening}>
                <StopIcon />
                <span>{lang === 'en' ? 'Stop' : lang === 'ar' ? 'إيقاف' : 'Rokein'}</span>
              </button>
            </div>
          )}

          {/* ── Input Bar ── */}
          <div className="cb-input-bar">
            <div className="cb-mic-wrap" ref={micRingRef} style={{ '--vol': volume }}>
              <button
                onClick={toggleMic}
                className={`cb-mic ${isListening ? 'active' : ''}`}
                title={isListening ? 'Stop recording' : 'Start mic'}
                disabled={loading || isProcessing}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </button>
            </div>
            <input
              type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? st.listening : (lang === 'en' ? 'Type or tap mic...' : lang === 'ar' ? 'اكتب أو اضغط المايك...' : 'Type karein ya mic dabayein...')}
              disabled={loading || isListening || isProcessing}
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim() || isListening} className="cb-send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button className={`cb-fab ${isOpen ? 'cb-fab-open' : ''}`} onClick={() => {
        try { const c = getAudioCtx(); if (c?.state === 'suspended') c.resume(); } catch (e) {}
        const wasOpen = isOpen;
        setIsOpen(!isOpen);
        setShowLangPicker(false);
        if (wasOpen) { stopSpeaking(); stopListening(); }
        else { setTimeout(() => speak(currentWelcome, false, 0), 600); }
      }}>
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>
    </div>
  );
}
