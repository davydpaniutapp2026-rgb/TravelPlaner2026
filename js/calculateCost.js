// calculateCost.js — розрахунок вартості подорожі та порівняння з бюджетом.
// data.js містить чистий JSON-об'єкт (усі ціни в EUR), тому читаємо його як JSON.

const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data.js"), "utf8"));

const LEVELS = { economy: "price_econ", comfort: "price_comf" };
const PLACE_TYPES = ["culture", "active", "food"];

const round2 = (n) => Math.round(n * 100) / 100;
const isPositiveInt = (n) => Number.isInteger(n) && n >= 1;

/**
 * Фільтрація місць міста за типом (culture / active / food).
 * Якщо type не передано — повертає всі місця міста.
 */
function filterPlacesByType(city, type, data = DATA) {
  const cityData = data[city];
  if (!cityData || !Array.isArray(cityData.places)) {
    throw new Error(`Невідоме місто: ${city}`);
  }
  if (type === undefined || type === null) return cityData.places;
  if (!PLACE_TYPES.includes(type)) {
    throw new Error(`Невідомий тип місць: ${type}`);
  }
  return cityData.places.filter((p) => p.type === type);
}

/**
 * Основна функція.
 * @param {{city:string, days:number, people:number, level:'economy'|'comfort',
 *          selectedPlaces?:string[], budget:number}} params
 * @returns {{livingCost:number, placesCost:number, total:number,
 *            enough:boolean, difference:number}}
 */
function calculateCost(params, data = DATA) {
  const { city, days, people, level, selectedPlaces = [], budget } = params || {};

  // --- Валідація ---
  if (!city || !data[city] || city === "base") throw new Error(`Невідоме місто: ${city}`);
  if (!LEVELS[level]) throw new Error(`Невідомий рівень комфорту: ${level}`);
  if (!isPositiveInt(days)) throw new Error("Кількість днів має бути цілим числом ≥ 1");
  if (!isPositiveInt(people)) throw new Error("Кількість осіб має бути цілим числом ≥ 1");
  if (typeof budget !== "number" || !Number.isFinite(budget) || budget < 0) {
    throw new Error("Бюджет має бути невід'ємним числом");
  }
  if (!Array.isArray(selectedPlaces)) throw new Error("selectedPlaces має бути масивом");

  const cityData = data[city];

  // 1–2. Проживання: (житло + їжа + транспорт) × coef × days × people
  const perDay = data.base[level].reduce((a, c) => a + c, 0);
  const livingCost = perDay * cityData.coef * days * people;

  // 3. Місця: ціна за рівнем × people (безкоштовні дають 0)
  const priceKey = LEVELS[level];
  let placesPerPerson = 0;
  for (const name of selectedPlaces) {
    const place = cityData.places.find((p) => p.name === name);
    if (!place) throw new Error(`Місця «${name}» немає в місті ${city}`);
    placesPerPerson += place[priceKey];
  }
  const placesCost = placesPerPerson * people;

  // 4–5. Разом і різниця з бюджетом
  const total = livingCost + placesCost;
  const diff = budget - total;

  return {
    livingCost: round2(livingCost),
    placesCost: round2(placesCost),
    total: round2(total),
    enough: diff >= 0,
    difference: round2(Math.abs(diff)), // залишок, якщо вистачає; нестача, якщо ні
  };
}

/** Порівняння обох рівнів одразу (економ і комфорт) для одних і тих самих параметрів. */
function calculateBothLevels(params, data = DATA) {
  return {
    economy: calculateCost({ ...params, level: "economy" }, data),
    comfort: calculateCost({ ...params, level: "comfort" }, data),
  };
}

module.exports = { calculateCost, calculateBothLevels, filterPlacesByType, DATA };
