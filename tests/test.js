// Запуск з кореня проєкту:  node tests/test.js
const assert = require("assert");
const path = require("path");
const { calculateCost, calculateBothLevels, filterPlacesByType } =
  require(path.join(__dirname, "..", "js", "calculateCost.js"));
const DATA = require(path.join(__dirname, "..", "js", "data.js"));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("✔", name); }
  catch (e) { failed++; console.log("✘", name, "\n   ", e.message); }
}

// ---------- Перевірка даних (data.js) ----------
test("Дані: є base і cities", () => {
  assert.ok(DATA.base && DATA.cities);
  assert.strictEqual(DATA.base.economy.length, 3);
  assert.strictEqual(DATA.base.comfort.length, 3);
});
test("Дані: base — невід'ємні числа", () => {
  for (const lvl of ["economy", "comfort"])
    DATA.base[lvl].forEach((n) => assert.ok(typeof n === "number" && n >= 0));
});
test("Дані: comfort не дешевший за economy у base", () => {
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  assert.ok(sum(DATA.base.comfort) >= sum(DATA.base.economy));
});
test("Дані: кожне місто має country, coef > 0 і місця", () => {
  for (const [name, c] of Object.entries(DATA.cities)) {
    assert.ok(c.country, `${name}: немає country`);
    assert.ok(typeof c.coef === "number" && c.coef > 0, `${name}: coef`);
    assert.ok(Array.isArray(c.places) && c.places.length > 0, `${name}: places`);
  }
});
test("Дані: місця коректні (тип, ціни, рейтинг, без дублікатів назв)", () => {
  for (const [city, c] of Object.entries(DATA.cities)) {
    const names = new Set();
    for (const p of c.places) {
      const ctx = `${city} / ${p.name}`;
      assert.ok(p.name && !names.has(p.name), `${ctx}: порожня або дублікат назви`);
      names.add(p.name);
      assert.ok(["culture", "active", "food"].includes(p.type), `${ctx}: type`);
      assert.strictEqual(typeof p.ticket, "boolean", `${ctx}: ticket`);
      assert.ok(p.price_econ >= 0 && p.price_comf >= 0, `${ctx}: ціна < 0`);
      assert.ok(p.price_comf >= p.price_econ, `${ctx}: comfort дешевший за economy`);
      assert.ok(p.rating >= 1 && p.rating <= 5, `${ctx}: rating`);
      if (p.ticket) assert.ok(p.price_econ > 0, `${ctx}: квиток із нульовою ціною`);
    }
  }
});

// ---------- Приклади з документа ----------
test("1. Вистачає (економ, 1 особа)", () => {
  const r = calculateCost({ city: "Лісабон", days: 3, people: 1, level: "economy",
    selectedPlaces: ["Башта Белен", "Pastéis de Belém"], budget: 250 });
  assert.deepStrictEqual(r, { livingCost: 165, placesCost: 18, total: 183, enough: true, difference: 67 });
});
test("2. Вистачає (комфорт, 2 особи)", () => {
  const r = calculateCost({ city: "Барселона", days: 5, people: 2, level: "comfort",
    selectedPlaces: ["Храм Святого Сімейства", "Парк Гуель", "Sensi Tapas"], budget: 2000 });
  assert.deepStrictEqual(r, { livingCost: 1440, placesCost: 196, total: 1636, enough: true, difference: 364 });
});
test("3. Не вистачає", () => {
  const r = calculateCost({ city: "Барселона", days: 4, people: 2, level: "economy",
    selectedPlaces: ["Храм Святого Сімейства", "Будинок Міла", "Монсеррат", "Ринок Бокерія"], budget: 600 });
  assert.deepStrictEqual(r, { livingCost: 528, placesCost: 172, total: 700, enough: false, difference: 100 });
});
test("4. Межовий випадок: бюджет = вартість", () => {
  const r = calculateCost({ city: "Лісабон", days: 7, people: 1, level: "comfort",
    selectedPlaces: [], budget: 840 });
  assert.deepStrictEqual(r, { livingCost: 840, placesCost: 0, total: 840, enough: true, difference: 0 });
});
test("5. Нестача навіть із безкоштовними місцями", () => {
  const r = calculateCost({ city: "Лісабон", days: 2, people: 2, level: "economy",
    selectedPlaces: ["Пляж Кашкайш", "Трамвай 28"], budget: 200 });
  assert.deepStrictEqual(r, { livingCost: 220, placesCost: 6, total: 226, enough: false, difference: 26 });
});
test("6. Некоректні дані: 0 днів", () => {
  assert.throws(() => calculateCost({ city: "Лісабон", days: 0, people: 1, level: "economy", budget: 300 }),
    /днів має бути/);
});

// ---------- Валідація ----------
test("Невідоме місто", () =>
  assert.throws(() => calculateCost({ city: "Рим", days: 1, people: 1, level: "economy", budget: 100 }), /Невідоме місто/));
test("«base» не є містом", () =>
  assert.throws(() => calculateCost({ city: "base", days: 1, people: 1, level: "economy", budget: 100 }), /Невідоме місто/));
test("Невідомий level", () =>
  assert.throws(() => calculateCost({ city: "Лісабон", days: 1, people: 1, level: "lux", budget: 100 }), /рівень/));
test("Дробова кількість осіб", () =>
  assert.throws(() => calculateCost({ city: "Лісабон", days: 1, people: 1.5, level: "economy", budget: 100 }), /осіб/));
test("Від'ємний бюджет", () =>
  assert.throws(() => calculateCost({ city: "Лісабон", days: 1, people: 1, level: "economy", budget: -5 }), /Бюджет/));
test("Місця немає в обраному місті", () =>
  assert.throws(() => calculateCost({ city: "Лісабон", days: 1, people: 1, level: "economy",
    selectedPlaces: ["Парк Гуель"], budget: 500 }), /немає в місті/));

// ---------- Фільтрація за типом ----------
test("Фільтр: food у Лісабоні = 3 місця", () => {
  const r = filterPlacesByType("Лісабон", "food");
  assert.strictEqual(r.length, 3);
  assert.ok(r.every((p) => p.type === "food"));
});
test("Фільтр: active у Барселоні = 4 місця", () =>
  assert.strictEqual(filterPlacesByType("Барселона", "active").length, 4));
test("Фільтр без типу повертає всі місця", () =>
  assert.strictEqual(filterPlacesByType("Лісабон").length, 9));
test("Фільтр: невідомий тип", () =>
  assert.throws(() => filterPlacesByType("Лісабон", "sport"), /тип/));

// ---------- Економ vs комфорт ----------
test("Економ дешевший за комфорт", () => {
  const r = calculateBothLevels({ city: "Барселона", days: 3, people: 2,
    selectedPlaces: ["Парк Гуель", "Sensi Tapas"], budget: 1000 });
  assert.ok(r.economy.total < r.comfort.total);
});

console.log(`\nПройдено: ${passed}, провалено: ${failed}`);
process.exit(failed ? 1 : 0);