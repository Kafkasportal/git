---
name: "appwrite-mcp"
displayName: "Appwrite MCP"
description: "Complete Appwrite BaaS integration with MCP. Manage databases, collections, documents, users, authentication, and storage directly from Kiro. Perfect for Appwrite-powered applications."
keywords: ["appwrite", "baas", "backend", "database", "authentication", "storage", "mongodb"]
author: "Dernek Team"
---

# Appwrite MCP

## Overview

Appwrite MCP provides comprehensive Backend-as-a-Service capabilities through the Model Context Protocol. Manage your Appwrite instance directly from Kiro including databases, collections, documents, users, authentication, and file storage.

This power enables you to:
- Create and manage databases and collections
- Perform CRUD operations on documents
- Manage user accounts and authentication
- Handle file uploads and storage
- Query and filter data
- Manage permissions and access control
- Automate Appwrite workflows

Perfect for developers building applications with Appwrite who want to automate backend operations, manage data programmatically, or integrate Appwrite into their workflows.

## Onboarding

### Prerequisites

- Appwrite instance running (self-hosted or cloud)
- Appwrite API endpoint URL
- API key with appropriate permissions
- Basic understanding of Appwrite concepts (databases, collections, documents)

### Installation

Appwrite MCP uses the standard `@modelcontextprotocol/server-appwrite` package. It will be installed automatically when you configure it in Kiro.

### Configuration

The Appwrite MCP server requires your Appwrite instance details and API credentials.

**Required environment variables:**
- `APPWRITE_ENDPOINT`: Your Appwrite API endpoint (e.g., `https://cloud.appwrite.io/v1`)
- `APPWRITE_API_KEY`: Your Appwrite API key with appropriate permissions

**Setup:**
1. Get your Appwrite endpoint from your instance
2. Generate an API key in Appwrite Console (Settings → API Keys)
3. Configure these in your `mcp.json` file

**Verify connection:**
```bash
# Test your Appwrite connection
curl -X GET "https://your-appwrite-endpoint/v1/health" \
  -H "X-Appwrite-Key: YOUR_API_KEY"
```

## Common Workflows

### Workflow 1: Create a Database and Collection

**Goal:** Set up a new database with a collection for storing data

**Steps:**
1. Create a new database
2. Create a collection within the database
3. Define attributes (fields) for the collection
4. Set up permissions

**Example:**
```
Tool: create_database
Parameters:
  - name: "users_db"
  - database_id: "users_database"

Tool: create_collection
Parameters:
  - database_id: "users_database"
  - name: "profiles"
  - collection_id: "profiles"

Tool: create_attribute
Parameters:
  - database_id: "users_database"
  - collection_id: "profiles"
  - attribute_type: "string"
  - attribute_id: "email"
  - required: true
```

### Workflow 2: Create and Query Documents

**Goal:** Add documents to a collection and retrieve them with filters

**Steps:**
1. Create a new document with data
2. Query documents with filters
3. Update or delete as needed

**Example:**
```
Tool: create_document
Parameters:
  - database_id: "users_database"
  - collection_id: "profiles"
  - document_id: "unique_id"
  - data: {
      "email": "user@example.com",
      "name": "John Doe",
      "status": "active"
    }

Tool: list_documents
Parameters:
  - database_id: "users_database"
  - collection_id: "profiles"
  - queries: ["status == 'active'"]
```

### Workflow 3: Manage User Accounts

**Goal:** Create users, manage authentication, and handle user data

**Steps:**
1. Create a new user account
2. Set user preferences
3. Manage user sessions
4. Handle password reset

**Example:**
```
Tool: create_user
Parameters:
  - user_id: "unique_user_id"
  - email: "user@example.com"
  - password: "secure_password"
  - name: "John Doe"

Tool: update_user_preferences
Parameters:
  - user_id: "unique_user_id"
  - preferences: {
      "theme": "dark",
      "language": "en"
    }
```

### Workflow 4: Handle File Storage

**Goal:** Upload files and manage storage

**Steps:**
1. Upload a file to storage
2. Get file download URL
3. Delete files when needed

**Example:**
```
Tool: create_file
Parameters:
  - bucket_id: "default"
  - file_id: "unique_file_id"
  - file: <file_content>
  - permissions: ["read('any')"]

Tool: get_file_download
Parameters:
  - bucket_id: "default"
  - file_id: "unique_file_id"
```

### Workflow 5: Set Up Permissions

**Goal:** Control access to databases, collections, and documents

**Steps:**
1. Define role-based permissions
2. Apply permissions to resources
3. Test access control

**Example:**
```
Tool: update_collection_permissions
Parameters:
  - database_id: "users_database"
  - collection_id: "profiles"
  - permissions: [
      "read('role:authenticated')",
      "write('role:admin')",
      "delete('role:admin')"
    ]
```

## Available Tools

### Database Operations

**create_database**
Create a new database

**Parameters:**
- `name` (string, required): Database name
- `database_id` (string, optional): Custom database ID

**list_databases**
List all databases

**delete_database**
Delete a database

**Parameters:**
- `database_id` (string, required): Database ID to delete

### Collection Operations

**create_collection**
Create a new collection

**Parameters:**
- `database_id` (string, required): Parent database ID
- `name` (string, required): Collection name
- `collection_id` (string, optional): Custom collection ID

