import type { CredentialField, McpIntegration } from '../mcpIntegration';

export class GitLabMcpIntegration implements McpIntegration {
	public readonly id = 'gitlab';
	public readonly label = 'GitLab';
	public readonly description = 'Integração com repositórios, issues e pipelines do GitLab.';
	public readonly serverName = 'gitlab';
	public readonly command = 'npx';
	public readonly verifiedNpmPackage = '@modelcontextprotocol/server-gitlab';
	public readonly fields: CredentialField[] = [
		{ key: 'url', label: 'URL do GitLab', placeholder: 'https://gitlab.sua-empresa.local', required: true },
		{ key: 'token', label: 'Token do GitLab', placeholder: 'PAT / token de acesso', required: true, password: true }
	];
	public readonly notes = 'Ideal para quem precisa analisar merge requests, pipelines e repositórios.';

	public args(): string[] {
		return ['-y', this.verifiedNpmPackage];
	}

	public env(values: Record<string, string>): Record<string, string> {
		return {
			GITLAB_URL: values.url ?? '',
			GITLAB_TOKEN: values.token ?? ''
		};
	}
}
