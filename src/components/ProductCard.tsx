import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatPrice, getGradeForCondition, getGradeChipStyle } from '../utils/formatters';
import { Check, ShoppingCart, Heart, ShieldCheck, Camera } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, openProductModal, toggleWishlist, isInWishlist } = useStore();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const grade = getGradeForCondition(product.estado);
  const gradeStyle = getGradeChipStyle(grade);
  const isOutOfStock = product.stock <= 0;
  const isFavorited = isInWishlist(product.id);
  const savings = Math.max(0, product.originalPrice - product.price);
  // Urgency bar: fewer units → higher % sold
  const soldPct = isOutOfStock ? 100 : product.stock <= 1 ? 98 : product.stock <= 2 ? 92 : product.stock <= 3 ? 88 : 75;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const res = addToCart(product, 1);
    if (res.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1400);
    }
  };

  const openInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    openProductModal(product);
  };

  return (
    <div
      onClick={() => openProductModal(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Header Media Area */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-200/60 animate-pulse" />
        )}

        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
            <span className="text-3xl mb-1">📦</span>
            <span className="text-xs font-medium text-slate-500">{product.title}</span>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        )}

        {/* Stacked badges: OFF + Grado */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-orange-600 text-white shadow-sm">
            -{product.discount}% OFF
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold shadow-sm ${gradeStyle.badge}`}>
            {grade}
          </span>
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
            isFavorited
              ? 'bg-white heart-active'
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-orange-600'
          }`}
          aria-label={isFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-orange-600 text-orange-600' : ''}`} />
        </button>

        {/* Fotos reales */}
        <button
          type="button"
          onClick={openInspect}
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 text-white text-[11px] font-semibold hover:bg-slate-950 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" /> Fotos reales del lote
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div>
          <div className="text-[11px] text-slate-500">{product.cat} · {product.vendor}</div>
          <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-[#004AC6] transition-colors">
            {product.title}
          </h3>
        </div>

        {/* Falla color-coded */}
        <div className={`text-[11px] p-1.5 rounded-lg border truncate font-medium ${gradeStyle.box} border`}>
          {product.conditionDetails}
        </div>

        {/* Price matrix */}
        <div>
          <span className="block text-xs text-slate-400 line-through tabular-nums">
            {formatPrice(product.originalPrice)}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {formatPrice(product.price)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold tabular-nums">
              Ahorrás {formatPrice(savings)}
            </span>
          </div>
        </div>

        {/* Scarcity */}
        {!isOutOfStock ? (
          <div>
            <div className="flex justify-between text-[11px] font-bold text-orange-600">
              <span>{product.stock <= 1 ? '¡Última unidad!' : `¡Solo ${product.stock} disponibles!`}</span>
              <span>{soldPct}% vendido</span>
            </div>
            <div className="h-1.5 rounded-full bg-orange-100 mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${soldPct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-rose-600">Agotado</div>
        )}

        {/* Trust row */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Mercado Pago · Garantía {product.warrantyDays} días</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
          <button
            onClick={openInspect}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            Ver Falla
          </button>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#004AC6] hover:bg-[#1D4ED8] text-white'
            }`}
            aria-label={`Agregar ${product.title} al carrito`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Listo</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
