/**
 * Punto de entrada de la aplicación React.
 * Monta el árbol de componentes con i18n y modo estricto.
 */
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import App from './App.jsx'
import './index.css'
import './styles/responsive.css'
import i18n from './i18n/i18n.js'

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
