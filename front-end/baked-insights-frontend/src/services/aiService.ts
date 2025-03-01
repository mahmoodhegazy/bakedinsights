import Together from "together-ai";

// Initialize Together client - make sure to get API key from environment variable
// const together = new Together(import.meta.env.VITE_TOGETHER_API_KEY);
const together = new Together({ apiKey: "768a9ad1b017b43562bc2fc14bc635f63f1396847cd31d40220f7d6de7418c75" });


// Interface for chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  static async getChatResponse(messages: ChatMessage[]): Promise<string> {
    // Add system context about the application
    const systemContext: ChatMessage = {
      role: 'system',
      content: `You are an AI assistant for the Baked Insights application, a system for managing production records and checklists. 
                The application allows users to:
                - Create and manage tables for production records
                - Share tables with other users
                - Create and complete checklists for production requirements
                - Monitor compliance and analyze production data
                - Given a SKU and/or a date, provide information about its production records and perform analsis for that SKU/date.
                
                You should help users understand how to use these features and provide guidance on best practices for production record management.
                If you don't know the answer, say "I don't know". Never say "I don't know" about a feature of the application, instead, say "I can't help you with that".`,
    };
    
    const messagesWithContext = [systemContext, ...messages];
    try {
      const response = await together.chat.completions.create({
        messages: messagesWithContext,
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      });
      
      return response.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response');
    }
  }
}