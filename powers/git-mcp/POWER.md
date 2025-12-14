---
name: "git-mcp"
displayName: "Git MCP"
description: "Complete Git version control integration with MCP. Execute git commands, analyze commits, manage branches, and automate git workflows directly from Kiro."
keywords: ["git", "version-control", "commits", "branches", "repository", "vcs"]
author: "Dernek Team"
---

# Git MCP

## Overview

Git MCP provides comprehensive Git version control capabilities through the Model Context Protocol. Execute any git command, analyze commit history, manage branches, and automate git workflows directly within Kiro.

This power enables you to:
- Execute git commands programmatically
- Analyze commit history and generate changelogs
- Manage branches and tags
- Perform complex git workflows
- Integrate git operations into automated processes

Perfect for developers who want to automate git tasks, generate release notes, analyze repository history, or integrate version control into their workflows.

## Onboarding

### Prerequisites

- Git installed on your system (version 2.0+)
- A git repository initialized in your workspace
- Basic understanding of git commands

### Installation

Git MCP uses the standard `@modelcontextprotocol/server-git` package. It will be installed automatically when you configure it in Kiro.

### Configuration

The Git MCP server is configured in `mcp.json`. No additional setup is required beyond having git installed on your system.

**Verify git is installed:**
```bash
git --version
```

## Common Workflows

### Workflow 1: View Commit History

**Goal:** Analyze recent commits and understand what changed

**Steps:**
1. Use the `get_commits` tool to fetch recent commits
2. Specify the number of commits to retrieve
3. Review commit messages and authors

**Example:**
```
Tool: get_commits
Parameters:
  - repository_path: "/path/to/repo"
  - max_count: 10

Returns: List of 10 most recent commits with:
  - Hash
  - Author
  - Date
  - Message
```

### Workflow 2: Generate Release Notes

**Goal:** Create formatted release notes from git commits

**Steps:**
1. Fetch commits since last release tag
2. Categorize commits (features, fixes, breaking changes)
3. Format as release notes

**Example:**
```
Tool: get_commits
Parameters:
  - repository_path: "/path/to/repo"
  - max_count: 50

Process:
1. Filter commits by type (feat:, fix:, breaking:)
2. Group by category
3. Format as markdown release notes
```

### Workflow 3: Analyze Branch Status

**Goal:** Check current branch, uncommitted changes, and branch status

**Steps:**
1. Get current branch name
2. Check for uncommitted changes
3. View branch tracking status

**Example:**
```
Tool: get_status
Parameters:
  - repository_path: "/path/to/repo"

Returns:
  - Current branch
  - Modified files
  - Staged changes
  - Untracked files
```

### Workflow 4: Create and Manage Tags

**Goal:** Create version tags and manage releases

**Steps:**
1. Create annotated tag for release
2. Push tag to remote
3. Verify tag creation

**Example:**
```
Tool: create_tag
Parameters:
  - repository_path: "/path/to/repo"
  - tag_name: "v1.0.0"
  - message: "Release version 1.0.0"
```

## Available Tools

### get_commits
Retrieve commit history from a repository

**Parameters:**
- `repository_path` (string, required): Path to git repository
- `max_count` (number, optional): Maximum number of commits to retrieve (default: 10)

**Returns:** Array of commit objects with hash, author, date, and message

### get_status
Get current repository status

**Parameters:**
- `repository_path` (string, required): Path to git repository

**Returns:** Repository status including current branch, modified files, staged changes

### create_tag
Create a new git tag

**Parameters:**
- `repository_path` (string, required): Path to git repository
- `tag_name` (string, required): Name of the tag
- `message` (string, optional): Tag message (for annotated tags)

**Returns:** Confirmation of tag creation

### get_diff
Get differences between commits or branches

**Parameters:**
- `repository_path` (string, required): Path to git repository
- `from_ref` (string, optional): Starting reference (commit/branch)
- `to_ref` (string, optional): Ending reference (commit/branch)

**Returns:** Diff output showing changes

## Troubleshooting

### Error: "Repository not found"
**Cause:** Invalid repository path or not a git repository
**Solution:**
1. Verify the path is correct: `ls -la /path/to/repo/.git`
2. Ensure you're pointing to a git repository root
3. Check file permissions

### Error: "Command failed"
**Cause:** Git command execution failed
**Solution:**
1. Verify git is installed: `git --version`
2. Check repository integrity: `git fsck`
3. Review git configuration: `git config --list`

### Error: "Permission denied"
**Cause:** Insufficient permissions to access repository
**Solution:**
1. Check file permissions: `ls -la /path/to/repo`
2. Ensure user has read/write access
3. On Linux/macOS: `chmod -R u+rw /path/to/repo`

### MCP Server Connection Issues
**Problem:** Git MCP server won't connect
**Symptoms:**
- Error: "Connection refused"
- Server not responding

**Solutions:**
1. Verify git is installed: `git --version`
2. Check repository path is accessible
3. Restart Kiro and try again
4. Review MCP server logs for errors

## Best Practices

- **Use meaningful commit messages** - Follow conventional commits (feat:, fix:, breaking:)
- **Commit frequently** - Small, focused commits are easier to review and revert
- **Create feature branches** - Keep main branch stable
- **Review before pushing** - Use `git diff` to review changes
- **Tag releases** - Use semantic versioning for tags (v1.0.0, v1.1.0, etc.)
- **Keep history clean** - Use interactive rebase for complex histories
- **Document breaking changes** - Clearly mark breaking changes in commits

## Configuration

**No additional configuration required** - Git MCP works with any git repository on your system.

**Optional: Configure git globally**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

**MCP Server:** `@modelcontextprotocol/server-git`
**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/git
