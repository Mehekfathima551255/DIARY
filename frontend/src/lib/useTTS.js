import { useState, useEffect, useCallback } from 'react';

export function useTTS() {
    const [speakingId, setSpeakingId] = useState(null);

    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = useCallback((text, id) => {
        if (!('speechSynthesis' in window)) return;
        
        // If clicking the currently speaking item, stop it.
        if (speakingId === id) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => {
            setSpeakingId(null);
        };
        
        utterance.onerror = () => {
            setSpeakingId(null);
        };

        setSpeakingId(id);
        window.speechSynthesis.speak(utterance);
    }, [speakingId]);

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
        }
    }, []);

    return { speak, stop, speakingId };
}
