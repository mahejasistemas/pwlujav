
const fs = require('fs');

const buffer = fs.readFileSync('public/pdf/COSTOS5.pdf');
const content = buffer.toString('binary');

// Extract strings (sequences of printable characters)
const strings = content.match(/[A-Za-z0-9 \.,:;\-\(\)\$\%@]{4,}/g);

console.log("--- Extracted Strings ---");
if (strings) {
    console.log(strings.slice(0, 100).join('\n'));
} else {
    console.log("No strings found");
}
