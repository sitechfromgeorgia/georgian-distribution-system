# MCP Servers Configuration

**Documented:** 2025-10-31  
**Configuration Files:** `.kilocode/mcp.json`, `.vscode/mcp.json`

## MCP Server Overview

Model Context Protocol (MCP) servers provide additional capabilities to AI assistants and development tools. The system is configured with 7 specialized MCP servers for enhanced development workflow.

## Individual MCP Server Configurations

### 1. Perplexity AI Server
**Purpose:** AI-powered research and information retrieval  
**Command:** `cmd /c npx -y @perplexity-ai/mcp-server`  
**Environment:** `PERPLEXITY_API_KEY=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`  
**Always Allow:**
- `perplexity_search` - Web search capabilities
- `perplexity_research` - Research assistant functionality  
- `perplexity_reason` - Analytical reasoning
- `perplexity_ask` - Question answering
**Timeout:** 300 seconds

### 2. Filesystem Server
**Purpose:** File system access and management  
**Command:** `cmd /c npx -y @modelcontextprotocol/server-filesystem c:/Users/`  
**Access:** Full filesystem access to user directory  
**Always Allow:** All file operations
- `read_text_file` - Text file reading
- `read_media_file` - Media file handling
- `write_file` - File creation and editing
- `create_directory` - Directory management
- `list_directory` - Directory listing
- `search_files` - File search
- `delete_file` - File deletion

### 3. GitHub Server
**Purpose:** GitHub integration and repository management  
**Type:** Streamable HTTP  
**URL:** `https://api.githubcopilot.com/mcp/`  
**Authorization:** Bearer token configured  
**Always Allow:**
- `create_repository` - Repository creation
- `push_files` - File pushing to repositories
- `create_or_update_file` - File management
- `list_branches` - Branch listing
- `get_file_contents` - File content retrieval

### 4. Sentry Server
**Purpose:** Error monitoring and performance tracking  
**Command:** `uvx mcp-server-sentry --auth-token [Configured]`  
**Integration:** Complete Sentry monitoring setup  
**Use Cases:** Production error tracking, performance monitoring, alerting

### 5. Supabase Server
**Purpose:** Supabase database and backend management  
**Command:** `npx -y @supabase/mcp-server-supabase@0.5.5 --access-token [Configured]`  
**Always Allow:**
- `search_docs` - Documentation search
- `list_organizations` - Organization management
- `create_project` - Project creation
- `apply_migration` - Database migrations
- `execute_sql` - SQL execution
- `generate_typescript_types` - Type generation
- `list_tables` - Table management

### 6. Context7 Server
**Purpose:** Library documentation and API reference  
**Command:** `npx -y @upstash/context7-mcp`  
**Environment:** `DEFAULT_MINIMUM_TOKENS=""`  
**Always Allow:**
- `resolve-library-id` - Library identification
- `get-library-docs` - Documentation retrieval

### 7. Sequential Thinking Server
**Purpose:** Step-by-step reasoning and planning  
**Command:** `npx -y @modelcontextprotocol/server-sequential-thinking`  
**Use Cases:** Complex problem solving, workflow planning, logical reasoning

### 8. Chrome DevTools Server
**Purpose:** Browser automation and web development  
**Command:** `npx -y chrome-devtools-mcp@latest`  
**Always Allow:**
- `navigate_page` - Web navigation
- `list_console_messages` - Console logging
- `take_screenshot` - Screen capture
- `evaluate_script` - JavaScript execution
- `list_network_requests` - Network monitoring

### 9. Shadcn Server
**Purpose:** UI component library integration  
**Command:** `npx shadcn@latest mcp`  
**Always Allow:**
- `get_project_registries` - Component registry access
- `list_items_in_registries` - Component listing
- `search_items_in_registries` - Component search
- `get_audit_checklist` - Code quality auditing

## Security Configuration

### Always Allow Permissions
All servers are configured with `alwaysAllow` permissions for seamless integration with:
- Kilocode AI Agent
- GitHub Copilot  
- VS Code development environment

### API Keys and Tokens
**Configured Services:**
- Perplexity AI API key
- GitHub Copilot token
- Sentry authentication token
- Supabase access token
- Context7 environment variables

## Integration Benefits

### Development Workflow Enhancement
1. **Research:** Perplexity AI for web research and fact-checking
2. **File Management:** Complete filesystem access for project management
3. **Version Control:** GitHub integration for repository management
4. **Monitoring:** Sentry integration for production oversight
5. **Backend:** Supabase integration for database operations
6. **Documentation:** Context7 for library documentation lookup
7. **Planning:** Sequential thinking for complex problem solving
8. **Web Development:** Chrome DevTools for browser automation
9. **UI Development:** Shadcn for component library integration

### Georgian Distribution System Support
These MCP servers directly support:
- **Database Management:** Supabase MCP for schema changes and data operations
- **Code Quality:** Shadcn MCP for UI component auditing
- **Research:** Perplexity MCP for technical research
- **File Operations:** Filesystem MCP for project file management
- **Error Monitoring:** Sentry MCP for production monitoring
- **Git Operations:** GitHub MCP for version control integration

## Usage with AI Agents

### Kilocode AI Agent Integration
- Automatically loads all configured MCP servers
- Provides context-aware assistance across all domains
- Enables complex multi-step development workflows
- Supports both solo and collaborative development

### GitHub Copilot Integration  
- Enhanced with MCP capabilities for better context
- Access to external APIs and services
- Improved code generation and debugging assistance

### VS Code Integration
- Seamless MCP server integration through extension
- AI-powered development assistance with external tool access
- Enhanced debugging and development workflows

## Configuration Management

### Environment Variables
All sensitive data (API keys, tokens) are properly secured through environment variables and not exposed in configuration files.

### Server Availability
All MCP servers are configured as "always available" with appropriate timeout settings to ensure responsive AI assistance.

### Security Best Practices
- API keys stored securely in environment
- Scope-limited permissions per server
- Timeout protection against hanging requests
- Streamable HTTP for efficient data transfer where applicable

This MCP configuration provides a comprehensive development environment that enhances AI-assisted development with powerful external capabilities and integrations.