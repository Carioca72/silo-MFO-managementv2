
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
    if (!creds) return []; // Retorna array vazio se não houver credenciais

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
      return []; // Retorna array vazio em caso de erro na chamada
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

  // A função de update permanece otimista, mas agora precisa de credenciais.
  async updateStage(id: string, newStage: string): Promise<Client | null> {
     const creds = this.getApiCredentials();
    if (!creds) return null;

    try {
       const response = await fetch(`${creds.apiUrl}/clients/${id}/stage`, {
        method: 'PATCH', // ou PUT, dependendo da API
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
}

export const clientService = new ClientService();
