const DATABASE_URL = "https://renessans-bank-3df94-default-rtdb.europe-west1.firebasedatabase.app";
const STAFF = {
  "Ирина": "8992",
  "Арсений": "9274",
  "Ольга": "9274",
  "dem": "1265",
  "renessans": "1265"
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const passField = document.getElementById("password");
  if (passField) {
    passField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }
  initSections();
});

function initSections() {
  const cardsSection = document.getElementById("cardsSection");
  if (cardsSection) {
    cardsSection.innerHTML = `
      <h3>Оформление карты</h3>
      <button onclick="selectCardType('дебетовая')">Дебетовая</button>
      <button onclick="selectCardType('детская')">Детская</button>
      <button onclick="selectCardType('кредитная')">Кредитная</button>
      <div id="cardForm"></div>
    `;
  }

  const manageSection = document.getElementById("manageSection");
  if (manageSection) {
    manageSection.innerHTML = `
      <h3>Управление картой</h3>
      <input type="text" id="manageFio" placeholder="ФИО клиента" />
      <input type="password" id="manageCode" placeholder="Кодовое слово" />
      <button onclick="findClientForManage()">Найти клиента</button>
      <div id="manageActions" style="margin-top:15px;"></div>
    `;
  }

  const requestSection = document.getElementById("requestSection");
  if (requestSection) {
    requestSection.innerHTML = `
      <h3>Проверить обращение</h3>
      <input type="text" id="checkFio" placeholder="ФИО клиента" />
      <input type="password" id="checkCode" placeholder="Кодовое слово" />
      <button onclick="checkExistingRequest()">Проверить</button>
      <div id="checkResult" style="margin-top:15px;"></div>
    `;
  }

  const archiveSection = document.getElementById("archiveSection");
  if (archiveSection) {
    archiveSection.innerHTML = `
      <h3>Архив операций</h3>
      <input type="text" id="archiveFio" placeholder="ФИО клиента" />
      <input type="password" id="archiveCode" placeholder="Кодовое слово" />
      <input type="date" id="dateFrom" /> → <input type="date" id="dateTo" />
      <button onclick="loadClientArchive()">Показать архив</button>
      <div id="archiveResult" style="margin-top:15px;"></div>
    `;
  }
}

function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value;
  if (STAFF[l] === p) {
    currentUser = l;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainScreen").style.display = "block";
    document.getElementById("error").textContent = "";

    if (l === "renessans") {
      document.getElementById("btnNormalRequests").style.display = "inline-block";
      document.getElementById("btnUrgentRequests").style.display = "inline-block";
      document.getElementById("btnNormalRequests").onclick = () => showSection('normalRequests');
      document.getElementById("btnUrgentRequests").onclick = () => showSection('urgentRequests');
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
  const sections = ['cards', 'manage', 'request', 'archive', 'normalRequests', 'urgentRequests'];
  sections.forEach(s => {
    const el = document.getElementById(s + "Section");
    if (el) el.style.display = "none";
  });
  document.getElementById(id + "Section").style.display = "block";

  if (id === 'normalRequests' && currentUser === 'renessans') loadAllRequests();
  if (id === 'urgentRequests' && currentUser === 'renessans') loadUrgentRequests();
}

// === КРЕДИТНАЯ КАРТА СО СКОРИНГОМ ===
function selectCardType(type) {
  let form = `<h3>Анкета: ${type} карта</h3>`;
  form += `
    <input type="text" id="fio" placeholder="ФИО" required>
    <input type="date" id="birthDate" required>
    <input type="text" id="passport" placeholder="Паспорт (серия номер)" required>
    <input type="tel" id="phone" placeholder="Телефон" required>
    <input type="email" id="email" placeholder="Email">
    <input type="text" id="address" placeholder="Адрес регистрации" required>
    <input type="text" id="codeWord" placeholder="Кодовое слово" required>
  `;

  if (type === "кредитная") {
    form += `
      <input type="number" id="income" placeholder="Ежемесячный доход (руб.)" required>
      <input type="number" id="loanAmount" placeholder="Сумма кредита (руб.)" required>
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
  if (type !== "кредитная") {
    proceedToCardDetails({
      type,
      fio: document.getElementById("fio").value,
      birthDate: document.getElementById("birthDate").value,
      passport: document.getElementById("passport").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      codeWord: document.getElementById("codeWord").value,
      staff: currentUser,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // === СКОРИНГ ===
  const income = parseFloat(document.getElementById("income").value);
  const loanAmount = parseFloat(document.getElementById("loanAmount").value);
  const birthDate = new Date(document.getElementById("birthDate").value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (income < 10000) return alert("❌ Доход ниже 10 000 руб.");
  if (age < 21 || age > 65) return alert("❌ Возраст не соответствует требованиям");
  if (loanAmount > income * 12) return alert("❌ Сумма кредита превышает годовой доход");

  document.getElementById("cardForm").innerHTML = `<div class="scoring">Ожидайте, рассматриваем заявку... (30 сек)</div>`;

  setTimeout(() => {
    const approved = income >= 30000 && loanAmount <= income * 6 && age >= 23;
    if (approved) {
      proceedToCardDetails({
        type,
        fio: document.getElementById("fio").value,
        birthDate: document.getElementById("birthDate").value,
        passport: document.getElementById("passport").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        codeWord: document.getElementById("codeWord").value,
        income,
        loanAmount,
        loanPurpose: document.getElementById("loanPurpose").value,
        staff: currentUser,
        timestamp: new Date().toISOString()
      });
    } else {
      document.getElementById("cardForm").innerHTML = `<div class="scoring" style="background:#ffebee;color:#c62828;">❌ В выдаче кредита отказано</div>`;
    }
  }, 30000);
}

function proceedToCardDetails(data) {
  const form = `
    <h3>Введите реквизиты карты</h3>
    <input type="text" id="cardNumber" placeholder="Номер карты" required>
    <input type="text" id="expiry" placeholder="Годен до (ММ/ГГ)" required>
    <input type="text" id="cvc" placeholder="CVC" required>
    <textarea id="notes" placeholder="Примечания"></textarea>
    <button onclick="finalizeCard(${JSON.stringify(data).replace(/"/g, '&quot;')})">Завершить обслуживание</button>
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
    logOperation({
      operation: `Выдача ${data.type} карты`,
      fio: data.fio,
      card: data.cardNumber,
      note: "Карта оформлена через систему"
    });
    alert("✅ Карта успешно оформлена!");
    document.getElementById("cardForm").innerHTML = "";
  }).catch(err => alert("❌ Ошибка сохранения"));
}

