// Main entry file - only imports some exports
import { add, multiply } from './utils.js';
import { formatName } from './helpers.js';

// Use the imported functions
const result1 = add(5, 3);
const result2 = multiply(4, 6);
const name = formatName('John', 'Doe');

console.log('Results:', result1, result2, name);

// Note: The following exports are unused and will be detected:
// - utils.js: divide function, PI constant
// - helpers.js: formatEmail function, DEFAULT_LANGUAGE constant