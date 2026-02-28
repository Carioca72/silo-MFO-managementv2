import FormData from 'form-data';

// Este serviço atua como um proxy para o microserviço Python dedicado ao WhatsApp.

class WhatsAppService {
    private microserviceUrl: string;

    constructor() {
        this.microserviceUrl = process.env.PYTHON_MICROSERVICE_URL || 'http://localhost:8000';
        if (!process.env.PYTHON_MICROSERVICE_URL) {
            console.warn('A variável de ambiente PYTHON_MICROSERVICE_URL não está definida. Usando http://localhost:8000 como padrão.');
        }
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        try {
            const response = await fetch(`${this.microserviceUrl}${endpoint}`, options);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`Erro na comunicação com o microserviço WhatsApp: ${errorBody.detail || response.statusText}`);
            }
            return await response.json();
        } catch (error: any) {
            console.error(`Falha ao chamar o endpoint ${endpoint} do microserviço:`, error.message);
            throw new Error(`Não foi possível conectar ao serviço de WhatsApp. Detalhes: ${error.message}`);
        }
    }

    /**
     * Verifica o estado atual da conexão com o WhatsApp.
     */
    public async getStatus(): Promise<{ status: string }> {
        return this.makeRequest('/status');
    }

    /**
     * Inicia a conexão e obtém o QR Code para escaneamento.
     */
    public async getQrCode(): Promise<{ message: string; qr_code?: string; status: string }> {
        return this.makeRequest('/qr-code');
    }

    /**
     * Envia uma mensagem de texto para um número de telefone.
     * @param phone - O número de telefone no formato internacional (ex: 5511999998888)
     * @param message - O conteúdo da mensagem de texto.
     */
    public async sendMessage(phone: string, message: string): Promise<{ status: string; message: string; details: any }> {
        const body = JSON.stringify({ phone, message });
        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
        };
        return this.makeRequest('/send-message', options);
    }

    /**
     * Envia um arquivo para um número de telefone.
     * @param phone - O número de telefone no formato internacional.
     * @param fileBuffer - O conteúdo do arquivo como um Buffer.
     * @param filename - O nome do arquivo a ser enviado (ex: relatorio.pdf).
     */
    public async sendFile(phone: string, fileBuffer: Buffer, filename: string): Promise<{ status: string; message: string; details: any }> {
        const form = new FormData();
        form.append('phone', phone);
        form.append('file', fileBuffer, {
            filename: filename,
            contentType: 'application/octet-stream', // Tipo genérico para arquivos
        });

        const options: RequestInit = {
            method: 'POST',
            body: form as any, // A lib form-data cuida dos headers aqui
        };

        return this.makeRequest('/send-file', options);
    }
}

export const whatsappService = new WhatsAppService();
