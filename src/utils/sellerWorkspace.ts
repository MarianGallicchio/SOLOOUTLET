import { SellerRole, IntegrationKey, User } from '../types';

/**
 * Dueños de plataforma (staff SoloOutlet). A futuro: tabla `roles` en la DB.
 * Agregá acá el email del administrador para ver el Panel Admin.
 */
export const PLATFORM_OWNER_EMAILS: string[] = ['admin@solooutlet.com'];

/** ¿Es cuenta vendedora (tiene tienda aprobada)? */
export function isMerchant(user: User | null): boolean {
  return !!user && (user.role === 'merchant_approved' || !!user.storeName);
}

/** ¿Es staff de la plataforma (ve el Panel Admin global)? */
export function isPlatformOwner(user: User | null): boolean {
  return !!user && PLATFORM_OWNER_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Modelo de permisos del workspace vendedor.
 * El comprador (B2C) no ve nada de esto: solo catálogo, carrito y sus pedidos.
 * El vendedor opera su tienda con empleados por rol, publicidad e integraciones.
 */

export const SELLER_ROLES: { value: SellerRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Dueño', description: 'Control total, finanzas y liquidaciones.' },
  { value: 'admin', label: 'Administrador', description: 'Todo excepto eliminar la tienda.' },
  { value: 'ventas', label: 'Ventas', description: 'Pedidos, chat con compradores y precios.' },
  { value: 'deposito', label: 'Depósito', description: 'Stock, inventario y despachos.' },
  { value: 'marketing', label: 'Marketing', description: 'Productos y campañas de publicidad.' },
];

export type WorkspaceModule =
  | 'resumen'
  | 'pedidos'
  | 'stock'
  | 'empleados'
  | 'publicidad'
  | 'integraciones'
  | 'finanzas';

const ROLE_MODULES: Record<SellerRole, WorkspaceModule[]> = {
  owner: ['resumen', 'pedidos', 'stock', 'empleados', 'publicidad', 'integraciones', 'finanzas'],
  admin: ['resumen', 'pedidos', 'stock', 'empleados', 'publicidad', 'integraciones', 'finanzas'],
  ventas: ['resumen', 'pedidos'],
  deposito: ['resumen', 'stock', 'pedidos'],
  marketing: ['resumen', 'publicidad'],
};

/** ¿Puede este rol ver/usar el módulo? */
export function canAccessModule(role: SellerRole, module: WorkspaceModule): boolean {
  return ROLE_MODULES[role].includes(module);
}

export function roleLabel(role: SellerRole): string {
  return SELLER_ROLES.find((r) => r.value === role)?.label ?? role;
}

export const INTEGRATION_CATALOG: {
  key: IntegrationKey;
  name: string;
  description: string;
  cta: string;
}[] = [
  {
    key: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Cobra con QR, saldo y tarjetas. La comisión de SoloOutlet se retiene vía application_fee.',
    cta: 'Conectar cuenta MP',
  },
  {
    key: 'andreani',
    name: 'Andreani',
    description: 'Etiquetas y seguimiento automático al despachar cada pedido.',
    cta: 'Conectar Andreani',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Avisos de venta y mensajes de clientes en el número de la tienda.',
    cta: 'Conectar WhatsApp',
  },
  {
    key: 'excel',
    name: 'Excel / CSV',
    description: 'Importá tu catálogo masivo y exportá ventas y liquidaciones.',
    cta: 'Activar importación',
  },
];

export const DEFAULT_INTEGRATIONS = (): { key: IntegrationKey; enabled: boolean }[] => [
  { key: 'mercadopago', enabled: false },
  { key: 'andreani', enabled: false },
  { key: 'whatsapp', enabled: false },
  { key: 'excel', enabled: false },
];
