import { emailService } from '../services/email/emailService';
import { whatsappService } from '../services/whatsapp/whatsappService';

/**
 * Envia um e-mail para um destinatário.
 * Esta função agora atua como um wrapper para o emailService, que se comunica com o microserviço Python.
 * @param to O endereço de e-mail do destinatário.
 * @param subject O assunto do e-mail.
 * @param body O corpo do e-mail, que pode ser texto simples ou HTML.
 */
export const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    console.log(`Solicitando envio de e-mail para: ${to}`);
    const result = await emailService.sendEmail(to, subject, body);
    console.log(`E-mail para ${to} processado pelo microserviço.`);
    return { success: true, messageId: result.message }; // Adapta a resposta para o formato esperado
  } catch (error: any) {
    console.error(`Falha ao enviar e-mail para ${to}:`, error.message);
    // Mantém a falha silenciosa para o resto do sistema, mas loga o erro.
    // Em uma implementação futura, isso poderia acionar um sistema de alerta.
    return { success: false, error: error.message };
  }
};

/**
 * Envia uma mensagem de texto via WhatsApp.
 * @param phone O número de telefone do destinatário.
 * @param message O conteúdo da mensagem.
 */
export const sendWhatsAppMessage = async (phone: string, message: string) => {
  try {
    console.log(`Solicitando envio de WhatsApp para: ${phone}`);
    const result = await whatsappService.sendMessage(phone, message);
    console.log(`Mensagem para ${phone} processada pelo microserviço.`);
    return { success: true, details: result.details };
  } catch (error: any) {
    console.error(`Falha ao enviar WhatsApp para ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envia um arquivo via WhatsApp.
 * @param phone O número de telefone do destinatário.
 * @param fileBuffer O conteúdo do arquivo como um Buffer.
 * @param filename O nome do arquivo (ex: relatorio.pdf).
 */
export const sendWhatsAppFile = async (phone: string, fileBuffer: Buffer, filename: string) => {
  try {
    console.log(`Solicitando envio de arquivo via WhatsApp para: ${phone}`);
    const result = await whatsappService.sendFile(phone, fileBuffer, filename);
    console.log(`Arquivo para ${phone} processado pelo microserviço.`);
    return { success: true, details: result.details };
  } catch (error: any) {
    console.error(`Falha ao enviar arquivo para ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
};
