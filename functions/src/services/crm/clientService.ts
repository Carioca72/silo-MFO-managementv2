
export interface Client {
  id: string;
  nome: string;
  cnpj: string;
  portfolio: string;
  email: string;
  telefone: string;
  aum: string;
  retorno: string;
  status: 'ativo' | 'alerta' | 'risco' | 'lead' | 'qualificado' | 'estudo' | 'aporte';
  perfil: string;
  sincronizado: boolean;
  stage?: string; // CRM Stage
}

class ClientService {

  private getApiCredentials() {
    const apiUrl = process.env.DATA_CRAZY_API_URL;
    const apiToken = process.env.DATA_CRAZY_TOKEN;

    if (!apiUrl || !apiToken) {
      console.error('ERRO CRÍTICO: As variáveis de ambiente DATA_CRAZY_API_URL e DATA_CRAZY_TOKEN não estão definidas. A integração com o CRM não funcionará.');
      return null;
    }
    return { apiUrl, apiToken };
  }

  async getAll(): Promise<Client[]> {
    const creds = this.getApiCredentials();
    if (!creds) return []; 

    try {
      const response = await fetch(`${creds.apiUrl}/clients`, {
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Falha ao buscar clientes do CRM: ${response.statusText}`);
      }

      const clients: Client[] = await response.json();
      return clients;

    } catch (error) {
      console.error('Falha na comunicação com a API do CRM (Data Crazy) em getAll:', error);
      return []; 
    }
  }

  async getById(id: string): Promise<Client | undefined> {
    const creds = this.getApiCredentials();
    if (!creds) return undefined;

    try {
      const response = await fetch(`${creds.apiUrl}/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
         if (response.status === 404) return undefined;
        throw new Error(`Falha ao buscar cliente ${id} do CRM: ${response.statusText}`);
      }

      const client: Client = await response.json();
      return client;

    } catch (error) {
        console.error(`Falha na comunicação com a API do CRM (Data Crazy) em getById para o ID ${id}:`, error);
        return undefined;
    }
  }

  async updateStage(id: string, newStage: string): Promise<Client | null> {
     const creds = this.getApiCredentials();
    if (!creds) return null;

    try {
       const response = await fetch(`${creds.apiUrl}/clients/${id}/stage`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) {
        throw new Error(`Falha ao atualizar o estágio do cliente ${id}: ${response.statusText}`);
      }

      const updatedClient: Client = await response.json();
      return updatedClient;

    } catch(error) {
        console.error(`Falha na comunicação com a API do CRM (Data Crazy) em updateStage para o ID ${id}:`, error);
        return null;
    }
  }

  // BUG-013: Implementar deleção de cliente
  async deleteById(id: string): Promise<{ success: boolean; message?: string }> {
    const creds = this.getApiCredentials();
    if (!creds) {
      return { success: false, message: 'Credenciais da API do CRM não configuradas.' };
    }

    try {
      const response = await fetch(`${creds.apiUrl}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
        }
      });

      if (response.status === 204 || response.status === 200) { // 204 No Content é comum para DELETE
        return { success: true };
      }

      if (response.status === 404) {
        return { success: false, message: `Cliente com ID ${id} não encontrado no CRM.` };
      }

      // Outros erros
      throw new Error(`Falha ao deletar cliente ${id} no CRM: ${response.statusText}`);

    } catch (error) {
      console.error(`Falha na comunicação com a API do CRM (Data Crazy) em deleteById para o ID ${id}:`, error);
      return { success: false, message: (error as Error).message };
    }
  }
}

export const clientService = new ClientService();
