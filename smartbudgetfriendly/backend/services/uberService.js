const axios = require('axios');

class UberService {
  constructor() {
    this.apiKey = process.env.UBER_API_KEY;
    this.baseURL = 'https://api.uber.com/v1.2';
    this.clientId = process.env.UBER_CLIENT_ID;
    this.clientSecret = process.env.UBER_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Authenticate with Uber API
  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry > Date.now()) {
        return this.accessToken; // Use existing token if still valid
      }

      const response = await axios.post('https://login.uber.com/oauth/v2/token', 
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
          scope: 'ride.request'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Uber authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Uber API');
    }
  }

  // Get Uber ride options between two points
  async getUberOptions(origin, destination) {
    try {
      const token = await this.authenticate();
      
      // Convert location names to coordinates (simplified - in real app, use geocoding API)
      const originCoords = await this.geocodeLocation(origin);
      const destinationCoords = await this.geocodeLocation(destination);
      
      if (!originCoords || !destinationCoords) {
        throw new Error('Could not geocode locations');
      }

      // Get price estimates
      const priceResponse = await axios.get(`${this.baseURL}/estimates/price`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json'
        },
        params: {
          start_latitude: originCoords.lat,
          start_longitude: originCoords.lng,
          end_latitude: destinationCoords.lat,
          end_longitude: destinationCoords.lng
        }
      });

      // Get time estimates
      const timeResponse = await axios.get(`${this.baseURL}/estimates/time`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json'
        },
        params: {
          start_latitude: originCoords.lat,
          start_longitude: originCoords.lng
        }
      });

      // Process the responses into our format
      return this.processUberData(priceResponse.data, timeResponse.data, origin, destination);

    } catch (error) {
      console.error('Uber API error:', error.response?.data || error.message);
      
      // Fallback to mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock Uber data as fallback');
        return this.getMockUberOptions(origin, destination);
      }
      
      return []; // Return empty array in production if API fails
    }
  }

  // Process Uber API response into our format
  processUberData(priceData, timeData, origin, destination) {
    const options = [];
    
    if (priceData.prices && timeData.times) {
      // Create a map of product_id to time estimate
      const timeMap = {};
      timeData.times.forEach(timeEstimate => {
        timeMap[timeEstimate.product_id] = timeEstimate.estimate;
      });

      priceData.prices.forEach(price => {
        const duration = timeMap[price.product_id] || 0;
        
        options.push({
          mode: 'taxi',
          provider: 'Uber',
          serviceType: price.display_name,
          departureTime: new Date(Date.now() + (timeMap[price.product_id] || 600) * 1000), // Default to 10 mins if no time estimate
          duration: duration, // in seconds
          price: price.low_estimate || price.estimate, // Use low estimate if available
          surge: price.surge_multiplier > 1,
          details: {
            productId: price.product_id,
            currency: price.currency_code,
            distance: price.distance, // in miles
            duration: duration, // in seconds
            minEstimate: price.low_estimate,
            maxEstimate: price.high_estimate,
            surgeMultiplier: price.surge_multiplier
          },
          comfortScore: this.calculateComfortScore(price.display_name),
          valueScore: this.calculateValueScore(price.low_estimate || price.estimate, duration, price.display_name)
        });
      });
    }

    return options;
  }

  // Calculate comfort score based on Uber service type
  calculateComfortScore(serviceType) {
    const comfortScores = {
      'UberGo': 6,
      'UberX': 7,
      'Uber Comfort': 8,
      'Uber Black': 9,
      'Uber SUV': 8,
      'Uber Pool': 5,
      'Uber Moto': 4,
      'Uber Auto': 5
    };
    
    return comfortScores[serviceType] || 6; // Default to 6 if unknown service
  }

  // Calculate value score for Uber option
  calculateValueScore(price, duration, serviceType) {
    // Convert duration from seconds to minutes
    const durationMinutes = duration / 60;
    
    // Base score (higher price = lower score)
    let score = Math.max(0, 100 - (price / 2));
    
    // Adjust for duration (longer duration = slightly lower score)
    score -= (durationMinutes / 10);
    
    // Adjust for service type (premium services get a small boost)
    if (['Uber Black', 'Uber SUV', 'Uber Comfort'].includes(serviceType)) {
      score += 5;
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Mock Uber data for development/fallback
  getMockUberOptions(origin, destination) {
    return [
      {
        mode: 'taxi',
        provider: 'Uber',
        serviceType: 'UberGo',
        departureTime: new Date(Date.now() + 5 * 60000), // 5 minutes from now
        duration: 2400, // 40 minutes in seconds
        price: 450,
        surge: false,
        details: {
          productId: 'uber_go',
          currency: 'INR',
          distance: 15.2,
          duration: 2400,
          minEstimate: 400,
          maxEstimate: 500
        },
        comfortScore: 6,
        valueScore: 72
      },
      {
        mode: 'taxi',
        provider: 'Uber',
        serviceType: 'UberX',
        departureTime: new Date(Date.now() + 7 * 60000), // 7 minutes from now
        duration: 2400, // 40 minutes in seconds
        price: 550,
        surge: false,
        details: {
          productId: 'uber_x',
          currency: 'INR',
          distance: 15.2,
          duration: 2400,
          minEstimate: 500,
          maxEstimate: 600
        },
        comfortScore: 7,
        valueScore: 68
      },
      {
        mode: 'taxi',
        provider: 'Uber',
        serviceType: 'Uber Comfort',
        departureTime: new Date(Date.now() + 10 * 60000), // 10 minutes from now
        duration: 2400, // 40 minutes in seconds
        price: 700,
        surge: false,
        details: {
          productId: 'uber_comfort',
          currency: 'INR',
          distance: 15.2,
          duration: 2400,
          minEstimate: 650,
          maxEstimate: 750
        },
        comfortScore: 8,
        valueScore: 65
      }
    ];
  }

  // Simplified geocoding function (in real app, use Google Maps Geocoding API)
  async geocodeLocation(locationName) {
    // Mock geocoding for common Indian cities
    const cityCoordinates = {
      'new delhi': { lat: 28.6139, lng: 77.2090 },
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'jaipur': { lat: 26.9124, lng: 75.7873 },
      'agra': { lat: 27.1767, lng: 78.0081 }
    };

    const normalizedName = locationName.toLowerCase().trim();
    return cityCoordinates[normalizedName] || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi
  }

  // Book an Uber ride (simplified - in real app, this would actually book)
  async bookUberRide(option, passengers, user) {
    try {
      const token = await this.authenticate();
      
      // This would be the actual Uber booking API call
      // For demo purposes, we'll return a mock response
      
      const mockBooking = {
        bookingId: `uber_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'confirmed',
        driver: {
          name: 'Rajesh Kumar',
          rating: 4.8,
          vehicle: {
            make: 'Toyota',
            model: 'Innova',
            licensePlate: 'DL1CAB1234'
          }
        },
        pickupTime: new Date(Date.now() + 10 * 60000), // 10 minutes from now
        fare: option.price,
        currency: 'INR',
        trackingUrl: `https://m.uber.com/ul/?client_id=${this.clientId}&action=setPickup`
      };

      return mockBooking;
    } catch (error) {
      console.error('Uber booking error:', error.response?.data || error.message);
      throw new Error('Failed to book Uber ride');
    }
  }
}

module.exports = new UberService();