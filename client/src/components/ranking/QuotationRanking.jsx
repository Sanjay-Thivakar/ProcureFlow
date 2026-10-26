import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Award,
  TrendingUp,
  Clock,
  Package,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { getRankedQuotations } from "../../services/procurementRankingService";
import { acceptQuotation, rejectQuotation } from "../../services/quotationService";

const QuotationRanking = ({ rfqId, onSuccess }) => {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("recommended"); // 'recommended' | 'price' | 'delivery'
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRankedQuotations(rfqId);
      setRankingData(res.data);
    } catch (err) {
      console.error("Failed to load quotation rankings:", err);
      setError(err.response?.data?.message || "Failed to calculate quotation rankings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfqId) {
      fetchRankings();
    }
  }, [rfqId]);

  const handleAward = async (quotationId) => {
    try {
      setActionInProgress(quotationId);
      await acceptQuotation(quotationId);
      toast.success("Quotation awarded successfully! Order created.");
      if (onSuccess) {
        await onSuccess();
      }
      await fetchRankings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to award quotation.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (quotationId) => {
    try {
      setActionInProgress(quotationId);
      await rejectQuotation(quotationId);
      toast.success("Quotation rejected.");
      if (onSuccess) {
        await onSuccess();
      }
      await fetchRankings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject quotation.");
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          onClick={fetchRankings}
          className="mt-3 px-4 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!rankingData || rankingData.rankedQuotations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        <Clock className="w-10 h-10 mx-auto mb-2 text-slate-400" />
        <h4 className="font-semibold text-slate-700">No Quotations to Rank Yet</h4>
        <p className="text-sm mt-1">Invited suppliers have not yet submitted price quotes for this RFQ.</p>
      </div>
    );
  }

  // Sorting
  const eligibleQuotes = rankingData.rankedQuotations.filter((q) => q.isEligible);
  const ineligibleQuotes = rankingData.rankedQuotations.filter((q) => !q.isEligible);

  const sortedEligible = [...eligibleQuotes].sort((a, b) => {
    if (sortBy === "price") {
      return a.effectiveTotalCost - b.effectiveTotalCost;
    }
    if (sortBy === "delivery") {
      const aEst = a.estimatedDelivery ? new Date(a.estimatedDelivery).getTime() : Infinity;
      const bEst = b.estimatedDelivery ? new Date(b.estimatedDelivery).getTime() : Infinity;
      return aEst - bEst;
    }
    // Default: Recommended rank
    return (a.rank || Infinity) - (b.rank || Infinity);
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-2xl p-5 border border-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">Intelligent Quotation Ranking</h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Weighted evaluation based on effective cost, delivery suitability, stock availability, and verified supplier track record.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto bg-white/80 backdrop-blur p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <button
            onClick={() => setSortBy("recommended")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              sortBy === "recommended"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setSortBy("price")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              sortBy === "price"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Effective Price
          </button>
          <button
            onClick={() => setSortBy("delivery")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              sortBy === "delivery"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Delivery Time
          </button>
        </div>
      </div>

      {/* Eligible Ranked Quotes */}
      <div className="space-y-4">
        {sortedEligible.map((quote) => {
          const isTopRank = quote.rank === 1 && sortBy === "recommended";
          const discount = quote.discountPercentage || 0;
          const isAwarding = actionInProgress === quote._id;

          return (
            <div
              key={quote._id}
              className={`relative bg-white rounded-2xl border transition-all duration-300 p-6 ${
                isTopRank
                  ? "border-indigo-400 shadow-md ring-2 ring-indigo-500/20"
                  : "border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Top Banner Tag */}
              {isTopRank && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                  Top Recommended Quotation
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Supplier info & Rank Badge */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-bold text-center border ${
                      isTopRank
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider text-slate-400">Rank</span>
                    <span className="text-xl">#{quote.rank}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-lg">
                        {quote.supplier?.name || "Supplier"}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Score: {quote.score}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {quote.supplier?.email}
                    </p>

                    {/* Explanation */}
                    <div className="mt-2.5 inline-block text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-indigo-600">Why ranked here: </span>
                      {quote.explanation}
                    </div>
                  </div>
                </div>

                {/* Middle: Key Factors */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                  {/* Effective Cost */}
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Effective Total</span>
                    <div className="font-bold text-slate-900 text-base mt-0.5">
                      ₹{quote.effectiveTotalCost?.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ₹{quote.effectiveUnitPrice}/{rankingData.rfq?.unit || "unit"}
                      {discount > 0 && (
                        <span className="text-emerald-600 font-semibold ml-1">
                          ({discount}% off)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Delivery Suitability */}
                  <div>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Delivery
                    </span>
                    <div className="font-semibold text-slate-800 text-sm mt-0.5">
                      {quote.estimatedDelivery
                        ? new Date(quote.estimatedDelivery).toLocaleDateString()
                        : "Not specified"}
                    </div>
                    <span
                      className={`text-[11px] ${
                        quote.factors?.delivery?.score >= 90
                          ? "text-emerald-600"
                          : quote.factors?.delivery?.score < 50
                          ? "text-rose-600"
                          : "text-slate-500"
                      }`}
                    >
                      {quote.factors?.delivery?.explanation || "Standard"}
                    </span>
                  </div>

                  {/* Stock Fulfilment */}
                  <div>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Package className="w-3 h-3" /> Stock
                    </span>
                    <div className="font-semibold text-slate-800 text-sm mt-0.5">
                      {quote.factors?.stock?.currentStock !== undefined
                        ? `${quote.factors.stock.currentStock} ${rankingData.rfq?.unit || "available"}`
                        : "Unverified"}
                    </div>
                    <span
                      className={`text-[11px] ${
                        quote.factors?.stock?.isFulfilled
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {quote.factors?.stock?.isFulfilled ? "Full Stock" : "Partial / Check"}
                    </span>
                  </div>

                  {/* Supplier Reliability */}
                  <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>
                      {quote.factors?.reliability?.label || "Supplier verification pending"}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 min-w-[130px] pt-3 lg:pt-0">
                  <button
                    disabled={isAwarding}
                    onClick={() => handleAward(quote._id)}
                    className="w-full px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm hover:shadow"
                  >
                    {isAwarding ? "Awarding..." : "Award Bid"}
                  </button>

                  <button
                    disabled={isAwarding}
                    onClick={() => handleReject(quote._id)}
                    className="w-full px-3 py-1.5 rounded-xl font-medium text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    Decline Bid
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ineligible or Expired Quotes Section */}
      {ineligibleQuotes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Ineligible / Expired Quotations ({ineligibleQuotes.length})
          </h4>
          <div className="space-y-2">
            {ineligibleQuotes.map((quote) => (
              <div
                key={quote._id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between opacity-70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 text-sm">
                      {quote.supplier?.name || "Supplier"}
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {quote.ineligibilityReason || "Quotation cannot be awarded."}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Quoted</span>
                  <div className="font-semibold text-slate-700 text-sm">
                    ₹{quote.quotedPrice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationRanking;
