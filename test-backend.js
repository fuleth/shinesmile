const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🧪 Testing ShineSmile Backend (SQL Server)');
  console.log('==========================================\n');

  try {
    // Test 1: Server connection
    console.log('1. Testing server connection...');
    const serverResponse = await fetch(`${BASE_URL}/`);
    if (serverResponse.ok) {
      console.log('✅ Server is running\n');
    } else {
      console.log('❌ Server connection failed\n');
      return;
    }

    // Test 2: User registration
    console.log('2. Testing user registration...');
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      phone: '1234567890'
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${registerResult.user.id}`);
      console.log(`   Token: ${registerResult.token.substring(0, 20)}...\n`);
      
      const token = registerResult.token;
      const userId = registerResult.user.id;

      // Test 3: User login
      console.log('3. Testing user login...');
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const loginResult = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log(`   User: ${loginResult.user.fullName}\n`);
      } else {
        console.log('❌ Login failed:', loginResult.message);
        return;
      }

      // Test 4: Book appointment
      console.log('4. Testing appointment booking...');
      const appointmentData = {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        service: 'cleaning',
        appointmentDate: '2024-02-15',
        timeSlot: '09:00 AM',
        notes: 'Test appointment'
      };

      const bookResponse = await fetch(`${BASE_URL}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const bookResult = await bookResponse.json();
      
      if (bookResponse.ok) {
        console.log('✅ Appointment booked successfully');
        console.log(`   Appointment ID: ${bookResult.appointment.id}`);
        console.log(`   Service: ${bookResult.appointment.service}`);
        console.log(`   Date: ${bookResult.appointment.appointmentDate}`);
        console.log(`   Time: ${bookResult.appointment.timeSlot}\n`);
        
        const appointmentId = bookResult.appointment.id;

        // Test 5: Get user appointments
        console.log('5. Testing appointment retrieval...');
        const appointmentsResponse = await fetch(`${BASE_URL}/api/appointments/my-appointments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const appointmentsResult = await appointmentsResponse.json();
        
        if (appointmentsResponse.ok) {
          console.log('✅ Appointments retrieved successfully');
          console.log(`   Found ${appointmentsResult.appointments.length} appointment(s)\n`);
        } else {
          console.log('❌ Failed to retrieve appointments:', appointmentsResult.message);
        }

        // Test 6: Get available time slots
        console.log('6. Testing available time slots...');
        const slotsResponse = await fetch(`${BASE_URL}/api/appointments/available-slots/2024-02-15`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const slotsResult = await slotsResponse.json();
        
        if (slotsResponse.ok) {
          console.log('✅ Available slots retrieved successfully');
          console.log(`   Available slots: ${slotsResult.availableSlots.length}`);
          console.log(`   Slots: ${slotsResult.availableSlots.join(', ')}\n`);
        } else {
          console.log('❌ Failed to retrieve available slots:', slotsResult.message);
        }

        // Test 7: Cancel appointment
        console.log('7. Testing appointment cancellation...');
        const cancelResponse = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const cancelResult = await cancelResponse.json();
        
        if (cancelResponse.ok) {
          console.log('✅ Appointment cancelled successfully\n');
        } else {
          console.log('❌ Failed to cancel appointment:', cancelResult.message);
        }

      } else {
        console.log('❌ Appointment booking failed:', bookResult.message);
      }

    } else {
      console.log('❌ User registration failed:', registerResult.message);
      if (registerResult.errors) {
        registerResult.errors.forEach(error => {
          console.log(`   - ${error.msg}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('🏁 Backend testing completed!');
}

// Run the tests
testBackend(); 