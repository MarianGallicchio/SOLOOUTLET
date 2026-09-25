import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { isMerchant } from './utils/sellerWorkspace';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { VenderView } from './components/VenderView';
import { AdminSalesDashboard } from './components/AdminSalesDashboard';
import { OrderSuccessView } from './components/OrderSuccessView';
import { WishlistView } from './components/WishlistView';
import { UserProfileView } from './components/UserProfileView';
import { PublicarView } from './components/PublicarView';
import { SellerWorkspace } from './components/SellerWorkspace';
import { AyudaView } from './components/AyudaView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  const { currentView, currentUser } = useStore();
  const seller = isMerchant(currentUser);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] pb-16 md:pb-0">
      {/* Header */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'catalog' && <CatalogView />}
        {currentView === 'vender' && <VenderView />}
        {currentView === 'admin' && <AdminSalesDashboard />}
        {currentView === 'order-success' && <OrderSuccessView />}
        {currentView === 'wishlist' && <WishlistView />}
        {currentView === 'profile' && <UserProfileView />}
        {/* Publicar y workspace: solo vendedores. El resto ve la landing de venta. */}
        {currentView === 'view-publicar' && (seller ? <PublicarView /> : <VenderView />)}
        {currentView === 'seller-workspace' && (seller ? <SellerWorkspace /> : <VenderView />)}
        {currentView === 'ayuda' && <AyudaView />}
      </main>

      {/* Drawers and Modals */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />

      {/* Footer */}
      <Footer />

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
