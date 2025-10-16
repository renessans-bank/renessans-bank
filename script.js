const DATABASE_URL = "https://renessans-bank-3df94-default-rtdb.europe-west1.firebasedatabase.app";
const STAFF = {
  "Ирина": "8992",
  "Арсений": "9274",
  "Ольга": "9274",
  "dem": "1265",
  "renessans": "1265"
};

let currentUser = null;

// === ENTER только для входа ===
document.addEventListener('DOMContentLoaded', () => {
  const passField = document.getElementById("password");
  if (passField) {
    passField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }
});

function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value;
  if (STAFF[l] === p) {
    currentUser = l;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainScreen").style.display = "block";
    document.getElementById("error").textContent = "";

    if (l === "renessans") {
      document.getElementById("btnNormal").style.display = "inline-block";
      document.getElementById("btnUrgent").style.display = "inline-block";
      document.getElementById("btnNormal").onclick = () => showSection('normal');
      document.getElementById("btnUrgent").onclick = () => showSection('urgent');
    }
  } else {
    document.getElementById("error").textContent = "Неверный логин или пароль";
  }
}

function logout() {
  currentUser = null;
  document.getElementById("mainScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("login").value = "";
  document.getElementById("password").value = "";
}

function showSection(id) {
  const sections = ['cards', 'manage', 'request', 'archive', 'normal', 'urgent'];
  sections.forEach(s => {
    const el = document.getElementById(s + "Section");
    if (el) el.style.display = "none";
  });
  document.getElementById(id + "Section").style.display = "block";

  if (id === 'normal' && currentUser === 'renessans') loadAllRequests();
  if (id === 'urgent' && currentUser === 'renessans') loadUrgentRequests();
}

// === ИНИЦИАЛИЗАЦИЯ ФОРМ ===
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById("cardsSection")) {
    document.getElementById("cardsSection").innerHTML = `
      <h3>Оформление карты</h3>
      <button onclick="selectCardType('дебетовая')">Дебетовая</button>
      <button onclick="selectCardType('детская')">Детская</button>
      <button onclick="selectCardType('кредитная')">Кредитная</button>
      <div id="cardForm"></div>
    `;
  }
  if (document.getElementById("manageSection")) {
    document.getElementById("manageSection").innerHTML = `
      <h3>Управление картой</h3>
      <input type="text" id="manageFio" placeholder="ФИО клиента" />
      <input type="password" id="manageCode" placeholder="Кодовое слово" />
      <button onclick="findClientForManage()">Найти</button>
      <div id="manageActions"></div>
    `;
  }
  if (document.getElementById("requestSection")) {
    document.getElementById("requestSection").innerHTML = `
      <h3>Проверить обращение</h3>
      <input type="text" id="checkFio" placeholder="ФИО клиента" />
      <input type="password" id="checkCode" placeholder="Кодовое слово" />
      <button onclick="checkExistingRequest()">Проверить</button>
      <div id="checkResult"></div>
    `;
  }
  if (document.getElementById("archiveSection")) {
    document.getElementById("archiveSection").innerHTML = `
      <h3>Архив операций</h3>
      <input type="text" id="archiveFio" placeholder="ФИО клиента" />
      <input type="password" id="archiveCode" placeholder="Кодовое слово" />
      <input type="date" id="dateFrom" /> → <input type="date" id="dateTo" />
      <button onclick="loadClientArchive()">Показать архив</button>
      <div id="archiveResult"></div>
    `;
  }
});

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

  fetch(`${DATABASE_URL}/clients.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(() => {
    logOperation({ operation: `Выдача ${data.type} карты`, fio: data.fio, card: data.cardNumber });
    alert("✅ Карта оформлена!");
    document.getElementById("cardForm").innerHTML = "";
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
    });
}

function updateStatus(clientId, status) {
  fetch(`${DATABASE_URL}/clients/${clientId}/status.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status)
  }).then(() => {
    logOperation({ operation: `Изменение статуса на ${status}`, fio: "из управления" });
    alert(`✅ Статус изменён на: ${status}`);
    findClientForManage();
  });
}

