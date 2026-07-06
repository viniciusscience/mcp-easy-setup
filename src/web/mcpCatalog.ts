import { AngularMcpIntegration } from './mcpIntegrations/angular';
import { DockerMcpIntegration } from './mcpIntegrations/docker';
import { GitLabMcpIntegration } from './mcpIntegrations/gitlab';
import { PostgresMcpIntegration } from './mcpIntegrations/postgres';
import { YouTrackMcpIntegration } from './mcpIntegrations/youtrack';
import type { CredentialField, McpIntegration, ServiceTemplate } from './mcpIntegration';

export type { CredentialField, McpIntegration, ServiceTemplate } from './mcpIntegration';

export type ClientId = 'claude-desktop' | 'claude-code' | 'vscode' | 'codex' | 'generic';

export interface ClientProfile {
	id: ClientId;
	label: string;
	description: string;
	nextStep: string;
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


export const serviceCatalog: McpIntegration[] = [
	new PostgresMcpIntegration(),
	new DockerMcpIntegration(),
	new AngularMcpIntegration(),
	new GitLabMcpIntegration(),
	new YouTrackMcpIntegration()
];


export function findServiceTemplate(id: string): ServiceTemplate | undefined {
	return serviceCatalog.find((service) => service.id === id);
}

export function isServiceReadyForAutomaticGeneration(service: ServiceTemplate, values: Record<string, string> = {}): boolean {
	const args = service.args(values);

	return service.command === 'npx'
		&& args[0] === '-y'
		&& args[1] === service.verifiedNpmPackage
		&& isSafeNpmPackageName(service.verifiedNpmPackage);
}

export function createGeneratedMcpConfig(client: ClientProfile, selectedServices: SelectedServiceResult[]): GeneratedMcpConfig {
	const servers = selectedServices.reduce<GeneratedMcpConfig['servers']>((accumulator, selectedService) => {
		if (!isServiceReadyForAutomaticGeneration(selectedService.service, selectedService.values)) {
			return accumulator;
		}

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
			if (service.fields.length === 0) {
				return `- ${service.label}: sem credenciais necessárias`;
			}

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

function isSafeNpmPackageName(packageName: string): boolean {
	if (packageName.startsWith('@company/') || packageName.includes('placeholder')) {
		return false;
	}

	return /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(packageName);
}

function maskValue(field: CredentialField, value: string): string {
	if (field.password) {
		return value.trim().length > 0 ? '******' : '(vazio)';
	}

	return value.trim().length > 0 ? value : '(vazio)';
}