**list_collections**
List collections in a database

**Parameters:**
- `database_id` (string, required): Database ID

**delete_collection**
Delete a collection

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID to delete

### Document Operations

**create_document**
Create a new document

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID
- `document_id` (string, optional): Custom document ID
- `data` (object, required): Document data

**list_documents**
Query documents

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID
- `queries` (array, optional): Query filters

**get_document**
Get a specific document

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID
- `document_id` (string, required): Document ID

**update_document**
Update a document

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID
- `document_id` (string, required): Document ID
- `data` (object, required): Updated data

**delete_document**
Delete a document

**Parameters:**
- `database_id` (string, required): Database ID
- `collection_id` (string, required): Collection ID
- `document_id` (string, required): Document ID to delete

### User Operations

**create_user**
Create a new user

**Parameters:**
- `user_id` (string, optional): Custom user ID
- `email` (string, required): User email
- `password` (string, required): User password
- `name` (string, optional): User name

**list_users**
List all users

**get_user**
Get a specific user

**Parameters:**
- `user_id` (string, required): User ID

**update_user**
Update user information

**Parameters:**
- `user_id` (string, required): User ID
- `data` (object, required): Updated user data

**delete_user**
Delete a user

**Parameters:**
- `user_id` (string, required): User ID to delete

### File Storage Operations

**create_file**
Upload a file

**Parameters:**
- `bucket_id` (string, required): Bucket ID
- `file_id` (string, optional): Custom file ID
- `file` (file, required): File content
- `permissions` (array, optional): File permissions

**list_files**
List files in a bucket

**Parameters:**
- `bucket_id` (string, required): Bucket ID

**get_file_download**
Get file download URL

**Parameters:**
- `bucket_id` (string, required): Bucket ID
- `file_id` (string, required): File ID

**delete_file**
Delete a file

**Parameters:**
- `bucket_id` (string, required): Bucket ID
- `file_id` (string, required): File ID to delete

## Troubleshooting

### Error: "Invalid API Key"
**Cause:** API key is incorrect or expired
**Solution:**
1. Verify API key in Appwrite Console
2. Generate a new API key if needed
3. Ensure key has required permissions
4. Update `APPWRITE_API_KEY` in mcp.json

### Error: "Connection refused"
**Cause:** Cannot reach Appwrite endpoint
**Solution:**
1. Verify endpoint URL is correct: `https://your-appwrite-endpoint/v1`
2. Check if Appwrite instance is running
3. Verify network connectivity
4. Check firewall rules

### Error: "Database not found"
**Cause:** Database ID is incorrect or doesn't exist
**Solution:**
1. List databases: Use `list_databases` tool
2. Verify database ID is correct
3. Ensure database hasn't been deleted
4. Check permissions for the API key

### Error: "Permission denied"
**Cause:** API key lacks required permissions
**Solution:**
1. Check API key permissions in Appwrite Console
2. Create a new API key with broader permissions if needed
3. Verify collection/document permissions
4. Check role-based access control settings

### Error: "Collection attribute validation failed"
**Cause:** Document data doesn't match collection schema
**Solution:**
1. Review collection attributes: Use `list_collections` tool
2. Verify data types match attribute definitions
3. Ensure required fields are provided
4. Check attribute constraints (min/max length, etc.)

### MCP Server Connection Issues
**Problem:** Appwrite MCP server won't connect
**Symptoms:**
- Error: "Connection refused"
- Server not responding

**Solutions:**
1. Verify environment variables are set correctly
2. Test Appwrite connection manually: `curl -X GET "YOUR_ENDPOINT/v1/health"`
3. Check Appwrite instance is running
4. Restart Kiro and try again
5. Review MCP server logs for errors

## Best Practices

- **Use meaningful IDs** - Create descriptive database, collection, and document IDs
- **Plan your schema** - Design collections and attributes before creating them
- **Set proper permissions** - Use role-based access control for security
- **Validate input** - Validate data before creating/updating documents
- **Use indexes** - Create indexes on frequently queried fields
- **Handle errors gracefully** - Implement proper error handling in workflows
- **Backup important data** - Regularly backup critical databases
- **Monitor usage** - Track API usage and optimize queries
- **Use transactions** - Group related operations for data consistency

## Configuration

**Required environment variables in mcp.json:**

- **`APPWRITE_ENDPOINT`**: Your Appwrite API endpoint
  - **How to get it:**
    1. Go to Appwrite Console
    2. Navigate to Settings → API
    3. Copy the API Endpoint URL
    4. Example: `https://cloud.appwrite.io/v1`

- **`APPWRITE_API_KEY`**: Your Appwrite API key
  - **How to get it:**
    1. Go to Appwrite Console
    2. Navigate to Settings → API Keys
    3. Click "Create API Key"
    4. Select required scopes (databases, collections, documents, users, files)
    5. Copy the generated API key

**After replacing placeholders, your mcp.json should look like:**
```json
{
  "mcpServers": {
    "appwrite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-appwrite"],
      "env": {
        "APPWRITE_ENDPOINT": "https://your-appwrite-endpoint/v1",
        "APPWRITE_API_KEY": "your-actual-api-key-here"
      }
    }
  }
}
```

---

**MCP Server:** `@modelcontextprotocol/server-appwrite`
**Documentation:** https://appwrite.io/docs
**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/appwrite
