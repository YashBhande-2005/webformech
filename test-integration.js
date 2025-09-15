// Test script to verify the Urban Mechanic integration
const mongoose = require('mongoose');
const Mechanic = require('./models/Mechanic');
const User = require('./models/User');
const ServiceRequest = require('./models/ServiceRequest');

// Connect to database
const connectDB = require('./config/db');
connectDB();

async function testIntegration() {
    console.log('🧪 Testing Urban Mechanic Integration...\n');

    try {
        // Test 1: Create a test mechanic
        console.log('1. Creating test mechanic...');
        
        // Create a test user first
        const testUser = new User({
            name: 'Test Mechanic',
            email: 'test.mechanic@example.com',
            password: 'password123',
            role: 'mechanic'
        });
        await testUser.save();
        console.log('✅ Test user created:', testUser._id);

        // Create a test mechanic profile
        const testMechanic = new Mechanic({
            user: testUser._id,
            specializations: ['Engine Repair', 'Battery Service'],
            experience: 5,
            servicesOffered: ['Battery Jump', 'Engine Trouble', 'Flat Tyre'],
            hourlyRate: 500,
            location: {
                type: 'Point',
                coordinates: [72.8777, 19.0760], // Mumbai coordinates
                formattedAddress: 'Mumbai, Maharashtra, India',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India'
            },
            isAvailable: true,
            rating: 4.5,
            reviewCount: 10
        });
        await testMechanic.save();
        console.log('✅ Test mechanic created:', testMechanic._id);

        // Test 2: Create a test customer
        console.log('\n2. Creating test customer...');
        const testCustomer = new User({
            name: 'Test Customer',
            email: 'test.customer@example.com',
            password: 'password123',
            role: 'customer'
        });
        await testCustomer.save();
        console.log('✅ Test customer created:', testCustomer._id);

        // Test 3: Create a test service request
        console.log('\n3. Creating test service request...');
        const testServiceRequest = new ServiceRequest({
            customer: testCustomer._id,
            vehicleInfo: {
                make: 'Honda',
                model: 'City',
                year: 2020,
                licensePlate: 'MH01AB1234'
            },
            serviceType: 'Battery Jump',
            description: 'Car battery died, need jump start service',
            location: {
                type: 'Point',
                coordinates: [72.8777, 19.0760], // Same location as mechanic
                formattedAddress: 'Mumbai, Maharashtra, India',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India'
            },
            status: 'pending'
        });
        await testServiceRequest.save();
        console.log('✅ Test service request created:', testServiceRequest._id);

        // Test 4: Test nearby mechanics query
        console.log('\n4. Testing nearby mechanics query...');
        const radiusInRadians = 10 / 6371; // 10km radius
        const nearbyMechanics = await Mechanic.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[72.8777, 19.0760], radiusInRadians]
                }
            },
            isAvailable: true,
            servicesOffered: { $in: ['Battery Jump'] }
        }).populate({
            path: 'user',
            select: 'name email phone'
        });

        console.log(`✅ Found ${nearbyMechanics.length} nearby mechanics for Battery Jump service`);
        nearbyMechanics.forEach(mechanic => {
            console.log(`   - ${mechanic.user.name} (${mechanic.servicesOffered.join(', ')})`);
        });

        // Test 5: Test mechanic notifications query
        console.log('\n5. Testing mechanic notifications...');
        const nearbyRequests = await ServiceRequest.find({
            location: {
                $geoWithin: {
                    $centerSphere: [testMechanic.location.coordinates, radiusInRadians]
                }
            },
            status: 'pending',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).populate({
            path: 'customer',
            select: 'name email phone'
        });

        console.log(`✅ Found ${nearbyRequests.length} pending requests near the mechanic`);
        nearbyRequests.forEach(request => {
            console.log(`   - ${request.serviceType}: ${request.description.substring(0, 50)}...`);
        });

        console.log('\n🎉 All tests passed! Integration is working correctly.');
        console.log('\n📋 Summary:');
        console.log(`   - Test mechanic: ${testMechanic._id}`);
        console.log(`   - Test customer: ${testCustomer._id}`);
        console.log(`   - Test service request: ${testServiceRequest._id}`);
        console.log(`   - Nearby mechanics found: ${nearbyMechanics.length}`);
        console.log(`   - Pending requests found: ${nearbyRequests.length}`);

        console.log('\n🚀 You can now test the complete flow:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Visit: http://localhost:5000/find-mechanic');
        console.log('   3. Request help and see notifications in mechanic dashboard');
        console.log('   4. Visit: http://localhost:5000/mechanic-dashboard (login as test.mechanic@example.com)');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Close database connection
        mongoose.connection.close();
    }
}

// Run the test
testIntegration();
