// Test price extraction
const { extractPriceImproved } = require('./server/price-utils.ts');

// Test with the actual price text from Logitech
const testText = "€189,99"; // European format with comma as decimal separator

console.log("Testing price extraction with:", testText);
const result = extractPriceImproved(testText);
console.log("Result:", result); 