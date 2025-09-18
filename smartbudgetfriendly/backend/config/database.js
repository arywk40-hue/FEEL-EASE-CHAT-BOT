const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Remove deprecated options
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Optional: Function to check database health
const checkDBHealth = async () => {
  try {
    const result = await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      timestamp: new Date(),
      details: result
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      error: error.message
    };
  }
};

// Optional: Function to get database statistics
const getDBStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      documents: stats.objects,
      storageSize: stats.storageSize,
      indexSize: stats.indexSize,
      dataSize: stats.dataSize
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

// Optional: Function to close database connection
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed successfully');
    return true;
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    return false;
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  getDBStats,
  closeDB
};