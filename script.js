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
  initSections();
});

function initSections() {
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
      <button onclick="findClientForManage()">Найти клиента</button>
      <div id="manageActions" style="margin-top:15px;"></div>
    `;
  }
  if (document.getElementById("requestSection")) {
    document.getElementById("requestSection").innerHTML = `
      <h3>Проверить обращение</h3>
      <input type="text" id="checkFio" placeholder="ФИО клиента" />
      <input type="password" id="checkCode" placeholder="Кодовое слово" />
      <button onclick="checkExistingRequest()">Проверить</button>
      <div id="checkResult" style="margin-top:15px;"></div>
    `;
  }
  if (document.getElementById("archiveSection")) {
    document.getElementById("archiveSection").innerHTML = `
      <h3>Архив операций</h3>
      <input type="text" id="archiveFio" placeholder="ФИО клиента" />
      <input type="password" id="archiveCode" placeholder="Кодовое слово" />
      <input type="date" id="dateFrom" /> → <input type="date" id="dateTo" />
      <button onclick="loadClientArchive()">Показать архив</button>
      <div id="archiveResult" style="margin-top:15px;"></div>
    `;
  }
  if (document.getElementById("viewClientsSection")) {
    document.getElementById("viewClientsSection").innerHTML = `
      <h3>Просмотр всех клиентов</h3>
      <button onclick="loadAllClients()">Загрузить список</button>
      <div id="clientsList" style="margin-top:15px;"></div>
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
    if (l === "renessans") {
      document.getElementById("renessansButtons").style.display = "inline";
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
  const sections = ['cards','manage','request','archive','normalRequests','urgentRequests','viewClients'];
  sections.forEach(s => {
    const el = document.getElementById(s + "Section");
    if (el) el.style.display = "none";
  });
  document.getElementById(id + "Section").style.display = "block";

  if (id === 'normalRequests' && currentUser === 'renessans') loadAllRequests();
  if (id === 'urgentRequests' && currentUser === 'renessans') loadUrgentRequests();
}

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
    proceedToCardDetails(collectBasicData(type));
    return;
  }

  const income = parseFloat(document.getElementById("income").value);
  const loanAmount = parseFloat(document.getElementById("loanAmount").value);
  const birthDate = new Date(document.getElementById("birthDate").value);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  if (income < 10000) return alert("❌ Доход < 10 000 руб.");
  if (age < 21 || age > 65) return alert("❌ Возраст не подходит");
  if (loanAmount > income * 12) return alert("❌ Сумма кредита > годового дохода");

  document.getElementById("cardForm").innerHTML = `<div class="scoring">Ожидайте... (30 сек)</div>`;

  setTimeout(() => {
    const approved = income >= 30000 && loanAmount <= income * 6 && age >= 23;
    if (approved) {
      proceedToCardDetails({
        ...collectBasicData(type),
        income,
        loanAmount,
        loanPurpose: document.getElementById("loanPurpose").value
      });
    } else {
      document.getElementById("cardForm").innerHTML = `<div class="scoring" style="background:#ffebee;color:#c62828;">❌ Отказано</div>`;
    }
  }, 30000);
}

function collectBasicData(type) {
  return {
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
  }).catch(() => alert("❌ Ошибка"));
}

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

      if (currentUser === "renessans") {
        html += `
          <hr>
          <h4>Редактирование</h4>
          <input type="text" id="editFio" value="${found.fio}" />
          <input type="text" id="editPassport" value="${found.passport}" />
          <input type="tel" id="editPhone" value="${found.phone}" />
          <input type="text" id="editCard" value="${found.cardNumber || ''}" />
          <select id="editStatus">
            <option value="активна" ${found.status === "активна" ? "selected" : ""}>активна</option>
            <option value="заблокирована" ${found.status === "заблокирована" ? "selected" : ""}>заблокирована</option>
            <option value="закрыта" ${found.status === "закрыта" ? "selected" : ""}>закрыта</option>
          </select>
          <button onclick="saveClientEdit('${found.id}')">Сохранить</button>
        `;
      } else {
        html += `
          <button onclick="updateStatus('${found.id}', 'заблокирована')">🔒 Заблокировать</button>
          <button onclick="updateStatus('${found.id}', 'активна')">🔓 Разблокировать</button>
          <button onclick="archiveRequestByClient('${found.id}')">📦 В архив</button>
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
  logOperation({ operation: "Редактирование клиента", fio: updates.fio });
  alert("✅ Изменения сохранены");
  findClientForManage();
}

function updateStatus(clientId, status) {
  fetch(`${DATABASE_URL}/clients/${clientId}/status.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status)
  }).then(() => {
    logOperation({ operation: `Статус → ${status}`, fio: "из управления" });
    alert(`✅ Статус: ${status}`);
    findClientForManage();
  });
}

