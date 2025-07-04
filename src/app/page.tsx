'use client';

import { LoadingOutlined, WarningOutlined } from '@ant-design/icons';
import styles from './page.module.css';
import { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { preloadImage } from '@/utils';

export default function Home() {
  const lastPhotoTaken = useRef<Date | null>(null);
  const rotation = useRef<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const justTookPhoto =
        lastPhotoTaken.current &&
        new Date().getTime() - lastPhotoTaken.current.getTime() < 10000;

      if (justTookPhoto) {
        return;
      }

      if (rotation.current.length) {
        const last = rotation.current.length - 1;
        const nextRotation = rotation.current.slice(0, -1);
        nextRotation.unshift(rotation.current[last]);

        const nextPhoto = nextRotation[last];
        await preloadImage(nextPhoto);

        rotation.current = nextRotation;
        setPhoto(nextPhoto);
      }

      try {
        const response = await fetch('/api/heartbeat', { method: 'POST' });

        if (response.status === 502) {
          setError('Camera Disconnected');

          return;
        }

        if (response.status !== 204) {
          setError(`Unexpected Heartbeat Response: ${response.status}`);

          return;
        }
      } catch (e) {
        console.error(e);
        setError('Unknown Heartbeat Error');

        return;
      }

      setError(null);
    }, 3000);

    (async () => {
      const response = await fetch('/api/photos');
      const data = await response.json();

      rotation.current = data.photos;
    })();

    return () => clearInterval(interval);
  }, []);

  const handleUserKeyPress = useCallback((event: KeyboardEvent) => {
    const { code } = event;

    if (code === 'Enter' || code === 'Space') {
      setCountdown((previousCountdown) => {
        if (previousCountdown === 0) {
          return previousCountdown;
        }

        return 3;
      });
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
      setError(null);
      lastPhotoTaken.current = new Date();

      (async () => {
        try {
          const response = await fetch('/api/photo', { method: 'POST' });

          if (response.status !== 201) {
            throw new Error('Unexpected photo response');
          }

          const data = await response.json();

          await preloadImage(data.url);
          rotation.current.push(data.url);
          setPhoto(data.url);
        } catch (e) {
          console.error(e);
          setError('Could Not Take Photo 😢');
        } finally {
          setCountdown(null);
        }
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
        animation: countdown === 0 ? `${styles.shutter} 2s ease-in` : undefined,
        backgroundImage:
          countdown === null && photo ? `url(${photo})` : undefined,
      }}
    >
      {error && (
        <div className={styles.error}>
          <WarningOutlined /> {error}
        </div>
      )}

      {countdown === 0 && <LoadingOutlined />}

      {countdown === null ? (
        'Press Enter!'
      ) : countdown !== 0 ? (
        <Fragment>
          <div className={styles.countdownText}>Look at the camera! 😉</div>
          <div className={styles.countdownNumber}>{countdown}</div>
        </Fragment>
      ) : undefined}
    </main>
  );
}
