const DATABASE_URL = "https://renessans-bank-3df94-default-rtdb.europe-west1.firebasedatabase.app";
const STAFF = {
  "Ирина": "8992",
  "Арсений": "9274",
  "Ольга": "9274",
  "dem": "1265",
  "renessans": "1265"
};

let currentUser = null;

// Горячие клавиши
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    switch(e.key) {
      case '1': showSection('cards'); break;
      case '2': showSection('manage'); break;
      case '3': showSection('request'); break;
      case '4': showSection('archive'); break;
      case '5': if (currentUser === 'renessans') showSection('normalRequests'); break;
      case '6': if (currentUser === 'renessans') showSection('urgentRequests'); break;
    }
  }
});

function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value;
  if (STAFF[l] === p) {
    currentUser = l;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainScreen").style.display = "block";
    document.getElementById("currentUserLabel").textContent = `Вы вошли как: ${l}`;
    document.getElementById("error").textContent = "";

    // Показываем вкладки для renessans
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
}

function showSection(id) {
  const sections = ['cards', 'manage', 'request', 'archive', 'normalRequests', 'urgentRequests'];
  sections.forEach(s => document.getElementById(s + "Section").style.display = "none");
  document.getElementById(id + "Section").style.display = "block";
}

// === ПРОВЕРКА ОБРАЩЕНИЯ ===
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

// === АРХИВ КЛИЕНТА ===
function loadClientArchive() {
  const fio = document.getElementById("archiveFio").value;
  const code = document.getElementById("archiveCode").value;
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;

  if (!fio || !code) return alert("Заполните ФИО и кодовое слово");

  fetch(`${DATABASE_URL}/operations.json`)
    .then(res => res.json())
    .then(ops => {
      if (!ops) return document.getElementById("archiveResult").innerHTML = "<p>Операций не найдено</p>";
      
      const filtered = [];
      for (let key in ops) {
        const op = ops[key];
        if (op.fio === fio) {
          const opDate = new Date(op.timestamp);
          const fromDate = from ? new Date(from) : null;
          const toDate = to ? new Date(to) : null;
          if ((!fromDate || opDate >= fromDate) && (!toDate || opDate <= toDate)) {
            filtered.push(op);
          }
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

// === ОБЫЧНЫЕ ОБРАЩЕНИЯ (renessans) ===
function showSection(id) {
  // ... (как выше)
  if (id === 'normalRequests' && currentUser === 'renessans') {
    loadAllRequests();
  }
  if (id === 'urgentRequests' && currentUser === 'renessans') {
    loadUrgentRequests();
  }
}

function loadAllRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("allRequestsList").innerHTML = "<p>Нет обращений</p>";
      
      let html = "";
      for (let key in reqs) {
        const r = reqs[key];
        html += `
          <div class="request-item">
            <p><strong>${r.fio}</strong> — ${r.topic}</p>
            <p>${r.description}</p>
            <p>Статус: ${r.status}</p>
            ${r.response ? `<p><strong>Ответ:</strong> ${r.response}</p>` : ''}
            <textarea id="resp-${key}" placeholder="Ваш ответ"></textarea>
            <button onclick="sendResponse('${key}')">Ответить</button>
          </div>
          <hr>
        `;
      }
      document.getElementById("allRequestsList").innerHTML = html;
    });
}

function loadUrgentRequests() {
  fetch(`${DATABASE_URL}/requests.json`)
    .then(res => res.json())
    .then(reqs => {
      if (!reqs) return document.getElementById("urgentRequestsList").innerHTML = "<p>Нет ускоренных обращений</p>";
      
      let html = "";
      for (let key in reqs) {
        const r = reqs[key];
        if (r.urgent) {
          html += `
            <div class="request-item">
              <p>🔥 <strong>${r.fio}</strong> — ${r.topic}</p>
              <p>${r.description}</p>
              <textarea id="respUrgent-${key}" placeholder="Ваш ответ"></textarea>
              <button onclick="sendResponse('${key}')">Ответить</button>
            </div>
            <hr>
          `;
        }
      }
      document.getElementById("urgentRequestsList").innerHTML = html || "<p>Нет ускоренных обращений</p>";
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

// === ОСТАЛЬНЫЕ ФУНКЦИИ (оформление карт, управление) ===
// ... (оставь как в предыдущей версии, но добавь логирование в operations)

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