// === УПРАВЛЕНИЕ ===
function findClientForManage() {
  const fio = document.getElementById("manageFio").value;
  const code = document.getElementById("manageCode").value;
  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

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

      let html = `
        <p><strong>ФИО:</strong> ${found.fio}</p>
        <p><strong>Паспорт:</strong> ${found.passport}</p>
        <p><strong>Телефон:</strong> ${found.phone}</p>
        <p><strong>Карта:</strong> ${found.cardNumber || "—"}</p>
        <p><strong>Статус:</strong> ${found.status || "активна"}</p>
      `;

      if (currentUser === "renessans") {
        html += `
          <hr>
          <h4>Редактирование (только для модератора)</h4>
          <input type="text" id="editFio" value="${found.fio}" />
          <input type="text" id="editPassport" value="${found.passport}" />
          <input type="tel" id="editPhone" value="${found.phone}" />
          <input type="text" id="editCard" value="${found.cardNumber || ''}" />
          <select id="editStatus">
            <option value="активна" ${found.status === "активна" ? "selected" : ""}>активна</option>
            <option value="заблокирована" ${found.status === "заблокирована" ? "selected" : ""}>заблокирована</option>
            <option value="закрыта" ${found.status === "закрыта" ? "selected" : ""}>закрыта</option>
          </select>
          <button onclick="saveClientEdit('${found.id}')">Сохранить изменения</button>
        `;
      } else {
        html += `
          <button onclick="updateStatus('${found.id}', 'заблокирована')">🔒 Заблокировать</button>
          <button onclick="updateStatus('${found.id}', 'активна')">🔓 Разблокировать</button>
        `;
      }
      document.getElementById("manageActions").innerHTML = html;
    });
}

function saveClientEdit(clientId) {
  const updates = {
    fio: document.getElementById("editFio").value,
    passport: document.getElementById("editPassport").value,
    phone: document.getElementById("editPhone").value,
    cardNumber: document.getElementById("editCard").value,
    status: document.getElementById("editStatus").value
  };

  for (let field in updates) {
    fetch(`${DATABASE_URL}/clients/${clientId}/${field}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates[field])
    });
  }
  logOperation({ operation: "Редактирование данных клиента", fio: updates.fio });
  alert("✅ Изменения сохранены");
  findClientForManage();
}

function updateStatus(clientId, status) {
  fetch(`${DATABASE_URL}/clients/${clientId}/status.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status)
  }).then(() => {
    logOperation({
      operation: `Изменение статуса на "${status}"`,
      fio: "из управления",
      note: `Новый статус: ${status}`
    });
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
    logOperation({
      operation: "Пометка обращения как срочное",
      fio: "из обращения",
      note: `ID обращения: ${reqId}`
    });
    alert("✅ Обращение помечено как срочное!");
    checkExistingRequest();
  });
}

