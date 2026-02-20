# 🌐 OmniService TG — Application Mobile

> **Appelez, on s'en charge**

Application mobile-first pour OmniService TG, entreprise togolaise de services multisectoriels.

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE_USERNAME/omniservice-tg.git
cd omniservice-tg

# 2. Installer les dépendances
npm install

# 3. Démarrer en développement
npm run dev

# 4. Build pour production
npm run build
```

---

## 📁 Structure des fichiers

```
src/
├── assets/
│   └── logo.png                  # Logo OmniService TG
├── components/
│   ├── TopNav.jsx                 # Barre supérieure (logo, recherche, panier, profil)
│   └── BottomNav.jsx              # Navigation bas (Accueil / Services / Commandes / À propos)
├── firebase/
│   └── config.js                  # Configuration Firebase / Firestore
├── pages/
│   ├── HomePage.jsx               # 🏠 Accueil (pub défilante, services prioritaires)
│   ├── ServicesPage.jsx           # 🛠 Services + formulaires individuels
│   ├── OrdersPage.jsx             # 📦 Suivi des commandes client
│   ├── AboutPage.jsx              # ℹ️ À propos
│   ├── ProfilePage.jsx            # 👤 Profil utilisateur
│   └── AdminPage.jsx              # 🔐 Interface admin (accès via /admin)
├── App.jsx                        # Routage principal
├── main.jsx                       # Point d'entrée React
└── index.css                      # Styles globaux + variables CSS
```

---

## 📱 Pages & Fonctionnalités

### 🏠 Accueil
- **Slider publicitaire** auto-défilant (4 slides, 4s/slide)
- **Bande défilante** avec les valeurs de l'entreprise
- **7 services prioritaires** en grille (avec badges "bientôt disponible")
- Section "Pourquoi nous choisir" avec icônes
- Call-to-action final

### 🛠 Services
7 services avec formulaires dédiés :
- 🥘 Alimentation & Produits locaux
- 🍽️ Restauration
- 🚚 Livraison & Courses
- 🔧 Maintenance Technique *(dès le 16 Mars)*
- 👗 Prêt-à-porter
- 🧹 Entretien & Nettoyage
- 🛡️ Gardiennage & Sécurité *(dès le 7 Avril)*

Chaque formulaire envoie les données dans **Firestore** (`collection: commandes`).

### 📦 Commandes
- Recherche par numéro de téléphone
- Affichage des commandes et leur statut
- Barre de progression visuelle

### 👤 Profil
- Sauvegarde nom & téléphone (localStorage)
- Liens vers notifications, confidentialité, aide

### 🔐 Admin
- Accès via `/admin`
- Mot de passe : `omni2026admin` *(à changer en production !)*
- Tableau de bord avec statistiques
- Filtres par statut
- Mise à jour du statut des commandes en temps réel

---

## 🔥 Firebase / Firestore

### Collection `commandes`
```js
{
  service: "food",                    // ID du service
  serviceLabel: "Alimentation & ...", // Nom complet
  // Champs du formulaire (variables selon le service)
  phone: "+228 XX XX XX XX",
  adresse: "...",
  statut: "En attente",               // Géré par l'admin
  createdAt: Timestamp
}
```

### Règles Firestore recommandées
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /commandes/{doc} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if false; // Admin via SDK uniquement
    }
  }
}
```

---

## 🎨 Design

- **Couleurs** : `#1A1A2E` (bleu nuit) + `#E94560` (rouge vif) + `#F5A623` (or)
- **Polices** : Nunito (titres) + Poppins (texte)
- **Style** : Mobile-first, inspiré de Gozem

---

## 📦 Déploiement

### GitHub Pages
```bash
npm install gh-pages --save-dev
# Ajouter dans package.json : "homepage": "https://username.github.io/omniservice-tg"
npm run build
npx gh-pages -d dist
```

### Firebase Hosting (recommandé)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🔑 Sécurité (production)
- [ ] Changer le mot de passe admin dans `AdminPage.jsx`
- [ ] Implémenter Firebase Authentication pour l'admin
- [ ] Configurer les règles Firestore
- [ ] Ajouter les variables d'environnement (`.env`)
