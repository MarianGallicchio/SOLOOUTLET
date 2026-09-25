import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  RotateCcw,
  Zap,
  Shirt,
  Home,
  Laptop,
  Headphones,
  Tag,
  Check,
  Percent,
  Boxes,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Filter,
  Clock,
} from 'lucide-react';
import { ConditionType, CategoryType, Product } from '../types';

export type SortOptionType = 'recommended' | 'price-asc' | 'price-desc' | 'newest' | 'discount';

export const SORT_OPTIONS: {
  id: SortOptionType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'price-asc',
    label: 'Precio: Menor a Mayor',
    shortLabel: 'Precio: Menor a Mayor',
    description: 'Los productos y lotes más accesibles primero',
    icon: ArrowUpDown,
  },
  {
    id: 'price-desc',
    label: 'Precio: Mayor a Menor',
    shortLabel: 'Precio: Mayor a Menor',
    description: 'Artículos premium y de mayor valor primero',
    icon: ArrowUpDown,
  },
  {
    id: 'newest',
    label: 'Recién agregados',
    shortLabel: 'Recién agregados',
    description: 'Nuevos lotes y devoluciones ingresadas al outlet',
    icon: Clock,
  },
  {
    id: 'discount',
    label: 'Mayor descuento (%)',
    shortLabel: 'Mayor % OFF',
    description: 'Liquidaciones de hasta 75% de ahorro real',
    icon: Percent,
  },
  {
    id: 'recommended',
    label: 'Recomendados de Outlet',
    shortLabel: 'Recomendados',
    description: 'Selección equilibrada por estado y garantía',
    icon: Sparkles,
  },
];

