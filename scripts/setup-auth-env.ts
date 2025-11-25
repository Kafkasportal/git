#!/usr/bin/env tsx
/**
 * Script to setup authentication and environment variables
 * Generates secure secrets and updates .env.local file
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ENV_FILE = resolve(process.cwd(), '.env.local');
const ENV_EXAMPLE = resolve(process.cwd(), '.env.example');

function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

function readEnvFile(): Map<string, string> {
  const env = new Map<string, string>();
  
  if (existsSync(ENV_FILE)) {
    const content = readFileSync(ENV_FILE, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          env.set(key.trim(), value);
        }
      }
    }
  }
  
  return env;
}

function writeEnvFile(env: Map<string, string>): void {
  const lines: string[] = [];
  
  // Read example file for structure
  if (existsSync(ENV_EXAMPLE)) {
    const exampleContent = readFileSync(ENV_EXAMPLE, 'utf-8');
    const exampleLines = exampleContent.split('\n');
    
    for (const line of exampleLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        lines.push(line);
      } else if (trimmed && trimmed.includes('=')) {
        const [key] = trimmed.split('=');
        const keyTrimmed = key.trim();
        if (env.has(keyTrimmed)) {
          lines.push(`${keyTrimmed}=${env.get(keyTrimmed)}`);
        } else {
          lines.push(line);
        }
      } else {
        lines.push(line);
      }
    }
  } else {
    // If no example file, write all env vars
    for (const [key, value] of env.entries()) {
      lines.push(`${key}=${value}`);
    }
  }
  
  writeFileSync(ENV_FILE, `${lines.join('\n')}\n`, 'utf-8');
}

function main() {
  console.log('🔐 Authentication & Environment Setup\n');
  
  const env = readEnvFile();
  
  // Generate secrets if not present or too short
  let needsUpdate = false;
  
  // SESSION_SECRET (minimum 16 chars, but we'll use 32 for security)
  if (!env.has('SESSION_SECRET') || env.get('SESSION_SECRET')!.length < 32) {
    const secret = generateSecret(32);
    env.set('SESSION_SECRET', secret);
    console.log('✅ Generated SESSION_SECRET (32 chars)');
    needsUpdate = true;
  } else {
    console.log('✓ SESSION_SECRET already exists');
  }
  
  // CSRF_SECRET (minimum 32 chars)
  if (!env.has('CSRF_SECRET') || env.get('CSRF_SECRET')!.length < 32) {
    const secret = generateSecret(32);
    env.set('CSRF_SECRET', secret);
    console.log('✅ Generated CSRF_SECRET (32 chars)');
    needsUpdate = true;
  } else {
    console.log('✓ CSRF_SECRET already exists');
  }
  
  // Check Appwrite configuration
  const requiredAppwriteVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY',
  ];
  
  console.log('\n📋 Appwrite Configuration:');
  for (const key of requiredAppwriteVars) {
    if (env.has(key) && env.get(key) && !env.get(key)!.includes('your-')) {
      console.log(`✓ ${key} is set`);
    } else {
      console.log(`⚠ ${key} is missing or not configured`);
      if (key === 'NEXT_PUBLIC_APPWRITE_ENDPOINT' && !env.has(key)) {
        env.set(key, 'https://fra.cloud.appwrite.io/v1');
        needsUpdate = true;
      }
    }
  }
  
  // Write updated env file
  if (needsUpdate) {
    writeEnvFile(env);
    console.log('\n✅ Updated .env.local file');
  } else {
    console.log('\n✓ No updates needed');
  }
  
  console.log('\n📝 Summary:');
  console.log('  - SESSION_SECRET: Required for session cookies (32+ chars)');
  console.log('  - CSRF_SECRET: Required for CSRF protection (32+ chars)');
  console.log('  - Appwrite vars: Required for backend connection');
  console.log('\n✅ Setup complete! Restart your dev server if it\'s running.');
}

main();

