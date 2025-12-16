#!/bin/bash
# SonarCloud Analiz Scripti

if [ -z "$SONAR_TOKEN" ]; then
    echo "❌ HATA: SONAR_TOKEN ortam değişkeni ayarlanmamış!"
    echo ""
    echo "Token'ı ayarlamak için:"
    echo "  export SONAR_TOKEN=your_token_here"
    echo ""
    echo "Veya doğrudan çalıştırmak için:"
    echo "  SONAR_TOKEN=your_token_here ./run-sonar-analysis.sh"
    echo ""
    echo "Token'ı SonarCloud'dan almak için:"
    echo "  1. https://sonarcloud.io adresine gidin"
    echo "  2. My Account > Security > Generate Token"
    exit 1
fi

echo "🚀 SonarCloud analizi başlatılıyor..."
echo "📁 Proje: Kafkasportal_git"
echo "🏢 Organizasyon: kafkasportal"
echo ""

npx --yes sonarqube-scanner -Dsonar.host.url=https://sonarcloud.io
