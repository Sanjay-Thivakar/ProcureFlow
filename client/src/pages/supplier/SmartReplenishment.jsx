import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Search,
  RefreshCw,
  Boxes,
  Info,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
} from "lucide-react";

import DashboardLayout from "../../components/layout/supplier/SupplierLayout";
import Loader from "../../components/common/Loader";
import { getSupplierReplenishmentRecommendations } from "../../services/smartReplenishmentService";
import { updateProduct } from "../../services/productService";

const SmartReplenishment = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // UI state
  const [expandedForecasts, setExpandedForecasts] = useState({});
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);

  const fetchRecommendations = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const res = await getSupplierReplenishmentRecommendations({
        status: statusFilter === "all" ? undefined : statusFilter,
        category: categoryFilter === "All" ? undefined : categoryFilter,
        search: searchTerm || undefined,
      });

      setData(res);
    } catch (err) {
      console.error("Failed to load replenishment recommendations:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to load supplier replenishment data. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations();
  };

  const toggleForecast = (productId) => {
    setExpandedForecasts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleOpenStockModal = (product) => {
    setStockModalProduct(product);
    setNewStockValue(String(product.inventoryRisk.currentStock));
  };

  const handleCloseStockModal = () => {
    setStockModalProduct(null);
    setNewStockValue("");
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    const parsed = Number(newStockValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Please enter a valid non-negative stock quantity.");
      return;
    }

    try {
      setUpdatingStock(true);
      await updateProduct(stockModalProduct.productId, { stock: parsed });
      toast.success(
        `Updated ${stockModalProduct.productName} stock to ${parsed} ${stockModalProduct.unit}`
      );
      handleCloseStockModal();
      await fetchRecommendations(true);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to update warehouse stock."
      );
    } finally {
      setUpdatingStock(false);
    }
  };

  const overview = data?.overview || {
    totalMonitoredProducts: 0,
    stockoutRiskCount: 0,
    lowStockCount: 0,
    adequateCount: 0,
    insufficientHistoryCount: 0,
  };

  const recommendations = data?.data || [];

  // Extract unique categories for filter dropdown
  const categories = [
    "All",
    ...new Set(recommendations.map((p) => p.category).filter(Boolean)),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Smart Replenishment & Demand
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor warehouse inventory levels, evaluate restaurant purchasing demand, and prevent costly stockouts.
            </p>
          </div>
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin text-indigo-600" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Boxes size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monitored
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {overview.totalMonitoredProducts}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Catalog items tracked</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Stockout Risk
                </p>
                <h3 className="text-2xl font-bold text-rose-700">
                  {overview.stockoutRiskCount}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-rose-500">Runout within 7 days or zero</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Low Stock
                </p>
                <h3 className="text-2xl font-bold text-amber-800">
                  {overview.lowStockCount}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-600">Coverage under 14 days</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Adequate Stock
                </p>
                <h3 className="text-2xl font-bold text-emerald-800">
                  {overview.adequateCount}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-emerald-600">Safe inventory coverage</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-500">
                <HelpCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Low History
                </p>
                <h3 className="text-2xl font-bold text-slate-700">
                  {overview.insufficientHistoryCount}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">&lt; 2 completed orders</p>
          </div>
        </div>

        {/* Methodology & Domain Transparency Notice */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 rounded-lg bg-indigo-600 p-1.5 text-white shadow-sm flex-shrink-0">
              <Info size={18} />
            </div>
            <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-indigo-950 text-sm">
                Transparent Inventory & Demand Methodology
              </p>
              <p>
                • <strong>Warehouse Stock:</strong> Measured directly from your live catalog (<code className="bg-indigo-100/60 px-1 py-0.5 rounded text-indigo-800">Product.stock</code>).
              </p>
              <p>
                • <strong>Historical Demand:</strong> Aggregated across verified, delivered orders placed by restaurant buyers. Buyer identities are strictly anonymized for privacy.
              </p>
              <p>
                • <strong>Lead Time Notice:</strong> Upstream supplier restock lead times and farm harvesting cycles are not tracked in the schema. Projections evaluate a standard 30-day inventory planning horizon.
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Items" },
              { id: "stockout_risk", label: "Stockout Risk", count: overview.stockoutRiskCount, color: "text-rose-600" },
              { id: "low_stock", label: "Low Stock", count: overview.lowStockCount, color: "text-amber-600" },
              { id: "adequate", label: "Adequate", count: overview.adequateCount, color: "text-emerald-600" },
              { id: "insufficient_data", label: "Insufficient Data" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-700 shadow-xs"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Category Filter Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 flex-wrap"
          >
            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Content Section */}
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
            <AlertTriangle className="mx-auto mb-2 text-rose-600" size={28} />
            <h3 className="font-semibold">{error}</h3>
            <button
              onClick={() => fetchRecommendations()}
              className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <Package className="mx-auto mb-3 text-slate-300" size={44} />
            <h3 className="text-base font-bold text-slate-700">
              No matching products found
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((item) => {
              const risk = item.inventoryRisk.stockRisk;
              const isStockoutRisk = risk === "stockout_risk";
              const isLowStock = risk === "low_stock";
              const isAdequate = risk === "adequate";

              const cardBorderClass = isStockoutRisk
                ? "border-rose-200 ring-1 ring-rose-100"
                : isLowStock
                ? "border-amber-200"
                : "border-slate-200";

              const badgeColor = isStockoutRisk
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : isLowStock
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : isAdequate
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200";

              const isForecastOpen = Boolean(expandedForecasts[item.productId]);

              return (
                <div
                  key={item.productId}
                  className={`rounded-2xl border ${cardBorderClass} bg-white shadow-xs p-6 transition-all hover:shadow-md`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                        <Package size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {item.productName}
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Unit: <strong className="text-slate-600">{item.unit}</strong> | Listed Price:{" "}
                          <strong className="text-slate-600">₹{item.price}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Badges & Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
                      >
                        {item.inventoryRisk.stockRiskLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                        {item.confidenceLabel} History
                      </span>
                      <button
                        onClick={() => handleOpenStockModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                      >
                        <Edit3 size={13} />
                        Update Stock
                      </button>
                    </div>
                  </div>

                  {/* 4 Dimension Grid */}
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Dimension 1: Warehouse Inventory */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        1. Warehouse Inventory
                      </p>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">On-Hand Stock</span>
                        <span className="text-base font-bold text-slate-900">
                          {item.inventoryRisk.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">In-Flight Reserved</span>
                        <span className="font-semibold text-slate-700">
                          {item.inventoryRisk.committedUnits} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Stock Coverage</span>
                        <span
                          className={`font-bold ${
                            isStockoutRisk
                              ? "text-rose-600"
                              : isLowStock
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.inventoryRisk.daysOfStockRemaining !== null
                            ? `${item.inventoryRisk.daysOfStockRemaining} days`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Dimension 2: Historical Restaurant Demand */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        2. Historical Demand
                      </p>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Orders Received</span>
                        <span className="text-base font-bold text-slate-900">
                          {item.measurements.totalOrders}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Total Units Sold</span>
                        <span className="font-semibold text-slate-700">
                          {item.measurements.totalUnitsSold} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Typical Order Size</span>
                        <span className="font-semibold text-slate-700">
                          {item.measurements.typicalOrderQuantity > 0
                            ? `${item.measurements.typicalOrderQuantity} ${item.unit}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Median Cadence</span>
                        <span className="font-semibold text-slate-700">
                          {item.measurements.medianOrderIntervalDays !== null
                            ? `Every ${item.measurements.medianOrderIntervalDays}d`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Dimension 3: Estimated Future Demand */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        3. Projected Demand
                      </p>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">30-Day Projected</span>
                        <span className="text-base font-bold text-indigo-700">
                          {item.estimatedDemand.projected30DayDemand !== null
                            ? `${item.estimatedDemand.projected30DayDemand} ${item.unit}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">14-Day Projected</span>
                        <span className="font-semibold text-slate-700">
                          {item.estimatedDemand.projected14DayDemand !== null
                            ? `${item.estimatedDemand.projected14DayDemand} ${item.unit}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Daily Demand Rate</span>
                        <span className="font-semibold text-slate-700">
                          {item.measurements.dailyDemandRate !== null
                            ? `${item.measurements.dailyDemandRate} ${item.unit}/d`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Dimension 4: Suggested Replenishment Quantity */}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        4. Replenishment Target
                      </p>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Suggested Restock</span>
                        <span className="text-base font-bold text-indigo-900">
                          {item.replenishment.suggestedQuantity !== null
                            ? `${item.replenishment.suggestedQuantity} ${item.unit}`
                            : "Manual Review"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-600 leading-snug">
                        {item.replenishment.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Walk-Forward Forecast Details */}
                  {item.forecast && item.forecast.isAvailable && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => toggleForecast(item.productId)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {isForecastOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isForecastOpen
                          ? "Hide Chronological Forecast Validation"
                          : `View Chronological Baseline Forecast (Evaluated on ${item.forecast.sampleSize} orders)`}
                      </button>

                      {isForecastOpen && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Walk-Forward Baseline Model Comparison (Out-of-Sample MAE)
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                              Best Fit: {item.forecast.bestModel} (MAE: {item.forecast.bestQuantityMAE} {item.unit})
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                              <p className="text-[11px] text-slate-500 font-medium">Naive Baseline</p>
                              <p className="text-sm font-bold text-slate-800 mt-1">
                                {item.forecast.modelComparison?.naiveQuantityMAE} {item.unit} MAE
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                              <p className="text-[11px] text-slate-500 font-medium">Historical Median</p>
                              <p className="text-sm font-bold text-slate-800 mt-1">
                                {item.forecast.modelComparison?.medianQuantityMAE} {item.unit} MAE
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                              <p className="text-[11px] text-slate-500 font-medium">EWMA (α = 0.35)</p>
                              <p className="text-sm font-bold text-slate-800 mt-1">
                                {item.forecast.modelComparison?.ewmaQuantityMAE} {item.unit} MAE
                              </p>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            {item.forecast.limitations?.map((lim, idx) => (
                              <p key={idx}>• {lim}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Update Stock Modal */}
        {stockModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                onClick={handleCloseStockModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-slate-900">Update Warehouse Stock</h2>
              <p className="mt-1 text-xs text-slate-500">
                Adjust on-hand inventory for <strong>{stockModalProduct.productName}</strong>.
              </p>

              <form onSubmit={handleSaveStock} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current On-Hand Stock ({stockModalProduct.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseStockModal}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStock}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updatingStock ? "Saving..." : "Save Stock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartReplenishment;
