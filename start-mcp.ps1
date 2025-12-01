#!/usr/bin/env pwsh

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Get-Content .env.local | ForEach-Object {
        if ($_ -and !$_.StartsWith("#")) {
            $name, $value = $_.Split("=", 2)
            if ($name -and $value) {
                [Environment]::SetEnvironmentVariable($name, $value)
                Write-Host "Set $name"
            }
        }
    }
}

# Run the MCP server
Write-Host "Starting Appwrite MCP Server..."
uvx mcp-server-appwrite --all
