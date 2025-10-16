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
  const pass = document.getElementById("password");
  if (pass) {
    pass.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }

  // Инициализация форм
  initForms();
});

function initForms() {
  if (document.getElementById("cardsSection")) {
    document.getElementById("cardsSection").innerHTML = `
      <h3>Оформление карты</h3>
      <button onclick="selectCardType('дебетовая')">Дебетовая</button>
      <button onclick="selectCardType('детская')">Детская</button>
      <button onclick="selectCardType('кредитная')">Кредитная</button>
      <div id="cardForm"></div>
    `;
  }
  // ... остальные формы (manage, request, archive) — аналогично предыдущей версии
}

function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value;
  if (STAFF[l] === p) {
    currentUser = l;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainScreen").style.display = "block";
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
  const sections = ['cards','manage','request','archive','normal','urgent'];
  sections.forEach(s => {
    const el = document.getElementById(s + "Section");
    if (el) el.style.display = "none";
  });
  document.getElementById(id + "Section").style.display = "block";
  if (id === 'normal' && currentUser === 'renessans') loadAllRequests();
  if (id === 'urgent' && currentUser === 'renessans') loadUrgentRequests();
}

// === КРЕДИТНАЯ КАРТА СО СКОРИНГОМ ===
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
    // Простое оформление
    proceedToCardDetails({ type, ...collectBasicData() });
    return;
  }

  // === СКОРИНГ ДЛЯ КРЕДИТА ===
  const income = parseFloat(document.getElementById("income").value);
  const loanAmount = parseFloat(document.getElementById("loanAmount").value);
  const birthDate = new Date(document.getElementById("birthDate").value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  // Проверки
  if (income < 10000) {
    alert("❌ Доход слишком низкий");
    return;
  }
  if (age < 21 || age > 65) {
    alert("❌ Возраст не соответствует требованиям");
    return;
  }
  if (loanAmount > income * 12) {
    alert("❌ Сумма кредита превышает годовой доход");
    return;
  }

  // Имитация скоринга
  document.getElementById("cardForm").innerHTML = `<div class="scoring">Ожидайте, рассматриваем заявку...</div>`;
  
  setTimeout(() => {
    // Простая логика одобрения
    const risk = (loanAmount / (income * 12)) * 100; // % от годового дохода
    const approved = income >= 30000 && risk <= 80 && age >= 23;

    if (approved) {
      proceedToCardDetails({ 
        type, 
        ...collectBasicData(),
        income,
        loanAmount,
        loanPurpose: document.getElementById("loanPurpose").value
      });
    } else {
      document.getElementById("cardForm").innerHTML = `<div class="scoring" style="background:#ffebee;color:#c62828;">❌ В выдаче кредита отказано</div>`;
    }
  }, 30000); // 30 секунд
}

function collectBasicData() {
  return {
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

// === УПРАВЛЕНИЕ (с редактированием для renessans) ===
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

      let html = `
        <p><strong>ФИО:</strong> ${found.fio}</p>
        <p><strong>Паспорт:</strong> ${found.passport}</p>
        <p><strong>Телефон:</strong> ${found.phone}</p>
        <p><strong>Карта:</strong> ${found.cardNumber || "—"}</p>
        <p><strong>Статус:</strong> ${found.status || "активна"}</p>
      `;

      // Только renessans видит всё и может редактировать
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
    logOperation({ operation: `Изменение статуса на ${status}`, fio: "из управления" });
    alert(`✅ Статус изменён на: ${status}`);
    findClientForManage();
  });
}

// === ОБРАЩЕНИЯ + АРХИВ ===
function checkExistingRequest() { /* ... как раньше ... */ }
function markAsUrgent(reqId) { /* ... */ }
function loadClientArchive() {
  const fio = document.getElementById("archiveFio").value;
  const code = document.getElementById("archiveCode").value;
  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

  // Загружаем и клиентов, и операции, и обращения
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
          html += `<p>💳 Карта: ${clients[key].cardNumber || "—"}, статус: ${clients[key].status || "активна"}</p>`;
        }
      }
    }

    // Операции
    if (ops) {
      html += "<h4>Операции:</h4><ul>";
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
          html += `<li>${requests[key].topic}: ${requests[key].description} — ${requests[key].status}</li>`;
        }
      }
      html += "</ul>";
    }

    document.getElementById("archiveResult").innerHTML = html;
  });
}

// === RENESSANS: ВСЕ ОБРАЩЕНИЯ ===
function loadAllRequests() { /* ... */ }
function loadUrgentRequests() { /* ... */ }
function sendResponse(reqId) { /* ... */ }

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
