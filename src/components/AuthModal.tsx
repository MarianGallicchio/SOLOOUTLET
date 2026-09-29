import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { CategoryType } from '../types';
import { getRememberedUser, rememberUser } from '../utils/cookies';
import {
  X,
  User,
  Store,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  ArrowRight,
  MessageCircle,
  Building2,
  Phone,
  FileText,
  Clock,
  Sparkles,
  LogIn,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authInitialTab, loginUser, registerBuyer, loginWithGoogle, submitMerchantApplication } = useStore();

  // Google Identity Services: el Client ID lo inyecta el backend/.env vía VITE_GOOGLE_CLIENT_ID.
  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen || !GOOGLE_CLIENT_ID) return;
    const init = () => {
      const g = (window as unknown as { google?: { accounts: { id: { initialize: (o: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } } }).google;
      if (!g || !googleBtnRef.current) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential?: string }) => {
          if (resp.credential) void loginWithGoogle(resp.credential);
        },
      });
      g.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      setGoogleReady(true);
    };
    if ((window as unknown as { google?: unknown }).google) { init(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [isAuthModalOpen, GOOGLE_CLIENT_ID, loginWithGoogle]);

  const [activeTab, setActiveTab] = useState<'buyer' | 'merchant'>(authInitialTab);
  const [buyerMode, setBuyerMode] = useState<'login' | 'register'>('login');
  // Modo de la pestaña vendedor: ingresar (cuenta existente) o solicitar admisión (nuevo comercio)
  const [merchantMode, setMerchantMode] = useState<'login' | 'register'>('login');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [merchantPassword, setMerchantPassword] = useState('');

  // Buyer form state (vacío: sin datos de referencia; "Recordarme" autocompleta el email)
  const [buyerEmail, setBuyerEmail] = useState(() => getRememberedUser()?.email || '');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerError, setBuyerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedUser());

  // Merchant contact form state
  const [merchantForm, setMerchantForm] = useState({
    storeName: '',
    contactPerson: '',
    cuit: '',
    category: 'Tecnología' as CategoryType,
    estimatedStockVolume: '50 a 200 unidades / mes',
    city: 'Buenos Aires',
    email: '',
    whatsapp: '',
  });

  if (!isAuthModalOpen) return null;

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyerError(null);
    if (!buyerEmail.trim()) { setBuyerError('Ingresá tu email.'); return; }
    if (buyerPassword.length < 6) { setBuyerError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (buyerMode === 'register') {
      if (!buyerName.trim()) { setBuyerError('Ingresá tu nombre y apellido.'); return; }
      const ok = await registerBuyer({ fullName: buyerName.trim(), email: buyerEmail.trim(), password: buyerPassword });
      if (!ok) setBuyerError('No pudimos crear la cuenta: revisá el mensaje arriba o probá con otro email.');
    } else {
      const user = await loginUser(buyerEmail.trim(), undefined, buyerPassword);
      if (!user) {
        setBuyerError('Email o contraseña incorrectos. Si no tenés cuenta, creala abajo.');
      } else if (rememberMe) {
        // "Recordarme": cookie de preferencias con token aleatorio (30 días)
        rememberUser(user.email);
      }
    }
  };

  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantForm.storeName || !merchantForm.whatsapp) return;
    if (merchantPassword.length < 6) {
      setSellerError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSellerError(null);
    await submitMerchantApplication(merchantForm, merchantPassword);
  };

  /** Login directo de un vendedor ya registrado (role merchant_approved + storeName). */
  const handleSellerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerError(null);
    if (sellerPassword.length < 6) {
      setSellerError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const user = await loginUser(sellerEmail.trim(), undefined, sellerPassword);
    if (!user) {
      setSellerError('Email o contraseña incorrectos. ¿Tu comercio aún no se registró? Usá "Registrar mi comercio".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAuthModalOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-4 border border-slate-200">
        
        {/* Header with Close */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 font-display">
              Acceso a solo<span className="text-blue-600">outlet</span>
            </span>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Compradores vs Vendedores */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'buyer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>Soy Comprador</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merchant')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'merchant'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Soy Comercio / Vendedor</span>
          </button>
        </div>

        {/* Tab 1: Compradores */}
        {activeTab === 'buyer' ? (
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="text-center max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {buyerMode === 'login' ? 'Iniciar sesión como comprador' : 'Crear cuenta de comprador'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Guardá tus productos favoritos, seguí tus envíos en tiempo real y acelerá tu checkout.
              </p>
            </div>

            {/* Google Sign-In: solo se muestra si hay Client ID configurado (login real) */}
            {GOOGLE_CLIENT_ID && (
              <>
                <div className="w-full flex justify-center" ref={googleBtnRef} />
                {!googleReady && (
                  <p className="text-[11px] text-slate-400 text-center">Cargando Google Sign-In…</p>
                )}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider">
                    o con correo electrónico
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleBuyerSubmit} className="space-y-3.5">
              {buyerMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre y Apellido</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={buyerPassword}
                    onChange={(e) => setBuyerPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 pr-16 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    {showPassword ? 'OCULTAR' : 'VER'}
                  </button>
                </div>
              </div>

              {buyerError && (
                <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{buyerError}</p>
              )}

              {buyerMode === 'login' && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  Recordarme en este dispositivo (30 días)
                </label>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer mt-2"
              >
                <span>{buyerMode === 'login' ? 'Iniciar Sesión' : 'Crear mi cuenta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setBuyerMode(buyerMode === 'login' ? 'register' : 'login'); setBuyerError(null); }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {buyerMode === 'login'
                    ? '¿No tenés cuenta todavía? Registrate gratis'
                    : '¿Ya tenés cuenta? Iniciar sesión'}
                </button>
              </div>
            </form>

          </div>
        ) : (
          /* Tab 2: Vendedores — ingresar con cuenta existente o solicitar admisión */
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* Sub-tabs: Ingresar / Registrar comercio */}
            <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMerchantMode('login'); setSellerError(null); }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  merchantMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ya tengo cuenta</span>
              </button>
              <button
                type="button"
                onClick={() => { setMerchantMode('register'); setSellerError(null); }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  merchantMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Registrar mi comercio</span>
              </button>
            </div>

            {merchantMode === 'login' ? (
              /* ── Ingreso directo de vendedor registrado ── */
              <form onSubmit={handleSellerLogin} className="space-y-3.5 max-w-sm mx-auto">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 font-display">Ingresar a Mi Tienda</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Panel de vendedor: pedidos, stock, empleados, publicidad y liquidaciones.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email de la empresa</label>
                  <input
                    type="email"
                    required
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="ventas@tucomercio.com.ar"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    placeholder="Dejar vacío si tu cuenta no tiene clave"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                {sellerError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{sellerError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al panel vendedor</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  ¿Comercio nuevo? Usá la pestaña <strong>Registrar mi comercio</strong>.
                </p>
              </form>
            ) : (
            /* ── Solicitud de admisión (nuevo comercio) ── */
            <>

            {/* Strict Notice: Sellers must contact us first */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Admisión Exclusiva para Comercios Verificados</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                La cuenta vendedora es <strong>separada de la de comprador</strong> y se crea al instante con el email de tu comercio: después podés ingresar siempre desde <strong>“Ya tengo cuenta”</strong> con tu email y contraseña.
              </p>
            </div>

            {/* Direct Contact Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://wa.me/5491155904420?text=Hola,%20tengo%20un%20comercio%20y%20quiero%20liquidar%20stock%20en%20solooutlet"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Comercial (+54 11)</span>
              </a>

              <a
                href="mailto:comercios@solooutlet.com.ar?subject=Solicitud%20de%20Admisi%C3%B3n%20Comercio%20solooutlet"
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>comercios@solooutlet.com.ar</span>
              </a>
            </div>

            {/* Application Form */}
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Formulario de Solicitud de Admisión de Comercio</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-4">
                Completá los datos de tu empresa y tu tienda queda activa en el acto.
              </p>

              <form onSubmit={handleMerchantSubmit} className="space-y-3 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Razón Social / Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Electro Plaza S.R.L."
                      value={merchantForm.storeName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, storeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      CUIT (con o sin guiones) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="30-71289412-4"
                      value={merchantForm.cuit}
                      onChange={(e) => setMerchantForm({ ...merchantForm, cuit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Persona de Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Laura Martínez (Gerente de Logística)"
                      value={merchantForm.contactPerson}
                      onChange={(e) => setMerchantForm({ ...merchantForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      WhatsApp Comercial *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="11 6592-8110"
                      value={merchantForm.whatsapp}
                      onChange={(e) => setMerchantForm({ ...merchantForm, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Rubro Principal *
                    </label>
                    <select
                      value={merchantForm.category}
                      onChange={(e) => setMerchantForm({ ...merchantForm, category: e.target.value as CategoryType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="Tecnología">Tecnología & Computación</option>
                      <option value="Electrodomésticos">Electrodomésticos</option>
                      <option value="Hogar">Hogar & Muebles</option>
                      <option value="Indumentaria">Indumentaria & Calzado</option>
                      <option value="Deportes">Deportes & Fitness</option>
                      <option value="Otros">Otros rubros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Volumen de stock a liquidar *
                    </label>
                    <select
                      value={merchantForm.estimatedStockVolume}
                      onChange={(e) => setMerchantForm({ ...merchantForm, estimatedStockVolume: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="10 a 50 unidades / mes">10 a 50 unidades / mes</option>
                      <option value="50 a 200 unidades / mes">50 a 200 unidades / mes</option>
                      <option value="+200 unidades / mes">+200 unidades / mes (Mayorista)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Email de la empresa *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ventas@tucomercio.com.ar"
                    value={merchantForm.email}
                    onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Contraseña para el panel vendedor *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres — la vas a usar en 'Ya tengo cuenta'"
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer mt-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Enviar solicitud de contacto comercial</span>
                </button>

              </form>
            </div>
            </>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
