const axios = require('axios');

async function getIRCTCOptions(origin, destination, date, passengers) {
  try {
    // This would be the actual IRCTC API integration
    // For demonstration, we'll return mock data
    
    // In a real implementation, you would:
    // 1. Convert location names to station codes
    // 2. Make API request to IRCTC
    // 3. Process the response
    
    const mockResponse = {
      data: {
        trains: [
          {
            trainNumber: '12301',
            trainName: 'Rajdhani Express',
            departureTime: '16:00',
            arrivalTime: '20:30',
            duration: '4h 30m',
            classes: [
              { class: '3A', fare: 520 },
              { class: '2A', fare: 750 },
              { class: '1A', fare: 1260 }
            ]
          },
          {
            trainNumber: '12430',
            trainName: 'Shatabdi Express',
            departureTime: '06:00',
            arrivalTime: '10:15',
            duration: '4h 15m',
            classes: [
              { class: 'CC', fare: 595 },
              { class: 'EC', fare: 1145 }
            ]
          }
        ]
      }
    };
    
    // Process the API response into our format
    const options = mockResponse.data.trains.map(train => {
      const cheapestClass = train.classes.reduce((cheapest, current) => 
        current.fare < cheapest.fare ? current : cheapest
      );
      
      return {
        mode: 'train',
        provider: 'IRCTC',
        departureTime: new Date(`${date}T${train.departureTime}:00`),
        arrivalTime: new Date(`${date}T${train.arrivalTime}:00`),
        duration: convertDurationToMinutes(train.duration),
        price: cheapestClass.fare * passengers,
        details: {
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          travelClass: cheapestClass.class,
          availableSeats: Math.floor(Math.random() * 50) + 10 // Mock availability
        },
        comfortScore: 7 // Based on train type and class
      };
    });
    
    return options;
  } catch (error) {
    console.error('IRCTC API error:', error);
    return []; // Return empty array if API fails
  }
}

function convertDurationToMinutes(durationStr) {
  // Convert "4h 30m" to 270 minutes
  const hoursMatch = durationStr.match(/(\d+)h/);
  const minutesMatch = durationStr.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

module.exports = {
  getIRCTCOptions
};