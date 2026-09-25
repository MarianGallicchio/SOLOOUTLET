import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ConditionType, CategoryType } from '../types';
import { formatPrice } from '../utils/formatters';
import { COMMISSION_CONFIG, calcSettlement } from '../utils/commissions';
import { isMerchant } from '../utils/sellerWorkspace';
import {
  Boxes,
  BadgeDollarSign,
  ShieldCheck,
  Zap,
  Calculator,
  ArrowRight,
  Sparkles,
  Upload,
  CheckCircle2,
  Camera,
  Smartphone,
  Monitor,
  AlertCircle,
  HelpCircle,
  X,
  Eye,
  Check,
  Store,
} from 'lucide-react';

export const VenderView: React.FC = () => {
  const { addNewProduct, openAuthModal, setCurrentView, currentUser } = useStore();
  const seller = isMerchant(currentUser);

  // Calculator state
  const [calcCost, setCalcCost] = useState<number>(100000);
  const [calcDiscount, setCalcDiscount] = useState<number>(35);

  const estimatedSalePrice = Math.round(calcCost * (1 - calcDiscount / 100));
  const feePercentage = COMMISSION_CONFIG.rate;
  const settlementPreview = calcSettlement(estimatedSalePrice, 'mercadopago', feePercentage);
  const marketplaceFee = settlementPreview.platformFee;
  const netEarnings = settlementPreview.netPayout;

  // Integrated 4-step publication form state with photos and validation
  const [form, setForm] = useState({
    title: '',
    vendor: currentUser?.storeName || currentUser?.fullName || 'ElectroPlaza Outlet',
    brand: 'HP',
    model: '14-dq2055wm',
    cat: 'Tecnología' as CategoryType,
    estado: 'Devolución' as ConditionType,
    originalPrice: 120000,
    price: 79999,
    stock: 1,
    conditionDetails: '',
    specs: 'Intel Core i5, 8GB RAM, 256GB SSD, Cargador original incluido',
    warrantyDays: 90,
  });

  // Photo slots state: Slot 1 (Principal), Slot 2 (Defecto obligatorio), Slot 3 (Ángulo general)
  const [photos, setPhotos] = useState<Record<string, string>>({
    main: '/src/assets/images/product_laptop_outlet_1790289258991.jpg',
    defect: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    angle: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [activeSlotTarget, setActiveSlotTarget] = useState<string | null>(null);

  // Hidden native file pickers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setForm((prev) => ({ ...prev, price: val }));
  };

  const handleOriginalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setForm((prev) => ({ ...prev, originalPrice: val }));
  };

  const computedDiscount = form.originalPrice > form.price
    ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
    : 0;

  // File processing from device
  const processImageFile = (file: File, slotKey: string) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotos((prev) => ({ ...prev, [slotKey]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlotTarget && e.target.files?.[0]) {
      processImageFile(e.target.files[0], activeSlotTarget);
    }
    e.target.value = '';
  };

  const triggerPC = (slotKey: string) => {
    setActiveSlotTarget(slotKey);
    fileInputRef.current?.click();
  };

  const triggerMobile = (slotKey: string) => {
    setActiveSlotTarget(slotKey);
    cameraInputRef.current?.click();
  };

  const removePhoto = (slotKey: string) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  // Validations
  const isTitleValid = form.title.trim().length >= 5;
  const isBrandValid = form.brand.trim().length >= 2;
  const isConditionDescValid = form.conditionDetails.trim().length >= 10;
  const isPriceValid = form.price > 0 && form.originalPrice > 0 && form.price < form.originalPrice;
  const hasMainPhoto = !!photos['main'];
  const hasDefectPhoto = !!photos['defect'];
  const photoCount = Object.values(photos).filter(Boolean).length;
  const isPhotosValid = photoCount >= 3 && hasMainPhoto && hasDefectPhoto;

  const canSubmit = isTitleValid && isBrandValid && isConditionDescValid && isPriceValid && isPhotosValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      title: true,
      brand: true,
      conditionDetails: true,
      price: true,
      photos: true,
    });

    if (!canSubmit) return;

    const specsArray = form.specs
      ? form.specs.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Verificado por comercio', 'Embalaje protegido', 'Garantía oficial'];

    const photoList = Object.values(photos).filter(Boolean);

    addNewProduct({
      title: form.title.trim(),
      vendor: form.vendor || 'Comercio Asociado',
      vendorRating: 5.0,
      cat: form.cat,
      estado: form.estado,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      discount: computedDiscount,
      image: photos['main'] || photoList[0],
      images: photoList,
      stock: Number(form.stock),
      conditionDetails: form.conditionDetails.trim(),
      warrantyDays: Number(form.warrantyDays),
      specs: specsArray,
      brand: form.brand,
      model: form.model,
      boostType: 'basic',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Hidden File Inputs for PC & Mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hero Banner for Sellers with 3D Depth */}
      <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-8 sm:p-12 overflow-hidden shadow-2xl mb-12 border border-blue-700/50 glass-panel-3d">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs mb-4 shadow-sm">
            <Boxes className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal de Liquidación para Comercios</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 font-display">
            Liquidá tu stock estancado en minutos.
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed mb-8">
            Publicá devoluciones, productos con fallas cosméticas, sin caja o reacondicionados con fotos reales y transparencia obligatoria.
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-semibold text-blue-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cobros automáticos en 48hs
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Carga desde Celular o PC
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Validación de transparencia
            </span>
          </div>

          {(currentUser?.role === 'merchant_approved' || currentUser?.storeName) && (
            <button
              onClick={() => setCurrentView('seller-workspace')}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm active:scale-95 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Abrir mi panel: empleados, publicidad e integraciones</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Mandatory Merchant Verification Notice */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm stat-card-3d">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Proceso de Admisión: Los vendedores deben contactarse primero con nosotros
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
              Por políticas de transparencia en outlet y defensa del consumidor, todos los comercios deben validar su CUIT y origen de mercadería antes de habilitar publicaciones.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAuthModal('merchant')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer btn-3d"
        >
          <span>Contactar con Admisiones</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Value Pillars with 3D Depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm stat-card-3d card-3d">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            1. Recuperá capital de trabajo
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            El stock inmovilizado en depósito cuesta dinero y ocupa espacio. Publicalo con descuento y monetizalo en días en vez de meses.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm stat-card-3d card-3d">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            2. Transparencia total, cero reclamos
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Al declarar si es devolución, si tiene rayones o si está sin caja con fotos reales, el comprador ya acepta la condición antes de pagar.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm stat-card-3d card-3d">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            3. Integración con Mercado Pago y Tarjetas
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tus clientes pueden financiar su compra en cuotas con Mercado Pago y tarjetas de crédito, mientras vos recibís tu cobro íntegro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        
        {/* Interactive Earnings Calculator */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm stat-card-3d">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" />
            <span>Simulador de Liquidación</span>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">
            Calculá cuánto recuperarías
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Ajustá el precio de lista original y el descuento estimado de outlet.
          </p>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Precio de lista original:</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatPrice(calcCost)}</span>
              </div>
              <input
                type="range"
                min="20000"
                max="800000"
                step="5000"
                value={calcCost}
                onChange={(e) => setCalcCost(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Descuento sugerido de liquidación:</span>
                <span className="font-bold text-blue-600 tabular-nums">-{calcDiscount}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="75"
                step="5"
                value={calcDiscount}
                onChange={(e) => setCalcDiscount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Precio de venta al público:</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatPrice(estimatedSalePrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Comisión de plataforma (8%):</span>
                <span className="tabular-nums">- {formatPrice(marketplaceFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl mt-3 shadow-2xs">
                <span>Cobro neto para tu comercio:</span>
                <span className="text-base tabular-nums font-display">
                  {formatPrice(netEarnings)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Publication Form — solo comercios con cuenta de ventas */}
        {seller ? (
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm stat-card-3d">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Publicación Transparente & Verificada</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 font-display">
                Publicar producto en el catálogo
              </h2>
              <p className="text-xs text-slate-500">
                Subí las fotos reales obligatorias y completá los datos con validación inline.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('view-publicar')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0 cursor-pointer btn-3d"
            >
              <span>Abrir Asistente 4 Pasos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 📸 SECCIÓN FOTOS REALES OBLIGATORIAS (DESDE CELULAR O PC) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Fotos reales del producto (Mínimo 3 fotos) *</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Subí fotos reales desde tu celular o PC. La foto del defecto/condición es obligatoria.
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isPhotosValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {photoCount}/3 fotos {isPhotosValid && '✓'}
                </span>
              </div>

              {/* 3 Main Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Slot 1: Foto Principal */}
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1.5">
                    <span>1. Foto Principal *</span>
                    {photos.main && <span className="text-emerald-600">✓ Lista</span>}
                  </div>

                  <div className="aspect-4/3 w-full bg-slate-100 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center">
                    {photos.main ? (
                      <>
                        <img src={photos.main} alt="Principal" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto('main')}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 p-2 text-center">Fondo neutro</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => triggerMobile('main')}
                      className="py-1 px-1 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" /> Celular
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerPC('main')}
                      className="py-1 px-1 rounded-md bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Monitor className="w-3 h-3" /> PC
                    </button>
                  </div>
                </div>

                {/* Slot 2: Foto Defecto Obligatoria */}
                <div className="rounded-xl border-2 border-rose-300 bg-rose-50/20 p-2.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-rose-900 mb-1.5">
                    <span>2. Foto Defecto *</span>
                    {photos.defect && <span className="text-emerald-600">✓ Lista</span>}
                  </div>

                  <div className="aspect-4/3 w-full bg-slate-100 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center">
                    {photos.defect ? (
                      <>
                        <img src={photos.defect} alt="Defecto" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto('defect')}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-semibold p-2 text-center">Foto del detalle</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => triggerMobile('defect')}
                      className="py-1 px-1 rounded-md bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" /> Celular
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerPC('defect')}
                      className="py-1 px-1 rounded-md bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Monitor className="w-3 h-3" /> PC
                    </button>
                  </div>
                </div>

                {/* Slot 3: Ángulo General */}
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1.5">
                    <span>3. Ángulo / Perfil *</span>
                    {photos.angle && <span className="text-emerald-600">✓ Lista</span>}
                  </div>

                  <div className="aspect-4/3 w-full bg-slate-100 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center">
                    {photos.angle ? (
                      <>
                        <img src={photos.angle} alt="Ángulo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto('angle')}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 p-2 text-center">Vista lateral</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => triggerMobile('angle')}
                      className="py-1 px-1 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" /> Celular
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerPC('angle')}
                      className="py-1 px-1 rounded-md bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Monitor className="w-3 h-3" /> PC
                    </button>
                  </div>
                </div>

              </div>

              {/* Photo Error Banner */}
              {touched.photos && !isPhotosValid && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>La foto principal y la foto del defecto son obligatorias para publicar.</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título del producto *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                placeholder="Ej: Smart TV 55 Pulgadas 4K UHD o Notebook Core i5"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                  touched.title && !isTitleValid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {touched.title && !isTitleValid && (
                <p className="text-[11px] text-rose-600 mt-1">Título requerido (mínimo 5 caracteres).</p>
              )}
            </div>

            {/* Marca & Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  onBlur={() => setTouched((prev) => ({ ...prev, brand: true }))}
                  placeholder="Ej: HP, Samsung, Apple..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modelo exacto *
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Ej: 14-dq2055wm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Merchant Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de tu comercio *
                </label>
                <input
                  type="text"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={form.cat}
                  onChange={(e) => setForm({ ...form, cat: e.target.value as CategoryType })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="Tecnología">Tecnología</option>
                  <option value="Electrodomésticos">Electrodomésticos</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Indumentaria">Indumentaria</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            {/* Declared Condition & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado declarado *
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as ConditionType })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white font-medium"
                >
                  <option value="Devolución">🟢 Devolución (10 días sin uso)</option>
                  <option value="Sin caja">🟡 Sin caja original</option>
                  <option value="Rayado">🔵 Rayado / Detalle cosmético</option>
                  <option value="Con falla">🔴 Con falla menor declarada</option>
                  <option value="Reacondicionado">🟣 Reacondicionado de fábrica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock disponible *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Prices & Real-time Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio de lista original ($) *
                </label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={handleOriginalPriceChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio de liquidación outlet ($) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={handlePriceChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 font-bold text-blue-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Descuento resultante: <strong>{computedDiscount}% OFF</strong>
                </span>
              </div>
            </div>

            {/* Price Validation Error */}
            {touched.price && !isPriceValid && (
              <p className="text-[11px] text-rose-600">
                El precio de outlet debe ser menor al precio original de lista.
              </p>
            )}

            {/* Diagnosis / Condition Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diagnóstico del estado real (detalle transparente) *
              </label>
              <textarea
                rows={2}
                value={form.conditionDetails}
                onChange={(e) => setForm({ ...form, conditionDetails: e.target.value })}
                onBlur={() => setTouched((prev) => ({ ...prev, conditionDetails: true }))}
                placeholder="Ej: Embalaje abierto para revisión técnica. Pantalla 100% sana, incluye cargador original. Rayón leve de 2cm en la parte trasera."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                  touched.conditionDetails && !isConditionDescValid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {touched.conditionDetails && !isConditionDescValid && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Por favor detallá el diagnóstico con al menos 10 caracteres.
                </p>
              )}
            </div>

            {/* Specs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Especificaciones (separadas por coma)
              </label>
              <input
                type="text"
                value={form.specs}
                onChange={(e) => setForm({ ...form, specs: e.target.value })}
                placeholder="Ej: 55 pulgadas 4K, 3x HDMI, WiFi 5GHz, Dolby Vision"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all btn-3d ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Publicar en solooutlet</span>
            </button>

          </form>
        </div>
        ) : (
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider mb-3 self-start">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Solo cuentas de ventas</span>
          </div>
          <h2 className="text-xl font-bold mb-2 font-display">Publicar es exclusivo para comercios verificados</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Para vender necesitás una cuenta de ventas con CUIT validado. Registrá tu comercio gratis y accedé al asistente de publicación, tu panel con stock y pedidos, y liquidaciones automáticas.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openAuthModal('merchant')}
              className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm active:scale-95 transition-all cursor-pointer"
            >
              Registrar mi comercio gratis
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('catalog')}
              className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all cursor-pointer"
            >
              Seguir explorando
            </button>
          </div>
        </div>
        )}

      </div>

    </div>
  );
};
