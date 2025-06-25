import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import fetch from "node-fetch";

// Create server instance
export const server = new McpServer({
  name: "docs",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register weather tools
server.tool(
  "test-connectivity",
  "Tests connectivity to the server",
  {},
  async ({}) => {
    console.log("Test connectivity called");

    return {
      content: [
        {
          type: "text",
          text: "test connectivity successful",
        },
      ],
    };
  }
);

// Register directory listing tool
server.tool(
  "list-directory",
  "Lists the contents of a given directory",
  {
    path: z.string().describe("The directory path to list"),
  },
  async ({ path }) => {
    console.log(`Listing directory: ${path}`);

    try {
      const entries = await readdir(path);
      const details = await Promise.all(
        entries.map(async (entry) => {
          try {
            const fullPath = join(path, entry);
            const stats = await stat(fullPath);
            return {
              name: entry,
              type: stats.isDirectory() ? "directory" : "file",
              size: stats.isFile() ? stats.size : undefined,
              modified: stats.mtime.toISOString(),
            };
          } catch (error) {
            return {
              name: entry,
              type: "unknown",
              error: `Cannot access: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                directory: path,
                entries: details,
                total: details.length,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing directory: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Register fetch-webpage tool
server.tool(
  "fetch-webpage",
  "Fetches the main content from a web page.",
  {
    url: z.string().url().describe("The URL of the web page to fetch"),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      // Optionally, extract main content (e.g., strip HTML tags)
      // For now, return the first 2000 characters
      return {
        content: [
          {
            type: "text",
            text: text.length > 2000 ? text.slice(0, 2000) + "..." : text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching webpage: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);
