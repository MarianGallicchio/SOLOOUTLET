/**
 * Banner de consentimiento de cookies — solooutlet.
 * Ley 25.326 (AR) / GDPR: banner no bloqueante, panel "Personalizar",
 * "Mis cookies" (tabla + borrar + exportar JSON) y política.
 * Accesible: role=dialog, aria-modal, foco visible, cierre con Escape.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cookie, X, ShieldCheck, SlidersHorizontal, BarChart3, Megaphone,
  Trash2, Download, Check, ChevronDown, ExternalLink,
} from 'lucide-react';
import {
  cookiesEnabled, getConsent, saveConsent, deleteAllOwnCookies, exportCookiesJson,
  COOKIE_CATALOG, getAllCookieNames, getCookie, deleteCookie,
  type CookieCategory,
} from '../utils/cookies';

const CATEGORY_META: Record<CookieCategory, { label: string; desc: string; icon: React.ReactNode; always?: boolean }> = {
  necessary: {
    label: 'Necesarias',
    desc: 'Imprescindibles para que el sitio funcione: consentimiento y carrito. Siempre activas.',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    always: true,
  },
  preferences: {
    label: 'Preferencias',
    desc: 'Recordar sesión ("Recordarme"), vistos recientes, filtros del catálogo y cupones.',
    icon: <SlidersHorizontal className="w-4 h-4 text-blue-600" />,
  },
  analytics: {
    label: 'Analíticas',
    desc: 'Origen de tu visita (parámetros utm_) para medir campañas. Datos anónimos.',
    icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
  },
  marketing: {
    label: 'Marketing',
    desc: 'Pop-up de ofertas: si lo cerrás, no reaparece por 7 días (solo si aceptás esta categoría).',
    icon: <Megaphone className="w-4 h-4 text-orange-600" />,
  },
};

type View = 'banner' | 'customize' | 'my-cookies' | 'policy';

export const CookieConsent: React.FC = () => {
  const [view, setView] = useState<View | null>(null);
  const [prefs, setPrefs] = useState({ preferences: true, analytics: true, marketing: false });
  const [expanded, setExpanded] = useState(false);
  const [cookiesOff, setCookiesOff] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Al montar: decidir si mostrar banner; leer consent previo en prefs
  useEffect(() => {
    if (!cookiesEnabled()) {
      setCookiesOff(true);
      return;
    }
    const existing = getConsent();
    if (existing) {
      setPrefs({ preferences: existing.preferences, analytics: existing.analytics, marketing: existing.marketing });
    } else {
      const t = setTimeout(() => setView('banner'), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Reabrir desde el footer
  useEffect(() => {
    const open = () => setView('customize');
    window.addEventListener('solooutlet:open-cookie-settings', open);
    return () => window.removeEventListener('solooutlet:open-cookie-settings', open);
  }, []);

  // Escape cierra (excepto el banner inicial)
  useEffect(() => {
    if (!view || view === 'banner') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setView(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view]);

  const decide = useCallback((all: { preferences: boolean; analytics: boolean; marketing: boolean }) => {
    saveConsent(all);
    setPrefs(all);
    setView(null);
    window.dispatchEvent(new Event('solooutlet:cookie-consent-updated'));
  }, []);

  if (cookiesOff) {
    return (
      <div className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:w-80 z-[80] rounded-2xl bg-amber-50 border border-amber-300 shadow-xl p-4" role="alert">
        <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">⚠️ Cookies deshabilitadas</p>
        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
          Tu navegador bloquea cookies: tu carrito, sesión y favoritos no van a sobrevivir al cierre de la pestaña. Habilitalas para una experiencia completa.
        </p>
        <button onClick={() => setCookiesOff(false)} className="mt-2 text-[11px] font-bold text-amber-900 underline cursor-pointer">
          Entendido
        </button>
      </div>
    );
  }

  if (!view) return null;

  const presentNames = getAllCookieNames();

  return (
    <>
      {view === 'banner' && <div className="fixed inset-0 z-[79] bg-slate-950/20" aria-hidden="true" onClick={() => setView(null)} />}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={view === 'banner'}
        aria-label="Configuración de cookies"
        tabIndex={-1}
        className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:w-[26rem] z-[80] outline-none"
      >
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Cookie className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-slate-900 font-display truncate">
                  {view === 'banner' && 'Tu privacidad, primero'}
                  {view === 'customize' && 'Personalizar cookies'}
                  {view === 'my-cookies' && 'Mis cookies'}
                  {view === 'policy' && 'Política de cookies'}
                </h2>
                <p className="text-[10px] text-slate-400">Ley 25.326 (AR) · GDPR</p>
              </div>
            </div>
            <button
              onClick={() => setView(null)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 text-xs">
            {/* ── BANNER ── */}
            {view === 'banner' && (
              <div className="space-y-3.5">
                <p className="text-slate-600 leading-relaxed">
                  Usamos cookies para que tu <strong className="text-slate-800">carrito y sesión sobrevivan</strong> al cierre del
                  navegador, y para mejorar tu experiencia. Elegí qué aceptás: nunca guardamos datos sensibles y podés
                  cambiarlo cuando quieras desde el pie de página.
                </p>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-expanded={expanded}
                >
                  Ver categorías <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="space-y-2">
                    {(Object.keys(CATEGORY_META) as CookieCategory[]).map((cat) => (
                      <div key={cat} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        {CATEGORY_META[cat].icon}
                        <div>
                          <span className="font-bold text-slate-800">{CATEGORY_META[cat].label}</span>
                          {CATEGORY_META[cat].always && <span className="ml-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded">SIEMPRE</span>}
                          <p className="text-[10px] text-slate-500 leading-snug">{CATEGORY_META[cat].desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => decide({ preferences: true, analytics: true, marketing: true })}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Aceptar todas
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => decide({ preferences: false, analytics: false, marketing: false })}
                      className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Rechazar no esenciales
                    </button>
                    <button
                      onClick={() => setView('customize')}
                      className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Personalizar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PERSONALIZAR ── */}
            {view === 'customize' && (
              <div className="space-y-3">
                {(Object.keys(CATEGORY_META) as CookieCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = meta.always ? true : prefs[cat as 'preferences' | 'analytics' | 'marketing'];
                  return (
                    <div key={cat} className="rounded-2xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {meta.icon}
                          <span className="font-bold text-slate-900">{meta.label}</span>
                          {meta.always && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                              Siempre activas
                            </span>
                          )}
                        </div>
                        {!meta.always && (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            aria-label={`Cookies ${meta.label}`}
                            onClick={() => setPrefs((p) => ({ ...p, [cat]: !p[cat as 'preferences' | 'analytics' | 'marketing'] }))}
                            className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${active ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{meta.desc}</p>
                    </div>
                  );
                })}
                <button
                  onClick={() => decide(prefs)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar mi elección
                </button>
              </div>
            )}

            {/* ── MIS COOKIES ── */}
            {view === 'my-cookies' && (
              <div className="space-y-3">
                <p className="text-slate-500 leading-relaxed">
                  Cookies de solooutlet en este navegador. Podés borrarlas una por una o todas; tu consentimiento se mantiene.
                </p>
                <div className="space-y-2">
                  {COOKIE_CATALOG.map((c) => {
                    const present = presentNames.includes(c.name);
                    const meta = CATEGORY_META[c.category];
                    return (
                      <div key={c.name} className={`rounded-xl border p-3 ${present ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60 opacity-70'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <code className="text-[11px] font-bold text-blue-700">{c.name}</code>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{meta.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.purpose}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Expira en {c.maxAgeDays >= 365 ? '12 meses' : `${c.maxAgeDays} días`} · {present ? 'activa ahora' : 'no presente'}
                            </p>
                          </div>
                          {present && c.category !== 'necessary' && (
                            <button
                              onClick={() => { deleteCookie(c.name); setView('my-cookies'); }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-400"
                              aria-label={`Borrar cookie ${c.name}`}
                              title={`Borrar ${c.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const blob = new Blob([exportCookiesJson()], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'solooutlet-mis-datos.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Exportar mis datos
                  </button>
                  <button
                    onClick={() => { deleteAllOwnCookies(); setView('my-cookies'); }}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Borrar todas
                  </button>
                </div>
              </div>
            )}

            {/* ── POLÍTICA ── */}
            {view === 'policy' && (
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-slate-900">Política de Cookies — solooutlet.</strong> Este aviso complementa los Términos
                  y Condiciones y respeta la <strong className="text-slate-900">Ley 25.326 de Protección de Datos Personales</strong> (Argentina)
                  y el <strong className="text-slate-900">Reglamento General de Protección de Datos (GDPR)</strong> de la UE.
                </p>
                <div>
                  <p className="font-bold text-slate-900">¿Qué son?</p>
                  <p>Pequeños archivos que este sitio guarda en tu navegador para recordar tus decisiones (carrito, sesión, preferencias). No contienen virus ni datos sensibles, y solo vos podés leerlas desde este equipo.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Consentimiento</p>
                  <p>Las cookies necesarias se usan por interés legítimo (funcionamiento del carrito y del consentimiento mismo). Las demás se activan solo con tu consentimiento, que podés otorgar, limitar por categoría o revocar cuando quieras desde "Personalizar" o el enlace del pie de página. Al revocar una categoría, sus cookies se borran al instante.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Tus derechos</p>
                  <p>Acceso, rectificación y eliminación: desde "Mis cookies" podés ver cada cookie, borrarlas individualmente, borrarlas todas o exportar tus datos en JSON. Ejercicio de derechos ARCO: privacidad@solooutlet.com.ar.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Terceros</p>
                  <p>Los pagos se procesan con Mercado Pago: su propia política de cookies aplica en su dominio. No usamos cookies publicitarias de terceros.</p>
                </div>
                <button onClick={() => setView('customize')} className="text-blue-600 hover:underline font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Configurar mis preferencias →
                </button>
              </div>
            )}
          </div>

          {/* Footer con accesos */}
          {view !== 'banner' && (
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
              {view !== 'customize' && (
                <button onClick={() => setView('customize')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Personalizar
                </button>
              )}
              {view !== 'my-cookies' && (
                <button onClick={() => setView('my-cookies')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Mis cookies
                </button>
              )}
              {view !== 'policy' && (
                <button onClick={() => setView('policy')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Política
                </button>
              )}
              {view === 'customize' && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Check className="w-3 h-3" /> Guardado en cookie_consent
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/** Abre el panel de cookies desde cualquier parte (lo usa el footer). */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event('solooutlet:open-cookie-settings'));
}
