import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ConditionType, CategoryType, Product } from '../types';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { COMMISSION_CONFIG, calcSettlement } from '../utils/commissions';
import { imgLaptop } from '../assets/images';
import {
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ShieldCheck,
  Package,
  Share2,
  ExternalLink,
  Info,
  X,
  Eye,
  Star,
  Zap,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  Monitor,
  FolderOpen,
} from 'lucide-react';

interface PhotoSlot {
  id: string;
  label: string;
  description: string;
  isRequired: boolean;
  isDefectSlot?: boolean;
  samplePlaceholder: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: 'main',
    label: '1. Foto principal (Obligatoria)',
    description: 'Producto sobre fondo neutro, bien iluminado y nítido',
    isRequired: true,
    samplePlaceholder: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'defect',
    label: '2. Foto del defecto o condición (Obligatoria)',
    description: 'Rayón, detalle, sin caja o zona afectada con claridad',
    isRequired: true,
    isDefectSlot: true,
    samplePlaceholder: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'general1',
    label: '3. Ángulo general / Lateral',
    description: 'Vista completa desde otro ángulo o perfil',
    isRequired: true,
    samplePlaceholder: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'serial',
    label: '4. Número de serie o etiqueta',
    description: 'Etiqueta de modelo, serie o código de barras si aplica',
    isRequired: false,
    samplePlaceholder: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'angle2',
    label: '5. Vista trasera o puertos',
    description: 'Parte posterior, conectores o base del equipo',
    isRequired: false,
    samplePlaceholder: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'accessories',
    label: '6. Accesorios incluidos',
    description: 'Cables, cargador o manuales que acompañan',
    isRequired: false,
    samplePlaceholder: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'detail1',
    label: '7. Detalle de encendido / Funcionamiento',
    description: 'Pantalla encendida o luces LED operativas',
    isRequired: false,
    samplePlaceholder: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'extra',
    label: '8. Foto libre adicional',
    description: 'Cualquier detalle que genere mayor transparencia',
    isRequired: false,
    samplePlaceholder: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
  },
];

const KNOWN_BRANDS = [
  'HP',
  'Samsung',
  'Apple',
  'Lenovo',
  'Dell',
  'Sony',
  'Philips',
  'LG',
  'Motorola',
  'Xiaomi',
  'Whirlpool',
  'Oster',
  'Electrolux',
  'Noblex',
  'Asus',
  'Logitech',
  'JBL',
  'Canon',
  'Bose',
  'Atma',
];

const CONDITION_OPTIONS: {
  type: ConditionType;
  colorName: string;
  badgeBg: string;
  bulletColor: string;
  borderActive: string;
  ringActive: string;
  tag: string;
  title: string;
  description: string;
  placeholder: string;
}[] = [
  {
    type: 'Devolución',
    colorName: 'Verde',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bulletColor: 'bg-emerald-500',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    ringActive: 'hover:border-emerald-300',
    tag: '🟢 Devolución',
    title: 'Devolución de cliente',
    description: 'El producto fue devuelto por el comprador original. Puede estar sin usar o con uso mínimo.',
    placeholder: 'Describí por qué fue devuelto y en qué estado está (ej: devuelto dentro de las 48hs por cambio de color, probado al 100% sin detalles)',
  },
  {
    type: 'Sin caja',
    colorName: 'Amarillo',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    bulletColor: 'bg-amber-500',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    ringActive: 'hover:border-amber-300',
    tag: '🟡 Sin caja',
    title: 'Sin caja de fábrica',
    description: 'El producto funciona perfectamente pero no tiene el embalaje original.',
    placeholder: 'Aclarar cómo se protegerá para el envío (ej: producto nuevo de exhibición en vitrina, se entrega en caja genérica reforzada con pluribol)',
  },
  {
    type: 'Rayado',
    colorName: 'Azul',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    bulletColor: 'bg-blue-500',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    ringActive: 'hover:border-blue-300',
    tag: '🔵 Rayado',
    title: 'Marcas superficiales',
    description: 'Tiene marcas superficiales visibles. El funcionamiento no está comprometido.',
    placeholder: 'Describí dónde está el rayón y qué tan visible es (ej: rayón de 3cm en la tapa superior que no afecta la pantalla ni el rendimiento)',
  },
  {
    type: 'Con falla',
    colorName: 'Rojo',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    bulletColor: 'bg-rose-500',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    ringActive: 'hover:border-rose-300',
    tag: '🔴 Con falla',
    title: 'Falla declarada',
    description: 'Tiene un defecto funcional declarado. El comprador sabe qué no funciona.',
    placeholder: 'Describí exactamente qué no funciona (ej: la tecla Shift izquierda no responde o el puerto USB lateral secundario no detecta datos)',
  },
  {
    type: 'Reacondicionado',
    colorName: 'Púrpura',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    bulletColor: 'bg-purple-500',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    ringActive: 'hover:border-purple-300',
    tag: '🟣 Reacondicionado',
    title: 'Restaurado por técnico',
    description: 'Fue reparado o restaurado a condiciones funcionales por un técnico.',
    placeholder: 'Detallá qué intervención técnica se le realizó (ej: se reemplazó la batería por una nueva original homologada y se renovó la pasta térmica)',
  },
];

const INCLUDED_OPTIONS = [
  'Cargador',
  'Manual',
  'Caja original',
  'Accesorios originales',
  'Garantía técnica',
  'Factura de compra original',
];

export interface FieldValidation {
  isValid: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

export function validateTitle(title: string): FieldValidation {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { isValid: false, message: 'El título es obligatorio.', type: 'error' };
  }
  if (trimmed.length < 5) {
    return {
      isValid: false,
      message: `Título demasiado corto (faltan ${5 - trimmed.length} caracteres para el mínimo de 5).`,
      type: 'warning',
    };
  }
  if (trimmed.length > 120) {
    return {
      isValid: false,
      message: `El título excede el límite máximo por ${trimmed.length - 120} caracteres.`,
      type: 'error',
    };
  }
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) {
    return {
      isValid: false,
      message: 'El título debe incluir palabras o nombre descriptivo del producto.',
      type: 'error',
    };
  }
  if (trimmed.length < 10) {
    return {
      isValid: true,
      message: 'Formato válido. Recomendado: incluir marca o modelo para mayor claridad.',
      type: 'warning',
    };
  }
  return {
    isValid: true,
    message: '✓ Título con formato óptimo y descriptivo.',
    type: 'success',
  };
}

