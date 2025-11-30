const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

// Ensure output directory exists
const outputDir = path.join(__dirname, 'dist');
fs.ensureDirSync(outputDir);

// HTML template
const htmlTemplate = (title, content, sidebar) => `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Dernek Yönetim Sistemi Dokümantasyonu</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            display: flex;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .sidebar {
            width: 280px;
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-right: 20px;
            height: fit-content;
            position: sticky;
            top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .sidebar h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #2563eb;
        }
        .sidebar ul {
            list-style: none;
        }
        .sidebar li {
            margin: 8px 0;
        }
        .sidebar a {
            color: #4b5563;
            text-decoration: none;
            display: block;
            padding: 6px 12px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .sidebar a:hover {
            background: #f3f4f6;
            color: #2563eb;
        }
        .sidebar a.active {
            background: #eff6ff;
            color: #2563eb;
            font-weight: 500;
        }
        .content {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .content h1 {
            font-size: 36px;
            margin-bottom: 20px;
            color: #111827;
        }
        .content h2 {
            font-size: 28px;
            margin-top: 32px;
            margin-bottom: 16px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        .content h3 {
            font-size: 22px;
            margin-top: 24px;
            margin-bottom: 12px;
            color: #374151;
        }
        .content p {
            margin-bottom: 16px;
        }
        .content ul, .content ol {
            margin-left: 24px;
            margin-bottom: 16px;
        }
        .content code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .content pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 16px;
        }
        .content pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        .content blockquote {
            border-left: 4px solid #2563eb;
            padding-left: 16px;
            margin: 16px 0;
            color: #6b7280;
        }
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        .content table th,
        .content table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        .content table th {
            background: #f9fafb;
            font-weight: 600;
        }
        .header {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 16px 0;
            margin-bottom: 20px;
        }
        .header h1 {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            font-size: 24px;
            color: #2563eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📘 Dernek Yönetim Sistemi - Dokümantasyon</h1>
    </div>
    <div class="container">
        <nav class="sidebar">
            <h2>İçindekiler</h2>
            ${sidebar}
        </nav>
        <main class="content">
            ${content}
        </main>
    </div>
</body>
</html>`;

// Get all markdown files
const docsDir = __dirname;
const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));

// Generate sidebar
const sidebarItems = files.map(file => {
    const name = file.replace('.md', '');
    const displayName = name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    const href = file === 'README.md' ? 'index.html' : `${name}.html`;
    return `<li><a href="${href}">${displayName}</a></li>`;
});

const sidebar = `<ul>${sidebarItems.join('')}</ul>`;

// Convert each markdown file to HTML
files.forEach(file => {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const html = marked(content);
    const title = file === 'README.md' ? 'Ana Sayfa' : file.replace('.md', '').split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const fullHtml = htmlTemplate(title, html, sidebar.replace(`href="${file === 'README.md' ? 'index.html' : file.replace('.md', '') + '.html'}"`, `href="${file === 'README.md' ? 'index.html' : file.replace('.md', '') + '.html'}" class="active"`));
    
    const outputFile = file === 'README.md' ? 'index.html' : file.replace('.md', '.html');
    fs.writeFileSync(path.join(outputDir, outputFile), fullHtml);
});

// Copy assets if any
const assetsDir = path.join(docsDir, 'assets');
if (fs.existsSync(assetsDir)) {
    fs.copySync(assetsDir, path.join(outputDir, 'assets'));
}

console.log(`✓ Built ${files.length} documentation pages`);
console.log(`✓ Output directory: ${outputDir}`);

