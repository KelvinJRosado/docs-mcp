import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readdir, stat } from "fs/promises";
import { join } from "path";

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
