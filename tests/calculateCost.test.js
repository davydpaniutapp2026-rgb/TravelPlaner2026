// 3 тести для calculateCost. Запуск: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { calculateCost } = require(path.join(__dirname, "..", "js", "calculateCost.js"));

test("calculateCost: бюджету вистачає — повертає залишок", () => {
  // Лісабон, comfort, 4 дні, 2 особи, місця: Замок Св. Георгія (23) + Time Out Market (25)
  // Проживання: 120 × 1 × 4 × 2 = 960; місця: (23 + 25) × 2 = 96; всього 1056
  const result = calculateCost({
    city: "Лісабон", days: 4, people: 2, level: "comfort",
    selectedPlaces: ["Замок Св. Георгія", "Time Out Market"], budget: 1200,
  });
  assert.deepEqual(result, {
    livingCost: 960, placesCost: 96, total: 1056, enough: true, difference: 144,
  });
});

test("calculateCost: бюджету не вистачає — повертає суму нестачі", () => {
  // Барселона (coef 1,2), economy, 3 дні, 3 особи, місця: Музей Пікассо (12) + Парк Гуель (18) + Монсеррат (20)
  // Проживання: 55 × 1,2 × 3 × 3 = 594; місця: 50 × 3 = 150; всього 744
  const result = calculateCost({
    city: "Барселона", days: 3, people: 3, level: "economy",
    selectedPlaces: ["Музей Пікассо", "Парк Гуель", "Монсеррат"], budget: 500,
  });
  assert.deepEqual(result, {
    livingCost: 594, placesCost: 150, total: 744, enough: false, difference: 244,
  });
});

test("calculateCost: некоректні дані — кидає помилку", () => {
  const ok = { city: "Лісабон", days: 2, people: 1, level: "economy", selectedPlaces: [], budget: 300 };

  assert.throws(() => calculateCost({ ...ok, days: 0 }), /днів/);
  assert.throws(() => calculateCost({ ...ok, city: "Рим" }), /Невідоме місто/);
  assert.throws(() => calculateCost({ ...ok, selectedPlaces: ["Парк Гуель"] }), /немає в місті/);
});
