

"use server";

import { http } from "@/lib/http";

export interface AgentTask {
  type: string;
  params: Record<string, any>;
  description: string;
}

export interface TaskPlan {
  intent: string;
  tasks: AgentTask[];
}

export interface TaskResult {
  task: AgentTask;
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentExecutionResult {
  command: string;
  plan: TaskPlan;
  results: TaskResult[];
  summary: string;
}

export interface UISchema {
  type: string;
  title: string;
  data: any;
}

export async function executeAgentCommand(
  command: string
): Promise<{ success: boolean; data?: AgentExecutionResult; error?: string }> {
  try {
    const res = await http<{ data: AgentExecutionResult }>("/agent/execute", {
      method: "POST",
      body: JSON.stringify({ command }),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateUIAction(
  query: string
): Promise<{ success: boolean; data?: UISchema; error?: string }> {
  try {
    const res = await http<{ data: UISchema }>("/agent/generate-ui", {
      method: "POST",
      body: JSON.stringify({ command: query }),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
