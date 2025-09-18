const axios = require('axios');
const { getIRCTCOptions } = require('./irctcService');
const { getRedBusOptions } = require('./redbusService');
const { getUberOptions } = require('./uberService');
const { getFlightOptions } = require('./skyscannerService');

// Main function to calculate all possible routes
async function calculateRoutes(origin, destination, date, passengers = 1) {
  try {
    // Fetch options from all providers in parallel
    const [
      trainOptions,
      busOptions,
      taxiOptions,
      flightOptions
    ] = await Promise.allSettled([
      getIRCTCOptions(origin, destination, date, passengers),
      getRedBusOptions(origin, destination, date, passengers),
      getUberOptions(origin, destination),
      getFlightOptions(origin, destination, date, passengers)
    ]);

    // Combine all options
    let allOptions = [];
    
    if (trainOptions.status === 'fulfilled') allOptions = allOptions.concat(trainOptions.value);
    if (busOptions.status === 'fulfilled') allOptions = allOptions.concat(busOptions.value);
    if (taxiOptions.status === 'fulfilled') allOptions = allOptions.concat(taxiOptions.value);
    if (flightOptions.status === 'fulfilled') allOptions = allOptions.concat(flightOptions.value);
    
    // Calculate multi-modal options (combinations of different transport modes)
    const multiModalOptions = await calculateMultiModalOptions(origin, destination, date, passengers);
    allOptions = allOptions.concat(multiModalOptions);
    
    // Calculate value scores for each option
    allOptions.forEach(option => {
      option.valueScore = calculateValueScore(option);
    });
    
    // Sort by value score (descending)
    allOptions.sort((a, b) => b.valueScore - a.valueScore);
    
    return allOptions;
  } catch (error) {
    console.error('Error calculating routes:', error);
    throw new Error('Failed to calculate routes');
  }
}

// Calculate value score based on price, duration, comfort, etc.
function calculateValueScore(option) {
  const { price, duration, comfortScore = 5, transfers = [] } = option;
  
  // Normalize factors (these weights can be adjusted)
  const priceWeight = 0.5;
  const timeWeight = 0.3;
  const comfortWeight = 0.2;
  
  // Normalize values (this is a simplified approach)
  // In a real application, you'd use more sophisticated normalization
  const normalizedPrice = Math.max(0, 1 - (price / 10000)); // Assuming max price of 10,000 INR
  const normalizedTime = Math.max(0, 1 - (duration / 600)); // Assuming max duration of 10 hours
  const normalizedComfort = comfortScore / 10;
  
  // Calculate score (0-100)
  const score = (
    normalizedPrice * priceWeight + 
    normalizedTime * timeWeight + 
    normalizedComfort * comfortWeight
  ) * 100;
  
  return Math.round(score);
}

// Calculate multi-modal options (e.g., train + taxi)
async function calculateMultiModalOptions(origin, destination, date, passengers) {
  // This is a simplified implementation
  // In a real application, you'd use more sophisticated routing algorithms
  
  const options = [];
  
  // Example: Check if there's a train to a major city near the destination
  // then calculate taxi from that city to the final destination
  
  // This would integrate with mapping APIs like Google Maps
  // to find optimal combinations of transport modes
  
  return options;
}

module.exports = {
  calculateRoutes,
  calculateValueScore
};