import React from 'react';
import { useStore } from '../context/StoreContext';
import { isMerchant } from '../utils/sellerWorkspace';
import { Home, Compass, Heart, ShoppingBag, User, Store } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, cart, setIsCartOpen, wishlist, currentUser, openAuthModal } = useStore();
  const seller = isMerchant(currentUser);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        {/* 1. Inicio */}
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Inicio</span>
        </button>

        {/* 2. Catálogo */}
        <button
          onClick={() => setCurrentView('catalog')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'catalog' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Catálogo</span>
        </button>

        {/* 3. Favoritos (Wishlist) */}
        <button
          onClick={() => setCurrentView('wishlist')}
          className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
            currentView === 'wishlist' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 mb-1 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Favoritos</span>
        </button>

        {/* 4. Carrito */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-1" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Carrito</span>
        </button>

        {/* 5. Mi Tienda (vendedor) o Mi Perfil / Cuenta (comprador) */}
        {seller ? (
          <button
            onClick={() => setCurrentView('seller-workspace')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              currentView === 'seller-workspace' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Mi Tienda</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('profile');
              } else {
                openAuthModal('buyer');
              }
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
              currentView === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">
              {currentUser ? 'Mi Cuenta' : 'Ingresar'}
            </span>
          </button>
        )}

      </div>
    </nav>
  );
};
