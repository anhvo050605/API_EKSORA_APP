const fs = require('fs');
const path = require('path');

const provincePath = path.join(__dirname, '../data/province.json');
const wardPath = path.join(__dirname, '../data/ward.json');

const provinces = JSON.parse(fs.readFileSync(provincePath));
const wards = JSON.parse(fs.readFileSync(wardPath));

module.exports = { provinces, wards };
