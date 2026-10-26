/**
 * Estado de instalación de la app (PWA).
 * El navegador avisa una sola vez de que la app se puede instalar (beforeinstallprompt),
 * a veces antes de que React monte la barra: por eso se escucha al cargar este módulo.
 */
import { useEffect, useState } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // mostramos nuestro propio botón
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

/** iPhone/iPad (Safari no tiene botón de instalar: hay que usar "Compartir"). */
const detectIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOS;
};

export const useInstallPrompt = () => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const installed = isStandalone();
  const isIOS = detectIOS();

  const promptInstall = async () => {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return outcome; // 'accepted' | 'dismissed'
  };

  return {
    canPrompt: Boolean(deferredPrompt) && !installed,
    showIOSHelp: isIOS && !installed,
    installed,
    promptInstall,
  };
};
