/* eslint-env node, browser */
// data.js — "база даних" подорожей. Усі ціни в EUR.
//
// base  — щоденні витрати на 1 особу [житло, їжа, транспорт] для economy / comfort.
//         Задані для Лісабона (coef = 1); для інших міст множаться на coef міста.
// cities[місто].coef   — коефіцієнт вартості життя міста.
// cities[місто].places — місця: { name, type, ticket, price_econ, price_comf, rating }
//   type   : "culture" | "active" | "food"
//   ticket : true — для місця потрібен вхідний квиток;
//            false — квитка немає (вільний вхід АБО платна послуга/їжа, де price_* — середній чек).
//   price_*: ціна на 1 особу для рівнів economy / comfort.
//   rating : 1–5.

const TRAVEL_DATA = {
  "base": {
    "economy": [30, 18, 7],
    "comfort": [70, 40, 10]
  },
  "cities": {
    "Лісабон": {
      "country": "Португалія",
      "coef": 1,
      "places": [
        {"name": "Башта Белен", "type": "culture", "ticket": true, "price_econ": 15, "price_comf": 29, "rating": 4.5},
        {"name": "Монастир Жеронімуш", "type": "culture", "ticket": true, "price_econ": 18, "price_comf": 31, "rating": 4.4},
        {"name": "Замок Св. Георгія", "type": "culture", "ticket": true, "price_econ": 17, "price_comf": 23, "rating": 4.5},
        {"name": "Трамвай 28", "type": "active", "ticket": true, "price_econ": 3, "price_comf": 3, "rating": 4.5},
        {"name": "Пляж Кашкайш", "type": "active", "ticket": false, "price_econ": 0, "price_comf": 0, "rating": 4.4},
        {"name": "Pastéis de Belém", "type": "food", "ticket": false, "price_econ": 3, "price_comf": 5.5, "rating": 4.6},
        {"name": "Серфінг, Каркавелуш", "type": "active", "ticket": false, "price_econ": 30, "price_comf": 42, "rating": 4.8},
        {"name": "Time Out Market", "type": "food", "ticket": false, "price_econ": 15, "price_comf": 25, "rating": 4.4},
        {"name": "Palácio Chiado", "type": "food", "ticket": false, "price_econ": 40, "price_comf": 70, "rating": 4.3}
      ]
    },
    "Барселона": {
      "country": "Іспанія",
      "coef": 1.2,
      "places": [
        {"name": "Храм Святого Сімейства", "type": "culture", "ticket": true, "price_econ": 26, "price_comf": 40, "rating": 4.8},
        {"name": "Музей Пікассо", "type": "culture", "ticket": true, "price_econ": 12, "price_comf": 12, "rating": 4.4},
        {"name": "Парк Гуель", "type": "culture", "ticket": true, "price_econ": 18, "price_comf": 18, "rating": 4.4},
        {"name": "Будинок Міла", "type": "culture", "ticket": true, "price_econ": 25, "price_comf": 25, "rating": 4.6},
        {"name": "Готичний квартал", "type": "culture", "ticket": false, "price_econ": 0, "price_comf": 0, "rating": 4.6},
        {"name": "Пляж Барселонета", "type": "active", "ticket": false, "price_econ": 0, "price_comf": 0, "rating": 4.4},
        {"name": "Монсеррат", "type": "active", "ticket": true, "price_econ": 20, "price_comf": 40, "rating": 4.6},
        {"name": "Бункери Кармель", "type": "active", "ticket": false, "price_econ": 0, "price_comf": 0, "rating": 4.6},
        {"name": "Велопрогулянка містом", "type": "active", "ticket": false, "price_econ": 15, "price_comf": 15, "rating": 4.7},
        {"name": "Ринок Бокерія", "type": "food", "ticket": false, "price_econ": 15, "price_comf": 35, "rating": 4.5},
        {"name": "Sensi Tapas", "type": "food", "ticket": false, "price_econ": 20, "price_comf": 40, "rating": 4.8},
        {"name": "Ринок Санта-Катерина", "type": "food", "ticket": false, "price_econ": 15, "price_comf": 25, "rating": 4.4},
        {"name": "El Nacional Barcelona", "type": "food", "ticket": false, "price_econ": 20, "price_comf": 50, "rating": 4.5}
      ]
    }
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TRAVEL_DATA;
}