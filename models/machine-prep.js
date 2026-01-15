/**
 * Machine Preparation Model (Simplified for Demo)
 * 
 * Calculates setup times and machine compatibility.
 * Demo version uses constant base times.
 */

// Default setup time in minutes
const DEFAULT_SETUP_TIME = 45;

/**
 * Calculate setup time for a production run
 * Demo version: Returns constant setup time
 * @param {Object} params
 * @param {Object} params.product - Product being produced
 * @param {Object} params.machine - Machine being used
 * @param {Object} params.previousProduct - Previously produced product (optional)
 * @returns {Object} Setup time breakdown
 */
export function calculateSetupTime({
  product,
  machine,
  previousProduct = null,
  defaultSetupMinutes = DEFAULT_SETUP_TIME,
}) {
  // Demo: Use constant setup time
  // Production would calculate based on material changes, temperature differences, etc.
  
  let setupMinutes = defaultSetupMinutes;
  const breakdown = [];
  
  // Base setup time
  breakdown.push({ type: 'base_setup', minutes: 30 });
  
  // Quality check always required
  breakdown.push({ type: 'quality_check', minutes: 15 });
  
  return {
    totalMinutes: setupMinutes,
    totalHours: Math.round((setupMinutes / 60) * 100) / 100,
    breakdown,
  };
}

/**
 * Check if a machine is compatible with a product
 * @param {Object} machine - Machine to check
 * @param {Object} product - Product to produce
 * @returns {Object} Compatibility result
 */
export function checkMachineCompatibility(machine, product) {
  const issues = [];
  let compatible = true;
  
  // Check if product's compatible_machines includes this machine
  if (product.compatible_machines && product.compatible_machines.length > 0) {
    if (!product.compatible_machines.includes(machine.id)) {
      issues.push({
        type: 'not_in_compatible_list',
        message: `Machine ${machine.code} is not in product's compatible machines list`,
      });
      compatible = false;
    }
  }
  
  // Check pressure
  if (product.required_pressure && machine.max_pressure) {
    if (product.required_pressure > machine.max_pressure) {
      issues.push({
        type: 'pressure',
        message: `Required pressure ${product.required_pressure} exceeds machine max ${machine.max_pressure}`,
      });
      compatible = false;
    }
  }
  
  // Check temperature
  if (product.required_temperature && machine.max_temperature) {
    if (product.required_temperature > machine.max_temperature) {
      issues.push({
        type: 'temperature',
        message: `Required temperature ${product.required_temperature} exceeds machine max ${machine.max_temperature}`,
      });
      compatible = false;
    }
  }
  
  return {
    compatible,
    issues,
    machineId: machine.id,
    machineCode: machine.code,
    productId: product.id,
  };
}

/**
 * Get list of compatible machines for a product
 * @param {Object} product - Product to check
 * @param {Array} machines - Available machines
 * @returns {Array} Compatible machines
 */
export function getCompatibleMachines(product, machines) {
  return machines.filter(machine => {
    const result = checkMachineCompatibility(machine, product);
    return result.compatible;
  });
}

/**
 * Calculate production time for a batch
 * @param {Object} params
 * @param {number} params.quantity - Batch size
 * @param {number} params.cycleTime - Seconds per cycle
 * @param {number} params.cavityCount - Cavities in mold
 * @param {number} params.setupMinutes - Setup time in minutes
 * @returns {Object} Production time breakdown
 */
export function calculateProductionTime({
  quantity,
  cycleTime,
  cavityCount = 1,
  setupMinutes = DEFAULT_SETUP_TIME,
}) {
  // Calculate number of shots needed
  const shots = Math.ceil(quantity / cavityCount);
  
  // Production time in minutes
  const productionMinutes = (shots * cycleTime) / 60;
  
  // Total time including setup
  const totalMinutes = productionMinutes + setupMinutes;
  
  return {
    shots,
    productionMinutes: Math.round(productionMinutes),
    setupMinutes,
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
  };
}
