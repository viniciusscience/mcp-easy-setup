export interface CredentialField {
	key: string;
	label: string;
	placeholder: string;
	required?: boolean;
	password?: boolean;
	defaultValue?: string;
}

export interface McpIntegration {
	id: string;
	label: string;
	description: string;
	serverName: string;
	command: string;
	verifiedNpmPackage: string;
	args: (values: Record<string, string>) => string[];
	env: (values: Record<string, string>) => Record<string, string>;
	fields: CredentialField[];
	notes: string;
}

export type ServiceTemplate = McpIntegration;
