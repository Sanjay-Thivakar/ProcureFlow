import { useState, useEffect } from "react";
import { Sparkles, Plus, Check, X, RefreshCw, AlertCircle, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import {
  getProductRecommendations,
  getContextRecommendations,
} from "../../services/productRecommendationService";

const ProductRecommendations = ({
  activeProduct,
  searchTerm,
  selectedProducts = [],
  onSelectProduct,
  onFilterToProduct,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [basis, setBasis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [isSectionDismissed, setIsSectionDismissed] = useState(false);

  // Fetch recommendations whenever activeProduct or searchTerm changes
  useEffect(() => {
    let isMounted = true;

    const fetchRecs = async () => {
      // Don't refetch if the entire section was manually closed
      if (isSectionDismissed) return;

      try {
        setLoading(true);
        setError("");

        let response;
        if (activeProduct?._id) {
          response = await getProductRecommendations(activeProduct._id, 6);
        } else if (searchTerm && searchTerm.trim().length >= 2) {
          response = await getContextRecommendations({
            query: searchTerm.trim(),
            limit: 6,
          });
        } else {
          // General contextual recommendation
          response = await getContextRecommendations({ limit: 4 });
        }

        if (isMounted && response?.success) {
          setRecommendations(response.recommendations || []);
          setBasis(response.basis || "complementary");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load recommendations at this moment."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [activeProduct?._id, searchTerm, isSectionDismissed]);

  const handleDismissSingle = (productId, e) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set([...prev, productId]));
  };

  const handleAddRecommendation = (product) => {
    const isAlreadySelected = selectedProducts.some(
      (item) => item._id === product._id
    );

    if (isAlreadySelected) {
      toast("This product listing is already in your selection.", {
        icon: "ℹ️",
      });
      return;
    }

    // Call the parent selection handler
    if (onSelectProduct) {
      onSelectProduct(product);
      toast.success(`Added ${product.name} to your selection!`);
    }
  };

  // Filter out any individually dismissed products
  const visibleRecommendations = recommendations.filter(
    (item) => !dismissedIds.has(item._id)
  );

  if (isSectionDismissed) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setIsSectionDismissed(false);
            setDismissedIds(new Set());
          }}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Show Suggestions
        </button>
      </div>
    );
  }

  // Get user-friendly badge label and color
  const getBasisBadge = () => {
    switch (basis) {
      case "co_purchase":
        return {
          label: "Frequently Paired",
          classes: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
      case "category_fallback":
        return {
          label: "Related Category",
          classes: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "complementary":
      default:
        return {
          label: "Smart Complement",
          classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
    }
  };

  const badgeInfo = getBasisBadge();

  return (
    <div className="mb-8 bg-gradient-to-r from-emerald-50/70 via-indigo-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                You may also need
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeInfo.classes}`}
              >
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeProduct
                ? `Recommended companions for ${activeProduct.name}`
                : "Suggested complementary supplies for your restaurant"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSectionDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          title="Dismiss suggestions"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-xl p-4 border border-rose-200 flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setDismissedIds(new Set())}
            className="text-xs font-semibold underline hover:text-rose-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && visibleRecommendations.length === 0 && (
        <div className="bg-white/80 rounded-xl p-6 text-center border border-dashed border-slate-200">
          <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">
            No complementary recommendations available at the moment.
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Check back as new suppliers list matching supplies.
          </p>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {!loading && !error && visibleRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRecommendations.map((product) => {
            const isSelected = selectedProducts.some(
              (item) => item._id === product._id
            );

            return (
              <div
                key={product._id}
                className="group relative bg-white hover:bg-emerald-50/30 rounded-xl p-4 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Dismiss single item */}
                <button
                  onClick={(e) => handleDismissSingle(product._id, e)}
                  className="absolute top-2.5 right-2.5 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition p-1"
                  title="Hide this recommendation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div>
                  <div className="flex items-start justify-between pr-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 truncate max-w-[140px]">
                      Supplier: <strong className="text-slate-700">{product.supplier?.name || "Verified"}</strong>
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      {product.stock} {product.unit} left
                    </span>
                  </div>

                  <div className="mt-2.5 text-sm">
                    <span className="font-bold text-emerald-600 text-base">
                      ₹{product.price}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">
                      per {product.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleAddRecommendation(product)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </>
                    )}
                  </button>

                  {onFilterToProduct && (
                    <button
                      onClick={() => onFilterToProduct(product.name)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                      title="Compare all suppliers for this item"
                    >
                      Compare
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;
