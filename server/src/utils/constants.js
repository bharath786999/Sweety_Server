const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

module.exports = {
  SLOT_LABELS,
  SLOT_KEYS: Object.keys(SLOT_LABELS),
  MIN_VALUE: 40,
  MAX_VALUE: 600,
  MAX_PER_DAY: 4,
};
