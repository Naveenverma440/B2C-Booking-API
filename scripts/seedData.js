const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Order = require('../models/Order');

// Sample users data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    phone: '+1-555-0101',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001'
    },
    isEmailVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    phone: '+1-555-0102',
    dateOfBirth: new Date('1985-08-22'),
    gender: 'female',
    address: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90210'
    },
    isEmailVerified: true
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    phone: '+1-555-0103',
    dateOfBirth: new Date('1992-12-10'),
    gender: 'male',
    address: {
      street: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      zipCode: '60601'
    },
    isEmailVerified: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@example.com',
    password: 'password123',
    phone: '+1-555-0104',
    dateOfBirth: new Date('1988-03-18'),
    gender: 'female',
    address: {
      street: '321 Elm Street',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      zipCode: '33101'
    },
    isEmailVerified: true
  }
];

// Function to generate sample orders for a user
const generateSampleOrders = (userId, userFirstName, userLastName) => {
  const orders = [];
  const today = new Date();
  
  // Generate upcoming bookings
  for (let i = 0; i < 3; i++) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (30 + i * 60)); // 30, 90, 150 days from now
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7); // 7-day trips
    
    orders.push({
      userId: userId,
      bookingReference: `BK${Date.now()}${i}${Math.floor(Math.random() * 1000)}`,
      destination: {
        city: ['Dubai', 'Paris', 'Tokyo', 'London', 'Sydney'][i % 5],
        country: ['UAE', 'France', 'Japan', 'UK', 'Australia'][i % 5]
      },
      origin: {
        city: 'New York',
        country: 'USA'
      },
      startDate: startDate,
      endDate: endDate,
      lastTravelDate: endDate,
      bookingType: ['flight', 'package', 'hotel'][i % 3],
      status: 'confirmed',
      travellers: [
        {
          firstName: userFirstName,
          lastName: userLastName,
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          passportNumber: `P${Math.floor(Math.random() * 10000000)}`,
          nationality: 'American'
        }
      ],
      flightDetails: {
        airline: ['Emirates', 'Air France', 'Japan Airlines'][i % 3],
        flightNumber: `${['EK', 'AF', 'JL'][i % 3]}${Math.floor(Math.random() * 1000)}`,
        departure: {
          airport: 'JFK',
          city: 'New York',
          date: startDate,
          time: '14:30'
        },
        arrival: {
          airport: ['DXB', 'CDG', 'NRT'][i % 3],
          city: ['Dubai', 'Paris', 'Tokyo'][i % 3],
          date: startDate,
          time: '23:45'
        },
        class: ['economy', 'business', 'premium-economy'][i % 3]
      },
      hotelDetails: {
        name: ['Burj Al Arab', 'Hotel Plaza Athenee', 'Park Hyatt Tokyo'][i % 3],
        address: ['Jumeirah Beach', '25 Avenue Montaigne', '3-7-1-2 Nishi Shinjuku'][i % 3],
        city: ['Dubai', 'Paris', 'Tokyo'][i % 3],
        checkIn: startDate,
        checkOut: endDate,
        roomType: ['Deluxe Room', 'Suite', 'Executive Room'][i % 3],
        numberOfRooms: 1
      },
      totalAmount: [2500, 3500, 4200][i % 3],
      currency: 'USD',
      paymentStatus: 'paid',
      paymentMethod: ['credit-card', 'debit-card', 'paypal'][i % 3],
      bookingSource: 'web'
    });
  }
  
  // Generate completed bookings
  for (let i = 0; i < 2; i++) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (60 + i * 90)); // 60, 150 days ago
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // 5-day trips
    
    orders.push({
      userId: userId,
      bookingReference: `BK${Date.now()}${i + 10}${Math.floor(Math.random() * 1000)}`,
      destination: {
        city: ['Barcelona', 'Rome'][i % 2],
        country: ['Spain', 'Italy'][i % 2]
      },
      origin: {
        city: 'New York',
        country: 'USA'
      },
      startDate: startDate,
      endDate: endDate,
      lastTravelDate: endDate,
      bookingType: ['package', 'flight'][i % 2],
      status: 'completed',
      travellers: [
        {
          firstName: userFirstName,
          lastName: userLastName,
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          passportNumber: `P${Math.floor(Math.random() * 10000000)}`,
          nationality: 'American'
        }
      ],
      flightDetails: {
        airline: ['Iberia', 'Alitalia'][i % 2],
        flightNumber: `${['IB', 'AZ'][i % 2]}${Math.floor(Math.random() * 1000)}`,
        departure: {
          airport: 'JFK',
          city: 'New York',
          date: startDate,
          time: '10:15'
        },
        arrival: {
          airport: ['BCN', 'FCO'][i % 2],
          city: ['Barcelona', 'Rome'][i % 2],
          date: startDate,
          time: '22:30'
        },
        class: 'economy'
      },
      hotelDetails: {
        name: ['Hotel Casa Fuster', 'Hotel de Russie'][i % 2],
        address: ['Passeig de Gracia 132', 'Via del Babuino 9'][i % 2],
        city: ['Barcelona', 'Rome'][i % 2],
        checkIn: startDate,
        checkOut: endDate,
        roomType: 'Standard Room',
        numberOfRooms: 1
      },
      totalAmount: [1800, 2200][i % 2],
      currency: 'USD',
      paymentStatus: 'paid',
      paymentMethod: 'credit-card',
      bookingSource: 'web'
    });
  }
  
  return orders;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create orders for each user
    console.log('📋 Creating sample bookings...');
    let totalOrders = 0;
    
    for (const user of createdUsers) {
      const userOrders = generateSampleOrders(user._id, user.firstName, user.lastName);
      
      for (const orderData of userOrders) {
        const order = new Order(orderData);
        await order.save();
        totalOrders++;
      }
      
      console.log(`✅ Created ${userOrders.length} bookings for ${user.email}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${createdUsers.length}`);
    console.log(`   - Bookings created: ${totalOrders}`);
    console.log(`   - Upcoming bookings: ${totalOrders * 0.6}`);
    console.log(`   - Completed bookings: ${totalOrders * 0.4}`);
    
    console.log('\n🔐 Sample login credentials:');
    sampleUsers.forEach(user => {
      console.log(`   Email: ${user.email} | Password: ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers };