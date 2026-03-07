// All API calls go through the backend — no API keys in frontend

export async function sendMessage(message, lang = 'ur') {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    // Return { reply, order } — order is null when no order was placed
    return { reply: data.reply, order: data.order || null };
  } catch (error) {
    console.error('[Chat] Error:', error);
    return { reply: 'Sorry, connection problem hai. Dobara try karein.', order: null };
  }
}

export async function transcribeAudio(audioBlob) {
  try {
    // Send raw audio bytes to server
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log('[STT] Sending', arrayBuffer.byteLength, 'bytes to Whisper');

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: arrayBuffer,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[STT] Server error:', err);
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[STT] Whisper result:', data.text);
    return data.text || '';
  } catch (error) {
    console.error('[STT] Transcribe error:', error);
    return '';
  }
}

export async function getTTSAudio(text) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('TTS failed');

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio')) {
      throw new Error('Invalid TTS response: ' + contentType);
    }

    const buffer = await res.arrayBuffer();
    if (!buffer || buffer.byteLength < 100) {
      throw new Error('TTS returned empty audio');
    }
    return buffer;
  } catch (error) {
    console.error('[TTS] Error:', error);
    return null;
  }
}

export async function resetChat() {
  try { await fetch('/api/reset', { method: 'POST' }); } catch (e) {}
}
