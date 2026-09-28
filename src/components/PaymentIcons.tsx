import React from 'react';
import { Building2 } from 'lucide-react';

/**
 * Insignias de medios de pago con marcas en SVG (sin dependencias).
 * Se usan en el footer y donde se listen métodos aceptados.
 */

const Badge: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span
    title={label}
    aria-label={label}
    className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
  >
    {children}
  </span>
);

export const VisaIcon: React.FC = () => (
  <Badge label="Visa">
    <svg viewBox="0 0 44 16" className="h-4 w-auto" role="img" aria-hidden="true">
      <text x="22" y="12.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="13" fill="#1A1F71" letterSpacing="1">
        VISA
      </text>
    </svg>
  </Badge>
);

export const MastercardIcon: React.FC = () => (
  <Badge label="Mastercard">
    <svg viewBox="0 0 44 26" className="h-5 w-auto" role="img" aria-hidden="true">
      <circle cx="17" cy="13" r="10" fill="#EB001B" />
      <circle cx="27" cy="13" r="10" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  </Badge>
);

export const AmexIcon: React.FC = () => (
  <Badge label="American Express">
    <svg viewBox="0 0 44 26" className="h-5 w-auto" role="img" aria-hidden="true">
      <rect x="2" y="2" width="40" height="22" rx="4" fill="#2E77BC" />
      <text x="22" y="17" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="10.5" fill="#FFFFFF" letterSpacing="0.5">
        AMEX
      </text>
    </svg>
  </Badge>
);

export const MercadoPagoIcon: React.FC = () => (
  <Badge label="Mercado Pago">
    <svg viewBox="0 0 72 20" className="h-4 w-auto" role="img" aria-hidden="true">
      <text x="36" y="14.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="12.5" fill="#009EE3">
        mercado pago
      </text>
    </svg>
  </Badge>
);

export const DebinIcon: React.FC = () => (
  <Badge label="DEBIN / Transferencia">
    <Building2 className="w-4 h-4 text-emerald-600" />
    <span className="text-[10px] font-extrabold text-slate-700 tracking-wide">DEBIN</span>
  </Badge>
);

export const PaymentBadges: React.FC = () => (
  <div className="flex flex-wrap gap-1.5">
    <MercadoPagoIcon />
    <VisaIcon />
    <MastercardIcon />
    <AmexIcon />
    <DebinIcon />
  </div>
);
