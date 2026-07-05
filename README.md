# MCP Easy Setup

[![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/Joseviniciusdasilvadesouzadesouza.mcp-easy-setup.svg)](https://marketplace.visualstudio.com/items?itemName=Joseviniciusdasilvadesouzadesouza.mcp-easy-setup)
[![Visual Studio Marketplace Installs](https://vsmarketplacebadge.apphb.com/installs-short/Joseviniciusdasilvadesouzadesouza.mcp-easy-setup.svg)](https://marketplace.visualstudio.com/items?itemName=Joseviniciusdasilvadesouzadesouza.mcp-easy-setup)
[![Visual Studio Marketplace Rating](https://vsmarketplacebadge.apphb.com/rating-short/Joseviniciusdasilvadesouzadesouza.mcp-easy-setup.svg)](https://marketplace.visualstudio.com/items?itemName=Joseviniciusdasilvadesouzadesouza.mcp-easy-setup)

Uma extensão para guiar devs, QAs e pessoas menos experientes na criação de integrações MCP sem precisar decorar JSON, comandos ou variáveis de ambiente.

O foco é simples: escolher o serviço, preencher as credenciais em linguagem direta e receber a configuração pronta para usar em clientes como Claude Desktop, Codex e outros clientes compatíveis com MCP.

## O que ela resolve

- Evita setup manual de JSON.
- Reduz erro de configuração em credenciais e URLs.
- Centraliza serviços internos em um fluxo guiado.
- Gera um arquivo pronto para copiar ou salvar no workspace.
- Ajuda a padronizar integrações para dev, QA e análise de código.

## Como funciona

```mermaid
flowchart TD
    A[Abrir o comando MCP Easy Setup] --> B[Escolher um ou mais serviços]
    B --> C[Selecionar o cliente de IA]
    C --> D[Preencher URL, token, usuário e senha]
    D --> E[Gerar JSON MCP]
    E --> F[Copiar para o cliente ou salvar em .vscode/mcp.easy-setup.json]
```

## Fluxo do usuário

1. Execute o comando `MCP Easy Setup` no Command Palette.
2. Selecione os serviços que deseja integrar.
3. Escolha o cliente de IA de destino.
4. Preencha os campos apresentados de forma guiada.
5. Copie o JSON gerado ou salve o arquivo no workspace.

## Serviços suportados

| Serviço | Para que serve | O que a extensão pede |
| --- | --- | --- |
| PostgreSQL | Acesso a banco e inspeção de dados | host, porta, banco, usuário e senha |
| Docker | Integração com ambiente local e recursos de containers | host e contexto |
| OpenSearch | Consultas e análise de índices | URL, usuário e senha |
| GitLab | Repositórios, MRs, pipelines e issues | URL e token |
| YouTrack | Tickets, boards e projetos | URL e token |

## Exemplo de saída

A extensão gera a estrutura MCP padrão no formato `mcpServers`.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:senha@localhost:5432/app_db"]
    }
  }
}
```

## Exemplo para Claude Desktop

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@company/mcp-gitlab"],
      "env": {
        "GITLAB_URL": "https://gitlab.sua-empresa.local",
        "GITLAB_TOKEN": "<TOKEN>"
      }
    }
  }
}
```

## O que a extensão entrega

- Resumo legível dos serviços escolhidos.
- Geração automática do JSON MCP.
- Campos de credencial com máscara para senhas.
- Opção de copiar o JSON para a área de transferência.
- Opção de salvar em `.vscode/mcp.easy-setup.json`.

## Como rodar localmente

```bash
npm run compile-web
npm test
```

## Desenvolvimento

Se você quiser adaptar a extensão para os servidores reais da empresa, o ponto principal fica em `src/web/mcpCatalog.ts`.

## Roadmap sugerido

- Adicionar suporte a mais clientes MCP.
- Permitir salvar perfis reutilizáveis por equipe.
- Trocar os templates genéricos pelos comandos reais da empresa.
- Exportar também arquivos prontos para Claude Desktop e outros clientes.
- Adicionar validação visual de URL, token e porta.

## Licença

Descreva aqui a licença que você deseja publicar no Marketplace e no GitHub.
