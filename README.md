# Lucy AI - Plateforme de gestion de portefeuille crypto

Application SaaS de suivi de portefeuille crypto avec alertes intelligentes basées sur l'IA.

## 🏗️ Architecture

### Vue d'ensemble

L'application est organisée en deux parties distinctes : le backend (Convex) et le frontend (React). Chaque partie suit une architecture modulaire pour faciliter la maintenance et l'évolution.

### Backend - Organisation modulaire

J'ai choisi de structurer le backend en **modules autonomes** plutôt que de tout mettre dans des fichiers plats. Voici pourquoi :

**Structure actuelle :**
```
convex/
├── modules/
│   ├── notifications/     # Tout ce qui concerne les alertes
│   ├── prices/            # Gestion des prix crypto
│   ├── rules/             # Règles d'alerte utilisateur
│   └── lib/               # Utilitaires partagés
├── ai.ts                  # Génération de notifications IA
├── pricesNode.ts          # Récupération prix Binance
└── schema.ts              # Définition de la base de données
```

**Pourquoi cette organisation ?**

1. **Séparation claire des responsabilités** : Chaque module gère un domaine métier précis. Si je dois modifier la logique des notifications, je sais exactement où aller.

2. **Réutilisabilité** : Les helpers dans `lib/` (comme `buildPortfolioInsights`) sont utilisés par plusieurs modules sans duplication de code.

3. **Maintenabilité** : Quand le projet grandira, cette structure permettra d'ajouter facilement de nouveaux modules (ex: `modules/analytics/`) sans toucher au reste.

4. **Tests futurs** : Cette organisation facilitera l'écriture de tests unitaires ciblés par module.

**Détail technique important** : Les fichiers racine (`notifications.ts`, `prices.ts`) servent uniquement de "barrel exports" - ils réexportent les fonctions des modules pour préserver l'API publique existante. C'est une transition douce vers la modularité sans casser le code existant.

### Frontend - Architecture par features

Le frontend suit une **architecture feature-based** où chaque fonctionnalité est isolée dans son propre dossier.

**Structure actuelle :**
```
src/
├── features/
│   └── notifications/     # Feature notifications complète
│       ├── components/    # Composants spécifiques
│       └── hooks/         # Logique métier encapsulée
├── pages/                 # Pages de l'application
├── layout/                # Layout principal
└── components/ui/         # Composants UI réutilisables
```

**Pourquoi cette approche ?**

1. **Scalabilité** : Quand j'ajouterai une nouvelle feature (ex: "analytics"), je crée simplement `features/analytics/` avec ses composants et hooks. Pas besoin de modifier le reste.

2. **Encapsulation** : Le hook `useNotificationCenter` contient toute la logique des notifications (requêtes, mutations, calculs). Le composant `NotificationsCenter` ne fait que l'afficher. Si je dois changer la logique, je modifie uniquement le hook.

3. **Réutilisabilité** : Le hook peut être réutilisé ailleurs dans l'app si besoin, sans dupliquer de code.

4. **Lisibilité** : Le layout principal (`MainLayout`) reste simple - il orchestre les features sans logique métier complexe.

## 🎯 Choix de conception

### 1. Séparation actions/mutations (contrainte technique)

**Le problème** : Convex interdit les appels réseau (HTTP) dans les mutations. C'est une contrainte de la plateforme pour garantir la performance.

**Ma solution** : J'ai séparé clairement :
- **Mutations** : Opérations sur la base de données uniquement
- **Actions** : Appels externes (Binance API, OpenAI API)

**Flux concret** :
1. Une mutation met à jour le prix en DB
2. Elle détecte si une règle est franchie
3. Au lieu d'appeler OpenAI directement (impossible), elle programme une action via `ctx.scheduler.runAfter(0, ...)`
4. L'action s'exécute ensuite et peut faire l'appel OpenAI
5. L'action insère ensuite la notification via une mutation interne

**Pourquoi c'est important** : Cette séparation garantit que les mises à jour de prix ne sont jamais bloquées par un appel API lent. L'utilisateur voit ses prix à jour immédiatement, et les notifications arrivent quelques millisecondes après.

### 2. Helpers centralisés dans `lib/`

J'ai extrait la logique réutilisable dans `modules/lib/` :

- **`env.ts`** : Résout les variables d'environnement (Convex env → `process.env` fallback). Utile pour le dev local où les secrets ne sont pas toujours dans Convex.

- **`portfolio.ts`** : Calcule les insights du portefeuille (positions, allocations, valeurs). Utilisé à la fois par le dashboard et pour générer les notifications IA personnalisées.

