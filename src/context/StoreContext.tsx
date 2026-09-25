import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, CustomerData, PaymentDetails, ViewType, Review, User, MerchantApplication, ChatMessage, PushNotification, Seller, Payout, SellerMember, SellerRole, AdCampaign, IntegrationKey, SavedAddress } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/mockData';
import { calcSettlement, releaseDateFrom, COMMISSION_CONFIG, resolveCoupon, resolveShipping } from '../utils/commissions';
import { DEFAULT_INTEGRATIONS } from '../utils/sellerWorkspace';
import { load, persist, forget } from '../data/db';
import { auth } from '../data/auth';

const DEFAULT_USER: User = {
  id: 'usr-101',
  fullName: 'Mariano Agustín Gómez',
  email: 'marianoagusting1996@gmail.com',
  phone: '11 5590-4421',
  address: 'Av. Libertador 2450, Piso 7A',
  city: 'Buenos Aires (CABA - Palermo)',
  postalCode: '1425',
  role: 'buyer',
  createdAt: '2026-08-15',
  addresses: [
    {
      id: 'addr-1',
      label: 'Casa / Principal',
      fullName: 'Mariano Agustín Gómez',
      phone: '11 5590-4421',
      address: 'Av. Libertador 2450, Piso 7A',
      city: 'Buenos Aires (CABA - Palermo)',
      postalCode: '1425',
    },
    {
      id: 'addr-2',
      label: 'Trabajo / Oficina',
      fullName: 'Mariano Agustín Gómez',
      phone: '11 5590-4421',
      address: 'Av. Corrientes 1240, Piso 3',
      city: 'CABA - Centro',
      postalCode: '1001',
    },
  ],
};

