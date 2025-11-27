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
                  "summary": "A brief summary of what was found or analyzed (or not found)",
                  "tables": { // Only include if actual table data is provided in context, NEVER include placeholder or example data.  
                    "Table Name 1": {
                      "Column1": [value1, value2],
                      "Column2": [value1, value2]
                    }
                  },
                  "checklists": [ // Only include if actual checklist data is provided in context, NEVER include placeholder or example data.  
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
                  "files_attached": { // Only include if actual files are provided
                    "filename.ext": "Content or summary of file content"
                  },
                  "analysis": "Analysis and insights of the actual data provided (or statement that no data was found)"
                }

                IMPORTANT: 
                - Do not wrap your JSON response in code blocks or markdown formatting. The response should be a plain JSON object without any markdown syntax.
                - Don't include information about where files are stored (S3 bucket, presigned URL, etc.).
                - Focus on the content and analysis that would be useful to the user.
                - If anything is not applicable, omit that entire section from the JSON.
                - If the user asks for a specific file, provide the content of that file in the "files_attached" section.
                - If the user asks for a specific table or checklist, provide the relevant data in the "tables" or "checklists" sections respectively.
                - If the user asks for a summary or analysis, provide it in the "summary" or "analysis" sections respectively.
                - If you don't know the answer, say 'I cannot find the answer withing the selected filters' without any further explanation. NEVER HALLUCINATE OR MAKE UP ANSWERS.
                
                CRITICAL ANTI-HALLUCINATION RULES:
                1. NEVER create, invent, or hallucinate data that doesn't exist
                2. If no checklists are found, you MUST state "No checklists found"
                3. ONLY report data that is explicitly provided in the context
                4. If context shows empty arrays/objects, report that no data was found
                5. Do not use placeholder names like "Checklist Name" or "User Name"`,
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
        model: "ServiceNow-AI/Apriel-1.5-15b-Thinker",
      });
      
      return response.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response');
    }
  }
}