// Featured tags requested by user + popular tags
export const POPULAR_TAGS = [
  { id: 'Electro', label: 'Electro', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300' },
  { id: 'Ropa', label: 'Ropa', icon: Shirt, color: 'text-violet-600 bg-violet-50 border-violet-200 hover:border-violet-300' },
  { id: 'Hogar', label: 'Hogar', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-300' },
  { id: 'Tecnología', label: 'Tecnología', icon: Laptop, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300' },
  { id: 'Audio', label: 'Audio', icon: Headphones, color: 'text-rose-600 bg-rose-50 border-rose-200 hover:border-rose-300' },
  { id: 'Gaming', label: 'Gaming', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-300' },
  { id: 'Calzado', label: 'Calzado', icon: Tag, color: 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-300' },
];

export const ALL_CATEGORIES: { id: CategoryType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Tecnología', label: 'Tecnología', icon: Laptop },
  { id: 'Electrodomésticos', label: 'Electrodomésticos', icon: Zap },
  { id: 'Hogar', label: 'Hogar y Muebles', icon: Home },
  { id: 'Indumentaria', label: 'Indumentaria & Ropa', icon: Shirt },
  { id: 'Deportes', label: 'Deportes y Outdoor', icon: Tag },
  { id: 'Otros', label: 'Otros Rubros', icon: Boxes },
];

export const ALL_CONDITIONS: { id: ConditionType; label: string; subtitle: string; dotColor: string }[] = [
  { id: 'Devolución', label: 'Devolución', subtitle: 'Grado A · Como nuevo', dotColor: 'bg-emerald-500' },
  { id: 'Sin caja', label: 'Sin caja original', subtitle: 'Grado A/B · Embalaje de seguridad', dotColor: 'bg-sky-500' },
  { id: 'Rayado', label: 'Rayado cosmético', subtitle: 'Grado B · Detalle estético menor', dotColor: 'bg-amber-500' },
  { id: 'Con falla', label: 'Con falla informada', subtitle: 'Grado C · Falla menor declarada', dotColor: 'bg-orange-500' },
  { id: 'Reacondicionado', label: 'Reacondicionado', subtitle: 'Certificado · Service oficial', dotColor: 'bg-purple-500' },
];

/** Resuelve etiquetas normalizadas para un producto (usando tags explícitos o inferidos). */
export function getProductTags(p: Product): string[] {
  const set = new Set<string>(p.tags || []);
  const text = `${p.title} ${p.specs?.join(' ') || ''} ${p.cat} ${p.conditionDetails} ${p.vendor}`.toLowerCase();

  // Electro
  if (
    p.cat === 'Electrodomésticos' ||
    p.cat === 'Tecnología' ||
    /electro|cafetera|aspiradora|tv|notebook|auricular|parlante|tablet|bar|vaporizador|pantalla|led/i.test(text)
  ) {
    set.add('Electro');
  }

  // Ropa
  if (
    p.cat === 'Indumentaria' ||
    /ropa|campera|zapatilla|remera|buzo|pantalón|calzado|talle|impermeable|outfit|vestir|moda/i.test(text)
  ) {
    set.add('Ropa');
  }

  // Hogar
  if (
    p.cat === 'Hogar' ||
    /hogar|mueble|silla|mesa|aspiradora|cafetera|escritorio|colchón|bazar|decoración|cocina/i.test(text)
  ) {
    set.add('Hogar');
  }

  // Tecnología
  if (
    p.cat === 'Tecnología' ||
    /notebook|intel|core|ram|ssd|pantalla|tablet|auricular|bluetooth|4k|hdr|smart|tecnolog/i.test(text)
  ) {
    set.add('Tecnología');
  }

  // Audio
  if (/auricular|parlante|audio|sonido|bluetooth|anc|altavoz/i.test(text)) {
    set.add('Audio');
  }

  // Gaming
  if (/gamer|gaming|juegos|consola|reclinable|rgb/i.test(text)) {
    set.add('Gaming');
  }

  // Calzado
  if (/zapatilla|calzado|suela|running|talle 42|deportivo/i.test(text)) {
    set.add('Calzado');
  }

  return Array.from(set);
}

export const CatalogView: React.FC = () => {
  const {
    products,
    selectedStateFilter,
    setSelectedStateFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [sortOption, setSortOption] = useState<SortOptionType>('recommended');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [minDiscount, setMinDiscount] = useState<number>(0); // 0, 30, 50
  const [priceRange, setPriceRange] = useState<'all' | 'under-50k' | '50k-150k' | 'over-150k'>('all');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync if selectedCategoryFilter matches one of our tags (e.g. from search or external link)
  useEffect(() => {
    if (selectedCategoryFilter === 'Electro' || selectedCategoryFilter === 'Ropa' || selectedCategoryFilter === 'Hogar') {
      setSelectedTagFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Click handler for Tag Filter
  const handleTagClick = (tagId: string) => {
    if (selectedTagFilter === tagId) {
      setSelectedTagFilter(null);
    } else {
      setSelectedTagFilter(tagId);
      // If tag is 'Ropa', 'Electro', or 'Hogar', clear conflicting rigid category if needed
      if (tagId === 'Electro' && selectedCategoryFilter && selectedCategoryFilter !== 'Electrodomésticos' && selectedCategoryFilter !== 'Tecnología') {
        setSelectedCategoryFilter(null);
      } else if (tagId === 'Ropa' && selectedCategoryFilter && selectedCategoryFilter !== 'Indumentaria') {
        setSelectedCategoryFilter(null);
      } else if (tagId === 'Hogar' && selectedCategoryFilter && selectedCategoryFilter !== 'Hogar') {
        setSelectedCategoryFilter(null);
      }
    }
  };

  // Click handler for Category Filter
  const handleCategoryClick = (cat: CategoryType) => {
    if (selectedCategoryFilter === cat) {
      setSelectedCategoryFilter(null);
    } else {
      setSelectedCategoryFilter(cat);
    }
  };

  // Click handler for Condition Filter
  const handleStateClick = (state: ConditionType) => {
    if (selectedStateFilter === state) {
      setSelectedStateFilter(null);
    } else {
      setSelectedStateFilter(state);
    }
  };

  const clearAllFilters = () => {
    setSelectedStateFilter(null);
    setSelectedCategoryFilter(null);
    setSelectedTagFilter(null);
    setSearchQuery('');
    setOnlyInStock(false);
    setMinDiscount(0);
    setPriceRange('all');
    setSortOption('recommended');
  };

  // Live count calculations for each tag based on current products
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    POPULAR_TAGS.forEach((t) => {
      counts[t.id] = 0;
    });

    products.forEach((p) => {
      const tags = getProductTags(p);
      tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [products]);

  // Live count calculations for categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.cat] = (counts[p.cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Live count calculations for condition
  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.estado] = (counts[p.estado] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Current active sort config
  const currentSortObj = SORT_OPTIONS.find((s) => s.id === sortOption) || SORT_OPTIONS[0];

  // Main filter and sort computation
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products
      .filter((p) => {
        // Tag filter (e.g. 'Ropa', 'Electro', 'Hogar', 'Gaming', etc.)
        if (selectedTagFilter) {
          const productTags = getProductTags(p);
          const hasTag = productTags.includes(selectedTagFilter);
          if (!hasTag) {
            // Also check friendly fallbacks
            if (selectedTagFilter === 'Electro' && (p.cat === 'Electrodomésticos' || p.cat === 'Tecnología')) {
              // match
            } else if (selectedTagFilter === 'Ropa' && p.cat === 'Indumentaria') {
              // match
            } else if (selectedTagFilter === 'Hogar' && p.cat === 'Hogar') {
              // match
            } else {
              return false;
            }
          }
        }

        // Category filter
        if (selectedCategoryFilter) {
          // If selectedCategoryFilter is 'Electro' or 'Ropa', treat as tag
          if (selectedCategoryFilter === 'Electro') {
            if (p.cat !== 'Electrodomésticos' && p.cat !== 'Tecnología' && !getProductTags(p).includes('Electro')) {
              return false;
            }
          } else if (selectedCategoryFilter === 'Ropa') {
            if (p.cat !== 'Indumentaria' && !getProductTags(p).includes('Ropa')) {
              return false;
            }
          } else if (p.cat !== selectedCategoryFilter) {
            return false;
          }
        }

        // State / Condition filter
        if (selectedStateFilter && p.estado !== selectedStateFilter) {
          return false;
        }

        // Stock filter
        if (onlyInStock && p.stock <= 0) {
          return false;
        }

        // Discount filter
        if (minDiscount > 0 && p.discount < minDiscount) {
          return false;
        }

        // Price range filter
        if (priceRange === 'under-50k' && p.price >= 50000) return false;
        if (priceRange === '50k-150k' && (p.price < 50000 || p.price > 150000)) return false;
        if (priceRange === 'over-150k' && p.price <= 150000) return false;

        // Search text matching: title or description in real-time as user types
        if (q) {
          const title = (p.title || '').toLowerCase();
          const desc = ((p.description || '') + ' ' + (p.conditionDetails || '')).toLowerCase();
          const specs = (p.specs || []).join(' ').toLowerCase();
          const vendor = (p.vendor || '').toLowerCase();
          const cat = (p.cat || '').toLowerCase();
          const estado = (p.estado || '').toLowerCase();
          const tags = getProductTags(p).join(' ').toLowerCase();

          const matchTitle = title.includes(q);
          const matchDesc = desc.includes(q) || specs.includes(q);
          const matchOther = vendor.includes(q) || cat.includes(q) || estado.includes(q) || tags.includes(q);

          if (!matchTitle && !matchDesc && !matchOther) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Price low to high
        if (sortOption === 'price-asc') return a.price - b.price;
        // Price high to low
        if (sortOption === 'price-desc') return b.price - a.price;
        // Recently added
        if (sortOption === 'newest') {
          const dateA = new Date(a.createdAt).getTime() || 0;
          const dateB = new Date(b.createdAt).getTime() || 0;
          if (dateB !== dateA) return dateB - dateA;
          return b.id.localeCompare(a.id);
        }
        // Discount percentage
        if (sortOption === 'discount') return b.discount - a.discount;
        // Recommended default
        return 0;
      });
  }, [
    products,
    selectedTagFilter,
    selectedCategoryFilter,
    selectedStateFilter,
    onlyInStock,
    minDiscount,
    priceRange,
    searchQuery,
    sortOption,
  ]);

  const activeFiltersCount = [
    Boolean(selectedTagFilter),
    Boolean(selectedCategoryFilter),
    Boolean(selectedStateFilter),
    Boolean(onlyInStock),
    minDiscount > 0,
    priceRange !== 'all',
    Boolean(searchQuery),
    sortOption !== 'recommended',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  // Reusable Sidebar Content Component (shared by desktop sidebar & mobile drawer)
  const FilterSidebarContent = (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* Header of Sidebar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Filtros & Categorías
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* SECTION 1: TAGS DE OUTLET (Featured: Ropa, Electro, Hogar, etc.) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Etiquetas destacadas
          </span>
          {selectedTagFilter && (
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="text-2xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Quitar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTagFilter === tag.id;
            const Icon = tag.icon;
            const count = tagCounts[tag.id] || 0;

            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                  }`}
                />
                <span>{tag.label}</span>
                <span
                  className={`text-2xs font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-blue-700/60 text-white' : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {count}
                </span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CATEGORÍAS PRINCIPALES */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Rubros & Categorías
          </span>
          {selectedCategoryFilter && (
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className="text-2xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Todas
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* Option: Todas */}
          <button
            onClick={() => setSelectedCategoryFilter(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              selectedCategoryFilter === null && !selectedTagFilter
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5 text-slate-400" />
              <span>Todos los rubros</span>
            </div>
            <span className="text-2xs text-slate-400 font-mono">{products.length}</span>
          </button>

          {/* Individual Categories */}
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{cat.label}</span>
                </div>
                <span
                  className={`text-2xs font-mono ml-2 shrink-0 ${
                    isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ESTADO / CONDICIÓN DEL PRODUCTO */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Estado verificado
          </span>
          {selectedStateFilter && (
            <button
              onClick={() => setSelectedStateFilter(null)}
              className="text-2xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Cualquiera
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {ALL_CONDITIONS.map((cond) => {
            const isSelected = selectedStateFilter === cond.id;
            const count = conditionCounts[cond.id] || 0;

            return (
              <button
                key={cond.id}
                onClick={() => handleStateClick(cond.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cond.dotColor}`} />
                  <div className="min-w-0">
                    <p className={`text-xs leading-none truncate ${isSelected ? 'font-semibold text-white' : 'font-medium'}`}>
                      {cond.label}
                    </p>
                    <p className={`text-2xs mt-0.5 leading-none truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {cond.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xs font-mono shrink-0 ml-2 ${
                    isSelected ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: DESCUENTO / OFERTAS */}
      <div className="pt-4 border-t border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
          Descuentos de Liquidación
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 0, label: 'Todos' },
            { value: 30, label: '+30%' },
            { value: 50, label: '+50%' },
          ].map((d) => (
            <button
              key={d.value}
              onClick={() => setMinDiscount(d.value)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                minDiscount === d.value
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5: RANGO DE PRECIO */}
      <div className="pt-4 border-t border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Rango de precio
        </span>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'Cualquier precio' },
            { id: 'under-50k', label: 'Hasta $50.000' },
            { id: '50k-150k', label: '$50.000 a $150.000' },
            { id: 'over-150k', label: 'Más de $150.000' },
          ].map((pr) => (
            <label
              key={pr.id}
              className="flex items-center gap-2 py-1 px-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="priceRangeRadio"
                checked={priceRange === pr.id}
                onChange={() => setPriceRange(pr.id as any)}
                className="text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
              />
              <span className={priceRange === pr.id ? 'font-semibold text-slate-900' : ''}>
                {pr.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* SECTION 6: DISPONIBILIDAD */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none border border-slate-100">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 block leading-tight">
              Solo con stock inmediato
            </span>
            <span className="text-2xs text-slate-400 block mt-0.5">
              Oculta unidades reservadas o agotadas
            </span>
          </div>
        </label>
      </div>

      {/* Safe guarantee badge in sidebar */}
      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-2xs text-blue-900">
          <span className="font-bold block">Garantía SoloOutlet</span>
          <span>Cada producto incluye informe de falla y garantía formal de 30 a 180 días.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Catálogo de Outlet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'publicación disponible' : 'publicaciones disponibles'}{' '}
            con diagnóstico técnico y trazabilidad
          </p>
        </div>

        {/* Mobile Filter Toggle & Sort Dropdown Menu */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Mobile filter trigger button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            aria-label="Abrir filtros"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-2xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Interactive Custom Sort Dropdown Menu */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 shadow-2xs text-xs font-semibold text-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
              aria-expanded={isSortDropdownOpen}
              aria-haspopup="listbox"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-500 font-normal hidden sm:inline">Ordenar:</span>
              <span className="font-bold text-slate-900">{currentSortObj.shortLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isSortDropdownOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Menu Popover */}
            {isSortDropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100"
              >
                <div className="px-3.5 py-2 text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Criterio de ordenamiento
                </div>
                <div className="py-1">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sortOption === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSortOption(opt.id);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={isSelected ? 'text-blue-900 font-bold' : 'font-semibold text-slate-800'}>
                              {opt.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                          </div>
                          <p className="text-2xs text-slate-400 mt-0.5 leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Search Box */}
      <div className="mb-6 space-y-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o descripción del producto (ej: Notebook, Cafetera, Pantalla, Sin caja)..."
            aria-label="Buscar productos por título o descripción en tiempo real"
            className="w-full pl-12 pr-32 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2">
            {searchQuery && (
              <>
                <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 animate-in fade-in duration-150">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'coincidencia' : 'coincidencias'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Quick Search Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Sugerencias:
          </span>
          {[
            'Notebook',
            'Smart TV',
            'Cafetera Espresso',
            'Auriculares ANC',
            'Freidora de Aire',
            'Remera Dry-Fit',
            'Aspiradora Robot',
            'Sin caja',
            'Devolución',
          ].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setSearchQuery(searchQuery.toLowerCase() === term.toLowerCase() ? '' : term)}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                searchQuery.toLowerCase() === term.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Category Bar for Mobile (horizontal scroll) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {POPULAR_TAGS.map((tag) => {
          const isSelected = selectedTagFilter === tag.id;
          const Icon = tag.icon;
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tag.label}</span>
              <span className={`text-2xs font-mono ml-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {tagCounts[tag.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Chips Pillbox (if any active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
          <span className="text-2xs font-bold uppercase tracking-wider text-blue-900 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-blue-600" />
            Filtros activos:
          </span>

          {selectedTagFilter && (
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span>Etiqueta: {selectedTagFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {selectedCategoryFilter && (
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Rubro: {selectedCategoryFilter}</span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {selectedStateFilter && (
            <button
              onClick={() => setSelectedStateFilter(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Estado: {selectedStateFilter}</span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {sortOption !== 'recommended' && (
            <button
              onClick={() => setSortOption('recommended')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Orden: {currentSortObj.shortLabel}</span>
              <X className="w-3 h-3 text-indigo-400" />
            </button>
          )}

          {onlyInStock && (
            <button
              onClick={() => setOnlyInStock(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <span>Solo en stock</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {minDiscount > 0 && (
            <button
              onClick={() => setMinDiscount(0)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <span>Descuento: +{minDiscount}%</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {priceRange !== 'all' && (
            <button
              onClick={() => setPriceRange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              <span>
                Precio:{' '}
                {priceRange === 'under-50k'
                  ? 'Hasta $50.000'
                  : priceRange === '50k-150k'
                  ? '$50k a $150k'
                  : 'Más de $150k'}
              </span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Búsqueda: "{searchQuery}"</span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer todo</span>
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT: Sidebar (Desktop) + Products Feed */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-20 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          {FilterSidebarContent}
        </aside>

        {/* PRODUCTS GRID AREA */}
        <div className="flex-1 min-w-0 w-full">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-2xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">
                🔍
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No se encontraron productos coincidentes'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                {searchQuery
                  ? `No encontramos productos de outlet que coincidan con "${searchQuery}" en su título o descripción. Probá con otra palabra clave o limpiá la búsqueda.`
                  : 'No hay productos en liquidación que coincidan con la combinación de filtros seleccionada. Probá seleccionando otra etiqueta como "Ropa", "Electro" o "Hogar", o limpiando los filtros.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                  >
                    Borrar búsqueda ("{searchQuery}")
                  </button>
                )}
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Restablecer todos los filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER MODAL */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Filtros de Outlet
                </h3>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Cerrar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Mobile Sort options inside drawer */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Criterio de Ordenamiento
                </span>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={`mob-sort-${opt.id}`}
                      onClick={() => setSortOption(opt.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        sortOption === opt.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {FilterSidebarContent}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs text-center transition-colors shadow-sm cursor-pointer"
              >
                Ver {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
