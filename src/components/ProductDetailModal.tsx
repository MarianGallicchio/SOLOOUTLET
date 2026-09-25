import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice, getConditionBadgeStyle, getGradeForCondition, getGradeChipStyle } from '../utils/formatters';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Truck,
  CreditCard,
  Store,
  ShoppingBag,
  Star,
  MessageSquare,
  ThumbsUp,
  UserCheck,
  Send,
  Heart,
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductModal, closeProductModal, addToCart, setIsCheckoutOpen, addReview, toggleWishlist, isInWishlist, products, openProductModal } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [btnFeedback, setBtnFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  // Review form state
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorInput, setAuthorInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [conditionConfirmed, setConditionConfirmed] = useState<boolean>(true);
  const [helpfulLikes, setHelpfulLikes] = useState<Record<string, number>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  if (!selectedProductModal) return null;

  const product = selectedProductModal;
  const isFavorited = isInWishlist(product.id);
  const conditionStyle = getConditionBadgeStyle(product.estado);
  const isOutOfStock = product.stock <= 0;

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const currentDisplayImage = allImages[selectedImageIndex] || product.image;

  const reviews = product.reviews || [];
  const averageRating = product.rating || (reviews.length > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
    : 5.0);
  const totalReviews = reviews.length > 0 ? reviews.length : (product.reviewCount || 0);

  const ratingLabels: Record<number, string> = {
    1: '1 estrella · Muy insatisfecho',
    2: '2 estrellas · Regular',
    3: '3 estrellas · Bueno',
    4: '4 estrellas · Muy bueno',
    5: '5 estrellas · ¡Excelente oportunidad!',
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      setBtnFeedback(true);
      setTimeout(() => setBtnFeedback(false), 1500);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    closeProductModal();
    setIsCheckoutOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    addReview(product.id, {
      author: authorInput.trim() || 'Comprador verificado',
      rating: ratingInput,
      comment: commentInput.trim(),
      declaredConditionReceived: conditionConfirmed,
    });

    setCommentInput('');
    setAuthorInput('');
    setRatingInput(5);
  };

  const toggleHelpful = (reviewId: string) => {
    setHelpfulLikes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        onClick={closeProductModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-6 border border-slate-200">
        
        {/* Header / Actions */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
              isFavorited
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-rose-500'
            }`}
            aria-label={isFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            title={isFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={closeProductModal}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-md transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Detalles del Producto
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Calificaciones y Reseñas ({totalReviews})</span>
          </button>
        </div>

        {/* Tab 1: Product Information */}
        {activeTab === 'info' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 max-h-[80vh] overflow-y-auto">
            
            {/* Left Column: Media & Condition Highlight */}
            <div className="md:col-span-6 bg-slate-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
              <div>
                <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-white shadow-sm border border-slate-200/80 mb-2">
                  <img
                    src={currentDisplayImage}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-200"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border backdrop-blur-md ${conditionStyle.bg}`}>
                      {product.estado}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-600 text-white shadow-xs">
                      -{product.discount}% OFF
                    </span>
                  </div>
                </div>

                {/* Multi-photo Thumbnails if more than 1 image */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                    {allImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs scale-105'
                            : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Verified Merchant Badge */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">{product.vendor}</span>
                    <span className="text-slate-500"> · Comercio verificado ⭐ {product.vendorRating || '4.8'}</span>
                  </div>
                </div>
              </div>

              {/* Reporte Óptico — Stitch */}
              {(() => {
                const grade = getGradeForCondition(product.estado);
                const gs = getGradeChipStyle(grade);
                return (
                  <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 border-b border-slate-200">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Reporte Óptico de Defecto
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${gs.pill}`}>
                        {grade} · Certificado Oficial
                      </span>
                    </div>
                    <div className={`px-3.5 py-3 border-b text-xs ${gs.box} border-x-0`}>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                        Falla estética registrada
                      </div>
                      <p className="font-bold leading-relaxed mt-0.5">
                        {product.conditionDetails}
                      </p>
                      <p className="text-[11px] mt-1 opacity-80">
                        El detalle es cosmético superficial. No afecta placa, display ni operatividad.
                      </p>
                    </div>
                    <div className="bg-white px-3.5 py-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg">
                        <span className="font-semibold text-slate-700">Checklist hardware</span>
                        <span className="font-extrabold text-emerald-700">32/32 Puntos OK</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg">
                        <span className="font-semibold text-slate-700">Batería / funcionamiento</span>
                        <span className="font-extrabold text-emerald-700">Testeada Óptima</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg">
                        <span className="font-semibold text-slate-700">Garantía</span>
                        <span className="font-extrabold text-[#004AC6]">{product.warrantyDays} Días Cambio</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Information, Specs & Purchase */}
            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                  {product.cat} · SKU: {product.sku}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2">
                  {product.title}
                </h2>

                {/* Star rating preview */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">
                    {averageRating.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    ({totalReviews} reseñas de compradores)
                  </button>
                </div>

                {/* Pricing Block */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums font-display">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-base text-slate-400 line-through tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>

                {/* Installment perk */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg font-medium mb-5">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasta 3 cuotas sin interés con Mercado Pago o Tarjetas</span>
                </div>

                {/* Technical Specs */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Especificaciones técnicas:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {product.brand && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span><strong>Marca & Modelo:</strong> {product.brand} {product.model || ''}</span>
                      </li>
                    )}
                    {product.serialNumber && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span><strong>Número de serie:</strong> {product.serialNumber}</span>
                      </li>
                    )}
                    {product.specs.map((spec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What includes section */}
                {product.includes && product.includes.length > 0 && (
                  <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">
                      Qué incluye la venta:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.includes.map((inc, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                          ✓ {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust highlights */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-3 mb-6">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Garantía de {product.warrantyDays} días</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Envío a todo el país</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div>
                {/* Stock status */}
                <div className="text-xs font-medium text-slate-600 mb-3 flex items-center justify-between">
                  <span>Disponibilidad actual:</span>
                  {isOutOfStock ? (
                    <span className="text-rose-600 font-bold">Sin stock disponible</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'} en depósito
                    </span>
                  )}
                </div>

                {/* Quantity Stepper + Buttons */}
                <div className="space-y-2.5">
                  {!isOutOfStock && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium">Cantidad:</span>
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-3 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-900 tabular-nums">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          className="px-3 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          disabled={quantity >= product.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isOutOfStock
                          ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                          : btnFeedback
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{btnFeedback ? '✓ Agregado' : 'Agregar al carrito'}</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-md active:scale-95 flex items-center justify-center ${
                        isOutOfStock
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                    >
                      Comprar ahora
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Relacionados */}
            {(() => {
              const related = products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);
              if (related.length === 0) return null;
              return (
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    También te puede interesar
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          openProductModal(r);
                          setQuantity(1);
                          setSelectedImageIndex(0);
                          setActiveTab('info');
                        }}
                        className="text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#004AC6] hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="h-20 bg-slate-100 overflow-hidden">
                          <img src={r.image} alt={r.title} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <div className="text-[11px] font-semibold text-slate-900 line-clamp-1">{r.title}</div>
                          <div className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5">{formatPrice(r.price)}</div>
                          <div className="text-[10px] text-orange-600 font-bold">-{r.discount}% OFF</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        ) : (
          /* Tab 2: 5-Star Reviews & Rating System */
          <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto space-y-6">
            
            {/* Top Score Summary Banner */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-display tabular-nums">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 justify-center sm:justify-start">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold mt-1">
                    Promedio general basado en {totalReviews} opiniones
                  </div>
                </div>
              </div>

              {/* Outlet Guarantee Seal */}
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2.5 max-w-xs">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium leading-tight">
                  <strong className="block text-emerald-900">100% Estado Verificado:</strong>
                  Los compradores confirman que el estado coincide con lo publicado.
                </span>
              </div>

            </div>

            {/* Leave a 5-Star Review Form */}
            <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Dejar una calificación y reseña para este producto</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Contale a otros compradores cómo fue tu experiencia con este artículo de outlet.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                
                {/* 5-Star Rating Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tu puntuación de 1 a 5 estrellas *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeVal = hoverRating || ratingInput;
                        const isFilled = star <= activeVal;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                            aria-label={`Calificar con ${star} estrellas`}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {ratingLabels[hoverRating || ratingInput]}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu nombre o apodo
                  </label>
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    placeholder="Ej: Martín S. o Comprador de CABA"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu opinión sobre el producto y embalaje recibido *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ej: Llegó rápido y en excelente estado. La caja estaba abierta tal cual la descripción, pero el equipo funciona perfecto y el ahorro fue enorme..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Condition Verification Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={conditionConfirmed}
                    onChange={(e) => setConditionConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>
                    Confirmo que el producto recibido coincide con el estado declarado ({product.estado}).
                  </span>
                </label>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar reseña verificada</span>
                </button>

              </form>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Opiniones de compradores ({reviews.length})
              </h4>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Aún no hay reseñas para este artículo. ¡Sé el primero en compartir tu experiencia de compra!
                </div>
              ) : (
                reviews.map((rev) => {
                  const currentLikes = (rev.likes || 0) + (helpfulLikes[rev.id] || 0);
                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
                    >
                      {/* Reviewer Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                            {rev.author.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{rev.author}</span>
                              {rev.verifiedPurchase && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Compra verificada
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{rev.date}</div>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Footer: Declared condition confirmation & Helpful button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        {rev.declaredConditionReceived && (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Estado ({product.estado}) confirmado por el comprador</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleHelpful(rev.id)}
                          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors ml-auto cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Útil ({currentLikes})</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
