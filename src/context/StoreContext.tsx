import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, CustomerData, PaymentDetails, ViewType, Review, User, MerchantApplication, ChatMessage, PushNotification, Seller, Payout, SellerMember, SellerRole, AdCampaign, IntegrationKey, SavedAddress, DisputeReason, DISPUTE_REASONS } from '../types';
import { INITIAL_PRODUCTS, DEMO_PRODUCTS, DEMO_ORDERS } from '../data/mockData';
import { calcSettlement, releaseDateFrom, COMMISSION_CONFIG, resolveCoupon, resolveShipping } from '../utils/commissions';
import { DEFAULT_INTEGRATIONS } from '../utils/sellerWorkspace';
import { load, persist, forget, isApiMode, API_URL } from '../data/db';
import { auth, AuthSession } from '../data/auth';
import { animatePop as animateToastIn } from '../utils/animations';
import { Shipment, CourierId, generateShipmentLabel, advanceTracking, SHIPMENT_STATUS_LABEL } from '../utils/logistics';
import {
  getCartCookie, saveCartCookie, hasConsentFor, pushRecentlyViewed,
  rememberUser, forgetRememberedUser, saveCatalogPrefs, getCatalogPrefs,
} from '../utils/cookies';

const INITIAL_USER: User | null = null;

