import { GoogleGenerativeAI } from '@google/generai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

class SiloAdvisorService {
  async generateResponse(prompt: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error('Error generating response from Gemini:', error);
      throw new Error('Failed to get response from AI service.');
    }
  }
}

export const siloAdvisorService = new SiloAdvisorService();
