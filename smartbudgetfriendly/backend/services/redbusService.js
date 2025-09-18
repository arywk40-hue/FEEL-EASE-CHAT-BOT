const axios = require('axios');

async function getRedBusOptions(origin, destination, date, passengers) {
  try {
    // This would be the actual RedBus API integration
    // For demonstration, we'll return mock data
    
    const mockResponse = {
      data: {
        buses: [
          {
            busId: 'BUS001',
            busName: 'Sharma Travels AC Sleeper',
            departureTime: '22:00',
            arrivalTime: '03:30',
            duration: '5h 30m',
            fare: 450,
            availableSeats: 20
          },
          {
            busId: 'BUS002',
            busName: 'SRS Travels AC Seater',
            departureTime: '23:30',
            arrivalTime: '05:00',
            duration: '5h 30m',
            fare: 400,
            availableSeats: 15
          }
        ]
      }
    };
    
    // Process the API response into our format
    const options = mockResponse.data.buses.map(bus => ({
      mode: 'bus',
      provider: 'RedBus',
      departureTime: new Date(`${date}T${bus.departureTime}:00`),
      arrivalTime: new Date(`${date}T${bus.arrivalTime}:00`),
      duration: convertDurationToMinutes(bus.duration),
      price: bus.fare * passengers,
      details: {
        busId: bus.busId,
        busName: bus.busName,
        busType: 'AC',
        availableSeats: bus.availableSeats
      },
      comfortScore: 6 // Based on bus type
    }));
    
    return options;
  } catch (error) {
    console.error('RedBus API error:', error);
    return []; // Return empty array if API fails
  }
}

function convertDurationToMinutes(durationStr) {
  const hoursMatch = durationStr.match(/(\d+)h/);
  const minutesMatch = durationStr.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

module.exports = {
  getRedBusOptions
};