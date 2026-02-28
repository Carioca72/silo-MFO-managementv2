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
  private clients: Client[] = [
    {
      id: '1', nome: 'Família Andrade', cnpj: '12.345.678/0001-90',
      portfolio: 'andrade_main', email: 'gestao@andrade.com.br',
      telefone: '+55 81 99999-0001', aum: 'R$ 12,4M', retorno: '+8.2%',
      status: 'ativo', perfil: 'Moderado', sincronizado: true, stage: 'cliente_ativo'
    },
    {
      id: '2', nome: 'Instituto Brennand', cnpj: '23.456.789/0001-12',
      portfolio: 'brennand_fundo', email: 'financeiro@brennand.org',
      telefone: '+55 81 99999-0002', aum: 'R$ 8,7M', retorno: '+5.9%',
      status: 'ativo', perfil: 'Conservador', sincronizado: true, stage: 'cliente_ativo'
    },
    {
      id: '3', nome: 'Holding Cerqueira', cnpj: '34.567.890/0001-23',
      portfolio: 'cerqueira_holding', email: 'diretoria@cerqueira.com',
      telefone: '+55 81 99999-0003', aum: 'R$ 21,3M', retorno: '+11.4%',
      status: 'alerta', perfil: 'Arrojado', sincronizado: true, stage: 'cliente_ativo'
    },
    {
      id: '4', nome: 'Família Magalhães', cnpj: '56.789.012/0001-45',
      portfolio: 'magalhaes_fam', email: 'patrimonial@magalhaes.com',
      telefone: '+55 81 99999-0005', aum: 'R$ 15,8M', retorno: '-1.2%',
      status: 'risco', perfil: 'Moderado', sincronizado: false, stage: 'cliente_ativo'
    },
    // Add a lead for testing
    {
      id: 'CLI-12345', nome: 'Novo Investidor Teste', cnpj: '00.000.000/0001-00',
      portfolio: 'N/A', email: 'teste@investidor.com',
      telefone: '+55 11 99999-9999', aum: 'R$ 0,0M', retorno: '0%',
      status: 'lead', perfil: 'N/A', sincronizado: true, stage: 'lead'
    }
  ];

  getAll(): Client[] {
    return this.clients;
  }

  getById(id: string): Client | undefined {
    return this.clients.find(c => c.id === id);
  }

  updateStage(id: string, newStage: string): Client | null {
    const client = this.clients.find(c => c.id === id);
    if (client) {
      client.stage = newStage;
      // Map stage to status roughly
      if (['lead', 'qualificado', 'estudo', 'aporte'].includes(newStage)) {
        client.status = newStage as any;
      } else if (newStage === 'cliente_ativo') {
        client.status = 'ativo';
      }
      return client;
    }
    return null;
  }
}

export const clientService = new ClientService();
