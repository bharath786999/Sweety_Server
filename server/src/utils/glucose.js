// Typical adult target range in mg/dl. Shown as a guide only, not medical advice.
const LOW = 70;
const HIGH = 180;

const classify = (v) => (v < LOW ? 'low' : v > HIGH ? 'high' : 'in_range');

module.exports = { LOW, HIGH, classify };