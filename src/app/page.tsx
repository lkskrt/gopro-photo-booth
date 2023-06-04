'use client';

import styles from './page.module.css';
import { useState, useCallback, useEffect } from 'react';

export default function Home() {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleUserKeyPress = useCallback((event: KeyboardEvent) => {
    const { code } = event;

    if (code === 'Enter' || code === 'Space') {
      setCountdown(3);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleUserKeyPress);
    return () => {
      window.removeEventListener('keydown', handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown === 0) {
      (async () => {
        const response = await fetch('/api', { method: 'POST' });
        const data = await response.json();

        setPhotoUrl(data.url);
        setCountdown(null);
      })();

      return;
    }

    const timeout = setTimeout(() => {
      setCountdown((prevCountDown) =>
        prevCountDown !== null ? prevCountDown - 1 : null,
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, [countdown]);

  return (
    <main
      className={styles.main}
      style={{
        backgroundColor: countdown === 0 ? 'white' : undefined,
        backgroundImage: countdown === null ? `url(${photoUrl})` : undefined,
      }}
    >
      {countdown === null ? 'Press Enter!' : countdown}
    </main>
  );
}
