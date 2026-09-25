import React from 'react';
import { useStore } from '../context/StoreContext';
import { isMerchant } from '../utils/sellerWorkspace';
import { Package, ShoppingBag, Heart, LogIn, PackagePlus, Store } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

const GRADE_PILLS = [
  { key: 'all', label: 'Todos', condition: null as string | null },
  { key: 'a', label: 'Como Nuevo (Grado A)', condition: 'Devolución' },
  { key: 'b', label: 'Detalle Estético (Grado B)', condition: 'Rayado' },
  { key: 'c', label: 'Reacondicionado (Grado C)', condition: 'Reacondicionado' },
] as const;

/**
 * Navegación por rol:
 * - Comprador / invitado: Inicio, Catálogo, Favoritos. NADA de vendedor.
 * - Vendedor: + Mi Tienda y botón Publicar Lote.
 * - Staff plataforma: + Admin global.
 */
export const Navbar: React.FC = () => {
  const {
    currentView, setCurrentView, cart, setIsCartOpen, wishlist,
    currentUser, openAuthModal, selectedStateFilter,
    setSelectedCategoryFilter, setSearchQuery, goToStateFilter,
  } = useStore();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const seller = isMerchant(currentUser);

  const goPill = (condition: string | null) => {
    if (condition === null) {
      setSelectedCategoryFilter(null);
      setSearchQuery('');
      setCurrentView('catalog');
    } else {
      goToStateFilter(condition);
    }
  };

  const linkCls = (active: boolean, activeColor = 'text-[#004AC6] bg-blue-50/80') =>
    `px-3 py-2 rounded-lg transition-colors cursor-pointer ${
      active ? `${activeColor} font-semibold` : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold truncate">
            🔥 Liquidaciones de temporada hasta 70% OFF · Envíos rápidos a todo el país · Cuotas sin interés con Mercado Pago
          </span>
          <span className="hidden md:inline font-semibold whitespace-nowrap">
            ✓ Garantía de transparencia radical 30 días
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            aria-label="Ir al inicio de solooutlet"
          >
            <div className="w-9 h-9 rounded-xl bg-[#004AC6] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1D4ED8] transition-colors">
              <Package className="w-5 h-5 transition-transform group-hover:scale-105" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
              solo<span className="text-[#004AC6]">outlet</span>
            </span>
          </button>
        </div>

        {/* Navigation Links — por rol */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button onClick={() => setCurrentView('home')} className={linkCls(currentView === 'home')}>
            Inicio
          </button>

          <button onClick={() => setCurrentView('catalog')} className={linkCls(currentView === 'catalog')}>
            Catálogo
          </button>

          <button
            onClick={() => setCurrentView('wishlist')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'wishlist'
                ? 'text-rose-600 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
            <span>Favoritos</span>
            {wishlist.length > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {seller && (
            <button
              onClick={() => setCurrentView('seller-workspace')}
              className={linkCls(currentView === 'seller-workspace', 'text-orange-700 bg-orange-50')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Store className="w-4 h-4" /> Mi Tienda
              </span>
            </button>
          )}

        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'profile'
                  ? 'border-[#004AC6] bg-blue-50/80 text-[#004AC6] ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Mi perfil y compras"
            >
              <div className="w-6 h-6 rounded-lg bg-[#004AC6] text-white flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.fullName.charAt(0)}
              </div>
              <span className="hidden lg:inline max-w-[120px] truncate">
                {currentUser.fullName.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('buyer')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#004AC6]" />
              <span>Ingresar</span>
            </button>
          )}

          <NotificationBell />

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
            aria-label={`Ver carrito con ${totalCartCount} productos`}
          >
            <ShoppingBag className="w-5 h-5 text-slate-700" />
            <span className="hidden sm:inline text-xs font-bold">Carrito</span>
            {totalCartCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-[#004AC6] rounded-full shadow-sm">
                {totalCartCount}
              </span>
            )}
          </button>

          {seller && (
            <button
              onClick={() => setCurrentView('view-publicar')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap cursor-pointer bg-orange-600 hover:bg-orange-700 text-white active:scale-[0.98]"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Publicar Lote</span>
            </button>
          )}
        </div>
      </div>

      {/* Condition filter pills */}
      <div className="bg-slate-50 border-t border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 whitespace-nowrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Condición:</span>
          {GRADE_PILLS.map((pill) => {
            const isActive = pill.condition === null
              ? selectedStateFilter === null && currentView === 'catalog'
              : selectedStateFilter === pill.condition;
            return (
              <button
                key={pill.key}
                onClick={() => goPill(pill.condition)}
                className={`cond-pill px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                  isActive
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tags:</span>
          <button
            onClick={() => {
              setSelectedCategoryFilter('Tecnología');
              setCurrentView('catalog');
            }}
            className="cond-pill px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
          >
            ⚡ Tecnología
          </button>
          <button
            onClick={() => {
              setSelectedCategoryFilter('Indumentaria');
              setCurrentView('catalog');
            }}
            className="cond-pill px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100"
          >
            👕 Indumentaria
          </button>
          <button
            onClick={() => {
              setSelectedCategoryFilter('Hogar');
              setCurrentView('catalog');
            }}
            className="cond-pill px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
          >
            🏠 Hogar
          </button>
          <button
            onClick={() => {
              setSelectedCategoryFilter(null);
              setCurrentView('catalog');
            }}
            className="cond-pill px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200"
          >
            ⚡ Liquidaciones
          </button>
        </div>
      </div>
    </header>
  );
};
