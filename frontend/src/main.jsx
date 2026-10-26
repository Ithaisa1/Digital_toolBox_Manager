/**
 * Punto de entrada de la aplicación React.
 * Monta el árbol de componentes con i18n y modo estricto.
 */
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import '@fontsource-variable/inter'
import App from './App.jsx'
import './index.css'
import './styles/responsive.css'
// Diseño Aurora: va el último para dar el estilo común a toda la app
import './styles/aurora.css'
import i18n from './i18n/i18n.js'
// Escuchar desde el principio el aviso de "app instalable" del navegador
import './hooks/useInstallPrompt'

// Suspense evita parpadeos mientras cargan las traducciones
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div>Loading translations...</div>}>
        <App />
      </Suspense>
    </I18nextProvider>
  </React.StrictMode>,
)
