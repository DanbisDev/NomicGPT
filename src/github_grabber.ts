import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;

// GitHub client
const octokit = new Octokit({
    auth: GITHUB_TOKEN,
  });

// Function to fetch rules from GitHub
export async function getNomicRules(): Promise<string> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: "SirRender00",
        repo: "nomic",
        path: "rules.md",
      });
  
      if ("content" in data && data.content) {
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      } else {
        throw new Error("Could not retrieve rules content");
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      throw new Error("Failed to fetch rules from GitHub");
    }
  }
  
// Function to fetch agendas from GitHub
export async function getNomicAgendas(): Promise<string> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: "SirRender00",
        repo: "nomic",
        path: "agendas.md",
      });
  
      if ("content" in data && data.content) {
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      } else {
        throw new Error("Could not retrieve agendas content");
      }
    } catch (error) {
      console.error("Error fetching agendas:", error);
      throw new Error("Failed to fetch agendas from GitHub");
    }
  }
  
  // Function to fetch players from GitHub
  export async function getNomicPlayers(): Promise<string> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: "SirRender00",
        repo: "nomic",
        path: "players.md",
      });
  
      if ("content" in data && data.content) {
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      } else {
        throw new Error("Could not retrieve players content");
      }
    } catch (error) {
      console.error("Error fetching players:", error);
      throw new Error("Failed to fetch players from GitHub");
    }
  }
  
