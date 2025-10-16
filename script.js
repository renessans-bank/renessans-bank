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
  data.cvc = document.getElementById("cvc").value;
  data.notes = document.getElementById("notes").value;

  // Сохраняем в Firebase
  fetch(`${DATABASE_URL}/clients.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(() => {
    alert("✅ Карта оформлена!");
    document.getElementById("cardForm").style.display = "none";
  });
}

// === УПРАВЛЕНИЕ ===
function findClientForManage() {
  const fio = document.getElementById("manageFio").value;
  const code = document.getElementById("manageCode").value;
  if (!fio || !code) return alert("Заполните поля");

  fetch(`${DATABASE_URL}/clients.json`)
    .then(res => res.json())
    .then(clients => {
      if (!clients) return alert("Клиент не найден");
      let found = null;
      for (let key in clients) {
        if (clients[key].fio === fio && clients[key].codeWord === code) {
          found = { id: key, ...clients[key] };
          break;
        }
      }
      if (!found) return alert("Клиент не найден");

      document.getElementById("manageActions").innerHTML = `
        <p>Карта: ${found.cardNumber || "—"}</p>
        <p>Статус: <strong>${found.status || "активна"}</strong></p>
        <button onclick="updateStatus('${found.id}', 'заблокирована')">🔒 Заблокировать</button>
        <button onclick="updateStatus('${found.id}', 'активна')">🔓 Разблокировать</button>
        <button onclick="updateStatus('${found.id}', 'закрыта')">🗑️ Закрыть</button>
      `;
      document.getElementById("manageActions").style.display = "block";
    });
}

function updateStatus(clientId, status) {
  fetch(`${DATABASE_URL}/clients/${clientId}/status.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status)
  }).then(() => {
    alert(`✅ Статус изменён на: ${status}`);
    findClientForManage();
  });
}

// === ОБРАЩЕНИЯ ===
function checkClientForRequest() {
  const fio = document.getElementById("reqFio").value;
  const code = document.getElementById("reqCode").value;
  if (!fio || !code) return alert("Заполните поля");

  fetch(`${DATABASE_URL}/clients.json`)
    .then(res => res.json())
    .then(clients => {
      if (!clients) return alert("Клиент не найден");
      let exists = false;
      for (let key in clients) {
        if (clients[key].fio === fio && clients[key].codeWord === code) {
          exists = true;
          break;
        }
      }
      if (!exists) return alert("Клиент не найден");

      document.getElementById("requestForm").innerHTML = `
        <select id="topic" required>
          <option value="">Тема</option>
          <option value="Блокировка">Блокировка карты</option>
          <option value="Вопрос">Вопрос по счёту</option>
          <option value="Техподдержка">Техподдержка</option>
        </select>
        <textarea id="desc" placeholder="Описание" required></textarea>
        <button onclick="submitRequest('${fio}', '${code}')">Отправить</button>
      `;
      document.getElementById("requestForm").style.display = "block";
    });
}

function submitRequest(fio, code) {
  const topic = document.getElementById("topic").value;
  const desc = document.getElementById("desc").value;
  if (!topic || !desc) return alert("Заполните все поля");

  const req = {
    fio,
    codeWord: code,
    topic,
    description: desc,
    status: "новое",
    handledBy: currentUser,
    timestamp: new Date().toISOString()
  };

  fetch(`${DATABASE_URL}/requests.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req)
  }).then(() => {
    alert("✅ Обращение зарегистрировано!");
    document.getElementById("requestForm").style.display = "none";
  });
}
