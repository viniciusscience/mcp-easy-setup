import type { CredentialField, McpIntegration } from '../mcpIntegration';

export class AngularMcpIntegration implements McpIntegration {
	public readonly id = 'angular';
	public readonly label = 'Angular Docs';
	public readonly description = 'Consulta documentação, tópicos e exemplos oficiais do Angular.';
	public readonly serverName = 'angular-docs';
	public readonly command = 'npx';
	public readonly verifiedNpmPackage = 'angular-mcp-server';
	public readonly fields: CredentialField[] = [];
	public readonly notes = 'Fornece busca, categorias, tópicos e exemplos de Angular para assistentes MCP.';

	public args(): string[] {
		return ['-y', this.verifiedNpmPackage];
	}

	public env(): Record<string, string> {
		return {};
	}
}
