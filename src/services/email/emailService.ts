
// Este serviço atua como um proxy para o endpoint de e-mail do microserviço Python.

class EmailService {
    private microserviceUrl: string;

    constructor() {
        this.microserviceUrl = process.env.PYTHON_MICROSERVICE_URL || 'http://localhost:8000';
        if (!process.env.PYTHON_MICROSERVICE_URL) {
            console.warn('A variável de ambiente PYTHON_MICROSERVICE_URL não está definida. Usando http://localhost:8000 como padrão.');
        }
    }

    /**
     * Envia um e-mail utilizando o microserviço.
     * @param to - O endereço de e-mail do destinatário.
     * @param subject - O assunto do e-mail.
     * @param htmlContent - O conteúdo do e-mail em formato HTML.
     */
    public async sendEmail(to: string, subject: string, htmlContent: string): Promise<{ status: string; message: string }> {
        const endpoint = '/send-email';
        const body = JSON.stringify({
            to_email: to,
            subject: subject,
            html_content: htmlContent
        });

        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
        };

        try {
            const response = await fetch(`${this.microserviceUrl}${endpoint}`, options);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`Erro no microserviço de e-mail: ${errorBody.detail || response.statusText}`);
            }
            return await response.json();
        } catch (error: any) {
            console.error(`Falha ao chamar o endpoint ${endpoint} do microserviço:`, error.message);
            throw new Error(`Não foi possível conectar ao serviço de e-mail. Detalhes: ${error.message}`);
        }
    }
}

export const emailService = new EmailService();
