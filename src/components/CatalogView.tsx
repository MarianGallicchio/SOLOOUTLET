import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, X, ArrowUpDown, RotateCcw } from 'lucide-react';
import { ConditionType, CategoryType } from '../types';

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

  const [sortOption, setSortOption] = useState<'recommended' | 'price-asc' | 'price-desc' | 'discount'>('recommended');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  const allConditions: ConditionType[] = [
    'Devolución',
    'Sin caja',
    'Rayado',
    'Con falla',
    'Reacondicionado',
  ];

  const allCategories: CategoryType[] = [
    'Tecnología',
    'Electrodomésticos',
    'Hogar',
    'Indumentaria',
    'Deportes',
    'Otros',
  ];

  const handleStateClick = (state: ConditionType) => {
    if (selectedStateFilter === state) {
      setSelectedStateFilter(null);
    } else {
      setSelectedStateFilter(state);
    }
  };

  const handleCategoryClick = (cat: CategoryType) => {
    if (selectedCategoryFilter === cat) {
      setSelectedCategoryFilter(null);
    } else {
      setSelectedCategoryFilter(cat);
    }
  };

  const clearAllFilters = () => {
    setSelectedStateFilter(null);
    setSelectedCategoryFilter(null);
    setSearchQuery('');
    setOnlyInStock(false);
  };

  // Filter and sort computation
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products
      .filter((p) => {
        // State filter
        if (selectedStateFilter && p.estado !== selectedStateFilter) {
          return false;
        }

        // Category filter
        if (selectedCategoryFilter && p.cat !== selectedCategoryFilter) {
          return false;
        }

        // Stock filter
        if (onlyInStock && p.stock <= 0) {
          return false;
        }

        // Search text matching: title, vendor, estado, category, specs
        if (q) {
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchVendor = p.vendor.toLowerCase().includes(q);
          const matchEstado = p.estado.toLowerCase().includes(q);
          const matchCat = p.cat.toLowerCase().includes(q);
          const matchCondition = p.conditionDetails.toLowerCase().includes(q);
          if (!matchTitle && !matchVendor && !matchEstado && !matchCat && !matchCondition) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return a.price - b.price;
        if (sortOption === 'price-desc') return b.price - a.price;
        if (sortOption === 'discount') return b.discount - a.discount;
        return 0; // recommended default
      });
  }, [products, selectedStateFilter, selectedCategoryFilter, onlyInStock, searchQuery, sortOption]);

  const hasActiveFilters = Boolean(
    selectedStateFilter || selectedCategoryFilter || searchQuery || onlyInStock
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Catálogo de Outlet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'publicación disponible' : 'publicaciones disponibles'}{' '}
            con estado verificado
          </p>
        </div>

        {/* Quick Sort Control */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Ordenar por:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="recommended">Recomendados</option>
            <option value="discount">Mayor descuento (%)</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
        </div>
      </div>

      {/* Real-time Search Box */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por producto, comercio vendedor o estado (ej: Samsung, Rayado, ElectroPlaza)..."
          className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs mb-8 space-y-4">
        
        {/* Row 1: Filter by Estado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Estado:</span>
          </div>
          {allConditions.map((condition) => {
            const isSelected = selectedStateFilter === condition;
            return (
              <button
                key={condition}
                onClick={() => handleStateClick(condition)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {condition}
              </button>
            );
          })}
        </div>

        {/* Row 2: Filter by Categoría */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 mr-2 shrink-0">
            Categoría:
          </span>
          {allCategories.map((category) => {
            const isSelected = selectedCategoryFilter === category;
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Row 3: Toggles & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <span>Solo productos con stock disponible</span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros activos</span>
            </button>
          )}
        </div>

      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
            No se encontraron productos coincidentes
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Intenta modificando los términos de búsqueda, removiendo filtros de estado o desmarcando la opción de stock.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Ver todos los productos del catálogo
          </button>
        </div>
      )}

    </div>
  );
};
