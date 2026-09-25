import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { Heart, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const { products, wishlist, toggleWishlist, addToCart, setCurrentView, openProductModal, setIsCheckoutOpen } = useStore();

  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAllToCart = () => {
    favoriteProducts.forEach((p) => {
      if (p.stock > 0) {
        addToCart(p, 1);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>Lista de Deseos Guardada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Mis Productos Favoritos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Guardá las oportunidades de outlet para comprarlas más tarde antes de que se agote el stock.
          </p>
        </div>

        {favoriteProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAllToCart}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Agregar todos al carrito</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid or Empty State */}
      {favoriteProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-2xs max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-3xl">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Tu lista de favoritos está vacía
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Hacé clic en el ícono de corazón en cualquier producto del catálogo para guardarlo y seguir su precio o disponibilidad.
          </p>
          <button
            onClick={() => setCurrentView('catalog')}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Explorar catálogo de liquidaciones
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favoriteProducts.map((product) => {
            const conditionStyle = getConditionBadgeStyle(product.estado);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-slate-900/8 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Image */}
                <div
                  className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${conditionStyle.bg}`}>
                      {product.estado}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-600 text-white shadow-xs">
                      -{product.discount}%
                    </span>
                  </div>

                  {/* Remove from wishlist button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow-md transition-colors cursor-pointer"
                    title="Quitar de favoritos"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => openProductModal(product)}
                      className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {product.title}
                    </h3>
                    <div className="text-xs text-slate-500 mb-2 truncate">
                      {product.vendor} · {product.warrantyDays}d garantía
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-bold text-slate-900 tabular-nums">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-xs text-slate-400 line-through tabular-nums">
                        {formatPrice(product.originalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => addToCart(product, 1)}
                      disabled={isOutOfStock}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Agotado' : 'Mover al carrito'}</span>
                    </button>

                    <button
                      onClick={() => openProductModal(product)}
                      className="w-8 h-8 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors shrink-0"
                      title="Ver diagnóstico completo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
