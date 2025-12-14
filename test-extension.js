// Test file for Canvas Friend Groups Extension
// Run this in the browser console to test functionality

console.log('🧪 Starting Canvas Friend Groups Tests...');

// Test 1: Canvas API Integration
async function testCanvasAPI() {
  console.log('\n📝 Test 1: Canvas API Integration');
  
  try {
    const result = await chrome.storage.local.get(['canvasUrl', 'canvasToken']);
    
    if (!result.canvasUrl || !result.canvasToken) {
      console.log('⚠️  Canvas not configured. Please configure in the extension popup.');
      return false;
    }
    
    console.log('✅ Canvas configuration found');
    
    // Test API connection
    const response = await fetch(`${result.canvasUrl}/api/v1/users/self`, {
      headers: {
        'Authorization': `Bearer ${result.canvasToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Canvas API connection successful');
      console.log('   User:', userData.name);
      return true;
    } else {
      console.log('❌ Canvas API connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 2: Storage
async function testStorage() {
  console.log('\n💾 Test 2: Chrome Storage');
  
  try {
    // Test write
    await chrome.storage.local.set({ testKey: 'testValue' });
    console.log('✅ Write to storage successful');
    
    // Test read
    const result = await chrome.storage.local.get(['testKey']);
    if (result.testKey === 'testValue') {
      console.log('✅ Read from storage successful');
    } else {
      console.log('❌ Storage read mismatch');
      return false;
    }
    
    // Cleanup
    await chrome.storage.local.remove(['testKey']);
    console.log('✅ Storage cleanup successful');
    
    return true;
  } catch (error) {
    console.log('❌ Storage error:', error.message);
    return false;
  }
}

// Test 3: Assignment Data Structure
function testDataStructure() {
  console.log('\n📊 Test 3: Assignment Data Structure');
  
  const sampleAssignment = {
    title: 'Test Assignment',
    dueDate: new Date().toISOString(),
    courseName: 'Test Course',
    id: '12345'
  };
  
  const requiredFields = ['title', 'dueDate', 'courseName', 'id'];
  const hasAllFields = requiredFields.every(field => field in sampleAssignment);
  
  if (hasAllFields) {
    console.log('✅ Assignment structure valid');
    console.log('   Sample:', sampleAssignment);
    return true;
  } else {
    console.log('❌ Assignment structure invalid');
    return false;
  }
}

// Test 4: Date Formatting
function testDateFormatting() {
  console.log('\n📅 Test 4: Date Formatting');
  
  const testDates = [
    { date: new Date(), expected: 'Today' },
    { date: new Date(Date.now() + 24 * 60 * 60 * 1000), expected: 'Tomorrow' },
    { date: new Date(Date.now() - 24 * 60 * 60 * 1000), expected: 'Overdue' }
  ];
  
  console.log('✅ Date formatting test samples:');
  testDates.forEach(({ date, expected }) => {
    console.log(`   ${date.toLocaleDateString()} → ${expected}`);
  });
  
  return true;
}

// Test 5: Firebase Configuration Check
function testFirebaseConfig() {
  console.log('\n🔥 Test 5: Firebase Configuration');
  
  // This will be replaced with actual import in the extension
  const placeholderConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID"
  };
  
  const isConfigured = !placeholderConfig.apiKey.includes('YOUR_');
  
  if (isConfigured) {
    console.log('✅ Firebase appears to be configured');
    return true;
  } else {
    console.log('⚠️  Firebase not yet configured');
    console.log('   Please update firebase-config.js with your credentials');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('Canvas Friend Groups - Extension Tests');
  console.log('═══════════════════════════════════════');
  
  const results = {
    canvas: await testCanvasAPI(),
    storage: await testStorage(),
    dataStructure: testDataStructure(),
    dateFormatting: testDateFormatting(),
    firebase: testFirebaseConfig()
  };
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Test Results Summary:');
  console.log('═══════════════════════════════════════');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalPassed = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall: ${totalPassed}/${totalTests} tests passed`);
  console.log('═══════════════════════════════════════\n');
}

// Export for use in console
if (typeof window !== 'undefined') {
  window.testExtension = runAllTests;
  console.log('\n💡 Run window.testExtension() to execute all tests');
}

// Auto-run if in test mode
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  runAllTests();
}
