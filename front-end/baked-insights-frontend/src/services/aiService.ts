import Together from "together-ai";

// Initialize Together client
const together = new Together({ apiKey: "768a9ad1b017b43562bc2fc14bc635f63f1396847cd31d40220f7d6de7418c75" });

// Interface for chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Interface for file metadata
export interface FileMetadata {
  name: string;
  type: string;
  size: number;
}

// Interface for file content to be included in context
export interface FileContext {
  metadata: FileMetadata;
  content: string;
}

export class AIService {
  /**
   * Gets a response from the AI based on conversation history and context
   * 
   * @param messages Array of chat messages representing the conversation
   * @param files Optional array of file contexts to include
   * @returns Promise with the AI's response
   */
  static async getChatResponse(
    messages: ChatMessage[], 
    files?: FileContext[]
  ): Promise<string> {
    // Add system context about the application
    const systemContext: ChatMessage = {
      role: 'system',
      content: `You are an AI assistant for the Baked Insights application, a system for managing production records and checklists. 
                The application allows users to:
                - Create and manage tables for production records
                - Share tables with other users
                - Create and complete checklists for production requirements
                - Monitor compliance and analyze production data
                - Given a SKU/lot number/date, provide information about its production records and perform analysis
                - Given a file, provide information about its contents and perform analysis based on the data.
                
                When presenting data about SKUs, tables, checklists, or files, ALWAYS respond with a JSON structure as follows:
                
                {
                  "summary": "A brief summary of what was found or analyzed",
                  "tables": {
                    "Table Name 1": {
                      "Column1": [value1, value2],
                      "Column2": [value1, value2]
                    }
                  },
                  "checklists": [
                    {
                      "name": "Checklist Name",
                      "created_by": "User Name",
                      "created_at": "Date",
                      "status": "Submitted/Not Submitted",
                      "completion": "X/Y tasks completed",
                      "items": [
                        {
                          "field_name": "Field Name",
                          "value": "Value",
                          "comment": "Comment if any"
                        }
                      ]
                    }
                  ],
                  "files_attached": {
                    "filename.ext": "Content or summary of file content"
                  },
                  "analysis": "Any additional analysis or observations about the data"
                }
                
                Don't include information about where files are stored (S3 bucket, presigned URL, etc.).
                Focus on the content and analysis that would be useful to the user.
                If anything is not applicable, omit that entire section from the JSON.`,
    };
    
    const messagesWithContext = [systemContext, ...messages];
    
    // Add file context if available
    if (files && files.length > 0) {
      // Create a detailed file context message with proper formatting
      const fileContextContent = files.map((file, index) => {
        // Create a formatted section for each file
        return `File ${index + 1}: ${file.metadata.name} (${file.metadata.type})\n` +
               `Size: ${(file.metadata.size / 1024).toFixed(2)} KB\n` +
               `----------------------------------------\n` +
               `${file.content}\n` +
               `----------------------------------------\n`;
      }).join('\n');
      
      const fileContextMessage: ChatMessage = {
        role: 'system',
        content: `The user has uploaded the following files. Please analyze and use this information to answer their questions. Include relevant file information in your JSON response in the "files_attached" section:\n\n${fileContextContent}`
      };
      
      // Insert file context before the last user message for better context awareness
      const lastUserMessageIndex = messagesWithContext.map(m => m.role).lastIndexOf('user');
      if (lastUserMessageIndex > 0) {
        messagesWithContext.splice(lastUserMessageIndex, 0, fileContextMessage);
      } else {
        messagesWithContext.push(fileContextMessage);
      }
    }
    
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