'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Voice search hook — simple permission handling.
 * Starts SpeechRecognition directly. If mic is blocked, the API itself
 * will report 'not-allowed' error — we show the blocked UI then.
 * No pre-checking that can give false negatives.
 */

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useVoiceSearch({ lang = 'hi-IN' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasTranscript, setHasTranscript] = useState(false);
  const [error, setError] = useState(null);
  const [micPermission, setMicPermission] = useState('idle'); // idle | granted | denied
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const isSupported = !!SpeechRecognition;
  // Chrome blocks mic on HTTP (insecure origins) even with permission ON
  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || location.protocol === 'https:');

  const createRecognition = useCallback(() => {
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (final) {
        finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim();
        setTranscript(finalTranscriptRef.current);
        setHasTranscript(true);
        resetSilenceTimer();
      }

      setInterimTranscript(interim);
      if (interim) resetSilenceTimer();
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setError(null);
      } else if (event.error === 'not-allowed') {
        setMicPermission('denied');
        if (!isSecureContext) {
          setError('HTTP pe mic kaam nahi karta. Chrome flag enable karein ya HTTPS use karein.');
        } else {
          setError('Mic access denied hai. Browser settings mein jaake enable karein.');
        }
      } else {
        setError(event.error);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      if (recognitionRef.current?._manualStop) {
        setIsListening(false);
        recognitionRef.current._manualStop = false;
      } else {
        setIsListening(false);
      }
    };

    return rec;
  }, [lang]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      }
      setIsListening(false);
    }, 10000);
  }, []);

  /**
   * Start listening — NO pre-permission check.
   * SpeechRecognition API will trigger browser permission dialog if needed.
   * If mic is blocked, onerror fires with 'not-allowed'.
   */
  const startListening = useCallback(async () => {
    if (!isSupported) return;

    // Abort any existing session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    setError(null);
    setInterimTranscript('');
    finalTranscriptRef.current = '';

    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;

    try {
      rec.start();
      // If start() succeeds, mic is available
      setIsListening(true);
      setMicPermission('granted');
      resetSilenceTimer();
    } catch (err) {
      setMicPermission('denied');
      if (err.name === 'NotAllowedError' || err.message?.includes('not-allowed')) {
        if (!isSecureContext) {
          setError('HTTP pe mic kaam nahi karta. Chrome flag enable karein ya HTTPS use karein.');
        } else {
          setError('Mic access denied hai. Browser settings mein jaake enable karein.');
        }
      } else if (err.name === 'NotSupportedError') {
        setError('Browser mic support nahi karta. Chrome ya Edge use karein.');
      } else {
        setError('Mic start nahi ho paya. Please try again.');
      }
      setIsListening(false);
    }
  }, [isSupported, createRecognition, resetSilenceTimer]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current._manualStop = true;        try { recognitionRef.current.stop(); } catch { /* already stopped */ }

    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setHasTranscript(false);
    finalTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* already aborted */ }
      }
    };
  }, []);

  return {
    isSupported,
    isSecureContext,
    isListening,
    transcript,
    interimTranscript,
    hasTranscript,
    error,
    micPermission,  // 'idle' | 'granted' | 'denied'
    startListening,
    stopListening,
    clearTranscript,
  };
}
