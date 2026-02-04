import * as vscode from "vscode";

/**
 * Activates the Brave Search MCP extension
 * Registers an MCP server definition provider that launches the official Brave Search MCP server
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Brave Search MCP extension is now active");

  // Register the MCP server definition provider
  const provider = vscode.lm.registerMcpServerDefinitionProvider(
    "brave-search-mcp",
    new BraveSearchMcpProvider(),
  );

  context.subscriptions.push(provider);

  // Add command to configure API key
  const configureCommand = vscode.commands.registerCommand(
    "brave-search-mcp.configureApiKey",
    async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Brave Search API key",
        password: true,
        placeHolder: "BSA...",
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "API key cannot be empty";
          }
          return null;
        },
      });

      if (apiKey) {
        const config = vscode.workspace.getConfiguration("braveSearchMcp");
        await config.update(
          "apiKey",
          apiKey,
          vscode.ConfigurationTarget.Global,
        );
        vscode.window.showInformationMessage(
          "Brave Search API key saved successfully!",
        );
      }
    },
  );

  context.subscriptions.push(configureCommand);

  // Check if API key is configured on activation
  checkApiKeyConfiguration();
}

/**
 * MCP Server Definition Provider for Brave Search
 */
class BraveSearchMcpProvider implements vscode.McpServerDefinitionProvider {
  provideMcpServerDefinitions(
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.McpServerDefinition[]> {
    const config = vscode.workspace.getConfiguration("braveSearchMcp");
    const apiKey = config.get<string>("apiKey");
    const enabled = config.get<boolean>("enabled", true);

    // If disabled, return empty array
    if (!enabled) {
      console.log("Brave Search MCP is disabled");
      return [];
    }

    // If no API key is configured, show a warning
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn("Brave Search API key not configured");
      vscode.window
        .showWarningMessage(
          "Brave Search MCP: API key not configured",
          "Configure Now",
        )
        .then((selection) => {
          if (selection === "Configure Now") {
            vscode.commands.executeCommand("brave-search-mcp.configureApiKey");
          }
        });
      return [];
    }

    // Return the MCP server definition
    // This uses the official @brave/brave-search-mcp-server package
    return [
      new vscode.McpStdioServerDefinition(
        "Brave Search",
        "npx",
        ["-y", "@brave/brave-search-mcp-server"],
        {
          BRAVE_API_KEY: apiKey,
        },
      ),
    ];
  }
}

/**
 * Checks if the API key is configured and shows a notification if not
 */
function checkApiKeyConfiguration() {
  const config = vscode.workspace.getConfiguration("braveSearchMcp");
  const apiKey = config.get<string>("apiKey");

  if (!apiKey || apiKey.trim().length === 0) {
    vscode.window
      .showInformationMessage(
        "Brave Search MCP extension requires an API key to function.",
        "Configure Now",
        "Get API Key",
      )
      .then((selection) => {
        if (selection === "Configure Now") {
          vscode.commands.executeCommand("brave-search-mcp.configureApiKey");
        } else if (selection === "Get API Key") {
          vscode.env.openExternal(
            vscode.Uri.parse("https://api.search.brave.com/"),
          );
        }
      });
  }
}

/**
 * Deactivates the extension
 */
export function deactivate() {
  console.log("Brave Search MCP extension is now deactivated");
}