- **`logger.ts`** : Système de logs structuré (pour l'instant basique, mais prêt à évoluer).

**Pourquoi ?** Évite la duplication. Si je dois changer la façon dont je calcule les allocations, je modifie un seul endroit.

### 3. Notifications IA asynchrones

**Le choix** : Les notifications IA sont générées de manière asynchrone après la mise à jour des prix.

**Pourquoi ?**
- Performance : L'utilisateur voit ses prix mis à jour instantanément
- Résilience : Si OpenAI est lent ou en erreur, ça n'impacte pas le reste
- Fallback : En cas d'échec, un message générique est affiché

**Détail technique** : J'utilise `ctx.scheduler.runAfter(0, ...)` pour exécuter l'action IA immédiatement mais de manière non-bloquante. Le délai 0 signifie "dès que possible" sans bloquer la mutation.

### 4. Pourquoi pas OpenRouter ?

J'ai volontairement choisi d'utiliser directement l'API OpenAI plutôt qu'OpenRouter pour deux raisons :

1. **Pas de nécessité** : OpenRouter est utile quand on veut tester plusieurs modèles ou avoir un fallback automatique. Dans mon cas, `gpt-4o-mini` répond parfaitement à mes besoins et je n'ai pas besoin de cette flexibilité.

2. **Simplicité** : Moins de dépendances, moins de configuration, moins de points de défaillance. L'API OpenAI est suffisamment fiable pour mon usage.

3. **Temps** : Configurer OpenRouter aurait pris du temps que j'ai préféré investir dans d'autres fonctionnalités.

Si besoin à l'avenir, la transition serait simple : modifier `ai.ts` pour utiliser OpenRouter au lieu de `createOpenAI`.

## 🚀 Installation et lancement

### Prérequis

- Node.js >= 18.x
- pnpm (recommandé)
- Compte Convex (gratuit)

### Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Initialiser Convex (première fois)
npx convex dev

# 3. Configurer la clé OpenAI
npx convex env set OPENAI_API_KEY sk-proj-...
```

### Configuration locale

Créez `.env.local` (généré automatiquement par Convex, mais vous pouvez l'éditer) :

```env
CONVEX_DEPLOYMENT=anonymous:anonymous-lucy-saas
VITE_CONVEX_URL=http://127.0.0.1:3210
OPENAI_API_KEY=sk-proj-...  # Optionnel si défini dans Convex
```

### Lancement

**Terminal 1 - Backend :**
```bash
npx convex dev
```

**Terminal 2 - Frontend :**
```bash
pnpm dev
```

L'app est accessible sur `http://localhost:5173`

### Charger des données d'exemple

Pour tester l'application avec des données de portefeuille, vous pouvez importer le fichier `sampleData.jsonl` :

```bash
npx convex import sampleData.jsonl --table portfolio
```

Ce fichier contient des positions d'exemple :
- 0.5 BTC (investi 1000€)
- 10 ETH (investi 2000€)
- 50 SOL (investi 3000€)

Ces données permettront de voir le dashboard avec des valeurs réelles et de tester les notifications IA personnalisées basées sur votre portefeuille.

## 📊 Comment ça marche

### Flux de mise à jour des prix

1. Un cron (toutes les 10s) déclenche `pricesNode.refreshFromBinance`
2. L'action Node.js récupère les prix depuis Binance
3. Pour chaque prix, elle appelle la mutation `prices.upsertPrice`
4. La mutation détecte si des règles sont franchies
5. Pour chaque règle franchie, elle programme une action IA
6. L'action IA génère un message personnalisé via OpenAI
7. La notification est insérée en base
8. Le frontend reçoit la mise à jour automatiquement (subscription Convex)

### Création d'une règle

1. L'utilisateur remplit le formulaire dans la page Rules
2. Appel de `api.rules.create`
3. Validation et insertion en base
4. Toast de confirmation
5. La liste se met à jour automatiquement (reactivité Convex)

## 🐛 Debugging

Les logs backend apparaissent dans le terminal où tourne `npx convex dev`. Vous verrez notamment :
- `[notifications] scheduling AI generation` : Quand une règle est franchie
- `[NOTIFICATIONS] AI ACTION DÉMARRÉE` : Début de génération IA
- Les erreurs OpenAI si elles surviennent

Pour vérifier les variables d'environnement :
```bash
npx convex env list
```

## 📝 Structure des données

- **`portfolio`** : Positions de l'utilisateur
- **`tokenPrices`** : Prix actuels des cryptos
- **`alertRules`** : Règles d'alerte définies par l'utilisateur
- **`notifications`** : Alertes générées avec messages IA
