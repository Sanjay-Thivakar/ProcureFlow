/**
 * Helper to compute the median of an array of numbers.
 */
const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
};

/**
 * Calculates Out-of-Sample Chronological Walk-Forward Forecast Evaluation on Supplier Demand.
 * 
 * Strict Chronological Invariants:
 * - Only prior observations t_0 ... t_k are used to predict t_{k+1}.
 * - Compares 3 baseline models on order demand volume: Naive (last order quantity), Historical Median, and EWMA.
 * - Requires at least 5 qualifying completed orders for statistical baseline evaluation.
 * 
 * @param {Array<object>} deliveredOrders - Chronologically ordered purchase records
 * @returns {object} Forecast result with evaluation metrics and limitations disclaimer
 */
const evaluateChronologicalForecast = (deliveredOrders = []) => {
  const n = deliveredOrders.length;

  // Time-series evaluation is unsupportable on < 5 points
  if (n < 5) {
    return {
      isAvailable: false,
      reason: `Insufficient chronological order history (${n} observation${n === 1 ? "" : "s"}). Out-of-sample baseline evaluation requires at least 5 chronological orders.`,
      sampleSize: n,
      limitations: [
        "ProcureFlow records wholesale restaurant order placements, but does not observe restaurant end-consumer dining volume or kitchen waste.",
        "Supplier manufacturing or farm-level restock lead times are not recorded in the schema.",
        "Episodic bulk purchasing creates volatility that requires ongoing order accumulation for stable modeling.",
      ],
    };
  }

  // Extract chronological quantities and timestamps
  const quantities = deliveredOrders.map((o) => o.quantity);
  const dates = deliveredOrders.map((o) => new Date(o.orderDate).getTime());

  // Calculate order intervals in days
  const intervals = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const diffDays = Math.max(0, Math.round((dates[i + 1] - dates[i]) / (1000 * 60 * 60 * 24)));
    intervals.push(diffDays);
  }

  // Walk-forward evaluation on order quantity starting after index 2 (at least 3 initial points to train)
  const naiveQtyErrors = [];
  const medianQtyErrors = [];
  const ewmaQtyErrors = [];

  const alpha = 0.35; // Standard smoothing factor for EWMA

  for (let k = 2; k < quantities.length; k++) {
    const actualQty = quantities[k];
    const trainingQtys = quantities.slice(0, k);

    // 1. Naive Model: Predicts previous order quantity
    const naivePred = quantities[k - 1];
    naiveQtyErrors.push(Math.abs(actualQty - naivePred));

    // 2. Historical Median Model: Predicts median of known history
    const medianPred = calculateMedian(trainingQtys);
    medianQtyErrors.push(Math.abs(actualQty - medianPred));

    // 3. EWMA Model:
    let ewma = trainingQtys[0];
    for (let j = 1; j < trainingQtys.length; j++) {
      ewma = alpha * trainingQtys[j] + (1 - alpha) * ewma;
    }
    ewmaQtyErrors.push(Math.abs(actualQty - ewma));
  }

  const computeMAE = (errors) =>
    errors.length > 0
      ? Number((errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(1))
      : 0;

  const naiveMAE = computeMAE(naiveQtyErrors);
  const medianMAE = computeMAE(medianQtyErrors);
  const ewmaMAE = computeMAE(ewmaQtyErrors);

  // Determine winning baseline model by lowest Out-of-Sample MAE
  let bestModel = "Historical Median";
  let bestMAE = medianMAE;

  if (ewmaMAE < bestMAE) {
    bestModel = "Exponentially Weighted Moving Average (EWMA)";
    bestMAE = ewmaMAE;
  }
  if (naiveMAE < bestMAE) {
    bestModel = "Naive (Last Order Quantity)";
    bestMAE = naiveMAE;
  }

  // Typical quantity and median interval
  const typicalQty = calculateMedian(quantities);
  const medianIntervalDays = intervals.length > 0 ? calculateMedian(intervals) : 7;
  const projectedOrdersPerMonth = 30 / Math.max(1, medianIntervalDays);
  const projected30DayQuantity = Math.max(1, Math.round(projectedOrdersPerMonth * typicalQty));

  return {
    isAvailable: true,
    sampleSize: n,
    evaluatedSteps: naiveQtyErrors.length,
    validationMethod: "Chronological walk-forward test (strictly forward-facing, out-of-sample)",
    bestModel,
    bestQuantityMAE: bestMAE,
    modelComparison: {
      naiveQuantityMAE: naiveMAE,
      medianQuantityMAE: medianMAE,
      ewmaQuantityMAE: ewmaMAE,
    },
    forecast: {
      projected30DayQuantity,
      typicalOrderQuantity: typicalQty,
      medianIntervalDays,
    },
    limitations: [
      "Supplier replenishment estimates reflect historical buyer order volume only.",
      "Upstream supplier delivery lead times and raw material delays are not recorded in the platform.",
      "Sudden restaurant demand spikes or seasonal menu changes cannot be predicted without external POS integration.",
    ],
  };
};

module.exports = {
  calculateMedian,
  evaluateChronologicalForecast,
};
