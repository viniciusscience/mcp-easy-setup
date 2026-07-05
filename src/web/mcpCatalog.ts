export type ClientId = 'claude-desktop' | 'claude-code' | 'vscode' | 'codex' | 'generic';

export interface ClientProfile {
	id: ClientId;
	label: string;
	description: string;
	nextStep: string;
}

export interface CredentialField {
	key: string;
	label: string;
	placeholder: string;
	required?: boolean;
	password?: boolean;
	defaultValue?: string;
}

export interface ServiceTemplate {
	id: string;
	label: string;
	description: string;
	serverName: string;
	command: string;
	args: (values: Record<string, string>) => string[];
	env: (values: Record<string, string>) => Record<string, string>;
	fields: CredentialField[];
	notes: string;
}

export interface SelectedServiceResult {
	service: ServiceTemplate;
	values: Record<string, string>;
}

export interface GeneratedMcpConfig {
	client: ClientProfile;
	servers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>;
	json: string;
}

export const clientProfiles: ClientProfile[] = [
	{
		id: 'vscode',
		label: 'VS Code (MCP nativo)',
		description: 'Aplica no arquivo .vscode/mcp.json para uso direto no Chat do VS Code.',
		nextStep: 'Se quiser, aplique automaticamente no arquivo .vscode/mcp.json e use no Chat do VS Code.'
	},
	{
		id: 'claude-code',
		label: 'Claude Code (no VS Code)',
		description: 'Prepara configuracao para .mcp.json, usada pelo Claude Code no projeto.',
		nextStep: 'Se quiser, aplique automaticamente no arquivo .mcp.json para uso no Claude Code.'
	},
	{
		id: 'claude-desktop',
		label: 'Claude Desktop',
		description: 'Gera um bloco MCP pronto para colar no arquivo de configuração do Claude.',
		nextStep: 'Cole o JSON gerado dentro do bloco mcpServers do Claude Desktop.'
	},
	{
		id: 'codex',
		label: 'Codex / outras IAs',
		description: 'Mostra a mesma estrutura MCP padrão para reutilizar em outros clientes de IA.',
		nextStep: 'Use o mesmo bloco mcpServers no cliente de IA que suporte MCP.'
	},
	{
		id: 'generic',
		label: 'Genérico',
		description: 'Saída neutra para qualquer cliente MCP.',
		nextStep: 'Copie o JSON para o cliente MCP da sua preferência.'
	}
];

const postgresTemplate: ServiceTemplate = {
	id: 'postgres',
	label: 'PostgreSQL',
	description: 'Conecta ao banco com uma URL padrão de conexão.',
	serverName: 'postgres',
	command: 'npx',
	args: (values) => {
		const user = encodeURIComponent(values.user ?? '');
		const password = encodeURIComponent(values.password ?? '');
		const host = values.host ?? 'localhost';
		const port = values.port ?? '5432';
		const database = values.database ?? 'postgres';

		return ['-y', '@modelcontextprotocol/server-postgres', `postgresql://${user}:${password}@${host}:${port}/${database}`];
	},
	env: () => ({}),
	fields: [
		{ key: 'host', label: 'Host do PostgreSQL', placeholder: 'localhost', required: true, defaultValue: 'localhost' },
		{ key: 'port', label: 'Porta do PostgreSQL', placeholder: '5432', required: true, defaultValue: '5432' },
		{ key: 'database', label: 'Nome do banco', placeholder: 'app_db', required: true },
		{ key: 'user', label: 'Usuário', placeholder: 'app_user', required: true },
		{ key: 'password', label: 'Senha', placeholder: 'Senha do banco', required: true, password: true }
	],
	notes: 'Esse template segue o exemplo oficial do MCP para PostgreSQL.'
};

