# 🏦 ZenBilling Payment Microservice

Microservice de paiement dédié pour la plateforme ZenBilling, gérant les paiements via Stripe Connect et les notifications par email.

## 📋 Fonctionnalités

- 💳 **Gestion Stripe Connect** : Création et gestion des comptes marchands
- 🔗 **Liens d'onboarding** : Simplification de l'intégration Stripe
- 💰 **Paiements sécurisés** : Intentions de paiement et sessions checkout
- 📧 **Notifications email** : Confirmations et échecs de paiement
- 🔔 **Webhooks Stripe** : Traitement des événements en temps réel
- 🔐 **Authentification Supabase** : Sécurisation des endpoints
- 📊 **Logging avancé** : Traçabilité complète avec Pino
- 🐳 **Containerisation Docker** : Déploiement simplifié

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 13+
- Compte Stripe
- Compte Supabase
- Compte Brevo (pour les emails)

### Configuration locale

1. **Cloner le projet**
   ```bash
   cd payment-microservice
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration des variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos configurations
   ```

4. **Configuration de la base de données**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Démarrer en mode développement**
   ```bash
   npm run dev
   ```

### Déploiement avec Docker

1. **Construire et démarrer les services**
   ```bash
   docker-compose up -d --build
   ```

2. **Vérifier le statut**
   ```bash
   curl http://localhost:3001/health
   ```

## 🔧 Configuration

### Variables d'environnement obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` |
| `SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJ...` |
| `BREVO_API_KEY` | Clé API Brevo | `xkeysib-...` |

## 📚 API Endpoints

### Gestion des comptes Stripe

#### Créer un compte Connect
```http
POST /api/payments/stripe/connect
Authorization: Bearer <token>
```

#### Créer un lien d'onboarding
```http
POST /api/payments/stripe/account-link
Content-Type: application/json

{
  "refreshUrl": "https://example.com/reauth",
  "returnUrl": "https://example.com/return"
}
```

#### Statut du compte
```http
GET /api/payments/stripe/account-status
Authorization: Bearer <token>
```

### Paiements

#### Créer un paiement
```http
POST /api/payments/stripe/create-payment
Content-Type: application/json

{
  "amount": 10000,
  "description": "Facture #001",
  "invoiceId": "invoice_123"
}
```

#### Créer un paiement avec email
```http
POST /api/payments/stripe/create-payment-with-email
Content-Type: application/json

{
  "amount": 10000,
  "description": "Facture #001",
  "invoiceId": "invoice_123",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

### Webhooks

#### Webhook Stripe
```http
POST /api/payments/stripe/webhook
Content-Type: application/json
Stripe-Signature: <signature>
```

### Utilitaires

#### Santé du service
```http
GET /health
```

#### Dashboard Stripe
```http
GET /api/payments/stripe/dashboard-link
Authorization: Bearer <token>
```

## 🔒 Sécurité

- **Authentification** : Tous les endpoints protégés utilisent Supabase Auth
- **Rate Limiting** : 100 requêtes par IP toutes les 15 minutes
- **CORS** : Configuration restrictive des origines autorisées
- **Helmet** : Protection contre les vulnérabilités web communes
- **Validation** : Validation stricte des webhooks Stripe

## 📊 Monitoring

### Logs
Les logs sont centralisés avec Pino et incluent :
- Requêtes HTTP
- Événements Stripe
- Erreurs et exceptions
- Métriques de performance

### Health Check
```bash
curl http://localhost:3001/health
```

### Métriques Docker
```bash
docker stats zenbilling-payment-service
```

## 🛠 Développement

### Scripts disponibles
```bash
npm run dev          # Développement avec hot-reload
npm run build        # Construction pour production
npm run start        # Démarrage production
npm run ts:check     # Vérification TypeScript
```

### Structure du projet
```
src/
├── controllers/     # Logique des endpoints
├── services/       # Services métier
├── middlewares/    # Middlewares Express
├── routes/         # Définition des routes
├── interfaces/     # Types TypeScript
├── utils/          # Utilitaires
└── lib/           # Configuration externe
```

## 🐛 Débogage

### Logs en temps réel
```bash
docker-compose logs -f payment-service
```

### Tests de paiement Stripe
Utilisez les cartes de test Stripe :
- `4242424242424242` : Paiement réussi
- `4000000000000002` : Carte déclinée

### Webhook en local
Utilisez Stripe CLI pour tester les webhooks :
```bash
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

## 🚀 Déploiement

### Production
1. Configurer les variables d'environnement de production
2. Construire l'image Docker
3. Déployer avec docker-compose ou Kubernetes
4. Configurer les webhooks Stripe vers votre domaine

### CI/CD
Le projet inclut un workflow GitHub Actions pour :
- Tests automatisés
- Construction Docker
- Déploiement automatique

## 📝 Licence

Ce projet est sous licence propriétaire ZenBilling.

## 🤝 Support

Pour toute question ou problème :
- Ouvrir une issue GitHub
- Contacter l'équipe technique ZenBilling
- Consulter la documentation Stripe

---

**ZenBilling Payment Microservice** - Simplicité, sécurité et performance pour vos paiements en ligne. 