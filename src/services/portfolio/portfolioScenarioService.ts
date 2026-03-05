import { PortfolioScenario as OptimizerScenario } from '../math/portfolioOptimizer';

// Estende o cenário do otimizador para incluir dados de persistência
export interface SavedPortfolioScenario extends OptimizerScenario {
  id: string;          // Gerado pelo backend/DB
  clientId: string;    // ID do cliente associado
  createdAt: string;   // Timestamp de criação
  notes?: string;      // Anotações do advisor
}

class PortfolioScenarioService {

  private getApiCredentials() {
    const apiUrl = process.env.DATA_CRAZY_API_URL;
    const apiToken = process.env.DATA_CRAZY_TOKEN;

    if (!apiUrl || !apiToken) {
      console.error('ERRO CRÍTICO: DATA_CRAZY_API_URL e DATA_CRAZY_TOKEN não definidas.');
      return null;
    }
    return { apiUrl, apiToken };
  }

  async saveScenario(clientId: string, scenarioData: OptimizerScenario, notes?: string): Promise<SavedPortfolioScenario | null> {
    const creds = this.getApiCredentials();
    if (!creds) return null;

    try {
      const response = await fetch(`${creds.apiUrl}/clients/${clientId}/scenarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...scenarioData, notes })
      });

      if (!response.ok) {
        throw new Error(`Falha ao salvar o cenário: ${response.statusText}`);
      }

      const savedScenario: SavedPortfolioScenario = await response.json();
      return savedScenario;

    } catch (error) {
      console.error(`Falha ao salvar cenário para o cliente ${clientId}:`, error);
      return null;
    }
  }

  async getScenariosByClientId(clientId: string): Promise<SavedPortfolioScenario[]> {
    const creds = this.getApiCredentials();
    if (!creds) return [];

    try {
      const response = await fetch(`${creds.apiUrl}/clients/${clientId}/scenarios`, {
        headers: {
          'Authorization': `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Falha ao buscar cenários: ${response.statusText}`);
      }

      const scenarios: SavedPortfolioScenario[] = await response.json();
      return scenarios;

    } catch (error) {
      console.error(`Falha ao buscar cenários para o cliente ${clientId}:`, error);
      return [];
    }
  }
}

export const portfolioScenarioService = new PortfolioScenarioService();
