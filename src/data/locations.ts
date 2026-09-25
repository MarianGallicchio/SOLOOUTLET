export interface LocationPreset {
  city: string;
  postalCode: string;
  province: string;
  region?: string;
}

/**
 * Listado de localidades y códigos postales por defecto de Argentina
 * para agilizar la carga y validación de direcciones de entrega.
 */
export const DEFAULT_LOCATIONS: LocationPreset[] = [
  // CABA
  { city: 'CABA - Palermo', postalCode: '1425', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Belgrano', postalCode: '1428', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Caballito', postalCode: '1405', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Recoleta', postalCode: '1018', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Centro / San Nicolás', postalCode: '1001', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Villa Urquiza', postalCode: '1431', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Flores', postalCode: '1406', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Almagro', postalCode: '1177', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Colegiales', postalCode: '1426', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },
  { city: 'CABA - Núñez', postalCode: '1429', province: 'Ciudad Autónoma de Buenos Aires', region: 'CABA' },

  // GBA Norte
  { city: 'Vicente López / Olivos', postalCode: '1636', province: 'Buenos Aires (GBA Norte)', region: 'GBA Norte' },
  { city: 'San Isidro / Martínez', postalCode: '1640', province: 'Buenos Aires (GBA Norte)', region: 'GBA Norte' },
  { city: 'Tigre / Nordelta', postalCode: '1648', province: 'Buenos Aires (GBA Norte)', region: 'GBA Norte' },
  { city: 'San Martín', postalCode: '1650', province: 'Buenos Aires (GBA Norte)', region: 'GBA Norte' },
  { city: 'Pilar', postalCode: '1629', province: 'Buenos Aires (GBA Norte)', region: 'GBA Norte' },

  // GBA Oeste
  { city: 'Ramos Mejía / La Matanza', postalCode: '1704', province: 'Buenos Aires (GBA Oeste)', region: 'GBA Oeste' },
  { city: 'Morón / Castelar', postalCode: '1708', province: 'Buenos Aires (GBA Oeste)', region: 'GBA Oeste' },
  { city: 'Ituzaingó', postalCode: '1714', province: 'Buenos Aires (GBA Oeste)', region: 'GBA Oeste' },
  { city: 'Haedo', postalCode: '1706', province: 'Buenos Aires (GBA Oeste)', region: 'GBA Oeste' },

  // GBA Sur
  { city: 'Avellaneda', postalCode: '1870', province: 'Buenos Aires (GBA Sur)', region: 'GBA Sur' },
  { city: 'Quilmes / Bernal', postalCode: '1878', province: 'Buenos Aires (GBA Sur)', region: 'GBA Sur' },
  { city: 'Lanús', postalCode: '1824', province: 'Buenos Aires (GBA Sur)', region: 'GBA Sur' },
  { city: 'Lomas de Zamora / Banfield', postalCode: '1832', province: 'Buenos Aires (GBA Sur)', region: 'GBA Sur' },
  { city: 'Adrogué / Almirante Brown', postalCode: '1846', province: 'Buenos Aires (GBA Sur)', region: 'GBA Sur' },

  // Buenos Aires Interior & Costa
  { city: 'La Plata', postalCode: '1900', province: 'Buenos Aires', region: 'Interior BA' },
  { city: 'Mar del Plata', postalCode: '7600', province: 'Buenos Aires', region: 'Costa Atlántica' },
  { city: 'Bahía Blanca', postalCode: '8000', province: 'Buenos Aires', region: 'Interior BA' },
  { city: 'Tandil', postalCode: '7000', province: 'Buenos Aires', region: 'Interior BA' },

  // Santa Fe
  { city: 'Rosario', postalCode: '2000', province: 'Santa Fe', region: 'Santa Fe' },
  { city: 'Santa Fe Capital', postalCode: '3000', province: 'Santa Fe', region: 'Santa Fe' },

  // Córdoba
  { city: 'Córdoba Capital', postalCode: '5000', province: 'Córdoba', region: 'Córdoba' },
  { city: 'Villa Carlos Paz', postalCode: '5152', province: 'Córdoba', region: 'Córdoba' },
  { city: 'Río Cuarto', postalCode: '5800', province: 'Córdoba', region: 'Córdoba' },

  // Cuyo & NOA & NEA & Patagonia
  { city: 'Mendoza Capital / Godoy Cruz', postalCode: '5500', province: 'Mendoza', region: 'Cuyo' },
  { city: 'San Juan Capital', postalCode: '5400', province: 'San Juan', region: 'Cuyo' },
  { city: 'San Miguel de Tucumán', postalCode: '4000', province: 'Tucumán', region: 'NOA' },
  { city: 'Salta Capital', postalCode: '4400', province: 'Salta', region: 'NOA' },
  { city: 'San Salvador de Jujuy', postalCode: '4600', province: 'Jujuy', region: 'NOA' },
  { city: 'Neuquén Capital', postalCode: '8300', province: 'Neuquén', region: 'Patagonia' },
  { city: 'San Carlos de Bariloche', postalCode: '8400', province: 'Río Negro', region: 'Patagonia' },
  { city: 'Corrientes Capital', postalCode: '3400', province: 'Corrientes', region: 'NEA' },
  { city: 'Posadas', postalCode: '3300', province: 'Misiones', region: 'NEA' },
  { city: 'Resistencia', postalCode: '3500', province: 'Chaco', region: 'NEA' },
  { city: 'Ushuaia', postalCode: '9410', province: 'Tierra del Fuego', region: 'Patagonia' },
];

/** Localidades frecuentes sugeridas para botones de selección directa */
export const POPULAR_LOCATION_SHORTCUTS = [
  { label: 'CABA (Palermo)', city: 'Buenos Aires (CABA)', postalCode: '1425' },
  { label: 'CABA (Belgrano)', city: 'Buenos Aires (CABA)', postalCode: '1428' },
  { label: 'Vicente López', city: 'Vicente López', postalCode: '1636' },
  { label: 'La Plata', city: 'La Plata', postalCode: '1900' },
  { label: 'Rosario', city: 'Rosario', postalCode: '2000' },
  { label: 'Córdoba', city: 'Córdoba Capital', postalCode: '5000' },
];