const INITIAL_PRODUCT_CHATS: Record<string, ChatMessage[]> = {};

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedStateFilter: string | null;
  setSelectedStateFilter: (state: string | null) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (cat: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProductModal: Product | null;
  openProductModal: (p: Product) => void;
  closeProductModal: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  lastOrder: Order | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  updateProductStock: (productId: string, newStock: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  deleteProduct: (productId: string) => void;
  helpSection: 'garantia' | 'envios' | 'terminos' | null;
  setHelpSection: (s: 'garantia' | 'envios' | 'terminos' | null) => void;
  addNewProduct: (productData: Omit<Product, 'id' | 'sku' | 'createdAt'>) => void;
  processCheckout: (customer: CustomerData, payment: PaymentDetails, couponCode?: string) => Order;
  /** Modo API: crea la orden en MySQL y devuelve la URL de pago de Mercado Pago. null si no hay backend. */
  checkoutWithApi: ((customer: CustomerData, payment: PaymentDetails, couponCode?: string) => Promise<{ initPoint?: string; orderNumber?: string } | null>) | null;
  cancelOrder: (orderId: string) => void;
  openDispute: (orderId: string, reason: DisputeReason) => void;
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  removeAddress: (addressId: string) => void;
  goToStateFilter: (stateName: string) => void;
  addReview: (
    productId: string,
    reviewData: {
      author: string;
      rating: number;
      comment: string;
      declaredConditionReceived: boolean;
    }
  ) => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // User Profile & Authentication (vía servicio `auth`, listo para DB)
  currentUser: User | null;
  loginUser: (email: string, fullName?: string, password?: string) => Promise<User | null>;
  /** Registro real de comprador con validación de cuenta/contraseña. */
  registerBuyer: (input: { fullName: string; email: string; password: string }) => Promise<User | null>;
  /** Recuperación de contraseña: genera y devuelve código (demo) o lo envía por email (producción). */
  requestPasswordReset: (email: string) => Promise<{ code: string; viaEmail: boolean }>;
  /** Confirma el código y cambia la contraseña. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  /** Verificación de email: envía código (demo: devuelto; producción: por email). */
  requestEmailVerification: (email: string) => Promise<{ code: string; viaEmail: boolean }>;
  /** Confirma el código de verificación de email. */
  confirmEmailVerification: (email: string, code: string) => Promise<boolean>;
  /** Login con Google: envía el ID token al backend, que lo verifica y crea/sesiona en MySQL. */
  loginWithGoogle: (credential: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (updated: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authInitialTab: 'buyer' | 'merchant';
  openAuthModal: (tab?: 'buyer' | 'merchant') => void;

  // Merchant Onboarding & Contact
  merchantApplications: MerchantApplication[];
  submitMerchantApplication: (data: Omit<MerchantApplication, 'id' | 'date' | 'status'>, password?: string) => Promise<void>;
  /** Crea (si no existe) o loguea la cuenta vendedora de demo con datos precargados. */
  loginDemoSeller: () => Promise<void>;
  /** Crea (si no existe) o loguea la cuenta moderador/dueño de plataforma (admin@solooutlet.com). */
  loginDemoMod: () => Promise<void>;

  // In-product Live Merchant Chat
  productChats: Record<string, ChatMessage[]>;
  sendProductChatMessage: (productId: string, text: string) => void;

  // Real-time Push Notifications System
  pushNotifications: PushNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  triggerPushNotification: (notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => void;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;

  // ── Auto-logística (modo demo) ──
  createOrderShipment: (orderId: string, courierId: CourierId, weightKg: number) => Shipment | null;
  advanceOrderTracking: (orderId: string) => Shipment | null;

  // ── Comisiones y liquidaciones automáticas ──
  sellers: Seller[];
  payouts: Payout[];
  registerSellerAccount: (storeName: string, banking: { cbu?: string; alias?: string; mpAccount?: string }) => void;
  requestSellerPayout: (sellerName: string) => Payout | null;
  markPayoutTransferred: (payoutId: string, receipt?: string) => void;
  sellerPendingBalance: (sellerName: string) => number;
  platformRetainedTotal: () => number;

  // ── Workspace vendedor (empleados, publicidad, integraciones) ──
  activeSellerName: string | null;
  setActiveSellerName: (name: string | null) => void;
  createSellerWorkspace: (storeName: string, ownerEmail?: string) => Seller;
  mySellerRole: (sellerName: string) => SellerRole | null;
  inviteMember: (sellerName: string, data: { name: string; email: string; role: SellerRole }) => void;
  updateMemberRole: (sellerName: string, memberId: string, role: SellerRole) => void;
  toggleMemberActive: (sellerName: string, memberId: string) => void;
  removeMember: (sellerName: string, memberId: string) => void;
  createAdCampaign: (sellerName: string, data: { name: string; productIds: string[]; budget: number }) => void;
  toggleAdCampaign: (sellerName: string, campaignId: string) => void;
  toggleIntegration: (sellerName: string, key: IntegrationKey, accountLabel?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Limpieza one-time de datos de referencia viejos ──
  // Las demos anteriores precargaban productos/órdenes de ejemplo que quedaron
  // guardados en localStorage. Este flag fuerza un único reset para que el
  // catálogo arranque LIMPIO y cada vendedor publique los suyos.
  const RESET_KEY = 'solooutlet_reset_v2_clean';
  try {
    if (!localStorage.getItem(RESET_KEY)) {
      ['solooutlet_products', 'solooutlet_orders', 'solooutlet_cart', 'solooutlet_wishlist',
       'solooutlet_product_chats', 'solooutlet_push_notifs', 'solooutlet_sellers',
       'solooutlet_payouts', 'solooutlet_user', 'solooutlet_auth_session'].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(RESET_KEY, '1');
    }
  } catch { /* almacenamiento bloqueado: la app sigue normal */ }

  // Precarga demo: solo si no hay catálogo guardado (no pisa datos reales)
  const hasSavedCatalog = !!localStorage.getItem('solooutlet_products');
  const [products, setProducts] = useState<Product[]>(() =>
    load('solooutlet_products', hasSavedCatalog ? INITIAL_PRODUCTS : (INITIAL_PRODUCTS.length ? INITIAL_PRODUCTS : DEMO_PRODUCTS)));

  const [cart, setCart] = useState<CartItem[]>(() =>
    load('solooutlet_cart', [] as CartItem[]));

    // Migración: órdenes viejas sin settlement reciben cálculo automático retroactivo
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = load('solooutlet_orders', hasSavedCatalog ? [] as Order[] : DEMO_ORDERS);
    return saved.map((o) => {
      if (o.settlement) return o;
      const settlement = calcSettlement(o.total, o.paymentDetails.method);
      return {
        ...o,
        settlement,
        sellerName: o.sellerName || o.items?.[0]?.product?.vendor || 'Vendedor',
        payoutStatus: o.payoutStatus || 'pendiente',
        payoutReleaseAt: o.payoutReleaseAt || releaseDateFrom(new Date().toISOString()),
      };
    });
  });

  const [wishlist, setWishlist] = useState<string[]>(() =>
    load('solooutlet_wishlist', [] as string[]));

  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    load('solooutlet_user', INITIAL_USER));

  const [merchantApplications, setMerchantApplications] = useState<MerchantApplication[]>(() =>
    load('solooutlet_merchant_apps', [] as MerchantApplication[]));

  const [productChats, setProductChats] = useState<Record<string, ChatMessage[]>>(() =>
    load('solooutlet_product_chats', INITIAL_PRODUCT_CHATS));

  const withWorkspaceDefaults = (s: Seller): Seller => ({
    ...s,
    members: s.members ?? [],
    campaigns: s.campaigns ?? [],
    integrations: s.integrations?.length ? s.integrations : DEFAULT_INTEGRATIONS(),
  });

  const [sellers, setSellers] = useState<Seller[]>(() =>
    load('solooutlet_sellers', [] as Seller[]).map(withWorkspaceDefaults));

  const [activeSellerName, setActiveSellerName] = useState<string | null>(() =>
    load('solooutlet_active_seller', null as string | null));

  const [payouts, setPayouts] = useState<Payout[]>(() =>
    load('solooutlet_payouts', [] as Payout[]));

  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>(() => {
    const saved = load<PushNotification[] | null>('solooutlet_push_notifs', null);
    return saved || [];
  });

  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [helpSection, setHelpSection] = useState<'garantia' | 'envios' | 'terminos' | null>(null);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'buyer' | 'merchant'>('buyer');

  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync a la capa de datos (hoy localStorage, mañana tu DB vía VITE_API_URL)
  useEffect(() => {
    persist('solooutlet_products', products);
  }, [products]);

  useEffect(() => {
    persist('solooutlet_cart', cart);
    // Cookie de carrito (necesaria, 7 días): SOLO IDs y cantidades (límite 4 KB)
    saveCartCookie(cart.map((i) => ({ id: i.product.id, qty: i.quantity })));
  }, [cart]);

  useEffect(() => {
    persist('solooutlet_orders', orders);
  }, [orders]);

  useEffect(() => {
    persist('solooutlet_wishlist', wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (currentUser) {
      persist('solooutlet_user', currentUser);
    } else {
      forget('solooutlet_user');
    }
  }, [currentUser]);

  useEffect(() => {
    persist('solooutlet_merchant_apps', merchantApplications);
  }, [merchantApplications]);

  useEffect(() => {
    persist('solooutlet_product_chats', productChats);
  }, [productChats]);

  useEffect(() => {
    persist('solooutlet_push_notifs', pushNotifications);
  }, [pushNotifications]);

  useEffect(() => {
    persist('solooutlet_sellers', sellers);
  }, [sellers]);

  useEffect(() => {
    persist('solooutlet_payouts', payouts);
  }, [payouts]);

  useEffect(() => {
    if (activeSellerName) {
      persist('solooutlet_active_seller', activeSellerName);
    } else {
      forget('solooutlet_active_seller');
    }
  }, [activeSellerName]);

  const triggerPushNotification = (notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: PushNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: 'Ahora mismo',
      read: false,
    };
    setPushNotifications((prev) => [newNotif, ...prev]);

    // Also show toast banner
    showToast(`${newNotif.title}: ${newNotif.body}`);
  };

  const markNotificationAsRead = (id: string) => {
    setPushNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setPushNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setPushNotifications([]);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    // Fix StrictMode double-push: resolver fuera del updater y notificar solo si existe
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    if (targetOrder.status === newStatus) return;
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord)),
    );

    // Modo API (MySQL): el backend persiste el estado y crea la notificación
    // para el COMPRADOR en la DB — la ve al abrir la app o recargar.
    if (isApiMode) {
      void fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${load<AuthSession | null>('solooutlet_auth_session', null)?.token ?? ''}` },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});
    }

    const statusNames: Record<string, string> = {
      en_preparacion: 'En preparación en depósito',
      despachado: 'Despachado — el vendedor confirmó el envío y tu compra está en camino 🚚',
      completado: 'Entregado al comprador con éxito',
      cancelado: 'Cancelado con reintegro en curso',
    };

    triggerPushNotification({
      type: 'order_status',
      title: `📦 Actualización de tu pedido #${targetOrder.orderNumber}`,
      body: `El estado cambió a: "${statusNames[newStatus] || newStatus}". Podés ver los detalles en tu cuenta.`,
      linkView: 'profile',
      metadata: {
        orderId,
        newStatus,
      },
    });
  };

  // ── Auto-logística (modo demo) ──

  const notifyShipmentEvent = (order: Order, shipment: Shipment) => {
    const isDelivered = shipment.status === 'delivered';
    triggerPushNotification({
      type: 'order_status',
      title: isDelivered
        ? `✅ ¡Entregado! Pedido #${order.orderNumber}`
        : `🚚 Tu pedido #${order.orderNumber} — ${SHIPMENT_STATUS_LABEL[shipment.status]}`,
      body: isDelivered
        ? `Entrega confirmada por ${shipment.courierName}. Si todo está bien, la venta queda cerrada.`
        : `${shipment.courierName} · Tracking ${shipment.trackingNumber}. Llegada estimada: ${new Date(shipment.etaDate).toLocaleDateString('es-AR')}.`,
      linkView: 'profile',
      metadata: { orderId: order.id, newStatus: shipment.status },
    });
  };

  const createOrderShipment = (orderId: string, courierId: CourierId, weightKg: number): Shipment | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;
    const shipment = generateShipmentLabel({ courierId, weightKg, city: order.customer.city });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, shipment } : o)),
    );
    notifyShipmentEvent(order, shipment);
    return shipment;
  };

  const advanceOrderTracking = (orderId: string): Shipment | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.shipment) return null;
    const updated = advanceTracking(order.shipment);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, shipment: updated } : o)),
    );
    // Entrega confirmada → el pedido pasa a 'completado' y libera la liquidación
    if (updated.status === 'delivered' && order.status !== 'completado') {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'completado' as const } : o)),
      );
    }
    notifyShipmentEvent(order, updated);
    return updated;
  };

  const sendProductChatMessage = (productId: string, text: string) => {
    const timeNow = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const newBuyerMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'buyer',
      text: text.trim(),
      timestamp: timeNow,
    };

    setProductChats((prev) => {
      const existing = prev[productId] || [];
      return {
        ...prev,
        [productId]: [...existing, newBuyerMsg],
      };
    });

    // Auto-respond from verified seller with outlet condition transparency
    setTimeout(() => {
      const targetProd = products.find((p) => p.id === productId);
      let replyText = `¡Hola! Gracias por consultar. Te confirmo que el producto está en depósito bajo el estado "${targetProd?.estado || 'Outlet'}": ${targetProd?.conditionDetails || 'testeado al 100% y con garantía'}. Se despacha en 24hs con garantía de ${targetProd?.warrantyDays || 60} días.`;
      
      const lower = text.toLowerCase();
      if (lower.includes('envío') || lower.includes('envio') || lower.includes('caba') || lower.includes('llega') || lower.includes('cuándo') || lower.includes('tiempo')) {
        replyText = `Hola! Sí, despachamos en 24hs hábiles por Andreani Express a todo el país. Para CABA y GBA llega habitualmente en 24 a 48 hs. El paquete viaja 100% asegurado por el valor total.`;
      } else if (lower.includes('garant') || lower.includes('cambio') || lower.includes('devolu') || lower.includes('falla')) {
        replyText = `Hola! Las ventas son finales y sin devoluciones: lo que ves en las fotos reales es lo que recibís. La garantía de ${targetProd?.warrantyDays || 60} días corresponde al fabricante por fallas de funcionamiento. Solo se abre disputa por fraude o error grave en el envío.`;
      } else if (lower.includes('accesorio') || lower.includes('cargador') || lower.includes('cable') || lower.includes('caja')) {
        replyText = `Hola! Viene probado con sus cargadores y cables esenciales homologados. En caso de no tener caja de fábrica, va en caja de cartón corrugado triple acolchada de alta seguridad.`;
      } else if (lower.includes('rayón') || lower.includes('rayon') || lower.includes('detalle') || lower.includes('marca')) {
        replyText = `Hola! Tal como declaramos: "${targetProd?.conditionDetails}". El panel, circuitos y batería funcionan como nuevos, el precio refleja exclusivamente ese detalle cosmético declarado.`;
      }

      const sellerReply: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'seller',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      };

      setProductChats((prev) => {
        const existing = prev[productId] || [];
        return {
          ...prev,
          [productId]: [...existing, sellerReply],
        };
      });

      // Fire push notification for the buyer
      triggerPushNotification({
        type: 'chat_message',
        title: `💬 Respuesta del vendedor en ${targetProd?.title || 'tu producto consultado'}`,
        body: `"${replyText.length > 90 ? replyText.slice(0, 90) + '...' : replyText}"`,
        linkView: 'catalog',
        metadata: {
          productId,
          productTitle: targetProd?.title,
        },
      });
    }, 750);
  };

  // Animación del toast: solo cuando aparece un mensaje nuevo
  const lastToastRef = useRef<string | null>(null);
  const toastElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (toastMessage && lastToastRef.current !== toastMessage && toastElRef.current) {
      animateToastIn(toastElRef.current);
    }
    lastToastRef.current = toastMessage;
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const openAuthModal = (tab: 'buyer' | 'merchant' = 'buyer') => {
    setAuthInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  // Restaurar sesión guardada (cuentas separadas comprador/vendedor)
  useEffect(() => {
    auth.restoreSession().then((user) => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);

  const loginUser = async (email: string, _fullName?: string, password?: string): Promise<User | null> => {
    try {
      const user = await auth.login(email, password, _fullName);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`✓ Bienvenido/a, ${user.fullName}`);
      // Vendedor: directo a su panel de tienda
      if (user.role === 'merchant_approved' || user.storeName) {
        createSellerWorkspace(user.storeName || 'Mi Tienda', user.email);
        setCurrentView('seller-workspace');
      }
      return user;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos iniciar sesión.'}`);
      return null;
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ code: string; viaEmail: boolean }> => {
    return auth.requestPasswordReset(email);
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      await auth.resetPassword(email, code, newPassword);
      showToast('✓ Contraseña actualizada. Ya podés iniciar sesión.');
      return true;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos actualizar la contraseña.'}`);
      return false;
    }
  };

  const requestEmailVerification = async (email: string): Promise<{ code: string; viaEmail: boolean }> => {
    return auth.requestEmailVerification(email);
  };

  const confirmEmailVerification = async (email: string, code: string): Promise<boolean> => {
    try {
      await auth.confirmEmailVerification(email, code);
      setCurrentUser((prev) => (prev && prev.email.toLowerCase() === email.toLowerCase() ? { ...prev, emailVerified: true } : prev));
      showToast('✓ ¡Email verificado! Tu cuenta está completa.');
      return true;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos verificar el email.'}`);
      return false;
    }
  };

  const registerBuyer = async (input: { fullName: string; email: string; password: string }): Promise<User | null> => {
    try {
      const user = await auth.registerBuyer(input);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`✓ Cuenta creada. ¡Bienvenido/a a solooutlet, ${user.fullName.split(' ')[0]}!`);
      return user;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos crear la cuenta.'}`);
      return null;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<User | null> => {
    // Modo API: el backend verifica el ID token con Google y crea/busca el usuario en MySQL.
    if (isApiMode) {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Google rechazó el acceso');
        setCurrentUser(data.user);
        persist('solooutlet_auth_session', { userId: data.user.id, token: data.token, createdAt: new Date().toISOString() });
        persist('solooutlet_user', data.user);
        setIsAuthModalOpen(false);
        showToast(`✓ Bienvenido/a, ${data.user.fullName}`);
        return data.user as User;
      } catch (e) {
        showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos iniciar sesión con Google.'}`);
        return null;
      }
    }
    // Modo demo (sin backend): sesión local con los datos del token decodificado.
    try {
      const payload = JSON.parse(atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return await loginUser(payload.email || 'usuario@gmail.com', payload.name || 'Usuario Google');
    } catch {
      showToast('⚠️ No pudimos validar tu cuenta de Google.');
      return null;
    }
  };

  const logoutUser = async (): Promise<void> => {
    await auth.logout();
    forgetRememberedUser(); // limpia la cookie "Recordarme"
    setCurrentUser(null);
    showToast('Sesión cerrada');
    setCurrentView('home');
  };

  const updateUserProfile = async (updated: Partial<User>): Promise<void> => {
    if (!currentUser) return;
    const next = { ...currentUser, ...updated };
    setCurrentUser(next);
    try {
      await auth.updateUser(next);
    } catch {
      /* el cambio queda en memoria y en caché local */
    }
    showToast('✓ Datos de perfil actualizados');
  };

  const toggleWishlist = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Eliminado de tus favoritos');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`❤️ Guardado en favoritos: ${product?.title || 'Producto'}`);
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const submitMerchantApplication = async (data: Omit<MerchantApplication, 'id' | 'date' | 'status'>, password?: string): Promise<void> => {
    // Modo API (MySQL): la solicitud queda PENDIENTE hasta que el admin la aprueba.
    if (isApiMode) {
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: data.contactPerson.trim() || data.storeName,
            email: data.email,
            password: undefined,
            role: 'seller_pending',
            storeName: data.storeName,
            sellerProfile: { cuit: data.cuit, businessName: data.storeName, contactPerson: data.contactPerson, whatsapp: data.whatsapp, category: data.category },
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'No pudimos enviar la solicitud');
        setIsAuthModalOpen(false);
        showToast(`✓ Solicitud enviada. Te avisaremos cuando "${data.storeName}" sea aprobada.`);
        return;
      } catch (e) {
        showToast(`⚠️ ${e instanceof Error ? e.message : 'Error al enviar la solicitud.'}`);
        return;
      }
    }

    // Modo demo (sin backend): flujo local, aprobación inmediata
    const newApp: MerchantApplication = {
      ...data,
      id: `app-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'approved',
    };
    setMerchantApplications((prev) => [newApp, ...prev]);
    // Cuenta VENDEDORA separada (por email): entra directo a su tienda
    try {
      const sellerUser = await auth.registerSeller({
        fullName: data.contactPerson.trim() || data.storeName,
        email: data.email,
        storeName: data.storeName,
        password,
      });
      setCurrentUser(sellerUser);
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos crear tu cuenta vendedora.'}`);
      return;
    }
    // La tienda queda creada al instante: el comerciante ya puede operar su workspace
    createSellerWorkspace(data.storeName, data.email);
    setIsAuthModalOpen(false);
    setCurrentView('seller-workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`✓ ¡Tienda "${data.storeName}" creada! Bienvenido a tu panel vendedor.`);
  };

  const loginDemoSeller = async (): Promise<void> => {
    const email = 'ventas@electroplaza.com.ar';
    const password = 'vendedor123';
    try {
      const existing = await auth.findByEmail(email);
      if (existing && existing.role === 'merchant_approved') {
        const user = await auth.login(email, password);
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setActiveSellerName('ElectroPlaza');
        setCurrentView('seller-workspace');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('✓ Sesión iniciada como ElectroPlaza (cuenta demo).');
        return;
      }
      // No existe: registrar la tienda demo completa
      await submitMerchantApplication(
        {
          storeName: 'ElectroPlaza',
          contactPerson: 'Mariano (Demo)',
          cuit: '20-12345678-9',
          category: 'Tecnología',
          estimatedStockVolume: '20-50 lotes/mes',
          city: 'Buenos Aires',
          email,
          whatsapp: '+54 9 11 5555-5555',
        },
        password,
      );
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos iniciar la demo vendedora.'}`);
    }
  };

  const loginDemoMod = async (): Promise<void> => {
    const email = 'admin@solooutlet.com';
    const password = 'moderador123';
    try {
      const existing = await auth.findByEmail(email);
      if (!existing) {
        // Crear cuenta plataforma (role buyer + email en PLATFORM_OWNER_EMAILS = owner)
        const user = await auth.registerBuyer({ fullName: 'Moderación solooutlet', email, password });
        setCurrentUser(user);
      } else {
        const user = await auth.login(email, password);
        setCurrentUser(user);
      }
      setIsAuthModalOpen(false);
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('✓ Sesión iniciada como Moderación (dueño de plataforma).');
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos iniciar la sesión mod.'}`);
    }
  };

  const openProductModal = (product: Product) => {
    // Vistos recientemente (preferencias, últimos 10)
    pushRecentlyViewed(product.id);
  };

  const closeProductModal = () => {
    setSelectedProductModal(null);
  };

  const goToStateFilter = (stateName: string) => {
    setSelectedStateFilter(stateName);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, quantity = 1) => {
    const currentProd = products.find((p) => p.id === product.id) || product;
    if (currentProd.stock <= 0) {
      showToast('⚠️ Producto sin stock disponible');
      return { success: false, message: 'Sin stock' };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (existingQty + quantity > currentProd.stock) {
      showToast(`Solo quedan ${currentProd.stock} unidades disponibles`);
      return { success: false, message: 'Stock insuficiente' };
    }

    if (existingIndex > -1) {
      setCart((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      });
    } else {
      setCart((prev) => [...prev, { product: currentProd, quantity }]);
    }

    showToast(`✓ Agregado al carrito: ${product.title}`);
    return { success: true, message: 'Agregado' };
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const currentProd = products.find((p) => p.id === productId);
    if (currentProd && quantity > currentProd.stock) {
      showToast(`Máximo disponible: ${currentProd.stock} unidades`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
    showToast('Inventario actualizado en tiempo real');
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setWishlist((prev) => prev.filter((id) => id !== productId));
    showToast(`✓ "${target?.title || 'Producto'}" eliminado del catálogo`);
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const discount = Math.round(((p.originalPrice - newPrice) / p.originalPrice) * 100);
          return { ...p, price: newPrice, discount: Math.max(0, discount) };
        }
        return p;
      })
    );
    showToast('Precio actualizado en el catálogo');
  };

  const addNewProduct = (data: Omit<Product, 'id' | 'sku' | 'createdAt'>) => {
    const id = `prod-${Date.now()}`;
    const sku = `OUT-${data.cat.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newProduct: Product = {
      ...data,
      id,
      sku,
      createdAt: new Date().toISOString().split('T')[0],
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast('✓ Publicación creada exitosamente en el catálogo');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processCheckout = (customer: CustomerData, payment: PaymentDetails, couponCode?: string): Order => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const transferDiscount = payment.method === 'transfer' ? Math.round(subtotal * 0.1) : 0;
    const coupon = couponCode ? resolveCoupon(couponCode, subtotal) : null;
    const discountAmount = transferDiscount + (coupon?.amount ?? 0);
    // Recargo financiado (igual que lo mostrado en CheckoutModal): 6c +15%, 12c +30%
    const installments = payment.installments ?? 1;
    const surchargeRate =
      payment.method === 'credit_card' ? (installments >= 12 ? 0.3 : installments >= 6 ? 0.15 : 0) : 0;
    const surcharge = Math.round((subtotal - discountAmount) * surchargeRate);
    const shipping = resolveShipping(payment.shippingOption ?? 'standard', subtotal);
    const total = subtotal - discountAmount + surcharge + shipping;

    const orderNumber = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
    // ── Retención automática de comisión ──
    const settlement = calcSettlement(total, payment.method);
    const sellerName = cart[0]?.product.vendor || 'Vendedor SoloOutlet';
    const nowISO = new Date().toISOString();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      customer,
      items: cart.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
      subtotal,
      discountAmount,
      shipping,
      total,
      paymentDetails: {
        ...payment,
        installmentAmount: installments > 1 ? Math.round(total / installments) : total,
        couponCode: coupon?.code,
      },
      status: 'en_preparacion',
      settlement,
      sellerName,
      payoutStatus: 'pendiente',
      payoutReleaseAt: releaseDateFrom(nowISO),
    };

    // Auto-crear/actualizar cuenta del vendedor con saldo pendiente
    setSellers((prev) => {
      const existing = prev.find((s) => s.storeName === sellerName);
      if (existing) {
        return prev.map((s) =>
          s.storeName === sellerName ? { ...s, balancePending: s.balancePending + settlement.netPayout } : s,
        );
      }
      const seller: Seller = {
        id: `sel-${Date.now()}`,
        storeName: sellerName,
        commissionRate: COMMISSION_CONFIG.rate,
        balancePending: settlement.netPayout,
        balanceAvailable: 0,
        balanceTransferred: 0,
        createdAt: nowISO.split('T')[0],
        members: [],
        campaigns: [],
        integrations: DEFAULT_INTEGRATIONS(),
      };
      return [...prev, seller];
    });

    // Real-time stock reduction
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((item) => item.product.id === p.id);
        if (cartMatch) {
          const updatedStock = Math.max(0, p.stock - cartMatch.quantity);
          return { ...p, stock: updatedStock };
        }
        return p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setLastOrder(newOrder);
    clearCart();
    setIsCheckoutOpen(false);
    setCurrentView('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    triggerPushNotification({
      type: 'sale_alert',
      title: `💰 Venta ${orderNumber}: comisión retenida`,
      body: `Bruto ${total} · Comisión SoloOutlet ${settlement.platformFee} · Neto vendedor ${settlement.netPayout}.`,
      linkView: 'admin',
      metadata: { orderId: newOrder.id, productTitle: sellerName },
    });

    return newOrder;
  };

  /** Cancela un pedido en preparación: devuelve stock y anula la liquidación. */
  const cancelOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status !== 'en_preparacion') return;
    setProducts((prev) =>
      prev.map((p) => {
        const line = target.items.find((i) => i.product.id === p.id);
        return line ? { ...p, stock: p.stock + line.quantity } : p;
      }),
    );
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelado' as const } : o)));
    showToast(`✓ Pedido ${target.orderNumber} cancelado. Te devolvemos el dinero al mismo medio de pago.`);
    triggerPushNotification({
      type: 'order_status',
      title: `❌ Pedido ${target.orderNumber} cancelado`,
      body: 'El stock volvió al catálogo y la liquidación quedó anulada. Reintegro en curso.',
      linkView: 'profile',
      metadata: { orderId, newStatus: 'cancelado' },
    });
  };

  /**
   * Abre una disputa por fraude o error grave en un pedido entregado.
   * Las ventas son finales y sin devoluciones: este es el único canal post-entrega.
   */
  const openDispute = (orderId: string, reason: DisputeReason) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status !== 'completado' || target.dispute) return;
    const reasonLabel = DISPUTE_REASONS.find((r) => r.value === reason)?.label ?? reason;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, dispute: { reason, reasonLabel, date: new Date().toISOString().split('T')[0], status: 'abierta' as const } }
          : o,
      ),
    );
    showToast('✓ Disputa abierta. SoloOutlet la revisará con el vendedor.');
    triggerPushNotification({
      type: 'sale_alert',
      title: `🚨 Disputa abierta en ${target.orderNumber}`,
      body: `${target.customer.fullName} reporta: ${reasonLabel}. Revisalo en tu panel.`,
      linkView: 'admin',
      metadata: { orderId, productTitle: target.sellerName },
    });
  };

  const addAddress = (address: Omit<SavedAddress, 'id'>) => {
    if (!currentUser) return;
    const entry: SavedAddress = { ...address, id: `addr-${Date.now()}` };
    setCurrentUser({ ...currentUser, addresses: [...(currentUser.addresses ?? []), entry] });
    showToast('✓ Dirección guardada');
  };

  const removeAddress = (addressId: string) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      addresses: (currentUser.addresses ?? []).filter((a) => a.id !== addressId),
    });
    showToast('Dirección eliminada');
  };

  const registerSellerAccount = (storeName: string, banking: { cbu?: string; alias?: string; mpAccount?: string }) => {
    setSellers((prev) => {
      if (prev.some((s) => s.storeName === storeName)) {
        return prev.map((s) => (s.storeName === storeName ? { ...s, ...banking } : s));
      }
      return [
        ...prev,
        {
          id: `sel-${Date.now()}`,
          storeName,
          commissionRate: COMMISSION_CONFIG.rate,
          balancePending: 0,
          balanceAvailable: 0,
          balanceTransferred: 0,
          createdAt: new Date().toISOString().split('T')[0],
          members: [],
          campaigns: [],
          integrations: DEFAULT_INTEGRATIONS(),
          ...banking,
        },
      ];
    });
    showToast('✓ Cuenta de vendedor registrada para liquidaciones');
  };

  // Los cancelados no generan ni retienen dinero.
  const sellerPendingBalance = (sellerName: string) =>
    orders
      .filter((o) => (o.sellerName || o.items?.[0]?.product?.vendor) === sellerName && o.payoutStatus === 'pendiente' && o.status !== 'cancelado')
      .reduce((sum, o) => sum + (o.settlement?.netPayout ?? 0), 0);

  const platformRetainedTotal = () =>
    orders.filter((o) => o.status !== 'cancelado').reduce((sum, o) => sum + (o.settlement?.platformFee ?? 0), 0);

  const requestSellerPayout = (sellerName: string): Payout | null => {
    const pending = orders.filter(
      (o) => (o.sellerName || o.items?.[0]?.product?.vendor) === sellerName && o.payoutStatus === 'pendiente' && o.status !== 'cancelado',
    );
    if (pending.length === 0) {
      showToast('Sin saldo pendiente para liquidar');
      return null;
    }
    const gross = pending.reduce((s, o) => s + (o.settlement?.gross ?? o.total), 0);
    const platformFee = pending.reduce((s, o) => s + (o.settlement?.platformFee ?? 0), 0);
    const gatewayFee = pending.reduce((s, o) => s + (o.settlement?.gatewayFee ?? 0), 0);
    const netAmount = pending.reduce((s, o) => s + (o.settlement?.netPayout ?? 0), 0);
    const nowISO = new Date().toISOString();
    const payout: Payout = {
      id: `pay-${Date.now()}`,
      sellerName,
      orderIds: pending.map((o) => o.id),
      orderNumbers: pending.map((o) => o.orderNumber),
      gross,
      platformFee,
      gatewayFee,
      netAmount,
      status: 'pendiente',
      createdAt: nowISO,
      releaseAt: releaseDateFrom(nowISO),
    };
    setPayouts((prev) => [payout, ...prev]);
    setOrders((prev) => prev.map((o) => (pending.some((p) => p.id === o.id) ? { ...o, payoutStatus: 'liberado' } : o)));
    showToast(`✓ Liquidación ${payout.id} generada: neto ${netAmount} para ${sellerName}`);
    return payout;
  };

  const markPayoutTransferred = (payoutId: string, receipt?: string) => {
    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) return;
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? { ...p, status: 'transferido', transferredAt: new Date().toISOString(), transferReceipt: receipt || `TR-${Date.now()}` }
          : p,
      ),
    );
    setOrders((prev) =>
      prev.map((o) => (payout.orderIds.includes(o.id) ? { ...o, payoutStatus: 'transferido' } : o)),
    );
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === payout.sellerName
          ? { ...s, balanceTransferred: s.balanceTransferred + payout.netAmount, balancePending: Math.max(0, s.balancePending - payout.netAmount) }
          : s,
      ),
    );
    triggerPushNotification({
      type: 'sale_alert',
      title: `✅ Transferencia a ${payout.sellerName}`,
      body: `Neto ${payout.netAmount} transferido. SoloOutlet retuvo ${payout.platformFee} de comisión.`,
      linkView: 'admin',
      metadata: { productTitle: payout.sellerName },
    });
  };

  // ── Workspace vendedor ──────────────────────────────────────
  const createSellerWorkspace = (storeName: string, ownerEmail?: string): Seller => {
    const existing = sellers.find((s) => s.storeName === storeName);
    if (existing) {
      if (ownerEmail && !existing.ownerEmail) {
        setSellers((prev) => prev.map((s) => (s.storeName === storeName ? { ...s, ownerEmail } : s)));
      }
      setActiveSellerName(storeName);
      return existing;
    }
    const seller: Seller = {
      id: `sel-${Date.now()}`,
      storeName,
      ownerEmail: ownerEmail || currentUser?.email,
      commissionRate: COMMISSION_CONFIG.rate,
      balancePending: 0,
      balanceAvailable: 0,
      balanceTransferred: 0,
      createdAt: new Date().toISOString().split('T')[0],
      members: [],
      campaigns: [],
      integrations: DEFAULT_INTEGRATIONS(),
    };
    setSellers((prev) => [...prev, seller]);
    setActiveSellerName(storeName);
    return seller;
  };

  /** Rol del usuario actual dentro de la tienda (dueño si creó la cuenta o coincide el email). */
  const mySellerRole = (sellerName: string): SellerRole | null => {
    const seller = sellers.find((s) => s.storeName === sellerName);
    if (!seller) return null;
    if (!currentUser) return null;
    if (seller.ownerEmail === currentUser.email) return 'owner';
    const member = seller.members.find((m) => m.email.toLowerCase() === currentUser.email.toLowerCase() && m.active);
    if (member) return member.role;
    // Demo: el usuario logueado administra las tiendas sin dueño asignado
    if (!seller.ownerEmail) return 'owner';
    return null;
  };

  const inviteMember = (sellerName: string, data: { name: string; email: string; role: SellerRole }) => {
    const member: SellerMember = {
      id: `mem-${Date.now()}`,
      active: true,
      invitedAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    setSellers((prev) =>
      prev.map((s) => (s.storeName === sellerName ? { ...s, members: [...s.members, member] } : s)),
    );
    showToast(`✓ ${data.name} invitado como ${data.role}`);
  };

  const updateMemberRole = (sellerName: string, memberId: string, role: SellerRole) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === sellerName
          ? { ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, role } : m)) }
          : s,
      ),
    );
    showToast('✓ Rol actualizado');
  };

  const toggleMemberActive = (sellerName: string, memberId: string) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === sellerName
          ? { ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, active: !m.active } : m)) }
          : s,
      ),
    );
  };

  const removeMember = (sellerName: string, memberId: string) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === sellerName ? { ...s, members: s.members.filter((m) => m.id !== memberId) } : s,
      ),
    );
    showToast('Empleado eliminado del equipo');
  };

  const createAdCampaign = (sellerName: string, data: { name: string; productIds: string[]; budget: number }) => {
    const campaign: AdCampaign = {
      id: `ads-${Date.now()}`,
      spent: 0,
      status: 'activa',
      createdAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    setSellers((prev) =>
      prev.map((s) => (s.storeName === sellerName ? { ...s, campaigns: [campaign, ...s.campaigns] } : s)),
    );
    // Impulsar = marcar productos con boost básico para que destaquen en catálogo
    setProducts((prev) =>
      prev.map((p) => (data.productIds.includes(p.id) ? { ...p, boostType: 'basic' as const } : p)),
    );
    showToast(`✓ Campaña "${data.name}" activada y productos impulsados`);
  };

  const toggleAdCampaign = (sellerName: string, campaignId: string) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === sellerName
          ? {
              ...s,
              campaigns: s.campaigns.map((c) =>
                c.id === campaignId ? { ...c, status: c.status === 'activa' ? 'pausada' : 'activa' } : c,
              ),
            }
          : s,
      ),
    );
  };

  const toggleIntegration = (sellerName: string, key: IntegrationKey, accountLabel?: string) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.storeName === sellerName
          ? {
              ...s,
              integrations: s.integrations.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      enabled: !i.enabled,
                      accountLabel: !i.enabled ? accountLabel || i.accountLabel || 'Cuenta conectada' : i.accountLabel,
                      connectedAt: !i.enabled ? new Date().toISOString() : i.connectedAt,
                    }
                  : i,
              ),
            }
          : s,
      ),
    );
    showToast('✓ Integración actualizada');
  };

  const addReview = (
    productId: string,
    reviewData: {
      author: string;
      rating: number;
      comment: string;
      declaredConditionReceived: boolean;
    }
  ) => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId,
      author: reviewData.author.trim() || 'Comprador verificado',
      rating: reviewData.rating,
      date: new Date().toISOString().split('T')[0],
      comment: reviewData.comment,
      verifiedPurchase: true,
      declaredConditionReceived: reviewData.declaredConditionReceived,
      likes: 0,
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentReviews = p.reviews || [];
          const updatedReviews = [newReview, ...currentReviews];
          const newAvg =
            Math.round(
              (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length) * 10
            ) / 10;
          return {
            ...p,
            rating: newAvg,
            reviewCount: (p.reviewCount || 0) + 1,
            reviews: updatedReviews,
          };
        }
        return p;
      })
    );

    setSelectedProductModal((prev) => {
      if (prev && prev.id === productId) {
        const currentReviews = prev.reviews || [];
        const updatedReviews = [newReview, ...currentReviews];
        const newAvg =
          Math.round(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length) * 10
          ) / 10;
        return {
          ...prev,
          rating: newAvg,
          reviewCount: (prev.reviewCount || 0) + 1,
          reviews: updatedReviews,
        };
      }
      return prev;
    });

    showToast('✓ Reseña y calificación de 5 estrellas publicadas con éxito');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        orders,
        currentView,
        setCurrentView,
        selectedStateFilter,
        setSelectedStateFilter,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        searchQuery,
        setSearchQuery,
        selectedProductModal,
        openProductModal,
        closeProductModal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        lastOrder,
        toastMessage,
        showToast,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        updateProductStock,
        updateProductPrice,
        deleteProduct,
        helpSection,
        setHelpSection,
        addNewProduct,
        processCheckout,
        checkoutWithApi: isApiMode
          ? async (customer, payment, couponCode) => {
              try {
                const session = load<AuthSession | null>('solooutlet_auth_session', null);
                const res = await fetch(`${API_URL}/checkout`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token ?? ''}` },
                  body: JSON.stringify({ customer, items: cart, shippingOption: payment.shippingOption, couponCode }),
                });
                if (!res.ok) return null;
                return (await res.json()) as { initPoint?: string; orderNumber?: string };
              } catch {
                return null;
              }
            }
          : null,
        cancelOrder,
        openDispute,
        addAddress,
        removeAddress,
        goToStateFilter,
        addReview,
        wishlist,
        toggleWishlist,
        isInWishlist,
        currentUser,
        loginUser,
        registerBuyer,
        requestPasswordReset,
        resetPassword,
        requestEmailVerification,
        confirmEmailVerification,
        loginWithGoogle,
        logoutUser,
        updateUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authInitialTab,
        openAuthModal,
        merchantApplications,
        submitMerchantApplication,
        loginDemoSeller,
        loginDemoMod,
        productChats,
        sendProductChatMessage,
        pushNotifications,
        unreadNotificationsCount: pushNotifications.filter((n) => !n.read).length,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        triggerPushNotification,
        updateOrderStatus,
        createOrderShipment,
        advanceOrderTracking,        sellers,
        payouts,
        registerSellerAccount,
        requestSellerPayout,
        markPayoutTransferred,
        sellerPendingBalance,
        platformRetainedTotal,
        activeSellerName,
        setActiveSellerName,
        createSellerWorkspace,
        mySellerRole,
        inviteMember,
        updateMemberRole,
        toggleMemberActive,
        removeMember,
        createAdCampaign,
        toggleAdCampaign,
        toggleIntegration,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 left-4 md:left-auto md:w-96 z-50 pointer-events-none">
          <div ref={toastElRef} className="bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700/80">
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
