# MCP Servers Integration

> **MCP სერვერები** | Model Context Protocol server configurations

---

## 🔌 Overview

MCP (Model Context Protocol) servers provide Claude with direct access to tools and services during development.

---

## ⚙️ Configuration

All MCP servers are configured in `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": { ... },
    "github": { ... },
    "sentry": { ... },
    "perplexity": { ... },
    "context7": { ... },
    "shadcn": { ... },
    "chrome-devtools": { ... },
    "sequential-thinking": { ... }
  }
}
```

---

## 🗄️ Supabase MCP

### Purpose
Database operations, schema management, and SQL queries.

### Configuration
```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-supabase"],
    "env": {
      "SUPABASE_URL": "https://akxmacfsltzhbnunoepb.supabase.co",
      "SUPABASE_SERVICE_ROLE_KEY": "[service-role-key]"
    }
  }
}
```

### Capabilities
- Query database schema
- Execute SQL queries
- Create/modify tables
- Manage RLS policies
- View table data
- Analyze database structure

### Usage Example
```
Claude: "Show me the schema for the orders table"
Supabase MCP: [Returns table definition, columns, indexes, policies]
```

---

## 🐙 GitHub MCP

### Purpose
Repository management, PR creation, issue tracking.

### Configuration
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "[github-token]"
    }
  }
}
```

### Capabilities
- Create/update issues
- Create pull requests
- View repository structure
- Read file contents
- Check PR status
- Manage branches

### Usage Example
```
Claude: "Create a PR for the current feature"
GitHub MCP: [Creates PR with proper title and description]
```

---

## 🚨 Sentry MCP

### Purpose
Error tracking and monitoring integration.

### Configuration
```json
{
  "sentry": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sentry"],
    "env": {
      "SENTRY_ORG": "sitech-bg",
      "SENTRY_PROJECT": "georgian-distribution",
      "SENTRY_AUTH_TOKEN": "[sentry-token]"
    }
  }
}
```

### Capabilities
- Query recent errors
- View error details
- Check error trends
- Filter by time range
- Get stack traces
- View user impact

### Usage Example
```
Claude: "Show recent errors from production"
Sentry MCP: [Returns list of recent errors with details]
```

---

## 🔍 Perplexity MCP

### Purpose
Web research and technical documentation lookup.

### Configuration
```json
{
  "perplexity": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-perplexity"],
    "env": {
      "PERPLEXITY_API_KEY": "[api-key]"
    }
  }
}
```

### Capabilities
- Search web for technical info
- Look up library documentation
- Find code examples
- Research best practices
- Check latest updates

### Usage Example
```
Claude: "What are the latest Next.js 15 features?"
Perplexity MCP: [Searches and returns current information]
```

---

## 📚 Context7 MCP

### Purpose
Library and framework documentation access.

### Configuration
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-context7"],
    "env": {
      "CONTEXT7_API_KEY": "[api-key]"
    }
  }
}
```

### Capabilities
- Access React documentation
- Query Next.js docs
- Look up TypeScript info
- Find Supabase examples
- Check API references

### Usage Example
```
Claude: "How do I use React Server Components?"
Context7 MCP: [Returns relevant documentation]
```

---

## 🎨 shadcn MCP

### Purpose
UI component management and shadcn/ui integration.

### Configuration
```json
{
  "shadcn": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-shadcn"]
  }
}
```

### Capabilities
- List available components
- Add new components
- Update existing components
- Check component versions
- View component source
- Manage component registry

### Usage Example
```
Claude: "Add the toast component from shadcn"
shadcn MCP: [Installs toast component with dependencies]
```

---

## 🌐 Chrome DevTools MCP

### Purpose
Browser debugging and inspection.

### Configuration
```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
  }
}
```

### Capabilities
- Inspect running pages
- View console logs
- Check network requests
- Analyze performance
- Debug JavaScript
- Capture screenshots

### Usage Example
```
Claude: "Check the console for errors"
Chrome DevTools MCP: [Returns console output]
```

---

## 🧠 Sequential Thinking MCP

### Purpose
Advanced reasoning and problem-solving.

### Configuration
```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  }
}
```

### Capabilities
- Break down complex problems
- Step-by-step reasoning
- Analyze trade-offs
- Evaluate solutions
- Plan implementations

### Usage Example
```
Claude: "Help me plan the architecture for a new feature"
Sequential Thinking MCP: [Provides structured analysis]
```

---

## 📁 Filesystem MCP

### Purpose
File system operations during development.

### Configuration
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"],
    "env": {
      "ALLOWED_DIRECTORIES": "c:\\Users\\SITECH\\Desktop\\DEV\\Distribution-Managment"
    }
  }
}
```

### Capabilities
- Read files
- Write files
- Search files
- List directories
- Check file existence

---

## 🔒 Security Considerations

### API Keys
- Store in `.kilocode/mcp.json` (gitignored)
- Never commit API keys
- Rotate keys regularly
- Use minimal permissions

### Access Control
- Service role keys for server-side only
- Restrict MCP access to development only
- Monitor MCP usage

---

## 🐛 Troubleshooting

### MCP Server Not Responding

1. Check MCP configuration in `.kilocode/mcp.json`
2. Verify API keys are correct
3. Check network connectivity
4. Restart Claude Code

### Permission Errors

1. Verify API key has required permissions
2. Check environment variables
3. Verify URL/endpoints are correct

---

## 📚 Resources

- **MCP Documentation:** https://modelcontextprotocol.io/
- **Available MCP Servers:** https://github.com/modelcontextprotocol/servers

---

**Last Updated:** 2025-11-03
**Active MCP Servers:** 8
**Configuration:** `.kilocode/mcp.json`