function checkExistingRequest() {
  const fio = document.getElementById("checkFio").value;
  const code = document.getElementById("checkCode").value;
  if (!fio || !code) return alert("Заполните поля");

  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(requests => {
      if (!requests) return document.getElementById("checkResult").innerHTML = "<p>Обращений нет</p>";
      
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
          html += `<button onclick="markAsUrgent('${found.id}')">Ускорить</button>`;
        }
        html += `<button onclick="archiveRequest('${found.id}')" style="background:#6c757d;color:white;">Отправить в архив</button>`;
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
    alert("✅ Обращение ускорено!");
    checkExistingRequest();
  });
}

function archiveRequest(reqId) {
  if (!confirm("Отправить обращение в архив? Оно исчезнет из активных.")) return;
  fetch(`${DATABASE_URL}/requests/${reqId}/archived.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(true)
  }).then(() => {
    logOperation({ operation: "Архивация обращения", fio: "из обращения" });
    alert("✅ Обращение в архиве");
    document.getElementById("checkResult").innerHTML = "<p>Обращение перемещено в архив.</p>";
  });
}

function loadClientArchive() {
  const fio = document.getElementById("archiveFio").value;
  const code = document.getElementById("archiveCode").value;
  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

  Promise.all([
    fetch(`${DATABASE_URL}/clients.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/operations.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/requests.json`).then(r => r.json())
  ]).then(([clients, ops, requests]) => {
    let html = `<h4>Архив клиента: ${fio}</h4><hr>`;

    if (clients) {
      for (let key in clients) {
        if (clients[key].fio === fio && clients[key].codeWord === code) {
          html += `<p>💳 ${clients[key].type} карта: ${clients[key].cardNumber || "—"}, статус: ${clients[key].status || "активна"}</p>`;
        }
      }
    }

    if (ops) {
      html += "<h4>Операции:</h4><ul>";
      for (let key in ops) {
        if (ops[key].fio === fio) {
          html += `<li>${new Date(ops[key].timestamp).toLocaleString()} — ${ops[key].operation} (${ops[key].staff})</li>`;
        }
      }
      html += "</ul>";
    }

    if (requests) {
      html += "<h4>Обращения (включая архив):</h4><ul>";
      for (let key in requests) {
        if (requests[key].fio === fio && requests[key].codeWord === code) {
          const archived = requests[key].archived ? " (архив)" : "";
          html += `<li>${requests[key].topic}: ${requests[key].description} — ${requests[key].status}${archived}</li>`;
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
            <p>Статус: ${r.status} ${r.archived ? "(архив)" : ""}</p>
            ${r.response ? `<p><strong>Ответ:</strong> ${r.response}</p>` : ''}
            <textarea id="resp-${key}" placeholder="Ответ"></textarea>
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
      if (!reqs) return document.getElementById("urgentRequestsSection").innerHTML = "<p>Нет ускоренных</p>";
      let html = "<h4>Ускоренные обращения</h4>";
      for (let key in reqs) {
        const r = reqs[key];
        if (r.urgent && !r.archived) {
          html += `
            <div style="border:1px solid #ffcdd2; background:#ffebee; padding:15px; margin:10px 0; border-radius:6px;">
              <p>🔥 <strong>${r.fio}</strong> — ${r.topic}</p>
              <p>${r.description}</p>
              <textarea id="respUrgent-${key}" placeholder="Ответ"></textarea>
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
    alert("✅ Ответ отправлен!");
    if (document.getElementById("normalRequestsSection").style.display !== "none") loadAllRequests();
    if (document.getElementById("urgentRequestsSection").style.display !== "none") loadUrgentRequests();
  });
}

