/**
 * Order Forecast Model (Simplified for Demo)
 * 
 * Utilities for working with order predictions.
 * Demo version uses pre-seeded predictions, no actual forecasting.
 */

/**
 * Check if a prediction is reliable based on confidence threshold
 * @param {number} confidenceScore - Prediction confidence (0-1)
 * @param {number} threshold - Minimum threshold (default from settings)
 * @returns {boolean} Whether prediction is reliable
 */
export function isReliablePrediction(confidenceScore, threshold = 0.75) {
  return confidenceScore >= threshold;
}

/**
 * Calculate prediction error percentage
 * Demo version: Returns the confidence score inverted
 * @param {Object} prediction - Predicted order
 * @returns {number} Error percentage (0-100)
 */
export function calculatePredictionError(prediction) {
  // Error is inverse of confidence
  const error = (1 - prediction.confidence_score) * 100;
  return Math.round(error * 100) / 100;
}

/**
 * Get quantity range for a prediction
 * @param {Object} prediction - Predicted order
 * @returns {Object} Min, expected, max quantities
 */
export function getPredictionRange(prediction) {
  const expected = prediction.predicted_quantity;
  const errorRate = 1 - prediction.confidence_score;
  
  return {
    min: Math.round(expected * (1 - errorRate)),
    expected,
    max: Math.round(expected * (1 + errorRate)),
    errorPercent: Math.round(errorRate * 100),
  };
}

/**
 * Combine real orders and predictions for timeline display
 * @param {Array} orders - Real orders
 * @param {Array} predictions - Predicted orders
 * @param {number} errorThreshold - Max error % for reliable predictions
 * @returns {Array} Combined and sorted timeline items
 */
export function combineOrdersAndPredictions(orders, predictions, errorThreshold = 25) {
  const combined = [];
  
  // Add real orders
  orders.forEach(order => {
    combined.push({
      id: order.id,
      type: 'real',
      customer_id: order.customer_id,
      product_id: order.product_id,
      quantity: order.quantity,
      date: order.due_date,
      status: order.status,
      confidence: 1.0,
      isReliable: true,
      customer: order.customer,
      product: order.product,
    });
  });
  
  // Add predictions
  predictions.forEach(pred => {
    const errorPercent = calculatePredictionError(pred);
    const reliable = errorPercent <= errorThreshold;
    
    combined.push({
      id: pred.id,
      type: 'predicted',
      customer_id: pred.customer_id,
      product_id: pred.product_id,
      quantity: pred.predicted_quantity,
      date: pred.predicted_date,
      status: pred.basis,
      confidence: pred.confidence_score,
      isReliable: reliable,
      errorPercent,
      range: getPredictionRange(pred),
      customer: pred.customer,
      product: pred.product,
    });
  });
  
  // Sort by date
  combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return combined;
}

/**
 * Filter orders by customer and product
 * @param {Array} items - Combined orders/predictions
 * @param {string} customerId - Filter by customer (optional)
 * @param {string} productId - Filter by product (optional)
 * @returns {Array} Filtered items
 */
export function filterOrders(items, customerId = null, productId = null) {
  return items.filter(item => {
    if (customerId && item.customer_id !== customerId) return false;
    if (productId && item.product_id !== productId) return false;
    return true;
  });
}
