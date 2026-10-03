# Budget App (Vue 3 + Vite)

Application mobile de gestion de budget, dettes, objectifs et cash-flow.
Thème sombre, pensée mobile-first.

## Lancer en développement

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 (mets la fenêtre en format mobile / responsive).

## Fonctionnalités

- **Tableau de bord** : projection de solde fin de mois, revenus/dépenses/épargne/reste à vivre, échéances à venir (7 j)
- **Calendrier de cash-flow** dynamique avec dépenses **récurrentes** et paiements **fractionnés (3x/4x)** affichant l'échéance en cours
- **Budget** par catégorie (dépenses réelles calculées automatiquement) + **création/édition de catégories** (icône, couleur, budget)
- **Objectifs d'épargne** : calcul du reste, de la date d'atteinte et du nombre de mois ; contributions
- **Statistiques** : donut des dépenses par catégorie, barres 6 mois, épargne cumulée
- **Banque** : catégorisation automatique des transactions + détection d'abonnements convertibles en récurrent
- **Icônes Lucide** partout, **thème clair/sombre**, montants en **euros (fr-FR)**
- **Persistance** locale automatique (localStorage) — rien ne se perd au rechargement

## Structure

```
src/
  views/         Écrans
    DashboardView.vue Tableau de bord (accueil)
    CalendarView.vue  Calendrier de cash-flow (récurrences, fractionnés, projection)
    BudgetView.vue    Budget + gestion des catégories
    GoalsView.vue     Objectifs d'épargne
    StatsView.vue     Graphiques
    DebtView.vue      Dettes (cartes, dettes, IOUs)
    BankView.vue      Connexion bancaire
    SettingsView.vue  Réglages (thème, solde, revenu)
  components/     TopBar, BottomNav, AddSheet, BottomSheet, IconPicker,
                  AppIcon, DonutChart, BarChart
  composables/    useTheme.js, useAddSheet.js
  stores/         finance.js (Pinia — modèle + moteur de récurrences/objectifs)
  services/       bank.js (Open Banking / GoCardless + catégorisation)
  utils/          format.js (euros/dates), date.js (récurrences), icons.js
  router/         routes
```

## Serveur unifié (front + back)

`server/index.js` (Express) sert à la fois l'app compilée (`dist/`) **et** l'API
bancaire, sur un seul port. Deux modes automatiques :

- **DÉMO** (par défaut) : sans clés API, l'API renvoie des données fictives.
- **RÉEL** : dès que `GOCARDLESS_SECRET_ID` et `GOCARDLESS_SECRET_KEY` sont
  définis, l'API interroge GoCardless (Société Générale).

Lancer en local, comme en prod :

```bash
npm run build      # génère dist/ (le front appelle /api)
npm start          # sert front + API sur http://localhost:3000
```

## Connecter Société Générale (vraies données)

La connexion directe à SG est **impossible sans agrégateur agréé DSP2**.
L'app est câblée pour **GoCardless Bank Account Data** (gratuit, supporte SG).

1. Crée un compte : https://bankaccountdata.gocardless.com
2. Récupère `SECRET_ID` et `SECRET_KEY`
3. Renseigne-les comme variables d'environnement (voir Dokploy ci-dessous).
   Aucun changement de code : le serveur bascule seul en mode réel.

## Déploiement Docker / Dokploy

Le [Dockerfile](Dockerfile) construit une image unique (front + back).

```bash
docker build -t budget-app .
docker run --rm -p 3000:3000 budget-app   # http://localhost:3000
```

### Sur Dokploy
1. Pousse le code sur un dépôt git (GitHub/GitLab).
2. **Create → Application**, connecte le dépôt.
3. **Build Type** : `Dockerfile`.
4. **Port** : `3000`.
5. **Volumes** (⚠️ indispensable pour ne pas perdre la BDD à chaque déploiement) :
   monte un volume sur **`/data`** (ex. `budget-data` → `/data`).
6. **Environment** :
   ```
   # Connexion par email (SANS ça, le code n'est visible que dans les logs)
   SMTP_HOST=smtp.exemple.fr
   SMTP_PORT=587
   SMTP_USER=xxx
   SMTP_PASS=xxx
   SMTP_FROM=Budget <no-reply@theo-birost.fr>

   # Vraie banque (optionnel)
   GOCARDLESS_SECRET_ID=xxx
   GOCARDLESS_SECRET_KEY=xxx
   ```
7. **Domains** : ajoute ton domaine + SSL, puis **Deploy**.

> Le SMTP est **requis en prod** : sans lui, le code de connexion s'affiche
> seulement dans les logs du serveur (pratique en dev, inutilisable en ligne).

### Configurer l'email avec Gmail (le plus rapide)
1. Active la **validation en 2 étapes** : https://myaccount.google.com/security
2. Crée un **mot de passe d'application** : https://myaccount.google.com/apppasswords
   (nomme-le « Budget », copie le code de 16 caractères **sans les espaces**).
3. Renseigne les variables (voir `.env.example`) :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tbirost@gmail.com
   SMTP_PASS=<mot de passe d'application>
   SMTP_FROM=Budget <tbirost@gmail.com>
   ```

Test en local :
```bash
cp .env.example .env      # puis colle le mot de passe d'application
npm run build && node --env-file=.env server/index.js
```

> Alternatives « propres » si tu dépasses les limites Gmail (~500/j) : **Brevo**
> (300 mails/j gratuits), **Resend**, **Mailgun**. Même principe : ils te
> donnent un `SMTP_HOST/USER/PASS` à mettre dans ces mêmes variables.

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `PORT` | Port du serveur | `3000` |
| `DATA_DIR` | Dossier de la base SQLite | `/data` (Docker) |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Envoi des codes par email | — (mode logs) |
| `GOCARDLESS_SECRET_ID/KEY` | Vraie connexion bancaire | — (mode démo) |

## Prochaines étapes possibles
- Notifications push (service worker)
- Calendrier éditable (ajout/édition d'une dépense en cliquant un jour)
- Objectifs auto-suggérés & règle enveloppe 50/30/20
