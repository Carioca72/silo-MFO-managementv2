import { Injectable } from '@nestjs/common';

// Placeholder para a interface do resultado da análise que vem do Python
// Em um projeto real, isso seria muito mais detalhado.
export interface AnalysisResult {
  original_filename: string;
  diagnostics: string[];
  current_scenario: any;
  new_scenario: any;
  comparison_summary: any;
}

// Placeholder para a nossa entidade de banco de dados (ex: usando TypeORM ou Prisma)
export interface Study {
  id: string;
  name: string;
  clientName: string; // Nome do cliente para quem o estudo foi feito
  type: 'Estudo de Carteira' | 'Relatório de Resultados';
  status: 'Concluído' | 'Em Andamento' | 'Erro';
  createdAt: Date;
  analysisResult: AnalysisResult; // O JSON completo da análise do Python
}

@Injectable()
export class StudiesService {
  // Armazenamento em memória para simular um banco de dados.
  // Em um projeto real, injetaríamos um repositório (ex: TypeORM, Prisma).
  private readonly studies: Study[] = [];

  /**
   * Cria um novo estudo (ou relatório) e o armazena.
   * Em um cenário real, isso seria chamado após uma análise bem-sucedida do Python.
   */
  async create(clientName: string, type: Study['type'], analysisResult: AnalysisResult): Promise<Study> {
    console.log(`Criando um novo ${type} para o cliente ${clientName}`);
    const newStudy: Study = {
      id: `study_${Date.now()}`,
      name: analysisResult.original_filename, // Nome padrão inicial
      clientName,
      type,
      status: 'Concluído',
      createdAt: new Date(),
      analysisResult,
    };
    this.studies.push(newStudy);
    return newStudy;
  }

  /**
   * Lista todos os estudos e relatórios armazenados.
   */
  async findAll(): Promise<Study[]> {
    // Retorna uma cópia para evitar mutações externas
    return [...this.studies];
  }

  /**
   * Encontra um estudo específico pelo seu ID.
   */
  async findOne(id: string): Promise<Study | null> {
    return this.studies.find((study) => study.id === id) || null;
  }

  /**
   * Renomeia um estudo ou relatório.
   */
  async rename(id: string, newName: string): Promise<Study | null> {
    const study = await this.findOne(id);
    if (study) {
      study.name = newName;
      console.log(`Estudo ${id} renomeado para: ${newName}`);
      return study;
    }
    return null;
  }

  /**
   * Aciona uma nova análise para um estudo existente.
   * Em um cenário real, esta função precisaria do arquivo original novamente
   * ou de um link para ele para reenviar ao microserviço Python.
   * Por enquanto, vamos simular a lógica de reanálise.
   */
  async reanalyze(id: string): Promise<Study | null> {
    const study = await this.findOne(id);
    if (study) {
      console.log(`Reanalisando o estudo ${id}...`);
      // SIMULAÇÃO: Em um caso real, chamaríamos o microserviço Python aqui
      // e atualizaríamos o 'analysisResult' com a nova resposta.
      study.status = 'Em Andamento';
      // Simula a conclusão após um tempo
      setTimeout(() => {
        study.status = 'Concluído';
        // Poderíamos até atualizar o 'createdAt' para a data da reanálise se quisessemos
        console.log(`Reanálise do estudo ${id} concluída.`);
      }, 2000);
      return study;
    }
    return null;
  }
}
