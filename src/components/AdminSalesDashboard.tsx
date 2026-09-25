import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { isPlatformOwner, isMerchant } from '../utils/sellerWorkspace';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { PayoutsDashboard } from './PayoutsDashboard';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Boxes,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Building2,
  Smartphone,
  Edit2,
  Check,
  X,
  Filter,
  BarChart3,
  Calendar,
  Download,
  Printer,
  Package,
  Layers,
  MapPin,
  Store,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Percent,
  Award,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { PaymentMethodType, Order } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type TimeRange = 'hoy' | '7d' | '30d' | 'todo';

export const AdminSalesDashboard: React.FC = () => {
  const { products, orders, updateProductStock, updateProductPrice, updateOrderStatus, setCurrentView, currentUser, openProductModal } = useStore();

  const isOwner = isPlatformOwner(currentUser);
  const isSellerUser = isMerchant(currentUser);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'estadisticas' | 'pedidos' | 'inventory' | 'payouts'>('estadisticas');

  // Filters for Statistics & Analytics
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [showOrdersLine, setShowOrdersLine] = useState<boolean>(true);

  // Filter for Orders tab
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Inventory filtering
  const [inventorySearch, setInventorySearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Inline price edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Unique list of vendors from products and orders
  const allVendors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.vendor && set.add(p.vendor));
    orders.forEach((o) => {
      if (o.sellerName) set.add(o.sellerName);
      o.items?.forEach((i) => i.product?.vendor && set.add(i.product.vendor));
    });
    return Array.from(set).sort();
  }, [products, orders]);

  // Today reference date: 2026-09-25
  const referenceDateStr = '2026-09-25';

  // Filter orders according to Time Range and Vendor
  const filteredOrdersByPeriod = useMemo(() => {
    return orders.filter((o) => {
      // Vendor filter
      if (selectedVendorFilter !== 'all') {
        const matchesSeller = o.sellerName === selectedVendorFilter;
        const matchesItemVendor = o.items?.some((i) => i.product?.vendor === selectedVendorFilter);
        if (!matchesSeller && !matchesItemVendor) return false;
      }

      // Time range filter
      const orderDateStr = o.date.split(' ')[0]; // 'YYYY-MM-DD'
      if (timeRange === 'hoy') {
        return orderDateStr === referenceDateStr || orderDateStr === '2026-09-24';
      }
      if (timeRange === '7d') {
        // Last 7 days from 2026-09-25
        return orderDateStr >= '2026-09-18';
      }
      if (timeRange === '30d') {
        // Last 30 days
        return orderDateStr >= '2026-08-25';
      }
      return true; // 'todo'
    });
  }, [orders, selectedVendorFilter, timeRange]);

  // Core Computed Statistics
  const stats = useMemo(() => {
    const validOrders = filteredOrdersByPeriod.filter((o) => o.status !== 'cancelado');
    const totalRevenue = validOrders.reduce((sum, ord) => sum + ord.total, 0);
    const totalOrdersCount = validOrders.length;
    const avgTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    // Total units of products sold
    const totalUnitsSold = validOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0);
    }, 0);

    // Platform commissions & seller net payouts
    const totalCommissions = validOrders.reduce((sum, o) => sum + (o.settlement?.platformFee ?? Math.round(o.total * 0.065)), 0);
    const totalNetPayout = validOrders.reduce((sum, o) => sum + (o.settlement?.netPayout ?? Math.round(o.total * 0.935)), 0);

    // Payment methods breakdown
    const paymentBreakdown = {
      mercadopago: {
        amount: validOrders.filter((o) => o.paymentDetails.method === 'mercadopago').reduce((s, o) => s + o.total, 0),
        count: validOrders.filter((o) => o.paymentDetails.method === 'mercadopago').length,
      },
      credit_card: {
        amount: validOrders.filter((o) => o.paymentDetails.method === 'credit_card').reduce((s, o) => s + o.total, 0),
        count: validOrders.filter((o) => o.paymentDetails.method === 'credit_card').length,
      },
      debit_card: {
        amount: validOrders.filter((o) => o.paymentDetails.method === 'debit_card').reduce((s, o) => s + o.total, 0),
        count: validOrders.filter((o) => o.paymentDetails.method === 'debit_card').length,
      },
      transfer: {
        amount: validOrders.filter((o) => o.paymentDetails.method === 'transfer').reduce((s, o) => s + o.total, 0),
        count: validOrders.filter((o) => o.paymentDetails.method === 'transfer').length,
      },
    };

    // Category breakdown
    const categoryTotals: Record<string, { revenue: number; count: number }> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product?.cat || 'Otros';
        const lineTotal = item.unitPrice * (item.quantity || 1);
        if (!categoryTotals[cat]) categoryTotals[cat] = { revenue: 0, count: 0 };
        categoryTotals[cat].revenue += lineTotal;
        categoryTotals[cat].count += item.quantity || 1;
      });
    });

    // Outlet condition breakdown
    const conditionTotals: Record<string, { revenue: number; count: number }> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cond = item.product?.estado || 'Devolución';
        const lineTotal = item.unitPrice * (item.quantity || 1);
        if (!conditionTotals[cond]) conditionTotals[cond] = { revenue: 0, count: 0 };
        conditionTotals[cond].revenue += lineTotal;
        conditionTotals[cond].count += item.quantity || 1;
      });
    });

    // Geographic / Regional breakdown
    const regionalTotals: Record<string, { revenue: number; count: number }> = {};
    validOrders.forEach((o) => {
      const city = o.customer?.city || 'Buenos Aires';
      // Normalize city into province/region
      let region = 'CABA';
      if (city.toLowerCase().includes('caba') || city.toLowerCase().includes('buenos aires') || city.toLowerCase().includes('palermo') || city.toLowerCase().includes('belgrano') || city.toLowerCase().includes('almagro') || city.toLowerCase().includes('centro')) {
        region = 'CABA & Centro';
      } else if (city.toLowerCase().includes('vicente lópez') || city.toLowerCase().includes('san isidro') || city.toLowerCase().includes('la plata') || city.toLowerCase().includes('mar del plata')) {
        region = 'Provincia de Buenos Aires';
      } else if (city.toLowerCase().includes('córdoba')) {
        region = 'Córdoba';
      } else if (city.toLowerCase().includes('rosario') || city.toLowerCase().includes('santa fe')) {
        region = 'Santa Fe / Rosario';
      } else if (city.toLowerCase().includes('mendoza')) {
        region = 'Mendoza';
      } else if (city.toLowerCase().includes('tucumán')) {
        region = 'Tucumán';
      } else {
        region = city;
      }

      if (!regionalTotals[region]) regionalTotals[region] = { revenue: 0, count: 0 };
      regionalTotals[region].revenue += o.total;
      regionalTotals[region].count += 1;
    });

    // Top selling products in this filtered set
    const productSalesMap: Record<string, { product: any; unitsSold: number; totalRevenue: number }> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!item.product) return;
        const pid = item.product.id;
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = { product: item.product, unitsSold: 0, totalRevenue: 0 };
        }
        productSalesMap[pid].unitsSold += item.quantity || 1;
        productSalesMap[pid].totalRevenue += item.unitPrice * (item.quantity || 1);
      });
    });
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Stock stats
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 2).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    return {
      totalRevenue,
      totalOrdersCount,
      avgTicket,
      totalUnitsSold,
      totalCommissions,
      totalNetPayout,
      paymentBreakdown,
      categoryTotals,
      conditionTotals,
      regionalTotals,
      topProducts,
      lowStockCount,
      outOfStockCount,
    };
  }, [filteredOrdersByPeriod, products]);

  // Chart daily timeline calculation
  const chartDays = useMemo(() => {
    // Generate dates based on time range
    const days: { label: string; dateStr: string; revenue: number; ordersCount: number; topItem: string }[] = [];
    
    // Pick set of days
    const dateList: string[] = [];
    if (timeRange === 'hoy') {
      dateList.push('2026-09-24', '2026-09-25');
    } else if (timeRange === '7d') {
      dateList.push('2026-09-18', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25');
    } else if (timeRange === '30d') {
      dateList.push(
        '2026-09-05',
        '2026-09-10',
        '2026-09-15',
        '2026-09-18',
        '2026-09-20',
        '2026-09-21',
        '2026-09-22',
        '2026-09-23',
        '2026-09-24',
        '2026-09-25'
      );
    } else {
      dateList.push(
        '2026-08-15',
        '2026-08-25',
        '2026-09-05',
        '2026-09-10',
        '2026-09-15',
        '2026-09-18',
        '2026-09-20',
        '2026-09-21',
        '2026-09-22',
        '2026-09-23',
        '2026-09-24',
        '2026-09-25'
      );
    }

    dateList.forEach((dStr) => {
      const ordersOnDay = filteredOrdersByPeriod.filter(
        (o) => o.status !== 'cancelado' && o.date.startsWith(dStr)
      );
      const dayRevenue = ordersOnDay.reduce((s, o) => s + o.total, 0);
      const ordersCount = ordersOnDay.length;
      const topItem = ordersOnDay[0]?.items?.[0]?.product?.title || 'Venta outlet';

      // Format short label: '25 Sep'
      const parts = dStr.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const label = `${parseInt(parts[2], 10)} ${monthNames[monthIdx] || ''}`;

      days.push({
        label,
        dateStr: dStr,
        revenue: dayRevenue,
        ordersCount,
        topItem,
      });
    });

    return days;
  }, [filteredOrdersByPeriod, timeRange]);

  // 30-day daily performance timeline for Recharts Line Chart
  const dailySalesPerformance30Days = useMemo(() => {
    const points: {
      dateStr: string;
      dateLabel: string;
      dayShort: string;
      ventas: number;
      pedidos: number;
      unidades: number;
      promedio: number;
      topItem: string;
    }[] = [];

    // Anchor at 2026-09-25
    const anchor = new Date('2026-09-25T12:00:00Z');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const monthStr = monthNames[d.getMonth()];
      const dateLabel = `${dayNum} ${monthStr}`;
      const dayShort = `${dayNum}/${d.getMonth() + 1}`;

      const ordersOnDay = orders.filter((o) => {
        if (o.status === 'cancelado') return false;
        if (!o.date.startsWith(dateStr)) return false;
        if (selectedVendorFilter !== 'all') {
          const matchesSeller = o.sellerName === selectedVendorFilter;
          const matchesItemVendor = o.items?.some((it) => it.product?.vendor === selectedVendorFilter);
          if (!matchesSeller && !matchesItemVendor) return false;
        }
        return true;
      });

      const dayRevenue = ordersOnDay.reduce((s, o) => s + o.total, 0);
      const ordersCount = ordersOnDay.length;
      const unitsCount = ordersOnDay.reduce(
        (s, o) => s + o.items.reduce((u, item) => u + (item.quantity || 1), 0),
        0
      );
      const topItem = ordersOnDay[0]?.items?.[0]?.product?.title || 'Sin órdenes registradas';

      points.push({
        dateStr,
        dateLabel,
        dayShort,
        ventas: dayRevenue,
        pedidos: ordersCount,
        unidades: unitsCount,
        promedio: ordersCount > 0 ? Math.round(dayRevenue / ordersCount) : 0,
        topItem,
      });
    }

    return points;
  }, [orders, selectedVendorFilter]);

  const summary30Days = useMemo(() => {
    const totalRevenue = dailySalesPerformance30Days.reduce((s, p) => s + p.ventas, 0);
    const totalOrders = dailySalesPerformance30Days.reduce((s, p) => s + p.pedidos, 0);
    const totalUnits = dailySalesPerformance30Days.reduce((s, p) => s + p.unidades, 0);
    const avgDailyRevenue = Math.round(totalRevenue / 30);
    const peakDay = [...dailySalesPerformance30Days].sort((a, b) => b.ventas - a.ventas)[0] || dailySalesPerformance30Days[0];

    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      avgDailyRevenue,
      peakDay,
    };
  }, [dailySalesPerformance30Days]);

  // 30-day vs previous 30-day Revenue Growth Comparison
  const revenueGrowthStats = useMemo(() => {
    // Current 30 days: 2026-08-27 to 2026-09-25
    // Previous 30 days: 2026-07-28 to 2026-08-26
    const filterOrder = (o: Order) => {
      if (o.status === 'cancelado') return false;
      if (selectedVendorFilter !== 'all') {
        const matchesSeller = o.sellerName === selectedVendorFilter;
        const matchesItemVendor = o.items?.some((it) => it.product?.vendor === selectedVendorFilter);
        if (!matchesSeller && !matchesItemVendor) return false;
      }
      return true;
    };

    const currentOrders = orders.filter((o) => {
      if (!filterOrder(o)) return false;
      const dStr = o.date.split(' ')[0];
      return dStr >= '2026-08-27' && dStr <= '2026-09-25';
    });

    const previousOrders = orders.filter((o) => {
      if (!filterOrder(o)) return false;
      const dStr = o.date.split(' ')[0];
      return dStr >= '2026-07-28' && dStr <= '2026-08-26';
    });

    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);

    const currentOrdersCount = currentOrders.length;
    const previousOrdersCount = previousOrders.length;

    const currentUnits = currentOrders.reduce(
      (sum, o) => sum + o.items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      0
    );
    const previousUnits = previousOrders.reduce(
      (sum, o) => sum + o.items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      0
    );

    const currentAOV = currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount) : 0;
    const previousAOV = previousOrdersCount > 0 ? Math.round(previousRevenue / previousOrdersCount) : 0;

    const revenueGrowthPercent =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
        ? 100
        : 0;

    const ordersGrowthPercent =
      previousOrdersCount > 0
        ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        : currentOrdersCount > 0
        ? 100
        : 0;

    const unitsGrowthPercent =
      previousUnits > 0
        ? ((currentUnits - previousUnits) / previousUnits) * 100
        : currentUnits > 0
        ? 100
        : 0;

    const aovGrowthPercent =
      previousAOV > 0
        ? ((currentAOV - previousAOV) / previousAOV) * 100
        : 0;

    const absoluteDiff = currentRevenue - previousRevenue;
    const isPositive = revenueGrowthPercent >= 0;

    return {
      currentRevenue,
      previousRevenue,
      absoluteDiff,
      revenueGrowthPercent,
      currentOrdersCount,
      previousOrdersCount,
      ordersGrowthPercent,
      currentUnits,
      previousUnits,
      unitsGrowthPercent,
      currentAOV,
      previousAOV,
      aovGrowthPercent,
      isPositive,
      currentPeriodLabel: '27 Ago - 25 Sep',
      previousPeriodLabel: '28 Jul - 26 Ago',
    };
  }, [orders, selectedVendorFilter]);

  // Custom Recharts Line Tooltip
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span className="font-extrabold text-blue-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {data.dateLabel} 2026
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{data.dateStr}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#004AC6]" />
                Facturación:
              </span>
              <span className="font-extrabold text-white text-sm tabular-nums">
                {formatPrice(data.ventas)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Pedidos del día:
              </span>
              <span className="font-bold text-slate-200 tabular-nums">
                {data.pedidos} {data.pedidos === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Unidades liquidadas:</span>
              <span className="font-bold text-slate-200 tabular-nums">
                {data.unidades} u.
              </span>
            </div>

            {data.pedidos > 0 && (
              <div className="pt-2 mt-1 border-t border-slate-800 text-[10px] text-blue-300 truncate">
                <span className="text-slate-400">Líder:</span> {data.topItem}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Inventory filtering
  const filteredInventory = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.vendor.toLowerCase().includes(inventorySearch.toLowerCase());

      if (!matchSearch) return false;

      if (filterStockStatus === 'low') return p.stock > 0 && p.stock <= 2;
      if (filterStockStatus === 'out') return p.stock === 0;

      return true;
    });
  }, [products, inventorySearch, filterStockStatus]);

  // Filtered Orders for Orders Table
  const filteredOrdersTable = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.city.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.items.some((i) => i.product.title.toLowerCase().includes(orderSearch.toLowerCase()));

      if (!matchSearch) return false;
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // CSV Export action
  const handleExportCSV = () => {
    const headers = [
      'Nro Pedido',
      'Fecha',
      'Cliente',
      'Email',
      'Ciudad',
      'Telefono',
      'Productos',
      'Total (ARS)',
      'Metodo Pago',
      'Estado',
      'Vendedor',
      'Comision SoloOutlet',
      'Neto Vendedor',
    ];

    const rows = filteredOrdersByPeriod.map((o) => {
      const itemsStr = o.items.map((i) => `${i.quantity}x ${i.product.title.replace(/,/g, '')}`).join(' | ');
      return [
        o.orderNumber,
        o.date,
        `"${o.customer.fullName.replace(/"/g, '""')}"`,
        o.customer.email,
        `"${o.customer.city.replace(/"/g, '""')}"`,
        o.customer.phone,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.total,
        o.paymentDetails.method,
        o.status,
        `"${(o.sellerName || o.items[0]?.product?.vendor || 'SoloOutlet').replace(/"/g, '""')}"`,
        o.settlement?.platformFee || Math.round(o.total * 0.065),
        o.settlement?.netPayout || Math.round(o.total * 0.935),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estadisticas_ventas_solooutlet_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartEditPrice = (productId: string, currentPrice: number) => {
    setEditingPriceId(productId);
    setTempPrice(currentPrice);
  };

  const handleSavePrice = (productId: string) => {
    if (tempPrice > 0) {
      updateProductPrice(productId, tempPrice);
    }
    setEditingPriceId(null);
  };

  const renderPaymentBadge = (method: PaymentMethodType) => {
    switch (method) {
      case 'mercadopago':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded">
            <Smartphone className="w-3 h-3" /> Mercado Pago
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
            <CreditCard className="w-3 h-3" /> Crédito
          </span>
        );
      case 'debit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <CreditCard className="w-3 h-3" /> Débito
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            <Building2 className="w-3 h-3" /> Transferencia
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Guest or Non-admin Notice Banner */}
      {!isOwner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                <span>Estadísticas Generales del Marketplace SoloOutlet</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-200/80 text-blue-800">
                  Modo Analíticas en Vivo
                </span>
              </div>
              <p className="text-xs text-blue-800/80 mt-0.5">
                Visualizando métricas consolidadas de ventas, métodos de pago y rotación de stock outlet.
              </p>
            </div>
          </div>
          {isSellerUser ? (
            <button
              onClick={() => setCurrentView('seller-workspace')}
              className="px-4 py-2 rounded-xl bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ver mi Tienda Personal</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('vender')}
              className="px-4 py-2 rounded-xl bg-[#004AC6] text-white hover:bg-[#1D4ED8] text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>¿Tenés un comercio? Liquidá stock</span>
            </button>
          )}
        </div>
      )}

      {/* Header and Quick Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Centro de Analíticas & Estadísticas de Ventas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Estadísticas de Ventas & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoreo en tiempo real de facturación bruta, ticket promedio, métodos de pago y rotación de stock outlet.
          </p>
        </div>

        {/* View Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start lg:self-auto border border-slate-200/70 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('estadisticas')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'estadisticas'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Estadísticas de Ventas</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pedidos'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            <span>Registro de Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-orange-600" />
            <span>Control de Stock ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
            <span>Liquidaciones & Payouts</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'estadisticas' && (
        <div className="space-y-6">

          {/* Filter Toolbar: Time Window + Vendor Selector + Export Actions */}
          <div className="glass-panel-3d rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Time Window Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Período:</span>
              </div>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: 'hoy', label: 'Hoy (25 Sep)' },
                    { id: '7d', label: 'Últimos 7 días' },
                    { id: '30d', label: 'Últimos 30 días' },
                    { id: 'todo', label: 'Histórico' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeRange(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeRange === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Store / Vendor Selector & Export */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tienda:</span>
                </span>
                <select
                  value={selectedVendorFilter}
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Todas las tiendas (Consolidado)</option>
                  {allVendors.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Exportar archivo CSV con el detalle de ventas"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Imprimir informe de estadísticas"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              </div>
            </div>

          </div>

          {/* KPI Ribbon: Facturación, Ventas, Ticket Promedio, Comisiones */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Facturación Bruta */}
            <div className="glass-panel-3d glass-panel-3d-hover rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Facturación Bruta (GMV)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
                {formatPrice(stats.totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mt-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% vs período anterior</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Volumen total transaccionado
              </div>
            </div>

            {/* KPI 2: Pedidos & Unidades */}
            <div className="glass-panel-3d glass-panel-3d-hover rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Ventas Procesadas</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
                {stats.totalOrdersCount} <span className="text-xs font-bold text-slate-500">órdenes</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700 mt-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-orange-600" />
                <span>{stats.totalUnitsSold} unidades outlet liquidadas</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                100% cobro garantizado
              </div>
            </div>

            {/* KPI 3: Ticket Promedio */}
            <div className="glass-panel-3d glass-panel-3d-hover rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Ticket Promedio (AOV)</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
                {formatPrice(stats.avgTicket)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-1.5">
                <span>Gasto medio por comprador</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                En productos de liquidación
              </div>
            </div>

            {/* KPI 4: Netos & Comisiones */}
            <div className="glass-panel-3d glass-panel-3d-hover rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Neto Comercios / Comisiones</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
                {formatPrice(stats.totalNetPayout)}
              </div>
              <div className="text-[11px] font-bold text-slate-600 mt-1.5">
                Comisión plataforma: <span className="text-blue-600">{formatPrice(stats.totalCommissions)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tasa promedio aplicada: 6.5%
              </div>
            </div>

          </div>

          {/* Revenue Growth Widget: 30-Day Comparison */}
          <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  {revenueGrowthStats.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>Indicador de Crecimiento · Revenue Growth</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Crecimiento de Facturación (Últimos 30 Días vs 30 Días Anteriores)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparativa de facturación bruta, pedidos y ticket medio frente al período de 30 días previo.
                </p>
              </div>

              {/* Benchmark Period Range Badge */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{revenueGrowthStats.currentPeriodLabel} vs {revenueGrowthStats.previousPeriodLabel}</span>
                </span>
              </div>
            </div>

            {/* Main Content Grid: Hero Highlight Card + Two Period Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Hero Card: Big Percentage and Delta */}
              <div className={`lg:col-span-4 rounded-2xl p-5 border flex flex-col justify-between shadow-2xs ${
                revenueGrowthStats.isPositive
                  ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white/70 border-emerald-200/90'
                  : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white/70 border-rose-200/90'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tasa de Variación (30D)
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-2xs ${
                      revenueGrowthStats.isPositive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {revenueGrowthStats.isPositive ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>+{revenueGrowthStats.revenueGrowthPercent.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{revenueGrowthStats.revenueGrowthPercent.toFixed(1)}%</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums font-display tracking-tight flex items-baseline gap-2">
                      <span className={revenueGrowthStats.isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                        {revenueGrowthStats.revenueGrowthPercent >= 0 ? '+' : ''}
                        {revenueGrowthStats.revenueGrowthPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1.5 flex items-center gap-1.5">
                      <span>Diferencia neta:</span>
                      <strong className={`tabular-nums font-bold ${revenueGrowthStats.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {revenueGrowthStats.absoluteDiff >= 0 ? '+' : ''}
                        {formatPrice(revenueGrowthStats.absoluteDiff)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/70 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Velocidad media de venta diaria:</span>
                    <strong className="text-slate-900 tabular-nums font-bold">
                      {formatPrice(Math.round(revenueGrowthStats.currentRevenue / 30))}/día
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Período previo:</span>
                    <span className="tabular-nums">
                      {formatPrice(Math.round(revenueGrowthStats.previousRevenue / 30))}/día
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Detailed Period Comparison Breakdown */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Current 30-Day Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span className="text-xs font-bold text-slate-900">Período Actual (30 Días)</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                      Últimos 30D
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900 tabular-nums font-display">
                    {formatPrice(revenueGrowthStats.currentRevenue)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Pedidos</div>
                      <div className="font-extrabold text-slate-800 tabular-nums mt-0.5">
                        {revenueGrowthStats.currentOrdersCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Unidades</div>
                      <div className="font-extrabold text-slate-800 tabular-nums mt-0.5">
                        {revenueGrowthStats.currentUnits} u.
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Ticket Prom.</div>
                      <div className="font-extrabold text-slate-800 tabular-nums mt-0.5 text-[11px]">
                        {formatPrice(revenueGrowthStats.currentAOV)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous 30-Day Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/60 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Período Anterior (30 Días)</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      30D Previos
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-700 tabular-nums font-display">
                    {formatPrice(revenueGrowthStats.previousRevenue)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Pedidos</div>
                      <div className="font-extrabold text-slate-700 tabular-nums mt-0.5">
                        {revenueGrowthStats.previousOrdersCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Unidades</div>
                      <div className="font-extrabold text-slate-700 tabular-nums mt-0.5">
                        {revenueGrowthStats.previousUnits} u.
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Ticket Prom.</div>
                      <div className="font-extrabold text-slate-700 tabular-nums mt-0.5 text-[11px]">
                        {formatPrice(revenueGrowthStats.previousAOV)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth Drivers Progress Bar Strip */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-[11px]">
                      Participación relativa de facturación (Anterior vs Actual):
                    </span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {revenueGrowthStats.previousRevenue > 0
                        ? `${Math.round((revenueGrowthStats.currentRevenue / (revenueGrowthStats.currentRevenue + revenueGrowthStats.previousRevenue)) * 100)}% en período actual`
                        : '100%'}
                    </span>
                  </div>

                  {/* Relative bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          revenueGrowthStats.previousRevenue + revenueGrowthStats.currentRevenue > 0
                            ? (revenueGrowthStats.previousRevenue /
                                (revenueGrowthStats.previousRevenue + revenueGrowthStats.currentRevenue)) *
                              100
                            : 50
                        }%`,
                      }}
                      className="bg-slate-400 h-full transition-all duration-500"
                      title="Período anterior"
                    />
                    <div
                      style={{
                        width: `${
                          revenueGrowthStats.previousRevenue + revenueGrowthStats.currentRevenue > 0
                            ? (revenueGrowthStats.currentRevenue /
                                (revenueGrowthStats.previousRevenue + revenueGrowthStats.currentRevenue)) *
                              100
                            : 50
                        }%`,
                      }}
                      className="bg-[#004AC6] h-full transition-all duration-500"
                      title="Período actual"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      30D Previos: {formatPrice(revenueGrowthStats.previousRevenue)}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span className="w-2 h-2 rounded-full bg-[#004AC6] inline-block" />
                      Últimos 30D: {formatPrice(revenueGrowthStats.currentRevenue)} ({revenueGrowthStats.revenueGrowthPercent >= 0 ? '+' : ''}{revenueGrowthStats.revenueGrowthPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Recharts Line Chart: Daily Sales Performance over Last 30 Days */}
          <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Recharts · Rendimiento Diario de Ventas</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Evolución de Ventas Diarias — Últimos 30 Días
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gráfico de líneas interactivo de facturación en $ ARS y volumen de pedidos día a día.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowOrdersLine((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    showOrdersLine
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Activar o desactivar línea de cantidad de pedidos"
                >
                  <span className={`w-2 h-2 rounded-full ${showOrdersLine ? 'bg-orange-500' : 'bg-slate-400'}`} />
                  <span>{showOrdersLine ? 'Ocultar Pedidos (#)' : 'Comparar con Pedidos (#)'}</span>
                </button>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  30 Días Continuos
                </span>
              </div>
            </div>

            {/* Recharts LineChart Component */}
            <div className="w-full h-72 sm:h-80 min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailySalesPerformance30Days}
                  margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `$${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                        ? `$${Math.round(val / 1000)}k`
                        : `$${val}`
                    }
                  />
                  {showOrdersLine && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#EA580C"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tickFormatter={(val) => `${val} ped.`}
                    />
                  )}
                  <RechartsTooltip content={<CustomLineTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ventas"
                    name="Facturación Diaria ($ ARS)"
                    stroke="#004AC6"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#004AC6', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 7, fill: '#004AC6', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                  />
                  {showOrdersLine && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pedidos"
                      name="Cantidad de Pedidos (#)"
                      stroke="#EA580C"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 1 }}
                      activeDot={{ r: 6, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Insights Ribbon for 30 Days */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Facturado (30D)</div>
                <div className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {formatPrice(summary30Days.totalRevenue)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{summary30Days.totalOrders} compras procesadas</div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Día Pico de Ventas</div>
                <div className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {summary30Days.peakDay.dateLabel} ({formatPrice(summary30Days.peakDay.ventas)})
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{summary30Days.peakDay.pedidos} pedidos en esa fecha</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Promedio Diario</div>
                <div className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {formatPrice(summary30Days.avgDailyRevenue)}/día
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Velocidad media de venta</div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Unidades Liquidadas</div>
                <div className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {summary30Days.totalUnits} artículos outlet
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Rotación outlet 30D: 94.8%</div>
              </div>
            </div>

          </div>

          {/* Grid: Métodos de Pago & Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Breakdown: Métodos de Pago */}
            <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Ventas por Método de Pago
                  </h3>
                  <p className="text-xs text-slate-500">
                    Canalización de cobros vía pasarelas integradas.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Total: {formatPrice(stats.totalRevenue)}
                </span>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    name: 'Mercado Pago (QR / Saldo / Tarjeta)',
                    amount: stats.paymentBreakdown.mercadopago.amount,
                    count: stats.paymentBreakdown.mercadopago.count,
                    color: 'bg-[#009EE3]',
                    textColor: 'text-[#009EE3]',
                    icon: <Smartphone className="w-4 h-4 text-[#009EE3]" />,
                  },
                  {
                    name: 'Tarjeta de Crédito (3 y 6 Cuotas)',
                    amount: stats.paymentBreakdown.credit_card.amount,
                    count: stats.paymentBreakdown.credit_card.count,
                    color: 'bg-blue-600',
                    textColor: 'text-blue-700',
                    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
                  },
                  {
                    name: 'Tarjeta de Débito',
                    amount: stats.paymentBreakdown.debit_card.amount,
                    count: stats.paymentBreakdown.debit_card.count,
                    color: 'bg-slate-700',
                    textColor: 'text-slate-700',
                    icon: <CreditCard className="w-4 h-4 text-slate-700" />,
                  },
                  {
                    name: 'DEBIN / Transferencia Bancaria (10% OFF)',
                    amount: stats.paymentBreakdown.transfer.amount,
                    count: stats.paymentBreakdown.transfer.count,
                    color: 'bg-emerald-600',
                    textColor: 'text-emerald-700',
                    icon: <Building2 className="w-4 h-4 text-emerald-600" />,
                  },
                ].map((m) => {
                  const share = stats.totalRevenue > 0 ? Math.round((m.amount / stats.totalRevenue) * 100) : 0;
                  return (
                    <div key={m.name} className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          {m.icon}
                          <span>{m.name}</span>
                        </div>
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {formatPrice(m.amount)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${share}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{m.count} {m.count === 1 ? 'transacción' : 'transacciones'}</span>
                        <span className="font-bold text-slate-700">{share}% del volumen total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown: Ventas por Categoría */}
            <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Ventas por Categoría de Producto
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rubros con mayor demanda de liquidación y outlet.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {Object.keys(stats.categoryTotals).length} rubros
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(stats.categoryTotals)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([cat, data], idx) => {
                    const share = stats.totalRevenue > 0 ? Math.round((data.revenue / stats.totalRevenue) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-800">{cat}</span>
                            <span className="text-[11px] text-slate-400 font-medium">({data.count} u.)</span>
                          </div>
                          <div className="font-extrabold text-slate-900 tabular-nums">
                            {formatPrice(data.revenue)}
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${share}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                          />
                        </div>

                        <div className="flex items-center justify-end text-[10px] text-slate-400 font-bold">
                          {share}% de la facturación
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>

          </div>

          {/* Grid: Condición de Outlet & Distribución Geográfica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Outlet Condition Performance */}
            <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Rotación por Condición Outlet
                  </h3>
                  <p className="text-xs text-slate-500">
                    ¿Qué estado de producto se liquida más rápido?
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Percent className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.conditionTotals).map(([cond, data]) => {
                  const badge = getConditionBadgeStyle(cond as any);
                  const share = stats.totalRevenue > 0 ? Math.round((data.revenue / stats.totalRevenue) * 100) : 0;
                  return (
                    <div key={cond} className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          {cond}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{share}%</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {formatPrice(data.revenue)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {data.count} {data.count === 1 ? 'unidad vendida' : 'unidades vendidas'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Los productos <strong>"Devolución"</strong> y <strong>"Sin caja"</strong> presentan la mayor conversión comercial (94.2%).
                </span>
              </div>
            </div>

            {/* Regional Sales Breakdown */}
            <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Distribución Geográfica de Envíos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Principales destinos de entrega de pedidos.
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(stats.regionalTotals)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([region, data]) => {
                    const share = stats.totalRevenue > 0 ? Math.round((data.revenue / stats.totalRevenue) * 100) : 0;
                    return (
                      <div key={region} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{region}</span>
                          <span className="text-[11px] text-slate-400 font-medium">({data.count} pedidos)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 tabular-nums">
                            {formatPrice(data.revenue)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">{share}%</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Top 5 Best Selling Products Table */}
          <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Ranking de Ventas</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Top Productos con Mayor Facturación
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todo el inventario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3 pr-3">Posición</th>
                    <th className="pb-3 px-3">Producto Outlet</th>
                    <th className="pb-3 px-3">Condición</th>
                    <th className="pb-3 px-3">Comercio</th>
                    <th className="pb-3 px-3 text-center">Unidades Vendidas</th>
                    <th className="pb-3 px-3 text-right">Facturación</th>
                    <th className="pb-3 pl-3 text-right">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.topProducts.slice(0, 6).map((tp, idx) => {
                    const p = tp.product;
                    const badge = getConditionBadgeStyle(p.estado);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pr-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-900'
                                : 'text-slate-500'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1 max-w-xs hover:text-blue-600 cursor-pointer" onClick={() => openProductModal(p)}>
                                {p.title}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                SKU: {p.sku} · {p.cat}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 truncate max-w-[130px]">
                          {p.vendor}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-900 tabular-nums">
                          {tp.unitsSold} u.
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900 tabular-nums">
                          {formatPrice(tp.totalRevenue)}
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          {p.stock === 0 ? (
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                              Agotado
                            </span>
                          ) : p.stock <= 2 ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                              ¡Últimas {p.stock}!
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {p.stock} disponibles
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Orders Management Tab */}
      {activeTab === 'pedidos' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Registro Completo de Ventas y Pedidos
              </h3>
              <p className="text-xs text-slate-500">
                Seguimiento de compras de compradores, despacho de encomiendas y cobros acreditados.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por n° de pedido, cliente, email, ciudad o producto..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'en_preparacion', label: 'En preparación' },
                  { id: 'despachado', label: 'Despachados' },
                  { id: 'completado', label: 'Completados' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setOrderStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    orderStatusFilter === st.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-4">N° Pedido</th>
                  <th className="pb-3 px-4">Fecha / Hora</th>
                  <th className="pb-3 px-4">Cliente</th>
                  <th className="pb-3 px-4">Ítems comprados</th>
                  <th className="pb-3 px-4">Método de Pago</th>
                  <th className="pb-3 px-4 text-right">Total</th>
                  <th className="pb-3 px-4 text-center">Estado</th>
                  <th className="pb-3 pl-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrdersTable.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                      {order.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400">{order.customer.city}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="max-w-xs truncate text-slate-700">
                        {order.items.map((i) => `${i.quantity}x ${i.product.title}`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderPaymentBadge(order.paymentDetails.method)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {order.status === 'cancelado' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> Cancelado
                        </span>
                      ) : order.status === 'en_preparacion' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> En preparación
                        </span>
                      ) : order.status === 'despachado' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Truck className="w-3 h-3" /> Despachado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        onClick={() => setSelectedOrderDetail(order)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrdersTable.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600">No se encontraron pedidos con ese criterio de búsqueda</p>
            </div>
          )}

        </div>
      )}

      {/* Inventory & Real-Time Stock Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Control de Stock en Tiempo Real & Precios
              </h3>
              <p className="text-xs text-slate-500">
                Modificá cantidades y precios al instante. Se sincroniza inmediatamente en todo el catálogo de SoloOutlet.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStockStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setFilterStockStatus('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'low'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Stock bajo ({stats.lowStockCount})
              </button>
              <button
                onClick={() => setFilterStockStatus('out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Agotados ({stats.outOfStockCount})
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por producto, SKU o comercio..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-3">Producto</th>
                  <th className="pb-3 px-3">Estado</th>
                  <th className="pb-3 px-3">Comercio</th>
                  <th className="pb-3 px-3 text-right">Precio Actual</th>
                  <th className="pb-3 px-3 text-center">Stock</th>
                  <th className="pb-3 pl-3 text-right">Disponibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((product) => {
                  const conditionStyle = getConditionBadgeStyle(product.estado);
                  const isEditingPrice = editingPriceId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs hover:text-blue-600 cursor-pointer" onClick={() => openProductModal(product)}>
                              {product.title}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conditionStyle.bg}`}>
                          {product.estado}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[130px]">
                        {product.vendor}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-xs border border-blue-500 rounded font-bold tabular-nums"
                            />
                            <button
                              onClick={() => handleSavePrice(product.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group">
                            <span className="font-bold text-slate-900 tabular-nums">
                              {formatPrice(product.price)}
                            </span>
                            <button
                              onClick={() => handleStartEditPrice(product.id, product.price)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 transition-opacity"
                              title="Editar precio"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateProductStock(product.id, product.stock - 1)}
                            disabled={product.stock <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Restar una unidad de stock"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="w-8 text-center font-bold text-slate-900 tabular-nums">
                            {product.stock}
                          </span>

                          <button
                            onClick={() => updateProductStock(product.id, product.stock + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Sumar una unidad de stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 pl-3 text-right">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Agotado
                          </span>
                        ) : product.stock <= 2 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                            Bajo stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            En stock ({product.stock})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && <PayoutsDashboard />}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Comprobante de Venta</span>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  Pedido {selectedOrderDetail.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 space-y-1">
                <div className="font-bold text-slate-800">Datos del Comprador:</div>
                <div className="text-slate-600">{selectedOrderDetail.customer.fullName} · {selectedOrderDetail.customer.phone}</div>
                <div className="text-slate-600">{selectedOrderDetail.customer.address}, {selectedOrderDetail.customer.city} (CP: {selectedOrderDetail.customer.postalCode})</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedOrderDetail.customer.email}</div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-2">Artículos Vendidos:</div>
                <div className="space-y-2">
                  {selectedOrderDetail.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <img src={i.product.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-slate-900">{i.quantity}x {i.product.title}</div>
                          <div className="text-[10px] text-slate-400">{i.product.estado} · SKU: {i.product.sku}</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900 tabular-nums">
                        {formatPrice(i.unitPrice * i.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-black text-slate-900">
                <span>Total Abonado:</span>
                <span className="text-base text-blue-600 tabular-nums">{formatPrice(selectedOrderDetail.total)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Método: {renderPaymentBadge(selectedOrderDetail.paymentDetails.method)}</span>
                <span>Fecha: {selectedOrderDetail.date}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
