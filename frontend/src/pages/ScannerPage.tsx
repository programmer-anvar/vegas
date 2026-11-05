import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/pure';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'code_128', 'qr_code'] as const;

type Scan = { code: string; format: string };

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState('Tayyor');
  const [scans, setScans] = useState<Scan[]>([]);

  const releaseCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const start = async () => {
    releaseCamera();
    const video = videoRef.current;
    if (!video) return;

    try {
      setStatus('Kamera ochilmoqda...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({ formats: [...FORMATS] });
      let busy = false;
      setStatus('Shtrix-kodni kameraga yaqinlashtiring');

      timerRef.current = setInterval(async () => {
        if (busy || video.readyState < 2) return;
        busy = true;
        try {
          const [found] = await detector.detect(video);
          if (found) {
            setScans((prev) =>
              prev[0]?.code === found.rawValue
                ? prev
                : [{ code: found.rawValue, format: found.format }, ...prev].slice(0, 10)
            );
            navigator.vibrate?.(100);
          }
        } finally {
          busy = false;
        }
      }, 250);
    } catch (err) {
      setStatus(`Xato: ${err instanceof Error ? err.name : 'nomalum'}`);
    }
  };

  const stop = () => {
    releaseCamera();
    setStatus('Toxtatildi');
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h2>Skaner sinovi</h2>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ width: '100%', background: '#000', borderRadius: 8 }}
      />
      <p>{status}</p>
      <button onClick={start}>Kamerani yoqish</button> <button onClick={stop}>Stop</button>
      <ol>
        {scans.map((s, i) => (
          <li key={`${s.code}-${i}`}>
            {s.format}: <b>{s.code}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}