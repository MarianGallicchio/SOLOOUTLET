import { ConditionType } from '../types';

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount).replace('ARS', '$');
};

export type GradeType = 'Grado A' | 'Grado B' | 'Grado C';

/** Mapeo condición → Sistema de Grados SoloOutlet (Stitch). */
export const getGradeForCondition = (estado: ConditionType): GradeType => {
  switch (estado) {
    case 'Devolución':
    case 'Sin caja':
      return 'Grado A';
    case 'Rayado':
    case 'Con falla':
      return 'Grado B';
    case 'Reacondicionado':
      return 'Grado C';
    default:
      return 'Grado B';
  }
};

export const getGradeChipStyle = (grade: GradeType) => {
  switch (grade) {
    case 'Grado A':
      return {
        badge: 'bg-white/90 text-emerald-700',
        box: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        pill: 'bg-emerald-100 text-emerald-800',
      };
    case 'Grado B':
      return {
        badge: 'bg-white/90 text-amber-700',
        box: 'bg-amber-50 border-amber-200 text-amber-800',
        pill: 'bg-amber-100 text-amber-800',
      };
    case 'Grado C':
      return {
        badge: 'bg-white/90 text-indigo-700',
        box: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        pill: 'bg-indigo-100 text-indigo-800',
      };
  }
};

export const getConditionBadgeStyle = (estado: ConditionType) => {
  switch (estado) {
    case 'Devolución':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
        label: 'Devolución',
        desc: 'Producto devuelto sin uso intensivo',
      };
    case 'Sin caja':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        dot: 'bg-amber-500',
        label: 'Sin caja',
        desc: 'Nuevo con embalaje de seguridad alternativo',
      };
    case 'Rayado':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        dot: 'bg-blue-500',
        label: 'Rayado',
        desc: 'Detalle cosmético superficial que no afecta el uso',
      };
    case 'Con falla':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500',
        label: 'Con falla',
        desc: 'Detalle específico declarado con descuento extra',
      };
    case 'Reacondicionado':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        dot: 'bg-purple-500',
        label: 'Reacondicionado',
        desc: 'Revisado y certificado por servicio técnico',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: estado,
        desc: 'Producto de outlet',
      };
  }
};
