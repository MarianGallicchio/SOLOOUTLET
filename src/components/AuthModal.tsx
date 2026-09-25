import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AUTH_PASSWORD_PLACEHOLDER } from '../data/auth';
import { CategoryType } from '../types';
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
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authInitialTab, loginUser, submitMerchantApplication } = useStore();

  const [activeTab, setActiveTab] = useState<'buyer' | 'merchant'>(authInitialTab);
  const [buyerMode, setBuyerMode] = useState<'login' | 'register'>('login');

  // Buyer form state
  const [buyerEmail, setBuyerEmail] = useState('marianoagusting1996@gmail.com');
  const [buyerName, setBuyerName] = useState('Mariano Agustín Gómez');
  const [buyerPassword, setBuyerPassword] = useState('••••••••');

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
    if (!buyerEmail) return;
    const pwd = buyerPassword === AUTH_PASSWORD_PLACEHOLDER ? undefined : buyerPassword;
    await loginUser(buyerEmail, buyerName, pwd);
  };

  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantForm.storeName || !merchantForm.whatsapp) return;
    await submitMerchantApplication(merchantForm);
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

            {/* Quick 1-click button simulation */}
            <button
              type="button"
              onClick={() => loginUser('marianoagusting1996@gmail.com', 'Mariano Agustín Gómez')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con cuenta de Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider">
                o con correo electrónico
              </span>
            </div>

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
                <input
                  type="password"
                  required
                  value={buyerPassword}
                  onChange={(e) => setBuyerPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

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
                  onClick={() => setBuyerMode(buyerMode === 'login' ? 'register' : 'login')}
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
          /* Tab 2: Vendedores (Merchant must contact us first) */
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Strict Notice: Sellers must contact us first */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Admisión Exclusiva para Comercios Verificados</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                La cuenta vendedora es <strong>separada de la de comprador</strong> y se crea al instante con el email de tu comercio: accedés a tu panel con pedidos, stock, equipo, publicidad y liquidaciones.
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

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer mt-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Enviar solicitud de contacto comercial</span>
                </button>

              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
