
const fs = require('fs');
const pdf = require('pdf-parse');

console.log(typeof pdf);
console.log(pdf);

const dataBuffer = fs.readFileSync('public/pdf/COSTOS5.pdf');

try {
    // If pdf is an object with default, use that
    const parser = pdf.default || pdf;
    parser(dataBuffer).then(function(data) {
        console.log(data.text);
    });
} catch (e) {
    console.error(e);
}
