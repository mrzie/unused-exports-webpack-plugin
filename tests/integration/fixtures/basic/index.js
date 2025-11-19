// Main entry file - only imports some exports
import { add, multiply } from './utils.js';
import { formatName } from './helpers.js';

// Use the imported functions
const result1 = add(5, 3);
const result2 = multiply(4, 6);
const name = formatName('John', 'Doe');

console.log('Results:', result1, result2, name);

