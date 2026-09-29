import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {isApiMode} from './data/db';
import './index.css';

/**
 * En producción la app EXIGE backend (VITE_API_URL): sin servidor no hay
 * pagos reales ni roles confiables (localStorage es editable por el usuario).
 * El bloqueo se desactiva con ?demo=1 para maquetar localmente.
 */
const demoOverride = new URLSearchParams(window.location.search).has('demo');
const allowDemo = import.meta.env.DEV || demoOverride;

function BlockedProduction() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui', padding: 24}}>
      <div style={{maxWidth: 520, textAlign: 'center'}}>
        <div style={{fontSize: 40, marginBottom: 12}}>🔒</div>
        <h1 style={{fontSize: 20, fontWeight: 800, marginBottom: 8}}>solooutlet requiere configuración de servidor</h1>
        <p style={{fontSize: 14, lineHeight: 1.6, color: '#94a3b8'}}>
          Esta instalación se está sirviendo sin backend (<code style={{fontFamily: 'monospace'}}>VITE_API_URL</code> sin definir).
          Para operar con pagos reales y roles confiables, desplegá la API (<code style={{fontFamily: 'monospace'}}>npm run server</code> con MySQL)
          y volvé a compilar el frontend con <code style={{fontFamily: 'monospace'}}>VITE_API_URL</code> apuntando a ella.
          Para previsualizar el diseño sin backend agregá <code style={{fontFamily: 'monospace'}}>?demo=1</code> a la URL.
        </p>
      </div>
    </div>
  );
}

const mustBlock = !isApiMode && !allowDemo;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {mustBlock ? <BlockedProduction /> : <App />}
  </StrictMode>,
);
