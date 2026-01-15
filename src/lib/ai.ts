// AI integration with OpenAI and Ollama fallback
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check if OpenAI is available, otherwise use Ollama
 */
function getAIClient() {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai" as const,
      client: openai,
    };
  }

  // Fallback to Ollama (local)
  if (process.env.OLLAMA_API_URL) {
    return {
      provider: "ollama" as const,
      client: null, // Would need Ollama client implementation
    };
  }

  throw new Error("No AI provider configured");
}

/**
 * Generate AI response for document writing
 */
export async function generateDocumentContent(prompt: string, context?: string) {
  try {
    const { provider, client } = getAIClient();

    if (provider === "openai" && client) {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful writing assistant. Generate well-structured, professional content based on user prompts.",
          },
          ...(context
            ? [
                {
                  role: "system",
                  content: `Context: ${context}`,
                },
              ]
            : []),
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return {
        content: completion.choices[0]?.message?.content || "",
        provider: "openai",
      };
    }

    // Ollama fallback would go here
    throw new Error("AI provider not available");
  } catch (error) {
    console.error("AI generation error:", error);
    throw error;
  }
}

/**
 * Break down task into subtasks
 */
export async function breakDownTask(taskDescription: string) {
  try {
    const { provider, client } = getAIClient();

    if (provider === "openai" && client) {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a project management assistant. Break down tasks into actionable subtasks. Return a JSON array of subtask objects with 'title' and 'description' fields.",
          },
          {
            role: "user",
            content: `Break down this task into subtasks: ${taskDescription}`,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(response);

      return {
        subtasks: parsed.subtasks || [],
        provider: "openai",
      };
    }

    throw new Error("AI provider not available");
  } catch (error) {
    console.error("Task breakdown error:", error);
    throw error;
  }
}

/**
 * Generate project summary
 */
export async function generateProjectSummary(
  projectName: string,
  tasks: Array<{ title: string; status: string }>
) {
  try {
    const { provider, client } = getAIClient();

    if (provider === "openai" && client) {
      const taskList = tasks
        .map((t) => `- ${t.title} (${t.status})`)
        .join("\n");

      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a project management assistant. Generate concise project summaries with insights and recommendations.",
          },
          {
            role: "user",
            content: `Generate a summary for project "${projectName}" with these tasks:\n${taskList}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return {
        summary: completion.choices[0]?.message?.content || "",
        provider: "openai",
      };
    }

    throw new Error("AI provider not available");
  } catch (error) {
    console.error("Project summary error:", error);
    throw error;
  }
}

/**
 * Generate automation suggestions
 */
export async function suggestAutomations(
  workspaceContext: string,
  currentAutomations: Array<{ trigger: string; action: string }>
) {
  try {
    const { provider, client } = getAIClient();

    if (provider === "openai" && client) {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an automation expert. Suggest useful automations for workspace productivity. Return a JSON array of automation suggestions with 'name', 'trigger', 'condition', and 'action' fields.",
          },
          {
            role: "user",
            content: `Workspace context: ${workspaceContext}\nCurrent automations: ${JSON.stringify(currentAutomations)}\nSuggest new automations.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(response);

      return {
        suggestions: parsed.suggestions || [],
        provider: "openai",
      };
    }

    throw new Error("AI provider not available");
  } catch (error) {
    console.error("Automation suggestion error:", error);
    throw error;
  }
}