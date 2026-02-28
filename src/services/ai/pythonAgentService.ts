import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';

// Interface para o resultado da análise (será expandida nas próximas fases)
export interface PortfolioAnalysisResult {
  message: string;
  filename: string;
  extracted_data_placeholder: { ticker: string; value: number }[];
  // Futuramente terá: optimal_weights, performance_metrics, plot_base64, etc.
}

class PythonAgentService {
  private readonly baseUrl: string;

  constructor() {
    // A URL do serviço Python é injetada via variável de ambiente pelo docker-compose
    this.baseUrl = process.env.PYTHON_MICROSERVICE_URL;
    if (!this.baseUrl) {
      console.error('FATAL: PYTHON_MICROSERVICE_URL environment variable is not set.');
      // Em um app real, poderíamos impedir a inicialização ou usar um fallback
      // throw new Error('PYTHON_MICROSERVICE_URL environment variable is not set.');
    }
  }

  /**
   * Envia um arquivo de portfólio (PDF ou CSV) para o microserviço Python para extração e análise.
   * @param fileBuffer O buffer do arquivo a ser analisado.
   * @param originalname O nome original do arquivo.
   * @param mimetype O mimetype do arquivo (ex: 'application/pdf').
   * @returns O resultado da análise do serviço Python.
   */
  public async analyzePortfolioFile(
    fileBuffer: Buffer,
    originalname: string,
    mimetype: string
  ): Promise<PortfolioAnalysisResult> {
    if (!this.baseUrl) {
      throw new Error('Analysis service is not configured.');
    }

    try {
      const form = new FormData();
      
      // Criar um stream a partir do buffer do arquivo
      const stream = Readable.from(fileBuffer);
      
      form.append('file', stream, {
        filename: originalname,
        contentType: mimetype,
      });

      const url = `${this.baseUrl}/api/v1/extract-and-analyze`;
      console.log(`Forwarding file to Python Service at: ${url}`);

      const response = await axios.post<PortfolioAnalysisResult>(
        url,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error calling Python microservice:', error.response?.data);
        throw new Error(`Failed to analyze portfolio: ${error.response?.data?.detail || error.message}`);
      }
      console.error('An unexpected error occurred:', error);
      throw new Error('An unexpected error occurred while communicating with the analysis service.');
    }
  }
}

export const pythonAgentService = new PythonAgentService();
