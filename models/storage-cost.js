/**
 * Storage Cost Model (Simplified for Demo)
 * 
 * Calculates the cost of storing finished goods.
 * Demo version uses simple linear calculations.
 */

/**
 * Calculate storage cost for a batch
 * @param {Object} params
 * @param {number} params.quantity - Number of units
 * @param {number} params.storageCostPerDay - Cost per unit per day
 * @param {number} params.daysInStorage - Days until delivery
 * @returns {Object} Storage cost breakdown
 */
export function calculateStorageCost({
  quantity,
  storageCostPerDay = 0.50,
  daysInStorage = 0,
}) {
  // Simple linear calculation
  const totalCost = quantity * storageCostPerDay * daysInStorage;
  
  return {
    quantity,
    storageCostPerDay,
    daysInStorage,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerUnit: Math.round((totalCost / quantity) * 100) / 100,
  };
}

/**
 * Calculate capital tied up in inventory
 * @param {Object} params
 * @param {number} params.quantity - Number of units
 * @param {number} params.unitCost - Cost per unit (material + production)
 * @param {number} params.interestRate - Annual interest rate (decimal)
 * @param {number} params.daysInStorage - Days in storage
 * @returns {Object} Capital cost breakdown
 */
export function calculateCapitalCost({
  quantity,
  unitCost,
  interestRate = 0.035,
  daysInStorage = 0,
}) {
  const totalValue = quantity * unitCost;
  const dailyRate = interestRate / 365;
  const capitalCost = totalValue * dailyRate * daysInStorage;
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    capitalCost: Math.round(capitalCost * 100) / 100,
    dailyInterestCost: Math.round(totalValue * dailyRate * 100) / 100,
  };
}

/**
 * Calculate total holding cost (storage + capital)
 */
export function calculateTotalHoldingCost({
  quantity,
  storageCostPerDay,
  unitCost,
  interestRate,
  daysInStorage,
}) {
  const storage = calculateStorageCost({ quantity, storageCostPerDay, daysInStorage });
  const capital = calculateCapitalCost({ quantity, unitCost, interestRate, daysInStorage });
  
  return {
    storageCost: storage.totalCost,
    capitalCost: capital.capitalCost,
    totalCost: Math.round((storage.totalCost + capital.capitalCost) * 100) / 100,
    daysInStorage,
  };
}
