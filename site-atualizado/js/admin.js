/**
 * Admin Panel Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  initAdmin();
});

let state = {
  adminEmail: "",
  groups: [],
  guests: [],
  responses: [],
  config: {}
};

function initAdmin() {
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const newGroupForm = document.getElementById("new-group-form");

  // Verificar se já existe e-mail guardado no LocalStorage
  const savedEmail = localStorage.getItem("admin_email");
  if (savedEmail) {
    state.adminEmail = savedEmail;
    showDashboard();
    loadDashboardData();
  } else {
    showLogin();
  }

  // Evento do Formulário de Login (Botão "Acessar Painel")
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // CORREÇÃO: Lê o ID "email" (conforme definido no admin.html) ou "admin-email" como fallback
      const emailField = document.getElementById("email") || document.getElementById("admin-email");
      const emailInput = emailField ? emailField.value.trim() : "";
      
      if (!emailInput) {
        alert("Por favor, digite o e-mail do administrador.");
        return;
      }

      setLoading(true);
      state.adminEmail = emailInput;

      try {
        const success = await loadDashboardData();
        if (success) {
          localStorage.setItem("admin_email", emailInput);
          showDashboard();
        } else {
          alert("Acesso negado ou erro ao carregar os dados. Verifique se o e-mail está cadastrado na aba 'Administradores' da planilha.");
        }
      } catch (err) {
        console.error("Erro na autenticação:", err);
        alert("Erro de comunicação com o servidor: " + (err.message || "Tente novamente."));
      } finally {
        setLoading(false);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("admin_email");
      state.adminEmail = "";
      showLogin();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadDashboardData();
    });
  }

  if (newGroupForm) {
    newGroupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("group-name");
      const name = nameInput ? nameInput.value.trim() : "";
      if (!name) return;

      setLoading(true);
      const res = await API.createGroup({ nome: name }, state.adminEmail);
      setLoading(false);

      if (res && res.ok) {
        if (nameInput) nameInput.value = "";
        await loadDashboardData();
      } else {
        alert("Erro ao criar grupo: " + (res.message || "Erro desconhecido"));
      }
    });
  }
}

function showLogin() {
  const loginSec = document.getElementById("login-section");
  const dashSec = document.getElementById("dashboard-section");
  if (loginSec) loginSec.classList.remove("hidden");
  if (dashSec) dashSec.classList.add("hidden");
}

function showDashboard() {
  const loginSec = document.getElementById("login-section");
  const dashSec = document.getElementById("dashboard-section");
  if (loginSec) loginSec.classList.add("hidden");
  if (dashSec) dashSec.classList.remove("hidden");
  
  const displayEmail = document.getElementById("display-admin-email");
  if (displayEmail) displayEmail.textContent = state.adminEmail;
}

function setLoading(isLoading) {
  const spinner = document.getElementById("loading-spinner");
  const submitBtn = document.querySelector("#login-form button[type='submit']");
  
  if (spinner) {
    if (isLoading) spinner.classList.remove("hidden");
    else spinner.classList.add("hidden");
  }

  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }
}

async function loadDashboardData() {
  if (!state.adminEmail) return false;
  
  setLoading(true);
  const res = await API.getAdminData(state.adminEmail);
  setLoading(false);

  if (res && res.ok) {
    state.groups = res.grupos || res.groups || [];
    state.guests = res.convidados || res.guests || [];
    state.responses = res.respostas || res.responses || [];
    state.config = res.config || {};
    
    renderDashboard();
    return true;
  } else {
    console.error("Erro ao carregar dados do painel:", res);
    return false;
  }
}

function renderDashboard() {
  renderSummary();
  renderGroupsList();
}

function renderSummary() {
  const totalGroupsEl = document.getElementById("total-groups");
  const totalGuestsEl = document.getElementById("total-guests");
  const confirmedEl = document.getElementById("total-confirmed");
  const declinedEl = document.getElementById("total-declined");

  if (totalGroupsEl) totalGroupsEl.textContent = state.groups.length;
  if (totalGuestsEl) totalGuestsEl.textContent = state.guests.length;

  let confirmedCount = 0;
  let declinedCount = 0;

  state.responses.forEach(r => {
    if (r.presenca === true || r.presenca === "SIM" || r.presenca === "sim" || r.confirmado === true) {
      confirmedCount++;
    } else if (r.presenca === false || r.presenca === "NAO" || r.presenca === "nao" || r.confirmado === false) {
      declinedCount++;
    }
  });

  if (confirmedEl) confirmedEl.textContent = confirmedCount;
  if (declinedEl) declinedEl.textContent = declinedCount;
}

function renderGroupsList() {
  const container = document.getElementById("groups-list");
  if (!container) return;

  container.innerHTML = "";

  if (state.groups.length === 0) {
    container.innerHTML = "<p class='text-gray-500 italic'>Nenhum grupo cadastrado.</p>";
    return;
  }

  state.groups.forEach(group => {
    const groupCard = document.createElement("div");
    groupCard.className = "bg-white p-4 rounded-lg shadow border border-gray-200 mb-4";

    const isAtivo = group.ativo === true || group.ativo === "TRUE" || group.ativo === "true";
    const groupGuests = state.guests.filter(g => String(g.grupoId) === String(group.id));

    const statusBadge = isAtivo 
      ? `<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Link Ativo</span>`
      : `<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Link Inativo</span>`;

    groupCard.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-bold text-gray-800">${escapeHtml(group.nome || group.id)}</h3>
            ${statusBadge}
          </div>
          <p class="text-sm text-gray-500">ID: ${group.id}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${
            isAtivo
              ? `<button onclick="handleDisableGroup('${group.id}')" class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded transition">Desativar link</button>`
              : `<button onclick="handleEnableGroup('${group.id}')" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition">Ativar link</button>`
          }
          <button onclick="handleDeleteGroup('${group.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition">Excluir grupo</button>
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-gray-100">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Convidados (${groupGuests.length})</h4>
        <div class="flex flex-wrap gap-2 mb-2">
          ${groupGuests.map(g => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${escapeHtml(g.nome)}</span>`).join("") || "<span class='text-xs text-gray-400 italic'>Nenhum convidado</span>"}
        </div>
      </div>
    `;

    container.appendChild(groupCard);
  });
}

async function handleEnableGroup(grupoId) {
  if (!confirm("Deseja realmente ATIVAR o link para este grupo?")) return;

  setLoading(true);
  const res = await API.enableGroup(grupoId, state.adminEmail);
  setLoading(false);

  if (res && res.ok) {
    await loadDashboardData();
  } else {
    alert("Erro ao ativar o grupo: " + (res.message || "Erro desconhecido"));
  }
}

async function handleDisableGroup(grupoId) {
  if (!confirm("Deseja realmente DESATIVAR o link para este grupo?")) return;

  setLoading(true);
  const res = await API.disableGroup(grupoId, state.adminEmail);
  setLoading(false);

  if (res && res.ok) {
    await loadDashboardData();
  } else {
    alert("Erro ao desativar o grupo: " + (res.message || "Erro desconhecido"));
  }
}

async function handleDeleteGroup(grupoId) {
  if (!confirm("ATENÇÃO: Deseja realmente EXCLUIR este grupo? Todos os convidados e respostas associados serão permanentemente apagados.")) return;

  setLoading(true);
  const res = await API.deleteGroup(grupoId, state.adminEmail);
  setLoading(false);

  if (res && res.ok) {
    await loadDashboardData();
  } else {
    alert("Erro ao excluir o grupo: " + (res.message || "Erro desconhecido"));
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
