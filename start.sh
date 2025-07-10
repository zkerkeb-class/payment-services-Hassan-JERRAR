#!/bin/bash

echo "🏦 ZenBilling Payment Microservice - Script de démarrage"
echo "=================================================="

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"
echo "✅ npm $(npm --version) détecté"

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé. Copie de .env.example..."
    cp .env.example .env
    echo "📝 Veuillez éditer le fichier .env avec vos configurations avant de continuer."
    echo "   Variables importantes à configurer :"
    echo "   - DATABASE_URL"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - BREVO_API_KEY"
    exit 1
fi

echo "✅ Fichier .env trouvé"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Échec de l'installation des dépendances"
    exit 1
fi

echo "✅ Dépendances installées"

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Échec de la génération du client Prisma"
    exit 1
fi

echo "✅ Client Prisma généré"

# Vérifier la connexion à la base de données
echo "🔌 Vérification de la connexion à la base de données..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Impossible de se connecter à la base de données"
    echo "   Vérifiez votre DATABASE_URL dans le fichier .env"
    exit 1
fi

echo "✅ Base de données connectée et synchronisée"

# Démarrer le service
echo "🚀 Démarrage du Payment Microservice..."
echo "   Service disponible sur : http://localhost:3001"
echo "   Health check : http://localhost:3001/health"
echo "   API Documentation : http://localhost:3001/api"
echo ""
echo "💡 Utilisez Ctrl+C pour arrêter le service"

npm run dev 