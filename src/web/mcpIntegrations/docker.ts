import type { CredentialField, McpIntegration } from '../mcpIntegration';

export class DockerMcpIntegration implements McpIntegration {
	public readonly id = 'docker';
	public readonly label = 'Docker';
	public readonly description = 'Integração para ambientes e recursos expostos pelo Docker.';
	public readonly serverName = 'docker';
	public readonly command = 'npx';
	public readonly verifiedNpmPackage = 'docker-mcp-server';
	public readonly fields: CredentialField[] = [
		{ key: 'dockerHost', label: 'Host do Docker', placeholder: 'unix:///var/run/docker.sock', defaultValue: 'unix:///var/run/docker.sock' },
		{ key: 'dockerContext', label: 'Contexto do Docker', placeholder: 'Opcional', defaultValue: '' }
	];
	public readonly notes = 'Se a sua empresa usa um wrapper próprio, ajuste apenas o comando e os argumentos finais.';

	public args(): string[] {
		return ['-y', this.verifiedNpmPackage];
	}

	public env(values: Record<string, string>): Record<string, string> {
		return {
			DOCKER_HOST: values.dockerHost ?? '',
			DOCKER_CONTEXT: values.dockerContext ?? ''
		};
	}
}