// === ПРОСМОТР КЛИЕНТОВ (renessans) ===
function loadAllClients() {
  fetch(`${DATABASE_URL}/clients.json`)
    .then(res => res.json())
    .then(clients => {
      if (!clients) return document.getElementById("clientsList").innerHTML = "<p>Клиенты не найдены</p>";
      let html = "<h4>Список клиентов:</h4>";
      for (let key in clients) {
        const c = clients[key];
        html += `
          <div style="border:1px solid #ddd; padding:10px; margin:8px 0; border-radius:4px;">
            <strong>${c.fio}</strong> — ${c.type} карта
            <button onclick="viewFullClient('${c.fio}', '${c.codeWord}')">Просмотреть</button>
          </div>
        `;
      }
      document.getElementById("clientsList").innerHTML = html;
    });
}

function viewFullClient(fio, code) {
  Promise.all([
    fetch(`${DATABASE_URL}/clients.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/operations.json`).then(r => r.json()),
    fetch(`${DATABASE_URL}/requests.json`).then(r => r.json())
  ]).then(([clients, ops, requests]) => {
    let clientData = null;
    for (let key in clients) {
      if (clients[key].fio === fio && clients[key].codeWord === code) {
        clientData = { id: key, ...clients[key] };
        break;
      }
    }
    if (!clientData) return alert("Клиент не найден");

    let html = `
      <h3>Полные данные клиента</h3>
      <p><strong>ФИО:</strong> ${clientData.fio}</p>
      <p><strong>Паспорт:</strong> ${clientData.passport}</p>
      <p><strong>Телефон:</strong> ${clientData.phone}</p>
      <p><strong>Email:</strong> ${clientData.email}</p>
      <p><strong>Адрес:</strong> ${clientData.address}</p>
      <p><strong>Кодовое слово:</strong> ${clientData.codeWord}</p>
      <p><strong>Карта:</strong> ${clientData.cardNumber || "—"}</p>
      <p><strong>Статус:</strong> ${clientData.status || "активна"}</p>
      <hr>
      <h4>Редактирование</h4>
      <input type="text" id="fullEditFio" value="${clientData.fio}" />
      <input type="text" id="fullEditPassport" value="${clientData.passport}" />
      <input type="tel" id="fullEditPhone" value="${clientData.phone}" />
      <input type="text" id="fullEditCard" value="${clientData.cardNumber || ''}" />
      <select id="fullEditStatus">
        <option value="активна" ${clientData.status === "активна" ? "selected" : ""}>активна</option>
        <option value="заблокирована" ${clientData.status === "заблокирована" ? "selected" : ""}>заблокирована</option>
        <option value="закрыта" ${clientData.status === "закрыта" ? "selected" : ""}>закрыта</option>
      </select>
      <button onclick="saveFullClientEdit('${clientData.id}')">Сохранить</button>
      <button onclick="loadAllClients()">Назад к списку</button>
    `;
    document.getElementById("clientsList").innerHTML = html;
  });
}

function saveFullClientEdit(clientId) {
  const updates = {
    fio: document.getElementById("fullEditFio").value,
    passport: document.getElementById("fullEditPassport").value,
    phone: document.getElementById("fullEditPhone").value,
    cardNumber: document.getElementById("fullEditCard").value,
    status: document.getElementById("fullEditStatus").value
  };
  for (let field in updates) {
    fetch(`${DATABASE_URL}/clients/${clientId}/${field}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates[field])
    });
  }
  alert("✅ Изменения сохранены");
  loadAllClients();
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
