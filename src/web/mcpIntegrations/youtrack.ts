import type { CredentialField, McpIntegration } from '../mcpIntegration';

export class YouTrackMcpIntegration implements McpIntegration {
	public readonly id = 'youtrack';
	public readonly label = 'YouTrack';
	public readonly description = 'Acesso a issues, boards e projetos do YouTrack.';
	public readonly serverName = 'youtrack';
	public readonly command = 'npx';
	public readonly verifiedNpmPackage = '@habby/server-youtrack';
	public readonly fields: CredentialField[] = [
		{ key: 'url', label: 'URL do YouTrack', placeholder: 'https://youtrack.sua-empresa.local', required: true },
		{ key: 'token', label: 'Token do YouTrack', placeholder: 'Token de acesso', required: true, password: true }
	];
	public readonly notes = 'Deixa pronto para consulta de tickets e rastreio de demandas.';

	public args(): string[] {
		return ['-y', this.verifiedNpmPackage];
	}

	public env(values: Record<string, string>): Record<string, string> {
		return {
			YOUTRACK_URL: values.url ?? '',
			YOUTRACK_TOKEN: values.token ?? ''
		};
	}
}
