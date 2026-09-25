export type ConditionType = 
  | 'Devolución' 
  | 'Sin caja' 
  | 'Rayado' 
  | 'Con falla' 
  | 'Reacondicionado';

export type CategoryType = 
  | 'Tecnología' 
  | 'Electrodomésticos' 
  | 'Hogar' 
  | 'Indumentaria' 
  | 'Deportes' 
  | 'Otros';

export type PaymentMethodType = 
  | 'mercadopago' 
  | 'credit_card' 
  | 'debit_card' 
  | 'transfer';

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  declaredConditionReceived: boolean;
  likes?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'seller';
  text: string;
  timestamp: string;
}

export interface Product {
  id: string;
  title: string;
  vendor: string;
  vendorRating?: number;
  estado: ConditionType;
  cat: CategoryType;
  price: number;
  originalPrice: number;
  discount: number; // percentage
  image: string;
  images?: string[];
  stock: number;
  conditionDetails: string;
  description?: string;
  warrantyDays: number;
  specs: string[];
  isFeatured?: boolean;
  createdAt: string;
  sku: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  brand?: string;
  model?: string;
  serialNumber?: string;
  includes?: string[];
  boostType?: 'none' | 'basic' | 'premium';
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export type ShippingOption = 'standard' | 'express';

export interface PaymentDetails {
  method: PaymentMethodType;
  cardLast4?: string;
  installments?: number;
  installmentAmount?: number;
  mpTransactionId?: string;
  bankAlias?: string;
  shippingOption?: ShippingOption;
  couponCode?: string;
}

export interface OrderSettlementSnapshot {
  gross: number;
  platformFee: number;
  gatewayFee: number;
  netPayout: number;
  rateApplied: number;
}

export type PayoutStatus = 'pendiente' | 'liberado' | 'transferido' | 'retenido';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: CustomerData;
  items: {
    product: Product;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  discountAmount: number;
  shipping: number;
  total: number;
  paymentDetails: PaymentDetails;
  status: 'completado' | 'en_preparacion' | 'despachado' | 'cancelado';
  /** El comprador pidió devolución (solo entregados). Lo gestiona el vendedor. */
  returnRequested?: boolean;
  /** Liquidación automática: comisión retenida por SoloOutlet + neto vendedor. */
  settlement?: OrderSettlementSnapshot;
  /** Vendedor beneficiario (nombre de comercio). */
  sellerName?: string;
  payoutStatus?: PayoutStatus;
  payoutReleaseAt?: string;
}

export interface Seller {
  id: string;
  storeName: string;
  ownerEmail?: string;
  cbu?: string;
  alias?: string;
  mpAccount?: string;
  commissionRate: number;
  balancePending: number;
  balanceAvailable: number;
  balanceTransferred: number;
  createdAt: string;
  members: SellerMember[];
  campaigns: AdCampaign[];
  integrations: SellerIntegration[];
}

/** Roles dentro de una tienda vendedora. */
export type SellerRole = 'owner' | 'admin' | 'ventas' | 'deposito' | 'marketing';

export interface SellerMember {
  id: string;
  name: string;
  email: string;
  role: SellerRole;
  active: boolean;
  invitedAt: string;
}

/** Campaña de publicidad de la tienda (impulsa productos del catálogo). */
export interface AdCampaign {
  id: string;
  name: string;
  productIds: string[];
  budget: number;
  spent: number;
  status: 'activa' | 'pausada' | 'finalizada';
  createdAt: string;
}

export type IntegrationKey = 'mercadopago' | 'andreani' | 'whatsapp' | 'excel';

export interface SellerIntegration {
  key: IntegrationKey;
  enabled: boolean;
  accountLabel?: string;
  connectedAt?: string;
}

export interface Payout {
  id: string;
  sellerName: string;
  orderIds: string[];
  orderNumbers: string[];
  gross: number;
  platformFee: number;
  gatewayFee: number;
  netAmount: number;
  status: 'pendiente' | 'transferido';
  createdAt: string;
  releaseAt: string;
  transferredAt?: string;
  transferReceipt?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  role: 'buyer' | 'merchant_candidate' | 'merchant_approved';
  storeName?: string;
  createdAt: string;
  addresses?: SavedAddress[];
}

export interface MerchantApplication {
  id: string;
  storeName: string;
  contactPerson: string;
  cuit: string;
  category: CategoryType;
  estimatedStockVolume: string;
  city: string;
  email: string;
  whatsapp: string;
  date: string;
  status: 'pending_review' | 'contacted' | 'approved';
}

export interface PushNotification {
  id: string;
  type: 'order_status' | 'chat_message' | 'sale_alert' | 'system';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  linkView?: ViewType;
  metadata?: {
    orderId?: string;
    productId?: string;
    productTitle?: string;
    newStatus?: string;
  };
}

export type ViewType =
  | 'home'
  | 'catalog'
  | 'vender'
  | 'admin'
  | 'order-success'
  | 'wishlist'
  | 'profile'
  | 'merchant-contact'
  | 'view-publicar'
  | 'seller-workspace'
  | 'ayuda';
