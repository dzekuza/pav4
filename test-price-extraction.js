// Quick test for price extraction
import { extractPriceImproved } from "./server/price-utils.js";

console.log('Testing price extraction with "189.99":');
const result = extractPriceImproved("189.99");
console.log("Result:", result);

console.log('\nTesting with "€189.99":');
const result2 = extractPriceImproved("€189.99");
console.log("Result:", result2);

console.log('\nTesting with "Price: 189.99":');
const result3 = extractPriceImproved("Price: 189.99");
console.log("Result:", result3);
