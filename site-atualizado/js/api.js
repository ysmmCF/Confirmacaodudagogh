/**
 * API Service - Comunicação com Google Apps Script
 */

const API_BASE_URL = "https://script.google.com/macros/s/AKfycbwUDkqeGkfGt5U0K_ye1LJH1dxrNz7JhIARJqXBi81gnuFQ4wFKIuaxG7q0uaoVL6MZ9w/exec";

const API = {
  /**
   * Realiza uma requisição POST para o Google Apps Script
   */
  async request(payload) {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro na comunicação com a API:", error);
      return { ok: false, message: error.message || "Erro de conexão com o servidor." };
    }
  },

  /**
   * Obtém os dados completos do painel administrativo
   */
  async getAdminData(email) {
    return await this.request({
      action: "adminData",
      email: email
    });
  },

  /**
   * Ativa um grupo pelo ID
   */
  async enableGroup(grupoId, email) {
    return await this.request({
      action: "enableGroup",
      grupoId: grupoId,
      email: email
    });
  },

  /**
   * Desativa um grupo pelo ID
   */
  async disableGroup(grupoId, email) {
    return await this.request({
      action: "disableGroup",
      grupoId: grupoId,
      email: email
    });
  },

  /**
   * Exclui um grupo e seus dados vinculados
   */
  async deleteGroup(grupoId, email) {
    return await this.request({
      action: "deleteGroup",
      grupoId: grupoId,
      email: email
    });
  },

  /**
   * Cria um novo grupo
   */
  async createGroup(grupoData, email) {
    return await this.request({
      action: "createGroup",
      email: email,
      ...grupoData
    });
  },

  /**
   * Cria um novo convidado
   */
  async createGuest(guestData, email) {
    return await this.request({
      action: "createGuest",
      email: email,
      ...guestData
    });
  },

  /**
   * Atualiza um convidado existente
   */
  async updateGuest(guestData, email) {
    return await this.request({
      action: "updateGuest",
      email: email,
      ...guestData
    });
  },

  /**
   * Salva as respostas de confirmação (público)
   */
  async saveResponses(responseData) {
    return await this.request({
      action: "saveResponses",
      ...responseData
    });
  }
};