const INITIAL_PRODUCT_CHATS: Record<string, ChatMessage[]> = {
  'prod-1': [
    {
      id: 'msg-1',
      sender: 'buyer',
      text: 'Hola, ¿la caja está muy rota o solo fue abierta?',
      timestamp: '14:20',
    },
    {
      id: 'msg-2',
      sender: 'seller',
      text: '¡Hola! La caja solo tiene el precinto de fábrica abierto porque el cliente original cambió de color dentro de las 48hs. La notebook está 100% impecable sin marcas, batería al 100% y cargador original.',
      timestamp: '14:22',
    },
  ],
  'prod-2': [
    {
      id: 'msg-3',
      sender: 'buyer',
      text: '¿El rayón se nota cuando está encendida la tele viendo de frente?',
      timestamp: '10:05',
    },
    {
      id: 'msg-4',
      sender: 'seller',
      text: 'Hola! No, para nada. El rayón cosmético de 1.5 cm está en la parte trasera del marco de plástico. El panel LED 4K está impoluto sin píxeles muertos.',
      timestamp: '10:07',
    },
  ],
  'prod-3': [
    {
      id: 'msg-5',
      sender: 'buyer',
      text: 'Hola, ¿incluye el vaporizador para espumar leche?',
      timestamp: 'Ayer 18:30',
    },
    {
      id: 'msg-6',
      sender: 'seller',
      text: '¡Hola! Sí, incluye el tubo vaporizador de acero inoxidable, el porta filtro doble y la cuchara prensa. Se despacha en caja de cartón triple acolchada de máxima seguridad.',
      timestamp: 'Ayer 18:32',
    },
  ],
};

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
  cancelOrder: (orderId: string) => void;
  requestReturn: (orderId: string) => void;
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
  loginUser: (email: string, fullName?: string, password?: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (updated: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authInitialTab: 'buyer' | 'merchant';
  openAuthModal: (tab?: 'buyer' | 'merchant') => void;

  // Merchant Onboarding & Contact
  merchantApplications: MerchantApplication[];
  submitMerchantApplication: (data: Omit<MerchantApplication, 'id' | 'date' | 'status'>) => Promise<void>;

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
  const [products, setProducts] = useState<Product[]>(() =>
    load('solooutlet_products', INITIAL_PRODUCTS));

  const [cart, setCart] = useState<CartItem[]>(() =>
    load('solooutlet_cart', [] as CartItem[]));

  // Migración: órdenes viejas sin settlement reciben cálculo automático retroactivo
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = load('solooutlet_orders', [] as Order[]);
    const source = saved.length >= INITIAL_ORDERS.length
      ? saved
      : [...saved, ...INITIAL_ORDERS.filter((io) => !saved.some((s) => s.id === io.id))];
    const initialList = source.length > 0 ? source : INITIAL_ORDERS;
    return initialList.map((o) => {
      if (o.settlement) return o;
      const settlement = calcSettlement(o.total, o.paymentDetails.method, COMMISSION_CONFIG.rate);
      return {
        ...o,
        settlement,
        sellerName: o.sellerName || o.items?.[0]?.product?.vendor || 'ElectroPlaza Outlet',
        payoutStatus: o.payoutStatus || 'pendiente',
        payoutReleaseAt: o.payoutReleaseAt || releaseDateFrom(new Date().toISOString()),
      };
    });
  });

  const [wishlist, setWishlist] = useState<string[]>(() =>
    load('solooutlet_wishlist', ['prod-1', 'prod-3']));

  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    load('solooutlet_user', DEFAULT_USER));

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
    if (saved) return saved;
    return [
      {
        id: 'notif-1',
        type: 'order_status',
        title: '📦 Pedido Despachado por Andreani',
        body: 'Tu compra #ORD-2026-891 ya está en viaje con código de seguimiento AND-9281920.',
        timestamp: 'Hace 15 min',
        read: false,
        linkView: 'profile',
        metadata: {
          orderId: 'ord-101',
          productTitle: 'Notebook 14" Core i5',
          newStatus: 'despachado',
        },
      },
      {
        id: 'notif-2',
        type: 'chat_message',
        title: '💬 El vendedor respondió a tu consulta',
        body: 'ElectroPlaza Outlet: "Te confirmo que el equipo tiene batería al 100% y cargador original..."',
        timestamp: 'Hace 1 hora',
        read: false,
        linkView: 'catalog',
        metadata: {
          productId: 'prod-1',
          productTitle: 'Notebook 14" Core i5',
        },
      },
    ];
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

    const statusNames: Record<string, string> = {
      en_preparacion: 'En preparación en depósito',
      despachado: 'Despachado con seguimiento en viaje',
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
        replyText = `Hola! Tenés ${targetProd?.warrantyDays || 60} días de garantía técnica oficial con solooutlet y 10 días de prueba para cambio o devolución por disconformidad si el estado no coincide exactamente con lo publicado.`;
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

  const loginUser = async (email: string, fullName = 'Comprador', password?: string): Promise<boolean> => {
    try {
      const user = await auth.login(email, password, fullName);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`✓ Bienvenido/a, ${user.fullName}`);
      return true;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'No pudimos iniciar sesión.'}`);
      return false;
    }
  };

  const logoutUser = async (): Promise<void> => {
    await auth.logout();
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

  const submitMerchantApplication = async (data: Omit<MerchantApplication, 'id' | 'date' | 'status'>): Promise<void> => {
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

  const openProductModal = (product: Product) => {
    setSelectedProductModal(product);
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
    const settlement = calcSettlement(total, payment.method, COMMISSION_CONFIG.rate);
    const sellerName = cart[0]?.product.vendor || 'ElectroPlaza Outlet';
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

  /** Pide devolución de un pedido entregado (la gestiona el vendedor). */
  const requestReturn = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status !== 'completado' || target.returnRequested) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, returnRequested: true } : o)));
    showToast('✓ Devolución solicitada. El vendedor te contactará por chat.');
    triggerPushNotification({
      type: 'sale_alert',
      title: `↩️ Devolución solicitada en ${target.orderNumber}`,
      body: `${target.customer.fullName} pide devolver la compra. Revisalo en tu panel.`,
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
        cancelOrder,
        requestReturn,
        addAddress,
        removeAddress,
        goToStateFilter,
        addReview,
        wishlist,
        toggleWishlist,
        isInWishlist,
        currentUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authInitialTab,
        openAuthModal,
        merchantApplications,
        submitMerchantApplication,
        productChats,
        sendProductChatMessage,
        pushNotifications,
        unreadNotificationsCount: pushNotifications.filter((n) => !n.read).length,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        triggerPushNotification,
        updateOrderStatus,
        sellers,
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
          <div className="bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
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
