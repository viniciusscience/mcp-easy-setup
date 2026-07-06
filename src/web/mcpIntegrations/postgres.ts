import type { CredentialField, McpIntegration } from '../mcpIntegration';

export class PostgresMcpIntegration implements McpIntegration {
	public readonly id = 'postgres';
	public readonly label = 'PostgreSQL';
	public readonly description = 'Conecta ao banco com uma URL padrão de conexão.';
	public readonly serverName = 'postgres';
	public readonly command = 'npx';
	public readonly verifiedNpmPackage = '@modelcontextprotocol/server-postgres';
	public readonly fields: CredentialField[] = [
		{ key: 'host', label: 'Host do PostgreSQL', placeholder: 'localhost', required: true, defaultValue: 'localhost' },
		{ key: 'port', label: 'Porta do PostgreSQL', placeholder: '5432', required: true, defaultValue: '5432' },
		{ key: 'database', label: 'Nome do banco', placeholder: 'app_db', required: true },
		{ key: 'user', label: 'Usuário', placeholder: 'app_user', required: true },
		{ key: 'password', label: 'Senha', placeholder: 'Senha do banco', required: true, password: true }
	];
	public readonly notes = 'Esse template segue o exemplo oficial do MCP para PostgreSQL.';

	public args(values: Record<string, string>): string[] {
		const user = encodeURIComponent(values.user ?? '');
		const password = encodeURIComponent(values.password ?? '');
		const host = values.host ?? 'localhost';
		const port = values.port ?? '5432';
		const database = values.database ?? 'postgres';

		return ['-y', this.verifiedNpmPackage, `postgresql://${user}:${password}@${host}:${port}/${database}`];
	}

	public env(): Record<string, string> {
		return {};
	}
}
