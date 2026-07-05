import * as assert from 'assert';
import {
	buildServerSummary,
	clientProfiles,
	createGeneratedMcpConfig,
	findServiceTemplate,
	serviceCatalog,
	type SelectedServiceResult
} from '../../mcpCatalog';

const sampleValues: Record<string, Record<string, string>> = {
	postgres: {
		host: 'localhost',
		port: '5432',
		database: 'app_db',
		user: 'app_user',
		password: 'secret'
	},
	docker: {
		dockerHost: 'unix:///var/run/docker.sock',
		dockerContext: ''
	},
	opensearch: {
		url: 'https://opensearch.empresa.local:9200',
		username: 'search_user',
		password: 'search-secret'
	},
	gitlab: {
		url: 'https://gitlab.empresa.local',
		token: 'glpat-123'
	},
	youtrack: {
		url: 'https://youtrack.empresa.local',
		token: 'yt-123'
	}
};

suite('Web Extension Test Suite', () => {
	test('catálogo lista os serviços esperados', () => {
		assert.strictEqual(serviceCatalog.length, 5);
		assert.deepStrictEqual(
			serviceCatalog.map((service) => service.id),
			['postgres', 'docker', 'opensearch', 'gitlab', 'youtrack']
		);
		assert.deepStrictEqual(
			serviceCatalog.map((service) => service.serverName),
			['postgres', 'docker', 'opensearch', 'gitlab', 'youtrack']
		);
		assert.ok(serviceCatalog.every((service) => service.fields.length > 0));
		assert.ok(serviceCatalog.every((service) => service.notes.length > 0));
		assert.ok(clientProfiles.every((client) => client.label.length > 0 && client.nextStep.length > 0));
	});

	test('gera JSON MCP válido para todos os serviços', () => {
		const selectedServices: SelectedServiceResult[] = serviceCatalog.map((service) => ({
			service,
			values: sampleValues[service.id]
		}));

		const generated = createGeneratedMcpConfig(clientProfiles[0], selectedServices);
		const parsed = JSON.parse(generated.json) as {
			mcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>;
		};

		assert.deepStrictEqual(Object.keys(parsed.mcpServers).sort(), serviceCatalog.map((service) => service.serverName).sort());

		for (const service of serviceCatalog) {
			const server = parsed.mcpServers[service.serverName];
			assert.strictEqual(server.command, 'npx');
			assert.strictEqual(server.args[0], '-y');
			assert.ok(server.args[1].length > 0);
		}

		assert.strictEqual(parsed.mcpServers.postgres.args[1], '@modelcontextprotocol/server-postgres');
		assert.strictEqual(
			parsed.mcpServers.postgres.args[2],
			'postgresql://app_user:secret@localhost:5432/app_db'
		);
		assert.deepStrictEqual(parsed.mcpServers.docker.env, { DOCKER_HOST: 'unix:///var/run/docker.sock' });
		assert.deepStrictEqual(parsed.mcpServers.gitlab.env, {
			GITLAB_URL: 'https://gitlab.empresa.local',
			GITLAB_TOKEN: 'glpat-123'
		});
		assert.deepStrictEqual(parsed.mcpServers.youtrack.env, {
			YOUTRACK_URL: 'https://youtrack.empresa.local',
			YOUTRACK_TOKEN: 'yt-123'
		});
	});

	test('resume integrações e localiza templates', () => {
		const summary = buildServerSummary([
			{
				service: findServiceTemplate('gitlab')!,
				values: sampleValues.gitlab
			},
			{
				service: findServiceTemplate('postgres')!,
				values: sampleValues.postgres
			}
		]);

		assert.match(summary, /GitLab/);
		assert.match(summary, /Token do GitLab: \*\*\*\*\*\*/);
		assert.match(summary, /PostgreSQL/);
		assert.strictEqual(findServiceTemplate('nao-existe'), undefined);
	});

	test('mascara valores vazios e campos sensíveis no resumo', () => {
		const summary = buildServerSummary([
			{
				service: findServiceTemplate('youtrack')!,
				values: {
					url: '',
					token: ''
				}
			}
		]);

		assert.match(summary, /URL do YouTrack: \(vazio\)/);
		assert.match(summary, /Token do YouTrack: \(vazio\)/);
	});

	test('preserva encoding de credenciais no PostgreSQL', () => {
		const postgres = findServiceTemplate('postgres')!;
		const generated = createGeneratedMcpConfig(clientProfiles[1], [
			{
				service: postgres,
				values: {
					host: 'db.empresa.local',
					port: '5432',
					database: 'main_db',
					user: 'dev@empresa.com',
					password: 'pa ss/word?'
				}
			}
		]);

		const parsed = JSON.parse(generated.json) as { mcpServers: { postgres: { args: string[] } } };

		assert.strictEqual(parsed.mcpServers.postgres.args[2], 'postgresql://dev%40empresa.com:pa%20ss%2Fword%3F@db.empresa.local:5432/main_db');
	});

	test('remove env vazia quando o serviço não precisa dela', () => {
		const docker = findServiceTemplate('docker')!;
		const generated = createGeneratedMcpConfig(clientProfiles[2], [
			{
				service: docker,
				values: {
					dockerHost: 'unix:///var/run/docker.sock',
					dockerContext: ''
				}
			}
		]);

		const parsed = JSON.parse(generated.json) as { mcpServers: { docker: { env?: Record<string, string> } } };

		assert.deepStrictEqual(parsed.mcpServers.docker.env, { DOCKER_HOST: 'unix:///var/run/docker.sock' });
	});
});
