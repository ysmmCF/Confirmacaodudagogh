"use strict";

(() => {
  const API_BASE_URL = "https://script.google.com/macros/s/AKfycbx9i55ldw-sSx16ifP2jdu0ULdvuiCe4UnDSZ_N5YR6dJLTocpGihGs7wpSdTH5dA4OsQ/exec";

  async function callApi(payload) {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    let data;
    try { data = await response.json(); } catch (_) { throw new Error("Resposta inválida do servidor."); }
    if (!response.ok || !data || data.ok !== true) {
      const error = new Error(data && data.message ? data.message : `Erro HTTP ${response.status}`);
      error.status = response.status; error.data = data;
      throw error;
    }
    return data;
  }

  function getGroup(token) {
    return callApi({ action: "getGroup", token });
  }

  function saveResponses(token, respostas) {
    return callApi({ action: "saveResponses", grupoId: token, respostas });
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const statePanel = document.getElementById("state-panel");
  const guestContent = document.getElementById("guest-content");
  const guestList = document.getElementById("guest-list");
  const form = document.getElementById("rsvp-form");
  const saveButton = document.getElementById("save-button");
  const formNote = document.getElementById("form-note");
  let guests = [];
  let savedAnswers = [];
  let submissionInProgress = false;

  function showState(message, type = "info", actionLabel = "", action = null) {
    statePanel.replaceChildren();
    statePanel.className = `state-panel state-${type}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    statePanel.append(paragraph);
    if (actionLabel && action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button";
      button.textContent = actionLabel;
      button.addEventListener("click", action);
      statePanel.append(button);
    }
    statePanel.hidden = false;
    guestContent.hidden = true;
  }

  function responseValue(guest) {
    const value = String(guest.status || "").trim();
    return value === "Confirmado" || value === "Não irá" ? value : "Pendente";
  }

  function render(data) {
    guests = Array.isArray(data.convidados) ? data.convidados : [];
    guestList.replaceChildren();

    if (!guests.length) {
      showState("Não há convidados nesta lista.", "info");
      return;
    }

    guests.forEach((guest, index) => {
      const row = document.createElement("fieldset");
      row.className = "guest-row";
      row.setAttribute("aria-label", guest.nome || "Convidado");
      row.style.boxSizing = "border-box";
      row.style.width = "100%";
      row.style.maxWidth = "100%";
      row.style.minWidth = "0";
      const guestName = document.createElement("div");
      guestName.className = "guest-name";
      guestName.textContent = guest.nome || "";
      guestName.style.boxSizing = "border-box";
      guestName.style.display = "block";
      guestName.style.width = "100%";
      guestName.style.maxWidth = "100%";
      guestName.style.minWidth = "0";
      guestName.style.whiteSpace = "normal";
      guestName.style.overflowWrap = "anywhere";
      guestName.style.wordBreak = "break-word";
      row.append(guestName);

      const choices = document.createElement("div");
      choices.className = "response-choices";
      const current = responseValue(guest);
      ["Confirmado", "Não irá"].forEach((value, choiceIndex) => {
        const label = document.createElement("label");
        label.className = "choice";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `guest-${index}`;
        input.value = value;
        input.checked = current === value;
        input.dataset.guestId = guest.id || "";
        input.setAttribute("aria-label", `${guest.nome || "Convidado"}: ${value === "Confirmado" ? "Vou estar presente" : "Não poderei comparecer"}`);
        const text = document.createElement("span");
        text.textContent = value === "Confirmado" ? "Vou estar presente" : "Não poderei comparecer";
        label.append(input, text);
        choices.append(label);
      });
      row.append(choices);

      const fullNameField = document.createElement("label");
      fullNameField.className = "full-name-field";
      const fullNameLabel = document.createElement("span");
      fullNameLabel.textContent = "Seu nome completo";
      const fullNameInput = document.createElement("input");
      fullNameInput.type = "text";
      fullNameInput.name = `full-name-${index}`;
      // This is a separate guest-provided field; never derive it from guest.nome (the admin's registered name).
      fullNameInput.value = String(guest.nomeCompleto || "");
      fullNameInput.placeholder = "Digite seu nome completo";
      fullNameInput.autocomplete = "off";
      fullNameInput.maxLength = 120;
      fullNameInput.required = true;
      fullNameInput.dataset.guestId = guest.id || "";
      fullNameInput.setAttribute("aria-label", `Nome completo de ${guest.nome || "convidado"}`);
      fullNameField.append(fullNameLabel, fullNameInput);
      row.append(fullNameField);
      guestList.append(row);
    });

    savedAnswers = readAnswers();
    updateSaveAvailability();

    statePanel.hidden = true;
    guestContent.hidden = false;
  }

  function readAnswers() {
    return guests.map((guest, index) => {
      const selected = form.querySelector(`input[name="guest-${index}"]:checked`);
      const fullNameInput = form.querySelector(`input[name="full-name-${index}"]`);
      return {
        convidadoId: guest.id,
        resposta: selected ? selected.value : "Pendente",
        nomeCompleto: fullNameInput ? fullNameInput.value.trim() : ""
      };
    });
  }

  function updateSaveAvailability() {
    const current = readAnswers();
    const allAnswered = current.every((item) => (item.resposta === "Confirmado" || item.resposta === "Não irá") && item.nomeCompleto);
    const changed = current.some((item, index) => item.resposta !== (savedAnswers[index] && savedAnswers[index].resposta) || item.nomeCompleto !== (savedAnswers[index] && savedAnswers[index].nomeCompleto));
    saveButton.disabled = !allAnswered || !changed;
    if (!allAnswered) {
      formNote.textContent = "Escolha uma resposta e informe o nome completo de cada pessoa.";
    } else if (!changed) {
      formNote.textContent = "Suas respostas estão atualizadas.";
    } else {
      formNote.textContent = "Há alterações prontas para salvar.";
    }
    formNote.classList.remove("form-note-error");
  }

  form.addEventListener("change", updateSaveAvailability);
  form.addEventListener("input", updateSaveAvailability);

  function isInvalidToken(error) {
    const message = `${error.message || ""} ${JSON.stringify(error.data || {})}`.toLowerCase();
    return error.status === 404 || /token|grupo|inv[aá]lid|n[aã]o encontrado|not found/.test(message);
  }

  async function loadGroup() {
    showState("Preparando sua noite...", "loading");
    const mark = document.createElement("div");
    mark.className = "loading-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = "<span></span><span></span><span></span>";
    statePanel.prepend(mark);
    try {
      const data = await getGroup(token);
      render(data);
    } catch (error) {
      console.error("Falha ao carregar grupo:", error);
      if (isInvalidToken(error)) {
        showState("Não conseguimos encontrar esta lista de convidados.", "error", "Tentar novamente", loadGroup);
      } else {
        showState("Não foi possível carregar sua lista no momento. Tente novamente em alguns instantes.", "error", "Tentar novamente", loadGroup);
      }
    }
  }

  function showSuccess() {
    statePanel.replaceChildren();
    statePanel.className = "state-panel state-success";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Confirmação registrada";
    const detail = document.createElement("p");
    detail.textContent = "Obrigado por responder. Que sua presença ilumine esta celebração como as estrelas nas pinturas de Vincent van Gogh.";
    statePanel.append(eyebrow, detail);
    statePanel.hidden = false;
    guestContent.hidden = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submissionInProgress) return;
    const currentAnswers = readAnswers();
    const responses = currentAnswers.filter((item) => item.resposta === "Confirmado" || item.resposta === "Não irá");
    if (responses.length !== guests.length || !responses.every((item) => item.convidadoId && item.nomeCompleto)) {
      formNote.textContent = "Escolha uma resposta e informe o nome completo de cada pessoa.";
      formNote.classList.add("form-note-error");
      return;
    }
    if (!responses.some((item, index) => item.resposta !== (savedAnswers[index] && savedAnswers[index].resposta) || item.nomeCompleto !== (savedAnswers[index] && savedAnswers[index].nomeCompleto))) return;
    submissionInProgress = true;
    saveButton.disabled = true;
    saveButton.classList.add("is-saving");
    saveButton.setAttribute("aria-busy", "true");
    saveButton.textContent = "Salvando...";
    formNote.textContent = "";
    formNote.classList.remove("form-note-error");
    let saveFailed = false;
    let saveErrorMessage = "";
    try {
      const result = await saveResponses(token, responses);
      if (Array.isArray(result.convidados)) {
        const returnedById = new Map(result.convidados.map((guest) => [guest.id, guest]));
        guests = guests.map((guest) => ({ ...guest, ...returnedById.get(guest.id) }));
      } else {
        guests = guests.map((guest) => {
          const response = responses.find((item) => item.convidadoId === guest.id);
          return response ? { ...guest, status: response.resposta, nomeCompleto: response.nomeCompleto } : guest;
        });
      }
      savedAnswers = readAnswers();
      showSuccess();
    } catch (error) {
      console.error("Falha ao salvar respostas:", error);
      saveFailed = true;
      saveErrorMessage = error.message || "Tente novamente.";
    } finally {
      submissionInProgress = false;
      saveButton.classList.remove("is-saving");
      saveButton.removeAttribute("aria-busy");
      saveButton.textContent = "Salvar confirmação";
      updateSaveAvailability();
      if (saveFailed) {
        formNote.textContent = "Não foi possível registrar sua resposta. " + saveErrorMessage;
        formNote.classList.add("form-note-error");
      }
    }
  });

  if (!token || !token.trim()) {
    showState("Este link de confirmação está incompleto.", "error");
  } else {
    loadGroup();
  }
})();



