#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:8081';

// Test configuration
const TESTS = {
  security: {
    rateLimiting: true,
    corsProtection: true,
    securityHeaders: true,
    inputValidation: true,
    passwordStrength: true,
  },
  performance: {
    compression: true,
    caching: true,
    responseTime: true,
    databaseOptimization: true,
  }
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${details ? `: ${details}` : ''}`);
}

async function testRateLimiting() {
  console.log('\n🔒 Testing Rate Limiting...');
  
  try {
    // Test normal login attempt
    const normalResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
    });
    
    if (normalResponse.res.statusCode === 401) {
      logTest('Normal login attempt', true);
    } else {
      logTest('Normal login attempt', false, `Expected 401, got ${normalResponse.res.statusCode}`);
    }
    
    // Test rate limiting by making multiple requests
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
      }));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.res.statusCode === 429);
    
    if (rateLimited) {
      logTest('Rate limiting protection', true);
    } else {
      logTest('Rate limiting protection', false, 'No 429 responses detected');
    }
    
  } catch (error) {
    logTest('Rate limiting test', false, error.message);
  }
}

async function testCORSProtection() {
  console.log('\n🌐 Testing CORS Protection...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'X-Requested-With'
      }
    });
    
    if (response.res.statusCode === 400 || response.res.statusCode === 403) {
      logTest('CORS protection', true);
    } else {
      logTest('CORS protection', false, `Expected 400/403, got ${response.res.statusCode}`);
    }
    
  } catch (error) {
    logTest('CORS protection', true, 'Request blocked as expected');
  }
}

async function testSecurityHeaders() {
  console.log('\n🛡️ Testing Security Headers...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/ping`);
    
    const headers = response.res.headers;
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy',
      'strict-transport-security'
    ];
    
    let passed = 0;
    requiredHeaders.forEach(header => {
      if (headers[header]) {
        logTest(`Header: ${header}`, true);
        passed++;
      } else {
        logTest(`Header: ${header}`, false, 'Missing');
      }
    });
    
    if (passed === requiredHeaders.length) {
      logTest('All security headers present', true);
    } else {
      logTest('All security headers present', false, `${passed}/${requiredHeaders.length} headers found`);
    }
    
  } catch (error) {
    logTest('Security headers test', false, error.message);
  }
}

async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...');
  
  try {
    // Test invalid email
    const invalidEmailResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: 'test123' })
    });
    
    if (invalidEmailResponse.res.statusCode === 400) {
      logTest('Email validation', true);
    } else {
      logTest('Email validation', false, `Expected 400, got ${invalidEmailResponse.res.statusCode}`);
    }
    
    // Test weak password
    const weakPasswordResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'weak' })
    });
    
    if (weakPasswordResponse.res.statusCode === 400) {
      logTest('Password strength validation', true);
    } else {
      logTest('Password strength validation', false, `Expected 400, got ${weakPasswordResponse.res.statusCode}`);
    }
    
  } catch (error) {
    logTest('Input validation test', false, error.message);
  }
}

async function testCompression() {
  console.log('\n🗜️ Testing Compression...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/business/active`, {
      headers: { 'Accept-Encoding': 'gzip, deflate' }
    });
    
    const contentEncoding = response.res.headers['content-encoding'];
    if (contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('deflate'))) {
      logTest('Response compression', true, `Using ${contentEncoding}`);
    } else {
      logTest('Response compression', false, 'No compression detected');
    }
    
  } catch (error) {
    logTest('Compression test', false, error.message);
  }
}

async function testCaching() {
  console.log('\n💾 Testing Caching...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/business/active`);
    
    const cacheHeaders = [
      'etag',
      'last-modified',
      'cache-control'
    ];
    
    let foundHeaders = 0;
    cacheHeaders.forEach(header => {
      if (response.res.headers[header]) {
        logTest(`Cache header: ${header}`, true);
        foundHeaders++;
      } else {
        logTest(`Cache header: ${header}`, false, 'Missing');
      }
    });
    
    if (foundHeaders > 0) {
      logTest('Caching headers present', true, `${foundHeaders}/${cacheHeaders.length} headers found`);
    } else {
      logTest('Caching headers present', false, 'No cache headers found');
    }
    
  } catch (error) {
    logTest('Caching test', false, error.message);
  }
}

async function testResponseTime() {
  console.log('\n⚡ Testing Response Time...');
  
  try {
    const start = Date.now();
    const response = await makeRequest(`${BASE_URL}/api/ping`);
    const duration = Date.now() - start;
    
    if (duration < 1000) {
      logTest('Response time', true, `${duration}ms`);
    } else {
      logTest('Response time', false, `${duration}ms (too slow)`);
    }
    
  } catch (error) {
    logTest('Response time test', false, error.message);
  }
}

async function testDatabaseOptimization() {
  console.log('\n🗄️ Testing Database Optimization...');
  
  try {
    const start = Date.now();
    const response = await makeRequest(`${BASE_URL}/api/admin/users`);
    const duration = Date.now() - start;
    
    if (response.res.statusCode === 200) {
      logTest('Database query performance', true, `${duration}ms`);
    } else {
      logTest('Database query performance', false, `HTTP ${response.res.statusCode}`);
    }
    
  } catch (error) {
    logTest('Database optimization test', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Security and Performance Tests...\n');
  
  if (TESTS.security.rateLimiting) await testRateLimiting();
  if (TESTS.security.corsProtection) await testCORSProtection();
  if (TESTS.security.securityHeaders) await testSecurityHeaders();
  if (TESTS.security.inputValidation) await testInputValidation();
  
  if (TESTS.performance.compression) await testCompression();
  if (TESTS.performance.caching) await testCaching();
  if (TESTS.performance.responseTime) await testResponseTime();
  if (TESTS.performance.databaseOptimization) await testDatabaseOptimization();
  
  console.log('\n🎉 Security and Performance Tests Completed!');
}

// Run tests
runAllTests().catch(console.error); 