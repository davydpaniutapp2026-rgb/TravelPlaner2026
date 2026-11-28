/* eslint-env browser */
// script.js — логіка інтерфейсу, формування маршруту та збереження у localStorage

const CURRENCY_RATES = {
  EUR: { rate: 1, symbol: "€" },
  USD: { rate: 1.08, symbol: "$" },
  UAH: { rate: 45, symbol: "₴" },
};
const TYPE_NAMES = { culture: "Культура", active: "Активний", food: "Гастрономія" };

const STORAGE_KEY = "travelPlannerState";
const FAVORITES_KEY = "travelPlannerFavorites";

document.addEventListener("DOMContentLoaded", () => {
  const citySelect = document.getElementById("citySelect");
  const daysSelect = document.getElementById("daysSelect");
  const budgetInput = document.getElementById("budgetInput");
  const peopleSelect = document.getElementById("peopleSelect");
  const levelSelect = document.getElementById("levelSelect");
  const currencySelect = document.getElementById("currencySelect");
  const typeCheckboxes = document.querySelectorAll('input[name="vacationType"]');
  const submitBtn = document.querySelector(".btn-submit");
  const tripForm = document.getElementById("tripForm");
  const resultSection = document.getElementById("resultSection");

  const data = window.TRAVEL_DATA;
  if (!data || !data.cities) return;

  // 1. Заповнення списку міст із бази даних
  Object.entries(data.cities).forEach(([cityName, cityInfo]) => {
    const option = document.createElement("option");
    option.value = cityName;
    option.textContent = cityInfo.country ? `${cityName} (${cityInfo.country})` : cityName;
    citySelect.appendChild(option);
  });

  // 2. Перевірка вибору хоча б одного типу відпочинку (TC-08)
  function updateSubmitState() {
    const anyChecked = Array.from(typeCheckboxes).some((cb) => cb.checked);
    submitBtn.disabled = !anyChecked;
    submitBtn.style.opacity = anyChecked ? "1" : "0.55";
    submitBtn.style.cursor = anyChecked ? "pointer" : "not-allowed";
  }

  // 3. Збереження та відновлення стану форми в localStorage (TC-08)
  function saveFormState() {
    try {
      const state = {
        city: citySelect.value,
        days: daysSelect.value,
        budget: budgetInput.value,
        people: peopleSelect.value,
        level: levelSelect.value,
        currency: currencySelect.value,
        types: Array.from(typeCheckboxes)
          .filter((cb) => cb.checked)
          .map((cb) => cb.value),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Не вдалося зберегти стан у localStorage:", e);
    }
  }

  function loadFormState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.city && data.cities[state.city]) citySelect.value = state.city;
      if (state.days) daysSelect.value = state.days;
      if (state.budget) budgetInput.value = state.budget;
      if (state.people) peopleSelect.value = state.people;
      if (state.level) levelSelect.value = state.level;
      if (state.currency && CURRENCY_RATES[state.currency]) currencySelect.value = state.currency;
      if (Array.isArray(state.types)) {
        typeCheckboxes.forEach((cb) => {
          cb.checked = state.types.includes(cb.value);
        });
      }
    } catch (e) {
      console.warn("Пошкоджені дані в localStorage, очищення:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function toggleFavorite(placeName) {
    const favs = getFavorites();
    const idx = favs.indexOf(placeName);
    if (idx === -1) favs.push(placeName);
    else favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }

  function formatMoney(amountEur, currencyCode) {
    const { rate, symbol } = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.EUR;
    const converted = Math.round(amountEur * rate * 100) / 100;
    return `${converted} ${symbol}`;
  }

  loadFormState();
  updateSubmitState();

  [citySelect, daysSelect, budgetInput, peopleSelect, levelSelect, currencySelect].forEach((el) => {
    el.addEventListener("change", saveFormState);
    el.addEventListener("input", saveFormState);
  });

  typeCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      updateSubmitState();
      saveFormState();
    });
  });

  // 4. Обробка створення плану
  tripForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = citySelect.value;
    const days = Number(daysSelect.value);
    const people = Number(peopleSelect.value);
    const level = levelSelect.value || "economy";
    const currency = currencySelect.value || "EUR";
    const rawBudget = Number(budgetInput.value);
    const selectedTypes = Array.from(typeCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    if (!city || !days || !people || selectedTypes.length === 0 || rawBudget < 1) {
      return;
    }

    // Конвертуємо бюджет користувача в EUR для розрахунків
    const { rate } = CURRENCY_RATES[currency] || CURRENCY_RATES.EUR;
    const budgetInEur = rawBudget / rate;

    // Підбираємо місця за обраними типами (сортуємо за рейтингом)
    const cityInfo = data.cities[city];
    const matchingPlaces = cityInfo.places
      .filter((p) => selectedTypes.includes(p.type))
      .sort((a, b) => b.rating - a.rating);

    // Розподіляємо місця по днях (по 1–2 локації на день)
    const maxPlaces = Math.min(matchingPlaces.length, days * 2);
    const chosenPlaces = matchingPlaces.slice(0, maxPlaces);
    const selectedPlaceNames = chosenPlaces.map((p) => p.name);

    const calc = window.calculateCost({
      city,
      days,
      people,
      level,
      selectedPlaces: selectedPlaceNames,
      budget: budgetInEur,
    });

    const both = window.calculateBothLevels({
  city,
  days,
  people,
  selectedPlaces: selectedPlaceNames,
  budget: budgetInEur,
});
const levelNames = { economy: "Економ", comfort: "Комфорт" };

document.getElementById("levelCompare").innerHTML = Object.entries(both)
  .map(
    ([key, r]) => `
      <div class="level-col ${key === level ? "selected" : ""}">
        <h3>${levelNames[key]}</h3>
        <p>Разом: <strong>${formatMoney(r.total, currency)}</strong></p>
        <p class="status ${r.enough ? "ok" : "bad"}">
          ${r.enough ? "Вкладаєтесь, залишок" : "Перевищено на"}: ${formatMoney(r.difference, currency)}
        </p>
      </div>`
  )
  .join("");

    // Деталізація базових витрат
    const [baseStay, baseFood, baseTransport] = data.base[level];
    const mult = cityInfo.coef * days * people;
    const stayCostEur = baseStay * mult;
    const foodCostEur = baseFood * mult;
    const transportCostEur = baseTransport * mult;

    document.getElementById("accommodationCost").textContent = formatMoney(stayCostEur, currency);
    document.getElementById("foodCost").textContent = formatMoney(foodCostEur, currency);
    document.getElementById("transportCost").textContent = formatMoney(transportCostEur, currency);
    document.getElementById("ticketsCost").textContent = formatMoney(calc.placesCost, currency);
    document.getElementById("totalCost").textContent = formatMoney(calc.total, currency);

    const balanceBar = document.getElementById("balanceBar");
    const balanceSpan = balanceBar.querySelector("span");
    if (calc.enough) {
      balanceBar.classList.remove("deficit");
      balanceSpan.innerHTML = `Залишок бюджету: <span id="remainingBudget">${formatMoney(calc.difference, currency)}</span>`;
    } else {
      balanceBar.classList.add("deficit");
      balanceSpan.innerHTML = `Нестача бюджету: <span id="remainingBudget">-${formatMoney(calc.difference, currency)}</span>`;
    }

    // Генерація карток днів маршруту
    const itineraryList = document.getElementById("itineraryList");
    itineraryList.innerHTML = "";
    const favorites = getFavorites();
    const priceKey = level === "comfort" ? "price_comf" : "price_econ";

    for (let day = 1; day <= days; day++) {
      const p1 = chosenPlaces[(day - 1) * 2];
      const p2 = chosenPlaces[(day - 1) * 2 + 1];
      const dayPlaces = [p1, p2].filter(Boolean);

      const dayCard = document.createElement("div");
      dayCard.className = "day-card";

      const placesHtml =
        dayPlaces.length > 0
          ? dayPlaces
              .map(
                (p) =>
                  `<p><strong>${p.name}</strong> (${p.type}, ★ ${p.rating})</p>`
              )
              .join("")
          : "<p>Вільний день для прогулянок містом</p>";

      const pricesHtml =
        dayPlaces.length > 0
          ? dayPlaces
              .map(
                (p) =>
                  `<span class="price-badge">${p[priceKey] === 0 ? "Безкоштовно" : formatMoney(p[priceKey] * people, currency)}</span>`
              )
              .join("")
          : `<span class="price-badge">0 ${CURRENCY_RATES[currency].symbol}</span>`;

      const primaryName = dayPlaces[0] ? dayPlaces[0].name : `${city} — День ${day}`;
      const isFav = favorites.includes(primaryName);

      dayCard.innerHTML = `
        <div class="day-thumb" aria-hidden="true"></div>
        <div class="day-body">
          <span class="day-badge">День ${day}</span>
          ${placesHtml}
        </div>
        <div class="day-right">
          ${pricesHtml}
          <button type="button" class="star-btn ${isFav ? "active" : ""}" title="Додати в улюблене" aria-label="Улюблене">
            ★
          </button>
        </div>
      `;

      const starBtn = dayCard.querySelector(".star-btn");
      starBtn.addEventListener("click", () => {
        toggleFavorite(primaryName);
        starBtn.classList.toggle("active");
      });

      itineraryList.appendChild(dayCard);
    }

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
