#!/bin/bash
# Appwrite Cloud Otomatik Kurulum Script'i

echo "🚀 Appwrite Cloud Otomatik Kurulum"
echo "=================================="
echo ""
echo "Bu script Appwrite Cloud bilgilerinizi alıp projeyi yapılandırır."
echo ""
echo "📋 Gerekli Bilgiler:"
echo "1. Appwrite Cloud Console: https://cloud.appwrite.io/console"
echo "2. Project ID: Settings > General > Project ID"
echo "3. API Key: Settings > API Keys > Create API Key"
echo ""
echo "Not: API Key oluştururken şu izinleri seçin:"
echo "   - users.read, users.write"
echo "   - databases.read, databases.write"
echo "   - storage.read, storage.write"
echo ""

read -p "Project ID: " PROJECT_ID
read -sp "API Key: " API_KEY
echo ""
read -p "Database ID (varsayılan: kafkasder_db): " DATABASE_ID
DATABASE_ID=${DATABASE_ID:-kafkasder_db}
read -p "Endpoint (varsayılan: https://cloud.appwrite.io/v1): " ENDPOINT
ENDPOINT=${ENDPOINT:-https://cloud.appwrite.io/v1}

# .env.local dosyasını güncelle
ENV_FILE=".env.local"

# Backend provider'ı appwrite olarak ayarla
sed -i 's/NEXT_PUBLIC_BACKEND_PROVIDER=.*/NEXT_PUBLIC_BACKEND_PROVIDER=appwrite/' "$ENV_FILE" 2>/dev/null || echo "NEXT_PUBLIC_BACKEND_PROVIDER=appwrite" >> "$ENV_FILE"

# Appwrite bilgilerini güncelle
sed -i "s|NEXT_PUBLIC_APPWRITE_ENDPOINT=.*|NEXT_PUBLIC_APPWRITE_ENDPOINT=$ENDPOINT|" "$ENV_FILE" 2>/dev/null || echo "NEXT_PUBLIC_APPWRITE_ENDPOINT=$ENDPOINT" >> "$ENV_FILE"
sed -i "s|NEXT_PUBLIC_APPWRITE_PROJECT_ID=.*|NEXT_PUBLIC_APPWRITE_PROJECT_ID=$PROJECT_ID|" "$ENV_FILE" 2>/dev/null || echo "NEXT_PUBLIC_APPWRITE_PROJECT_ID=$PROJECT_ID" >> "$ENV_FILE"
sed -i "s|NEXT_PUBLIC_APPWRITE_DATABASE_ID=.*|NEXT_PUBLIC_APPWRITE_DATABASE_ID=$DATABASE_ID|" "$ENV_FILE" 2>/dev/null || echo "NEXT_PUBLIC_APPWRITE_DATABASE_ID=$DATABASE_ID" >> "$ENV_FILE"
sed -i "s|APPWRITE_API_KEY=.*|APPWRITE_API_KEY=$API_KEY|" "$ENV_FILE" 2>/dev/null || echo "APPWRITE_API_KEY=$API_KEY" >> "$ENV_FILE"

echo ""
echo "✅ .env.local dosyası güncellendi!"
echo ""
echo "📝 Sonraki adım: Database kurulumu"
echo "   npm run appwrite:setup"
