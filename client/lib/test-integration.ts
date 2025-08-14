// Test script for the complete tracking integration
// This can be run in the browser console to test the functionality

import { trackReferral, getCompleteAnalytics } from './tracking';

export const testIntegration = {
  // Test referral tracking
  async testReferralTracking() {
    console.log('🧪 Testing referral tracking...');
    
    try {
      const result = await trackReferral(
        'godislove.lt', // business domain
        'https://godislove.lt/products/test-product', // product URL
        'Test Product', // product name
        'test_user_123' // user ID
      );
      
      if (result.success) {
        console.log('✅ Referral tracking test PASSED');
        console.log('Referral ID:', result.referralId);
        console.log('Target URL:', result.targetUrl);
        return true;
      } else {
        console.error('❌ Referral tracking test FAILED');
        console.error('Error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Referral tracking test ERROR:', error);
      return false;
    }
  },

  // Test analytics retrieval
  async testAnalyticsRetrieval() {
    console.log('🧪 Testing analytics retrieval...');
    
    try {
      const events = await getCompleteAnalytics('godislove.lt');
      
      console.log('✅ Analytics retrieval test PASSED');
      console.log('Total events:', events.length);
      console.log('Event types:', [...new Set(events.map(e => e.event_type))]);
      
      // Show sample events
      events.slice(0, 3).forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          type: event.event_type,
          timestamp: event.timestamp,
          data: event.data
        });
      });
      
      return true;
    } catch (error) {
      console.error('❌ Analytics retrieval test ERROR:', error);
      return false;
    }
  },

  // Test complete flow
  async testCompleteFlow() {
    console.log('🧪 Testing complete customer journey flow...');
    
    // Step 1: Track a referral
    const referralResult = await this.testReferralTracking();
    if (!referralResult) {
      console.error('❌ Complete flow test FAILED at referral tracking step');
      return false;
    }
    
    // Step 2: Wait a moment for data to be processed
    console.log('⏳ Waiting for data processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Retrieve analytics
    const analyticsResult = await this.testAnalyticsRetrieval();
    if (!analyticsResult) {
      console.error('❌ Complete flow test FAILED at analytics retrieval step');
      return false;
    }
    
    console.log('✅ Complete flow test PASSED');
    console.log('🎯 Customer journey tracking is working correctly!');
    return true;
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting integration tests...');
    console.log('=====================================');
    
    const results = {
      referralTracking: await this.testReferralTracking(),
      analyticsRetrieval: await this.testAnalyticsRetrieval(),
      completeFlow: await this.testCompleteFlow()
    };
    
    console.log('=====================================');
    console.log('📊 Test Results:');
    console.log('- Referral Tracking:', results.referralTracking ? '✅ PASS' : '❌ FAIL');
    console.log('- Analytics Retrieval:', results.analyticsRetrieval ? '✅ PASS' : '❌ FAIL');
    console.log('- Complete Flow:', results.completeFlow ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log('🎉 All tests PASSED! Integration is working correctly.');
    } else {
      console.log('⚠️ Some tests FAILED. Please check the errors above.');
    }
    
    return results;
  }
};

// Usage examples:
// 
// 1. Test individual components:
// testIntegration.testReferralTracking();
// testIntegration.testAnalyticsRetrieval();
// 
// 2. Test complete flow:
// testIntegration.testCompleteFlow();
// 
// 3. Run all tests:
// testIntegration.runAllTests();

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testIntegration = testIntegration;
}