export function validateGeneralDescription(desc: string): FieldValidation {
  const trimmed = desc.trim();
  const len = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (len === 0) {
    return { isValid: false, message: 'La descripción general es obligatoria.', type: 'error' };
  }
  if (len < 80) {
    return {
      isValid: false,
      message: `Faltan ${80 - len} caracteres para alcanzar el mínimo requerido (80).`,
      type: 'warning',
    };
  }
  if (len > 600) {
    return {
      isValid: false,
      message: `La descripción excede el límite permitido por ${len - 600} caracteres (máx. 600).`,
      type: 'error',
    };
  }
  if (words.length < 8) {
    return {
      isValid: false,
      message: 'La descripción debe contener al menos 8 palabras con información técnica.',
      type: 'warning',
    };
  }
  return {
    isValid: true,
    message: '✓ Longitud y formato de descripción excelentes.',
    type: 'success',
  };
}

export function validateConditionDescription(desc: string): FieldValidation {
  const trimmed = desc.trim();
  const len = trimmed.length;

  if (len === 0) {
    return {
      isValid: false,
      message: 'El diagnóstico o detalle de la condición es obligatorio.',
      type: 'error',
    };
  }
  if (len < 10) {
    return {
      isValid: false,
      message: `Faltan ${10 - len} caracteres para detallar el estado (mínimo 10).`,
      type: 'warning',
    };
  }
  return {
    isValid: true,
    message: '✓ Diagnóstico del estado detallado correctamente.',
    type: 'success',
  };
}

export function validatePrice(price: number, originalPrice: number) {
  const isPValid = Number.isFinite(price) && price >= 500;
  const isOValid = Number.isFinite(originalPrice) && originalPrice > 0;
  const isDiscountValid = isPValid && isOValid && price < originalPrice;

  let priceMessage = '';
  if (!price || price <= 0) {
    priceMessage = 'El precio de outlet debe ser mayor a $0.';
  } else if (price < 500) {
    priceMessage = 'El precio mínimo en la plataforma es de $500 ARS.';
  } else if (isOValid && price >= originalPrice) {
    priceMessage = 'El precio de outlet debe ser inferior al precio original.';
  } else {
    priceMessage = '✓ Precio de outlet válido.';
  }

  let originalMessage = '';
  if (!originalPrice || originalPrice <= 0) {
    originalMessage = 'Ingresá el precio original de lista de fábrica.';
  } else if (isPValid && originalPrice <= price) {
    originalMessage = 'Debe ser mayor al precio de outlet para reflejar el descuento.';
  } else {
    originalMessage = '✓ Precio de lista válido.';
  }

  let discountMessage = '';
  if (isDiscountValid) {
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    const savings = originalPrice - price;
    discountMessage = `✓ Descuento del ${discount}% OFF ($${savings.toLocaleString('es-AR')} de ahorro).`;
  } else if (price >= originalPrice && originalPrice > 0) {
    discountMessage = '⚠️ El precio de outlet debe ser menor al precio original de lista.';
  }

  return {
    isPriceValid: isPValid,
    isOriginalValid: isOValid,
    isValid: isDiscountValid,
    priceMessage,
    originalMessage,
    discountMessage,
  };
}

interface FormState {
  // Step 1: Photos (record of slotId -> url)
  photos: Record<string, string>;
  
  // Step 2: Info
  title: string;
  brand: string;
  model: string;
  serialNumber: string;
  category: CategoryType;
  condition: ConditionType;
  conditionDescription: string;
  generalDescription: string;
  includedItems: string[];
  
  // Step 3: Pricing & Boost
  price: number;
  originalPrice: number;
  boostType: 'none' | 'basic' | 'premium';
  durationDays: number; // 7, 15, 30, or 0 for unlimited
}

const STORAGE_KEY = 'solooutlet_publicar_draft_v1';

