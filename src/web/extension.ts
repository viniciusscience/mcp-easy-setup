import * as vscode from 'vscode';
import {
	buildServerSummary,
	clientProfiles,
	createGeneratedMcpConfig,
	findServiceTemplate,
	serviceCatalog,
	type ClientProfile,
	type CredentialField,
	type SelectedServiceResult,
	type ServiceTemplate
} from './mcpCatalog';

export function activate(context: vscode.ExtensionContext) {
	console.log('MCP Easy Setup ativada!');

	const disposable = vscode.commands.registerCommand('mcpEasySetup.searchMcp', async () => {
		await runMcpWizard(context);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

async function runMcpWizard(context: vscode.ExtensionContext) {
	const selectedServices = await vscode.window.showQuickPick(
		serviceCatalog.map((service) => ({
			label: service.label,
			description: service.description,
			serviceId: service.id
		})),
		{
			canPickMany: true,
			matchOnDescription: true,
			placeHolder: 'Escolha os serviços MCP que quer configurar'
		}
	);

	if (!selectedServices || selectedServices.length === 0) {
		return;
	}

	const selectedClient = await vscode.window.showQuickPick(
		clientProfiles.map((client) => ({
			label: client.label,
			description: client.description,
			client
		})),
		{
			matchOnDescription: true,
			placeHolder: 'Escolha o cliente de IA que vai consumir o MCP'
		}
	);

	if (!selectedClient) {
		return;
	}

	const collectedServices: SelectedServiceResult[] = [];

	for (const item of selectedServices) {
		const template = findServiceTemplate(item.serviceId);

		if (!template) {
			continue;
		}

		const values = await collectServiceValues(template);

		if (!values) {
			return;
		}

		collectedServices.push({
			service: template,
			values
		});
	}

	if (collectedServices.length === 0) {
		return;
	}

	const generated = createGeneratedMcpConfig(selectedClient.client, collectedServices);
	const summary = buildServerSummary(collectedServices);
	const content = [
		`# Integração MCP para ${selectedClient.client.label}`,
		'',
		selectedClient.client.nextStep,
		'',
		'## Serviços configurados',
		summary,
		'',
		'## JSON gerado',
		'```json',
		generated.json,
		'```'
	].join('\n');

	const document = await vscode.workspace.openTextDocument({
		content,
		language: 'markdown'
	});

	await vscode.window.showTextDocument(document, {
		preview: false,
		preserveFocus: true
	});

	if (selectedClient.client.id === 'vscode') {
		const autoApply = await vscode.window.showInformationMessage(
			'Configuração pronta para VS Code. Deseja aplicar automaticamente em .vscode/mcp.json?',
			'Aplicar automaticamente',
			'Copiar JSON'
		);

		if (autoApply === 'Aplicar automaticamente') {
			await saveMergedConfigToWorkspace(generated.json, '.vscode/mcp.json', 'servers');
			context.globalState.update('mcpEasySetup.lastClient', selectedClient.client.id);
			return;
		}

		if (autoApply === 'Copiar JSON') {
			await vscode.env.clipboard.writeText(generated.json);
			context.globalState.update('mcpEasySetup.lastClient', selectedClient.client.id);
			return;
		}
	}

	if (selectedClient.client.id === 'claude-code') {
		const autoApply = await vscode.window.showInformationMessage(
			'Configuração pronta para Claude Code. Deseja aplicar automaticamente em .mcp.json?',
			'Aplicar automaticamente',
			'Copiar JSON'
		);

		if (autoApply === 'Aplicar automaticamente') {
			await saveMergedConfigToWorkspace(generated.json, '.mcp.json', 'mcpServers');
			context.globalState.update('mcpEasySetup.lastClient', selectedClient.client.id);
			return;
		}

		if (autoApply === 'Copiar JSON') {
			await vscode.env.clipboard.writeText(generated.json);
			context.globalState.update('mcpEasySetup.lastClient', selectedClient.client.id);
			return;
		}
	}

	const action = await vscode.window.showInformationMessage(
		'Integrações MCP geradas. Quer copiar ou salvar no workspace?',
		'Copiar JSON',
		'Salvar no workspace'
	);

	if (action === 'Copiar JSON') {
		await vscode.env.clipboard.writeText(generated.json);
		return;
	}

	if (action === 'Salvar no workspace') {
		await saveGeneratedConfigToWorkspace(generated.json);
	}

	context.globalState.update('mcpEasySetup.lastClient', selectedClient.client.id);
}

async function collectServiceValues(template: ServiceTemplate): Promise<Record<string, string> | undefined> {
	const values: Record<string, string> = {};

	for (const field of template.fields) {
		const value = await promptForField(template, field);

		if (value === undefined) {
			return undefined;
		}

		values[field.key] = value;
	}

	return values;
}

async function promptForField(template: ServiceTemplate, field: CredentialField): Promise<string | undefined> {
	const value = await vscode.window.showInputBox({
		prompt: `${template.label} - ${field.label}`,
		placeHolder: field.placeholder,
		password: field.password,
		ignoreFocusOut: true,
		value: field.defaultValue ?? '',
		validateInput: (input) => {
			if (!field.required) {
				return undefined;
			}

			return input.trim().length > 0 ? undefined : 'Esse campo é obrigatório.';
		}
	});

	if (value === undefined) {
		return undefined;
	}

	return value.trim();
}

async function saveGeneratedConfigToWorkspace(json: string) {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

	if (!workspaceFolder) {
		await vscode.window.showWarningMessage('Abra uma pasta no VS Code para que eu possa salvar o arquivo gerado.');
		return;
	}

	const vscodeFolder = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
	const targetFile = vscode.Uri.joinPath(vscodeFolder, 'mcp.easy-setup.json');

	await vscode.workspace.fs.createDirectory(vscodeFolder);
	await vscode.workspace.fs.writeFile(targetFile, new TextEncoder().encode(json));

	const document = await vscode.workspace.openTextDocument(targetFile);
	await vscode.window.showTextDocument(document, { preview: false });
	await vscode.window.showInformationMessage('Arquivo salvo em .vscode/mcp.easy-setup.json');
}

async function saveMergedConfigToWorkspace(
	json: string,
	relativeFilePath: string,
	rootKey: 'mcpServers' | 'servers'
) {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

	if (!workspaceFolder) {
		await vscode.window.showWarningMessage('Abra uma pasta no VS Code para que eu possa salvar o arquivo gerado.');
		return;
	}

	const targetFile = vscode.Uri.joinPath(workspaceFolder.uri, ...relativeFilePath.split('/'));
	const parentSegments = relativeFilePath.split('/').slice(0, -1);

	if (parentSegments.length > 0) {
		const targetFolder = vscode.Uri.joinPath(workspaceFolder.uri, ...parentSegments);
		await vscode.workspace.fs.createDirectory(targetFolder);
	}

	const generatedConfig = JSON.parse(json) as Record<string, unknown>;
	const generatedServers = ((generatedConfig[rootKey] as Record<string, unknown>) ?? {}) as Record<string, unknown>;

	let existingConfig: Record<string, unknown> = {};

	try {
		const existingBytes = await vscode.workspace.fs.readFile(targetFile);
		existingConfig = JSON.parse(new TextDecoder().decode(existingBytes)) as Record<string, unknown>;
	} catch {
		existingConfig = {};
	}

	const existingServers = ((existingConfig[rootKey] as Record<string, unknown>) ?? {}) as Record<string, unknown>;
	const mergedConfig = {
		...existingConfig,
		[rootKey]: {
			...existingServers,
			...generatedServers
		}
	};

	await vscode.workspace.fs.writeFile(targetFile, new TextEncoder().encode(`${JSON.stringify(mergedConfig, null, 2)}\n`));

	const document = await vscode.workspace.openTextDocument(targetFile);
	await vscode.window.showTextDocument(document, { preview: false });
	await vscode.window.showInformationMessage(`Configuração aplicada em ${relativeFilePath}`);
}