export const serviceCatalog: ServiceTemplate[] = [
	postgresTemplate,
	{
		id: 'docker',
		label: 'Docker',
		description: 'Integração para ambientes e recursos expostos pelo Docker.',
		serverName: 'docker',
		command: 'npx',
		args: () => ['-y', '@company/mcp-docker'],
		env: (values) => ({
			DOCKER_HOST: values.dockerHost ?? '',
			DOCKER_CONTEXT: values.dockerContext ?? ''
		}),
		fields: [
			{ key: 'dockerHost', label: 'Host do Docker', placeholder: 'unix:///var/run/docker.sock', defaultValue: 'unix:///var/run/docker.sock' },
			{ key: 'dockerContext', label: 'Contexto do Docker', placeholder: 'Opcional', defaultValue: '' }
		],
		notes: 'Se a sua empresa usa um wrapper próprio, ajuste apenas o comando e os argumentos finais.'
	},
	{
		id: 'opensearch',
		label: 'OpenSearch',
		description: 'Acesso a índices e consultas de OpenSearch.',
		serverName: 'opensearch',
		command: 'npx',
		args: () => ['-y', '@company/mcp-opensearch'],
		env: (values) => ({
			OPENSEARCH_URL: values.url ?? '',
			OPENSEARCH_USERNAME: values.username ?? '',
			OPENSEARCH_PASSWORD: values.password ?? ''
		}),
		fields: [
			{ key: 'url', label: 'URL do OpenSearch', placeholder: 'https://opensearch.sua-empresa.local:9200', required: true },
			{ key: 'username', label: 'Usuário', placeholder: 'opensearch_user', required: true },
			{ key: 'password', label: 'Senha', placeholder: 'Senha do OpenSearch', required: true, password: true }
		],
		notes: 'Use essa opção para deixar o analista/QA só preencher URL e credenciais.'
	},
	{
		id: 'gitlab',
		label: 'GitLab',
		description: 'Integração com repositórios, issues e pipelines do GitLab.',
		serverName: 'gitlab',
		command: 'npx',
		args: () => ['-y', '@company/mcp-gitlab'],
		env: (values) => ({
			GITLAB_URL: values.url ?? '',
			GITLAB_TOKEN: values.token ?? ''
		}),
		fields: [
			{ key: 'url', label: 'URL do GitLab', placeholder: 'https://gitlab.sua-empresa.local', required: true },
			{ key: 'token', label: 'Token do GitLab', placeholder: 'PAT / token de acesso', required: true, password: true }
		],
		notes: 'Ideal para quem precisa analisar merge requests, pipelines e repositórios.'
	},
	{
		id: 'youtrack',
		label: 'YouTrack',
		description: 'Acesso a issues, boards e projetos do YouTrack.',
		serverName: 'youtrack',
		command: 'npx',
		args: () => ['-y', '@company/mcp-youtrack'],
		env: (values) => ({
			YOUTRACK_URL: values.url ?? '',
			YOUTRACK_TOKEN: values.token ?? ''
		}),
		fields: [
			{ key: 'url', label: 'URL do YouTrack', placeholder: 'https://youtrack.sua-empresa.local', required: true },
			{ key: 'token', label: 'Token do YouTrack', placeholder: 'Token de acesso', required: true, password: true }
		],
		notes: 'Deixa pronto para consulta de tickets e rastreio de demandas.'
	}
];

export function findServiceTemplate(id: string): ServiceTemplate | undefined {
	return serviceCatalog.find((service) => service.id === id);
}

export function createGeneratedMcpConfig(client: ClientProfile, selectedServices: SelectedServiceResult[]): GeneratedMcpConfig {
	const servers = selectedServices.reduce<GeneratedMcpConfig['servers']>((accumulator, selectedService) => {
		accumulator[selectedService.service.serverName] = {
			command: selectedService.service.command,
			args: selectedService.service.args(selectedService.values),
			env: cleanEnv(selectedService.service.env(selectedService.values))
		};

		return accumulator;
	}, {});

	const json = JSON.stringify({ mcpServers: servers }, null, 2);

	return {
		client,
		servers,
		json
	};
}

export function buildServerSummary(selectedServices: SelectedServiceResult[]): string {
	return selectedServices
		.map(({ service, values }) => {
			const labels = service.fields
				.map((field) => `${field.label}: ${maskValue(field, values[field.key] ?? '')}`)
				.join(' | ');

			return `- ${service.label}: ${labels}`;
		})
		.join('\n');
}

function cleanEnv(env: Record<string, string>): Record<string, string> | undefined {
	const entries = Object.entries(env).filter(([, value]) => value.trim().length > 0);

	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
}

function maskValue(field: CredentialField, value: string): string {
	if (field.password) {
		return value.trim().length > 0 ? '******' : '(vazio)';
	}

	return value.trim().length > 0 ? value : '(vazio)';
}