const INITIAL_FORM: FormState = {
  photos: {
    main: imgLaptop,
    defect: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    general1: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  title: 'Notebook HP 14 Core i5 8GB 256GB SSD',
  brand: 'HP',
  model: '14-dq2055wm',
  serialNumber: '5CD1298XYZ',
  category: 'Tecnología',
  condition: 'Rayado',
  conditionDescription: 'Rayón superficial de 3cm en la tapa superior plástica producido durante exhibición. No compromete la pantalla, bisagras ni rendimiento.',
  generalDescription: 'Notebook HP 14 modelo 14-dq2055wm con procesador Intel Core i5 y 8GB de RAM. El equipo se encuentra en estado Rayado con detalle cosmético en tapa superior, pero 100% funcional. Incluye cargador original testeado y garantía técnica escrita de 90 días por solooutlet.',
  includedItems: ['Cargador', 'Accesorios originales', 'Garantía técnica'],
  price: 369000,
  originalPrice: 519000,
  boostType: 'basic',
  durationDays: 15,
};

export const PublicarView: React.FC = () => {
  const { addNewProduct, setCurrentView, currentUser, openProductModal } = useStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading draft', e);
    }
    return INITIAL_FORM;
  });

  // Track touched fields for inline validation on blur
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-suggestions dropdown for Brand
  const [brandFocused, setBrandFocused] = useState(false);

  // Success state after publishing
  const [publishedProduct, setPublishedProduct] = useState<{
    id: string;
    sku: string;
    product: Product;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Custom photo upload modal / link prompt
  const [activeUploadSlot, setActiveUploadSlot] = useState<string | null>(null);
  const [uploadUrlInput, setUploadUrlInput] = useState('');
  const [uploadMethodTab, setUploadMethodTab] = useState<'device' | 'url' | 'samples'>('device');
  const [isDragOver, setIsDragOver] = useState(false);

  // Hidden file inputs references for direct PC & Mobile file picking
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotRef = useRef<string | null>(null);

  // Read file from user device (mobile or desktop) as DataURL
  const processImageFile = (file: File, slotId: string) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleAssignPhoto(slotId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeviceFileSelect = (e: React.ChangeEvent<HTMLInputElement>, slotId?: string) => {
    const targetSlot = slotId || targetSlotRef.current || activeUploadSlot;
    if (!targetSlot) return;
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, targetSlot);
    }
    // reset input so the same file can be reselected if needed
    e.target.value = '';
  };

  const triggerPCFilePicker = (slotId: string) => {
    targetSlotRef.current = slotId;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerMobileCameraPicker = (slotId: string) => {
    targetSlotRef.current = slotId;
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Persist form to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch (e) {
      console.error('Error saving draft', e);
    }
  }, [form]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Photo calculation
  const uploadedPhotosList = Object.entries(form.photos).filter(([_, url]) => !!url);
  const photoCount = uploadedPhotosList.length;
  const hasMainPhoto = !!form.photos['main'];
  const hasDefectPhoto = !!form.photos['defect'];
  const isPhotosValid = photoCount >= 3 && photoCount <= 8 && hasMainPhoto && hasDefectPhoto;

  // Step 2 & 3 real-time format validations
  const titleValidation = useMemo(() => validateTitle(form.title), [form.title]);
  const generalDescValidation = useMemo(() => validateGeneralDescription(form.generalDescription), [form.generalDescription]);
  const conditionDescValidation = useMemo(() => validateConditionDescription(form.conditionDescription), [form.conditionDescription]);
  const priceValidation = useMemo(() => validatePrice(form.price, form.originalPrice), [form.price, form.originalPrice]);

  const isTitleValid = titleValidation.isValid;
  const isBrandValid = form.brand.trim().length >= 2;
  const isModelValid = form.model.trim().length >= 2;
  const isCategoryValid = !!form.category;
  const isConditionValid = !!form.condition;
  const isConditionDescValid = conditionDescValidation.isValid;
  const charCount = form.generalDescription.trim().length;
  const isDescLengthValid = generalDescValidation.isValid;
  const hasAtLeastOneIncluded = form.includedItems.length >= 1;

  // Checklist for Step 2 General Description
  const descLower = form.generalDescription.toLowerCase();
  const checkBrandModel = (form.brand && descLower.includes(form.brand.toLowerCase())) || 
                          (form.model && descLower.includes(form.model.toLowerCase()));
  const checkState = form.condition && descLower.includes(form.condition.toLowerCase());
  const checkIncluded = descLower.includes('incluye') || descLower.includes('cargador') || descLower.includes('caja') || descLower.includes('manual');
  const checkWarranty = descLower.includes('garantía') || descLower.includes('garantia') || descLower.includes('días') || descLower.includes('meses');

  const isStep2Valid =
    isTitleValid &&
    isBrandValid &&
    isModelValid &&
    isCategoryValid &&
    isConditionValid &&
    isConditionDescValid &&
    isDescLengthValid &&
    hasAtLeastOneIncluded;

  // Step 3 Price & Calculations
  const isPriceValid = priceValidation.isValid;
  const discountPercent = form.originalPrice > form.price
    ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
    : 0;

  const commissionRate = COMMISSION_CONFIG.rate;
  const commissionAmount = calcSettlement(form.price, 'mercadopago', commissionRate).platformFee;
  const netEarnings = form.price - commissionAmount;

  const boostCosts: Record<'none' | 'basic' | 'premium', number> = {
    none: 0,
    basic: 990,
    premium: 2490,
  };
  const currentBoostCost = boostCosts[form.boostType];
  const totalCostBreakdown = currentBoostCost + commissionAmount;

  // Duration date calculation
  const expirationDateText = useMemo(() => {
    if (form.durationDays === 0) return 'Sin vencimiento (hasta agotar stock)';
    const d = new Date();
    d.setDate(d.getDate() + form.durationDays);
    return `Vence el ${d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  }, [form.durationDays]);

  const isStep3Valid = isPriceValid;

  // Checklist for Step 4 Confirmation
  const checklist = [
    {
      label: 'Fotos reales cargadas (mínimo 3, incluyendo foto del defecto/condición)',
      ok: isPhotosValid,
      step: 1,
      detail: `${photoCount}/8 fotos cargadas`,
    },
    {
      label: 'Título con formato válido (mín. 5 caracteres con nombre de producto)',
      ok: isTitleValid,
      step: 2,
      detail: titleValidation.message,
    },
    {
      label: 'Estado declarado con diagnóstico detallado (mín. 10 caracteres)',
      ok: isConditionValid && isConditionDescValid,
      step: 2,
      detail: conditionDescValidation.message,
    },
    {
      label: 'Descripción general completa (entre 80 y 600 caracteres con contenido técnico)',
      ok: isDescLengthValid,
      step: 2,
      detail: generalDescValidation.message,
    },
    {
      label: 'Precio de outlet menor al precio original con descuento real',
      ok: isPriceValid,
      step: 3,
      detail: priceValidation.discountMessage || priceValidation.priceMessage,
    },
    {
      label: 'Al menos un detalle de qué incluye la venta',
      ok: hasAtLeastOneIncluded,
      step: 2,
      detail: `${form.includedItems.length} componente(s) declarado(s)`,
    },
  ];

  const canPublish = checklist.every((item) => item.ok);

  // Filtered suggested brands
  const filteredBrands = KNOWN_BRANDS.filter((b) =>
    b.toLowerCase().includes(form.brand.toLowerCase())
  );

  // Stepper handlers
  const canGoToStep = (targetStep: number): boolean => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return isPhotosValid;
    if (targetStep === 3) return isPhotosValid && isStep2Valid;
    if (targetStep === 4) return isPhotosValid && isStep2Valid && isStep3Valid;
    return false;
  };

  const goToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (canGoToStep(targetStep)) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!isPhotosValid) {
        setTouched((prev) => ({ ...prev, photos: true }));
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isStep2Valid) {
        setTouched({
          title: true,
          brand: true,
          model: true,
          condition: true,
          conditionDescription: true,
          generalDescription: true,
          includedItems: true,
        });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!isStep3Valid) {
        setTouched((prev) => ({ ...prev, price: true, originalPrice: true }));
        return;
      }
      setCurrentStep(4);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Add / remove photo
  const handleAssignPhoto = (slotId: string, url: string) => {
    setForm((prev) => ({
      ...prev,
      photos: {
        ...prev.photos,
        [slotId]: url,
      },
    }));
    setActiveUploadSlot(null);
    setUploadUrlInput('');
  };

  const handleRemovePhoto = (slotId: string) => {
    setForm((prev) => {
      const nextPhotos = { ...prev.photos };
      delete nextPhotos[slotId];
      return { ...prev, photos: nextPhotos };
    });
  };

  // Final Publish Handler
  const handlePublish = () => {
    if (!canPublish) return;

    const mainImageUrl = form.photos['main'] || uploadedPhotosList[0]?.[1] || INITIAL_FORM.photos.main;
    const allImagesArray = uploadedPhotosList.map(([_, u]) => u);

    const newProductPayload = {
      title: `${form.title.trim()}`,
      vendor: currentUser?.fullName || 'ElectroPlaza Outlet',
      vendorRating: 4.9,
      estado: form.condition,
      cat: form.category,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice),
      discount: discountPercent,
      image: mainImageUrl,
      images: allImagesArray,
      stock: 1,
      conditionDetails: form.conditionDescription.trim(),
      warrantyDays: form.condition === 'Con falla' ? 30 : 90,
      specs: [
        `Marca: ${form.brand}`,
        `Modelo: ${form.model}`,
        form.serialNumber ? `N/S: ${form.serialNumber}` : 'Número de serie validado en depósito',
        `Incluye: ${form.includedItems.join(', ')}`,
        `Garantía oficial solooutlet`,
      ],
      isFeatured: form.boostType === 'premium',
      brand: form.brand,
      model: form.model,
      serialNumber: form.serialNumber || undefined,
      includes: form.includedItems,
      boostType: form.boostType,
    };

    // Store context add
    addNewProduct(newProductPayload);

    const generatedSku = `OUT-${form.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullProductObj: Product = {
      ...newProductPayload,
      id: `prod-${Date.now()}`,
      sku: generatedSku,
      createdAt: new Date().toISOString().split('T')[0],
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
    };

    setPublishedProduct({
      id: fullProductObj.id,
      sku: generatedSku,
      product: fullProductObj,
    });

    // Clear saved draft
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Copy product link to clipboard
  const handleCopyLink = () => {
    const url = window.location.origin + `/#catalog?sku=${publishedProduct?.sku}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Preview Product Object for Step 4
  const previewProduct: Product = {
    id: 'preview-prod',
    sku: `OUT-${form.category.slice(0, 3).toUpperCase()}-PREVIEW`,
    title: form.title || 'Título del producto en borrador',
    vendor: currentUser?.fullName || 'Tu Comercio Oficial',
    vendorRating: 5.0,
    estado: form.condition,
    cat: form.category,
    price: form.price || 0,
    originalPrice: form.originalPrice || 0,
    discount: discountPercent,
    image: form.photos['main'] || uploadedPhotosList[0]?.[1] || INITIAL_FORM.photos.main,
    images: uploadedPhotosList.map(([_, u]) => u),
    stock: 1,
    conditionDetails: form.conditionDescription || 'Sin descripción de estado',
    warrantyDays: form.condition === 'Con falla' ? 30 : 90,
    specs: [
      `Marca: ${form.brand || 'No especificada'}`,
      `Modelo: ${form.model || 'No especificado'}`,
      `Incluye: ${form.includedItems.join(', ') || 'Sin accesorios'}`,
    ],
    isFeatured: form.boostType === 'premium',
    createdAt: new Date().toISOString().split('T')[0],
    rating: 5.0,
    reviewCount: 0,
    reviews: [],
    brand: form.brand,
    model: form.model,
    serialNumber: form.serialNumber,
    includes: form.includedItems,
    boostType: form.boostType,
  };

  // Success view if already published
  if (publishedProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
              ¡Publicación activa y visible!
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Tu producto ya está publicado con total transparencia
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Los compradores ya pueden encontrarlo en el catálogo general, ver las fotos del estado declarado y pagar en cuotas protegidas.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Número de publicación (SKU):</span>
              <span className="font-mono font-bold text-slate-900">{publishedProduct.sku}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Impulso aplicado:</span>
              <span className="font-bold text-blue-600 capitalize">
                {form.boostType === 'none' ? 'Sin impulso (Catálogo general)' : form.boostType}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Vigencia estimada:</span>
              <span className="font-medium text-slate-800">{expirationDateText}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
            <button
              onClick={() => {
                openProductModal(publishedProduct.product);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Ver en el catálogo</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Compartir link directo</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setPublishedProduct(null);
                setForm(INITIAL_FORM);
                setCurrentStep(1);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              + Publicar otro producto de liquidación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Top Breadcrumb & Return to catalog */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => setCurrentView('catalog')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Catálogo
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-900">Publicar producto de outlet</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium border border-emerald-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Publicación 100% transparente</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Formulario de publicación paso a paso</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
            Publicá tu producto con claridad absoluta
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            El comprador de outlet valora la honestidad más que un empaque cerrado. Completá los 4 pasos para que quien compre entienda exactamente qué está adquiriendo y pague con confianza.
          </p>
        </div>

        {/* ── STEPPER (4 Steps with status: completado / actual / pendiente) ── */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Step 1 */}
            <button
              onClick={() => goToStep(1)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                currentStep === 1
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                  : isPhotosValid
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  currentStep === 1 ? 'text-blue-600' : isPhotosValid ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  Paso 1
                </span>
                {isPhotosValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{photoCount}/8 fotos</span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">Fotos reales</div>
              <div className="text-[11px] text-slate-500 truncate">Obligatorio defecto</div>
            </button>

            {/* Step 2 */}
            <button
              onClick={() => goToStep(2)}
              disabled={!canGoToStep(2)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                currentStep === 2
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 cursor-pointer'
                  : isStep2Valid
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer'
                  : canGoToStep(2)
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 cursor-pointer'
                  : 'border-slate-200/50 bg-slate-50/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  currentStep === 2 ? 'text-blue-600' : isStep2Valid ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  Paso 2
                </span>
                {isStep2Valid && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">Información & Estado</div>
              <div className="text-[11px] text-slate-500 truncate">Diagnóstico declarado</div>
            </button>

            {/* Step 3 */}
            <button
              onClick={() => goToStep(3)}
              disabled={!canGoToStep(3)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                currentStep === 3
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 cursor-pointer'
                  : isStep3Valid
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer'
                  : canGoToStep(3)
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 cursor-pointer'
                  : 'border-slate-200/50 bg-slate-50/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  currentStep === 3 ? 'text-blue-600' : isStep3Valid ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  Paso 3
                </span>
                {isStep3Valid && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">Precio & Impulso</div>
              <div className="text-[11px] text-slate-500 truncate">Descuento & Visibilidad</div>
            </button>

            {/* Step 4 */}
            <button
              onClick={() => goToStep(4)}
              disabled={!canGoToStep(4)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                currentStep === 4
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 cursor-pointer'
                  : canPublish
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer'
                  : canGoToStep(4)
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 cursor-pointer'
                  : 'border-slate-200/50 bg-slate-50/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  currentStep === 4 ? 'text-blue-600' : canPublish ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  Paso 4
                </span>
                {canPublish && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">Revisión & Publicar</div>
              <div className="text-[11px] text-slate-500 truncate">Checklist final</div>
            </button>

          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          PASO 1 — FOTOS DEL PRODUCTO
          ────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Paso 1 de 4 · Galería fotográfica
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                Fotos reales del producto (Mínimo 3, Máximo 8)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                El comprador necesita comprobar ocularmente el estado antes de confirmar la compra.
              </p>
            </div>

            {/* Photo Counter Badge */}
            <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 self-start sm:self-auto ${
              isPhotosValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Camera className="w-4 h-4" />
              <span>Fotos cargadas: {photoCount}/8</span>
              {isPhotosValid && <span className="text-emerald-600">✓ Válido</span>}
            </div>
          </div>

          {/* Strict Rules Visual Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Reglas estrictas de fotografía en solooutlet:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-900 block mb-0.5">1. Foto principal obligatoria</span>
                <p className="text-slate-500 text-[11px]">Producto completo sobre fondo neutro, bien iluminado.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-rose-200 bg-rose-50/20">
                <span className="font-bold text-rose-950 block mb-0.5">2. Foto del defecto obligatoria</span>
                <p className="text-rose-800 text-[11px]">Si está rayado, foto del rayón; si es sin caja, foto sin embalaje.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-900 block mb-0.5">3. Número de serie o modelo</span>
                <p className="text-slate-500 text-[11px]">Etiqueta o código que certifique originalidad.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-900 block mb-0.5">4. Ángulos generales</span>
                <p className="text-slate-500 text-[11px]">Perfil, vista trasera o accesorios incluidos.</p>
              </div>
            </div>
          </div>

          {/* Inline error if missing defect photo or less than 3 photos */}
          {touched.photos && !hasDefectPhoto && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block font-bold">La foto del estado es obligatoria para publicar con transparencia</strong>
                <span>Subí al menos una foto clara en el slot 2 mostrando el defecto, marca cosmética o producto sin caja.</span>
              </div>
            </div>
          )}

          {touched.photos && photoCount < 3 && hasDefectPhoto && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Debes cargar al menos 3 fotos reales del producto para poder avanzar.</span>
            </div>
          )}

          {/* Photo Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PHOTO_SLOTS.map((slot, index) => {
              const photoUrl = form.photos[slot.id];
              const isFilled = !!photoUrl;

              return (
                <div
                  key={slot.id}
                  className={`relative rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isFilled
                      ? 'border-blue-500 bg-white shadow-xs'
                      : slot.isDefectSlot
                      ? 'border-rose-300 bg-rose-50/30 border-dashed hover:border-rose-400'
                      : 'border-slate-300 bg-slate-50/50 border-dashed hover:border-slate-400'
                  }`}
                >
                  {/* Top Slot Header */}
                  <div className="p-3 pb-2 flex items-center justify-between border-b border-slate-100 bg-white/70">
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {slot.label}
                    </span>
                    {slot.isRequired && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        slot.isDefectSlot ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        Obligatoria
                      </span>
                    )}
                  </div>

                  {/* Slot Body / Preview or Upload Area */}
                  <div className="aspect-4/3 w-full relative bg-slate-100 flex items-center justify-center overflow-hidden">
                    {isFilled ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUploadSlot(slot.id);
                              setUploadUrlInput(photoUrl);
                              setUploadMethodTab('device');
                            }}
                            className="w-7 h-7 rounded-full bg-slate-900/80 text-white hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer shadow-md"
                            title="Cambiar foto desde celular o PC"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(slot.id)}
                            className="w-7 h-7 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-md"
                            title="Eliminar foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 text-center flex flex-col items-center justify-center w-full">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                          slot.isDefectSlot ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Camera className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mb-2.5 line-clamp-2 px-1">
                          {slot.description}
                        </p>
                        
                        {/* Dual action buttons: Desde Celular / PC o Modal */}
                        <div className="flex flex-col w-full gap-1.5 px-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => triggerMobileCameraPicker(slot.id)}
                              className="py-1.5 px-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Sacar foto o elegir de la galería del celular"
                            >
                              <Smartphone className="w-3 h-3 shrink-0" />
                              <span className="truncate">Celular</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerPCFilePicker(slot.id)}
                              className="py-1.5 px-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Buscar archivo en tu computadora"
                            >
                              <Monitor className="w-3 h-3 shrink-0" />
                              <span className="truncate">PC</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveUploadSlot(slot.id);
                              setUploadUrlInput(slot.samplePlaceholder);
                              setUploadMethodTab('device');
                            }}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline py-0.5 cursor-pointer"
                          >
                            Otras opciones (URL / Ejemplo)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slot Footer explanation for buyer transparency */}
                  <div className="p-2.5 bg-slate-50 text-[10px] text-slate-500 border-t border-slate-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {isFilled ? 'Foto lista para el catálogo' : 'El comprador verá esta toma'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hidden File Inputs for PC & Mobile Native Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleDeviceFileSelect(e)}
          />
          {/* Mobile Camera Input with capture="environment" for direct camera opening on smartphones */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleDeviceFileSelect(e)}
          />

          {/* Upload Modal / Multi-source dialog (Celular, PC o URL) */}
          {activeUploadSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Cargar foto para {PHOTO_SLOTS.find(s => s.id === activeUploadSlot)?.label || 'el slot'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Elegí si preferís subir desde tu celular, PC o pegar una URL.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveUploadSlot(null)}
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs selector: Celular/PC vs Enlace Web vs Muestra */}
                <div className="flex border-b border-slate-200 mb-5">
                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('device')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                      uploadMethodTab === 'device'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Desde Celular o PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('url')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                      uploadMethodTab === 'url'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Enlace Web (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('samples')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                      uploadMethodTab === 'samples'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Foto sugerida</span>
                  </button>
                </div>

                {/* Tab 1: Direct Device Upload (PC or Mobile) */}
                {uploadMethodTab === 'device' && (
                  <div className="space-y-4">
                    {/* Drag and drop / Click area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, activeUploadSlot);
                      }}
                      className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50/70'
                          : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
                      }`}
                      onClick={() => triggerPCFilePicker(activeUploadSlot)}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 shadow-xs flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mb-1">
                        Arrastrá y soltá una foto acá, o hacé clic para explorar
                      </span>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Compatible con JPG, PNG, WEBP o fotos de cámara directa.
                      </p>
                    </div>

                    {/* Dual explicit buttons for Mobile vs PC */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => triggerMobileCameraPicker(activeUploadSlot)}
                        className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="text-left">
                          <span className="block leading-tight">Cámara o Galería</span>
                          <span className="text-[10px] font-normal text-blue-600">Desde tu Celular</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerPCFilePicker(activeUploadSlot)}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Monitor className="w-4 h-4 text-slate-600 shrink-0" />
                        <div className="text-left">
                          <span className="block leading-tight">Explorar archivos</span>
                          <span className="text-[10px] font-normal text-slate-500">Desde tu Computadora</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: URL input */}
                {uploadMethodTab === 'url' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Pegar URL de la imagen
                    </label>
                    <input
                      type="url"
                      value={uploadUrlInput}
                      onChange={(e) => setUploadUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                    />

                    {uploadUrlInput && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                        <img
                          src={uploadUrlInput}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Suggested sample for fast testing */}
                {uploadMethodTab === 'samples' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Podés usar la foto de muestra de estudio recomendada para este slot:
                    </p>
                    {PHOTO_SLOTS.find(s => s.id === activeUploadSlot)?.samplePlaceholder && (
                      <div
                        onClick={() => {
                          const sample = PHOTO_SLOTS.find(s => s.id === activeUploadSlot)?.samplePlaceholder;
                          if (sample) handleAssignPhoto(activeUploadSlot, sample);
                        }}
                        className="group relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs hover:border-blue-500"
                      >
                        <img
                          src={PHOTO_SLOTS.find(s => s.id === activeUploadSlot)?.samplePlaceholder}
                          alt="Sugerencia"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          ✓ Usar esta foto de muestra
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                  <button
                    type="button"
                    onClick={() => setActiveUploadSlot(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {uploadMethodTab === 'url' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (uploadUrlInput) {
                          handleAssignPhoto(activeUploadSlot, uploadUrlInput);
                        }
                      }}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Guardar foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentView('catalog')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancelar y volver
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isPhotosValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              <span>Continuar al Paso 2: Información</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          PASO 2 — INFORMACIÓN DEL PRODUCTO
          ────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          
          <div className="border-b border-slate-100 pb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Paso 2 de 4 · Identidad y Estado
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Información del producto y condición declarada
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Completá con precisión técnica. El estado declarado es el corazón de la compra en solooutlet.
            </p>
          </div>

          {/* SECTION A: Identidad del producto */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Identidad del producto</span>
            </h3>

            {/* Nombre del producto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Nombre del producto *
                </label>
                <span className="text-[11px] text-slate-400">
                  El comprador verá esto como título principal
                </span>
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => handleBlur('title')}
                placeholder='Ej: "Notebook HP 14 Core i5 8GB"'
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                  touched.title && !isTitleValid
                    ? 'border-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {touched.title && !isTitleValid && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Ingresá un título descriptivo de al menos 5 caracteres.
                </p>
              )}
            </div>

            {/* Marca, Modelo, Categoría & Serial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Marca con autosugerencias */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  onFocus={() => setBrandFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setBrandFocused(false), 200);
                    handleBlur('brand');
                  }}
                  placeholder="Ej: HP, Samsung..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    touched.brand && !isBrandValid
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {brandFocused && filteredBrands.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                    {filteredBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onMouseDown={() => setForm((prev) => ({ ...prev, brand: b }))}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
                {touched.brand && !isBrandValid && (
                  <p className="text-[11px] text-rose-600 mt-1">Marca requerida.</p>
                )}
              </div>

              {/* Modelo exacto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modelo exacto *
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  onBlur={() => handleBlur('model')}
                  placeholder='Ej: "HP 14-dq2055wm"'
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    touched.model && !isModelValid
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {touched.model && !isModelValid && (
                  <p className="text-[11px] text-rose-600 mt-1">Modelo requerido.</p>
                )}
              </div>

              {/* Número de serie (opcional con tooltip) */}
              <div className="relative group">
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Número de serie
                  </label>
                  <div className="relative group/tip cursor-help">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-30 text-center">
                      Agregar el número de serie genera más confianza en el comprador y facilita la validación de garantía.
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  placeholder="Ej: 5CD1298XYZ (opcional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as CategoryType })}
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
          </div>

          {/* SECTION B: Estado declarado — Selector visual con cards grandes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>El corazón del formulario</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Estado declarado del producto *
              </h3>
              <p className="text-xs text-slate-500">
                Elegí con total transparencia. El comprador verá exactamente este badge antes de agregar al carrito.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CONDITION_OPTIONS.map((item) => {
                const isSelected = form.condition === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        condition: item.type,
                      }));
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? item.borderActive + ' bg-white shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${item.badgeBg}`}>
                          <span className={`w-2 h-2 rounded-full ${item.bulletColor}`} />
                          {item.tag}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mb-1">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Garantía: {item.type === 'Con falla' ? '30 días' : '90 días'}</span>
                      <span className="font-semibold text-blue-600">
                        {isSelected ? 'Seleccionado' : 'Elegir'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Campo adicional desplegado: Descripción del estado (obligatorio) */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Descripción del estado (Obligatorio) *</span>
                </label>
                <span className="text-[11px] text-blue-700 font-medium">
                  Estado actual: <strong>{form.condition}</strong>
                </span>
              </div>

              <textarea
                rows={3}
                value={form.conditionDescription}
                onChange={(e) => setForm({ ...form, conditionDescription: e.target.value })}
                onBlur={() => handleBlur('conditionDescription')}
                placeholder={
                  CONDITION_OPTIONS.find((c) => c.type === form.condition)?.placeholder ||
                  'Describí con detalle el estado declarado...'
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none bg-white transition-colors ${
                  touched.conditionDescription && !isConditionDescValid
                    ? 'border-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:border-blue-600'
                }`}
              />

              {touched.conditionDescription && !isConditionDescValid && (
                <p className="text-[11px] text-rose-600">
                  Por favor detallá el estado con al menos 10 caracteres para garantizar transparencia con el comprador.
                </p>
              )}

              <p className="text-[11px] text-slate-500">
                💡 <em>Esto aparecerá en el recuadro destacado de diagnóstico dentro del detalle del producto.</em>
              </p>
            </div>
          </div>

          {/* SECTION C: Descripción general con contador y checklist de ayuda */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Descripción general del producto *
                </h3>
                <p className="text-xs text-slate-500">
                  Explicá las características principales, uso y beneficios. Mínimo 80, máximo 600 caracteres.
                </p>
              </div>

              {/* Character counter */}
              <div className={`px-3 py-1 rounded-xl text-xs font-bold tabular-nums self-start sm:self-auto ${
                charCount < 80
                  ? 'bg-amber-100 text-amber-800'
                  : charCount > 600
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {charCount} / 600 caracteres {charCount >= 80 && charCount <= 600 && '✓'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Textarea */}
              <div className="lg:col-span-8">
                <textarea
                  rows={6}
                  value={form.generalDescription}
                  onChange={(e) => setForm({ ...form, generalDescription: e.target.value })}
                  onBlur={() => handleBlur('generalDescription')}
                  placeholder="Describí las funciones clave del equipo, el estado de la batería o funcionamiento general, los accesorios y qué garantía ofrecés..."
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                    touched.generalDescription && !isDescLengthValid
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {touched.generalDescription && !isDescLengthValid && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    La descripción debe tener entre 80 y 600 caracteres (actual: {charCount}).
                  </p>
                )}
              </div>

              {/* Helper Checklist Card */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Checklist de ayuda
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2">
                  Se tildan a medida que los incluís en el texto:
                </p>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${checkBrandModel ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      checkBrandModel ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <span>Incluye marca y modelo</span>
                  </div>

                  <div className={`flex items-center gap-2 ${checkState ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      checkState ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <span>Menciona el estado ({form.condition})</span>
                  </div>

                  <div className={`flex items-center gap-2 ${checkIncluded ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      checkIncluded ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <span>Aclara qué está incluido</span>
                  </div>

                  <div className={`flex items-center gap-2 ${checkWarranty ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      checkWarranty ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <span>Menciona garantía</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Qué incluye la venta — Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Qué incluye la venta *
                </h3>
                <p className="text-xs text-slate-500">
                  Marcá los componentes físicos y legales que recibirá el comprador en la encomienda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INCLUDED_OPTIONS.map((item) => {
                const isChecked = form.includedItems.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((prev) => ({
                            ...prev,
                            includedItems: [...prev.includedItems, item],
                          }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            includedItems: prev.includedItems.filter((i) => i !== item),
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>

            {/* Soft notice if none checked */}
            {form.includedItems.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Aclarar qué no incluye la venta también genera confianza. Marcá al menos los accesorios o garantía técnica.
                </span>
              </div>
            )}
          </div>

          {/* Stepper Footer Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Paso 1: Fotos</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isStep2Valid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              <span>Continuar al Paso 3: Precio & Impulso</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          PASO 3 — PRECIO Y PUBLICIDAD
          ────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          
          <div className="border-b border-slate-100 pb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Paso 3 de 4 · Finanzas y Visibilidad
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Precio de outlet, comisión y opciones de publicidad
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Fijá tu precio con descuento real en ARS y elegí el nivel de impulso para acelerar la venta.
            </p>
          </div>

          {/* PRECIO EN ARS & DESCUENTO CALCULADO */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Precio en pesos argentinos (ARS)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Precio publicado en ARS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio de venta outlet (ARS) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    onBlur={() => handleBlur('price')}
                    placeholder="369000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Formato visual: <strong>{formatPrice(form.price || 0)}</strong>
                </div>
              </div>

              {/* Precio original de lista */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Precio original de lista (Nuevo en caja) *
                  </label>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-600 text-white shadow-2xs">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={form.originalPrice || ''}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    onBlur={() => handleBlur('originalPrice')}
                    placeholder="519000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 tabular-nums focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Precio tachado que verá el comprador: <del>{formatPrice(form.originalPrice || 0)}</del>
                </div>
              </div>

            </div>

            {/* Validation: price >= originalPrice */}
            {form.price >= form.originalPrice && form.originalPrice > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>El precio de outlet debe ser menor al precio original.</span>
              </div>
            )}

            {/* Platform commission estimation banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">
                  Comisión solooutlet transparente: 8% ({formatPrice(commissionAmount)})
                </span>
                <p className="text-slate-500 text-[11px]">
                  Incluye pasarela segura de cobro Mercado Pago y protección contra fraude.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold self-start sm:self-auto tabular-nums">
                Recibís en tu cuenta: {formatPrice(netEarnings > 0 ? netEarnings : 0)}
              </div>
            </div>
          </div>

          {/* OPCIONES DE PUBLICIDAD (SISTEMA DE IMPULSO) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                <span>Acelerador de ventas</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Opciones de publicidad (Sistema de impulso)
              </h3>
              <p className="text-xs text-slate-500">
                Elegí cómo y dónde querés que se exhiba tu publicación para vender más rápido:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option 1: Sin impulso */}
              <div
                onClick={() => setForm({ ...form, boostType: 'none' })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  form.boostType === 'none'
                    ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Sin impulso</span>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Gratuito
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Aparece en el catálogo general en orden cronológico estándar.
                  </p>

                  {/* Mock preview card badge */}
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[10px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800">Vista previa en catálogo:</div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        Estándar
                      </span>
                      <span>Posición regular</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">$0 costo adicional</span>
                  <span className={form.boostType === 'none' ? 'text-blue-600' : 'text-slate-400'}>
                    {form.boostType === 'none' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </div>
              </div>

              {/* Option 2: Impulso básico */}
              <div
                onClick={() => setForm({ ...form, boostType: 'basic' })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  form.boostType === 'basic'
                    ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Impulso básico</span>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      $990/semana
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Aparece destacado dentro de su categoría con badge "Destacado".
                  </p>

                  {/* Mock preview card badge */}
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[10px] text-blue-900 space-y-1">
                    <div className="font-bold">Vista previa en catálogo:</div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-extrabold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Destacado
                      </span>
                      <span>En tope de categoría</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-600">$990 ARS</span>
                  <span className={form.boostType === 'basic' ? 'text-blue-600' : 'text-slate-400'}>
                    {form.boostType === 'basic' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </div>
              </div>

              {/* Option 3: Impulso premium */}
              <div
                onClick={() => setForm({ ...form, boostType: 'premium' })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  form.boostType === 'premium'
                    ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Impulso premium</span>
                    <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      $2.490/semana
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Aparece en la sección "Últimas oportunidades" del home, con badge "Premium".
                  </p>

                  {/* Mock preview card badge */}
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[10px] text-purple-900 space-y-1">
                    <div className="font-bold">Vista previa en catálogo & Home:</div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-extrabold flex items-center gap-1">
                        ★ Premium
                      </span>
                      <span>Prioridad en búsquedas</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-700">$2.490 ARS</span>
                  <span className={form.boostType === 'premium' ? 'text-blue-600' : 'text-slate-400'}>
                    {form.boostType === 'premium' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </div>
              </div>

            </div>

            {/* Total Cost Breakdown when paying boost */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 mb-1">
                Desglose total estimado:
              </div>
              <div className="flex justify-between">
                <span>Precio del impulso ({form.boostType}):</span>
                <span className="font-bold tabular-nums">{formatPrice(currentBoostCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Comisión de la plataforma (8% al concretar venta):</span>
                <span className="font-bold tabular-nums">{formatPrice(commissionAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200 text-blue-950 font-extrabold text-sm">
                <span>Total deducciones e impulso:</span>
                <span className="tabular-nums font-display">{formatPrice(totalCostBreakdown)}</span>
              </div>
            </div>
          </div>

          {/* DURACIÓN DE LA PUBLICACIÓN */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Duración de la publicación
                </h3>
                <p className="text-xs text-slate-500">
                  Elegí el plazo de vigencia. Podés renovarlo sin cargo en cualquier momento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { days: 7, label: '7 días' },
                { days: 15, label: '15 días' },
                { days: 30, label: '30 días' },
                { days: 0, label: 'Sin vencimiento' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setForm({ ...form, durationDays: opt.days })}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    form.durationDays === opt.days
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span className="text-slate-500">Fecha de vencimiento calculada:</span>
              <strong className="text-slate-900">{expirationDateText}</strong>
            </div>
          </div>

          {/* Stepper Footer Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Paso 2: Información</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isStep3Valid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              <span>Continuar al Paso 4: Revisión final</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          PASO 4 — REVISIÓN Y CONFIRMACIÓN
          ────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          
          <div className="border-b border-slate-100 pb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Paso 4 de 4 · Revisión y Confirmación
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Resumen completo y vista previa interactiva
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comprobá cómo verán los compradores tu publicación en el catálogo antes de confirmarla.
            </p>
          </div>

          {/* Real Preview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Interactive Card Preview (Left) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200/90 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Card real en el catálogo:</span>
                <span className="text-[11px] text-blue-600 font-semibold">Vista en vivo</span>
              </div>

              {/* Mock Product Card using real data */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                <div className="relative aspect-4/3 w-full bg-slate-100">
                  <img
                    src={previewProduct.image}
                    alt={previewProduct.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border backdrop-blur-md shadow-xs ${
                      getConditionBadgeStyle(previewProduct.estado).bg
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getConditionBadgeStyle(previewProduct.estado).dot}`} />
                      {previewProduct.estado}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {form.boostType === 'premium' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-600 text-white shadow-xs">
                          ★ Premium
                        </span>
                      )}
                      {form.boostType === 'basic' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                          Destacado
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-600 text-white shadow-xs">
                        -{previewProduct.discount}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                    {previewProduct.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{previewProduct.vendor}</span>
                    <span className="text-slate-400">Garantía {previewProduct.warrantyDays}d</span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 line-clamp-2">
                    <strong>Estado:</strong> {form.conditionDescription}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatPrice(previewProduct.price)}
                      </span>
                      <span className="text-xs text-slate-400 line-through tabular-nums ml-2">
                        {formatPrice(previewProduct.originalPrice)}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-blue-600">
                      1 en stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Galería de fotos ({uploadedPhotosList.length}):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {uploadedPhotosList.map(([slotId, url]) => (
                    <div
                      key={slotId}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white"
                    >
                      <img src={url} alt={slotId} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist de publicación transparente (Right) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Checklist de publicación transparente</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Todos los ítems deben estar en verde para garantizar que el comprador reciba información completa.
                </p>

                <div className="space-y-2.5 pt-2">
                  {checklist.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        item.ok
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.ok ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            ✕
                          </div>
                        )}
                        <span className="font-medium">{item.label}</span>
                      </div>

                      {!item.ok && (
                        <button
                          type="button"
                          onClick={() => goToStep(item.step as 1 | 2 | 3 | 4)}
                          className="text-[11px] font-bold text-rose-700 hover:underline shrink-0 ml-2 cursor-pointer"
                        >
                          Completar en Paso {item.step} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications & Includes Summary */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">
                  Resumen de la venta:
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Marca:</strong> {form.brand}</div>
                  <div><strong>Modelo:</strong> {form.model}</div>
                  <div><strong>Categoría:</strong> {form.category}</div>
                  <div><strong>N/S:</strong> {form.serialNumber || 'No declarado'}</div>
                </div>
                <div className="pt-1 text-slate-600">
                  <strong>Incluye:</strong> {form.includedItems.join(', ')}
                </div>
              </div>

              {/* Confirmation CTA button */}
              <div className="space-y-3">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!canPublish}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      canPublish
                        ? 'bg-[#3B5BDB] hover:bg-[#2f4cb3] text-white shadow-lg shadow-[#3B5BDB]/25 active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Publicar producto</span>
                  </button>

                  {!canPublish && (
                    <div className="text-center text-[11px] text-slate-500 mt-2">
                      💡 Completá todos los campos requeridos para publicar con transparencia.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al Paso 3: Precio</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Tus datos se guardaron automáticamente en este navegador
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