// === АРХИВ ===
function loadClientArchive() {
  const fio = document.getElementById("archiveFio").value;
  const code = document.getElementById("archiveCode").value;
  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

  Promise.all([
    fetch(`${DATABASE_URL}/clients.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/operations.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/requests.json`).then(r => r.json())
  ]).then(([clients, ops, requests]) => {
    let html = `<h4>Полный профиль клиента: ${fio}</h4><hr>`;

    // Карты
    if (clients) {
      for (let key in clients) {
        if (clients[key].fio === fio && clients[key].codeWord === code) {
          html += `<p>💳 ${clients[key].type} карта: ${clients[key].cardNumber || "—"}, статус: ${clients[key].status || "активна"}</p>`;
        }
      }
    }

    // Операции
    if (ops) {
      html += "<h4>История операций:</h4><ul>";
      for (let key in ops) {
        if (ops[key].fio === fio) {
          html += `<li>${new Date(ops[key].timestamp).toLocaleString()} — ${ops[key].operation} (${ops[key].staff})</li>`;
        }
      }
      html += "</ul>";
    }

    // Обращения
    if (requests) {
      html += "<h4>Обращения:</h4><ul>";
      for (let key in requests) {
        if (requests[key].fio === fio && requests[key].codeWord === code) {
          html += `<li>${requests[key].topic}: ${requests[key].description} — статус: ${requests[key].status}</li>`;
        }
      }
      html += "</ul>";
    }

    document.getElementById("archiveResult").innerHTML = html || "<p>Данные не найдены</p>";
  });
}

// === RENESSANS: ВСЕ ОБРАЩЕНИЯ ===
function loadAllRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("normalRequestsSection").innerHTML = "<p>Нет обращений</p>";
      
      let html = "<h4>Все обращения</h4>";
      for (let key in reqs) {
        const r = reqs[key];
        html += `
          <div style="border:1px solid #eee; padding:15px; margin:10px 0; border-radius:6px;">
            <p><strong>${r.fio}</strong> — ${r.topic}</p>
            <p>${r.description}</p>
            <p>Статус: ${r.status}</p>
            ${r.response ? `<p><strong>Ответ:</strong> ${r.response}</p>` : ''}
            <textarea id="resp-${key}" placeholder="Ваш ответ" style="width:100%; margin:8px 0;"></textarea>
            <button onclick="sendResponse('${key}')">Ответить</button>
          </div>
        `;
      }
      document.getElementById("normalRequestsSection").innerHTML = html;
    });
}

function loadUrgentRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("urgentRequestsSection").innerHTML = "<p>Нет ускоренных обращений</p>";
      
      let html = "<h4>Ускоренные обращения</h4>";
      for (let key in reqs) {
        const r = reqs[key];
        if (r.urgent) {
          html += `
            <div style="border:1px solid #ffcdd2; background:#ffebee; padding:15px; margin:10px 0; border-radius:6px;">
              <p>🔥 <strong>${r.fio}</strong> — ${r.topic}</p>
              <p>${r.description}</p>
              <textarea id="respUrgent-${key}" placeholder="Ваш ответ" style="width:100%; margin:8px 0;"></textarea>
              <button onclick="sendResponse('${key}')">Ответить</button>
            </div>
          `;
        }
      }
      document.getElementById("urgentRequestsSection").innerHTML = html || "<p>Нет ускоренных обращений</p>";
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
    logOperation({
      operation: "Ответ на обращение",
      fio: "из модератора",
      note: `Ответ: ${resp.value.trim()}`
    });
    alert("✅ Ответ отправлен!");
    if (document.getElementById("normalRequestsSection").style.display !== "none") loadAllRequests();
    if (document.getElementById("urgentRequestsSection").style.display !== "none") loadUrgentRequests();
  });
}

// === ЛОГИРОВАНИЕ ===
function logOperation(log) {
  fetch(`${DATABASE_URL}/operations.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...log,
      timestamp: new Date().toISOString(),
      staff: currentUser
    })
  });
}