// === ОБРАЩЕНИЯ ===
function checkExistingRequest() {
  const fio = document.getElementById("checkFio").value;
  const code = document.getElementById("checkCode").value;
  if (!fio || !code) return alert("Заполните поля");

  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(requests => {
      if (!requests) return document.getElementById("checkResult").innerHTML = "<p>Обращений не найдено</p>";
      
      let found = null;
      for (let key in requests) {
        if (requests[key].fio === fio && requests[key].codeWord === code) {
          found = { id: key, ...requests[key] };
          break;
        }
      }

      if (!found) {
        document.getElementById("checkResult").innerHTML = "<p>Обращений не найдено</p>";
      } else {
        let html = `
          <p><strong>Тема:</strong> ${found.topic}</p>
          <p><strong>Статус:</strong> ${found.status}</p>
          <p><strong>Описание:</strong> ${found.description}</p>
        `;
        if (found.response) {
          html += `<p><strong>Ответ:</strong> ${found.response}</p>`;
        } else {
          html += `<p>Ответ ещё не поступил</p>`;
        }
        if (currentUser !== "renessans") {
          html += `<button onclick="markAsUrgent('${found.id}')">Ускорить обращение</button>`;
        }
        document.getElementById("checkResult").innerHTML = html;
      }
    });
}

function markAsUrgent(reqId) {
  fetch(`${DATABASE_URL}/requests/${reqId}/urgent.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(true)
  }).then(() => {
    alert("✅ Обращение помечено как срочное!");
    checkExistingRequest();
  });
}

// === АРХИВ ===
function loadClientArchive() {
  const fio = document.getElementById("archiveFio").value;
  const code = document.getElementById("archiveCode").value;
  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

  fetch(`${DATABASE_URL}/operations.json`)
    .then(res => res.json())
    .then(ops => {
      if (!ops) return document.getElementById("archiveResult").innerHTML = "<p>Операций не найдено</p>";
      
      const filtered = [];
      for (let key in ops) {
        const op = ops[key];
        if (op.fio === fio) {
          filtered.push(op);
        }
      }

      if (filtered.length === 0) {
        document.getElementById("archiveResult").innerHTML = "<p>Операций не найдено</p>";
      } else {
        let html = "<h4>История операций:</h4><ul>";
        filtered.forEach(op => {
          html += `<li>${new Date(op.timestamp).toLocaleString()} — ${op.operation} (${op.staff})</li>`;
        });
        html += "</ul>";
        document.getElementById("archiveResult").innerHTML = html;
      }
    });
}

// === RENESSANS: ВСЕ ОБРАЩЕНИЯ ===
function loadAllRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("normalSection").innerHTML = "<p>Нет обращений</p>";
      
      let html = "";
      for (let key in reqs) {
        const r = reqs[key];
        html += `
          <div>
            <p><strong>${r.fio}</strong> — ${r.topic}</p>
            <p>${r.description}</p>
            <p>Статус: ${r.status}</p>
            ${r.response ? `<p><strong>Ответ:</strong> ${r.response}</p>` : ''}
            <textarea id="resp-${key}" placeholder="Ваш ответ"></textarea>
            <button onclick="sendResponse('${key}')">Ответить</button>
            <hr>
          </div>
        `;
      }
      document.getElementById("normalSection").innerHTML = html;
    });
}

function loadUrgentRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("urgentSection").innerHTML = "<p>Нет ускоренных обращений</p>";
      
      let html = "";
      for (let key in reqs) {
        const r = reqs[key];
        if (r.urgent) {
          html += `
            <div>
              <p>🔥 <strong>${r.fio}</strong> — ${r.topic}</p>
              <p>${r.description}</p>
              <textarea id="respUrgent-${key}" placeholder="Ваш ответ"></textarea>
              <button onclick="sendResponse('${key}')">Ответить</button>
              <hr>
            </div>
          `;
        }
      }
      document.getElementById("urgentSection").innerHTML = html || "<p>Нет ускоренных обращений</p>";
    });
}

function sendResponse(reqId) {
  const resp = document.getElementById(`resp-${reqId}`) || document.getElementById(`respUrgent-${reqId}`);
  if (!resp || !resp.value.trim()) return alert("Введите ответ");
  
  fetch(`${DATABASE_URL}/requests/${reqId}/response.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp.value.trim())
  }).then(() => {
    alert("✅ Ответ отправлен!");
    if (document.getElementById("normalSection").style.display !== "none") loadAllRequests();
    if (document.getElementById("urgentSection").style.display !== "none") loadUrgentRequests();
  });
}

// === ЛОГИРОВАНИЕ ===
function logOperation(opData) {
  fetch(`${DATABASE_URL}/operations.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...opData,
      timestamp: new Date().toISOString(),
      staff: currentUser
    })
  });
}
