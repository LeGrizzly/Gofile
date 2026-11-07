# @LeGrizzly/gofile ☁️📤

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24.0.0-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Biome](https://img.shields.io/badge/Code_Quality-Biome-60A5FA?style=flat-square&logo=biome)](https://biomejs.dev/)

`@LeGrizzly/gofile` est un client TypeScript modulaire, robuste et sans dépendances superflues pour interagir avec l'API REST de l'hébergeur [Gofile.io](https://gofile.io). Il prend en charge l'upload de gros fichiers en streaming multipart, le suivi de progression en temps réel, la gestion d'arborescences de dossiers et l'obtention de liens directs.

---

## ⚡ Fonctionnalités Clés

- **Upload Multipart & Streaming** : Téléversement direct depuis un `Buffer` ou un `ReadableStream` Node.js vers les serveurs Gofile.
- **Résolution Dynamique du Meilleur Serveur** : Requête automatique du serveur d'upload optimal (`getServer()`) avant chaque transfert.
- **Suivi d'Avancement Réactif** : Émission d'événements (`progress`, `complete`, `error`) via `UploadProgressHandler` et `EventEmitter`.
- **Gestion Complète de Contenu (`ContentService`)** : Création de répertoires distants, organisation de dossiers, suppression et modification des options de partage (mots de passe, expiration, tags).
- **Zéro Dépendance Runtime** : Utilise nativement les APIs web standard (`fetch`, `FormData`, `crypto`) intégrées à Node.js 24+.
- **Typage Strict** : Modélisation complète des réponses Gofile et des paramètres d'upload.

---

## 📦 Installation

```bash
npm install @LeGrizzly/gofile
```

---

## 💡 Exemples d'Utilisation

### 1. Upload Simple d'un Fichier

```typescript
import { GofileAPI } from "@LeGrizzly/gofile";
import { readFile } from "node:fs/promises";

const api = new GofileAPI({
    token: "votre_token_compte_gofile_optionnel",
});

// Lecture du fichier sur disque
const fileBuffer = await readFile("./archive_album.zip");

// Upload vers Gofile
const result = await api.uploadFile(fileBuffer, "archive_album.zip");

if (result.success) {
    console.log("Fichier téléversé avec succès !");
    console.log("Page de téléchargement :", result.downloadPage);
    console.log("Identifiant du fichier :", result.fileId);
} else {
    console.error("Échec du téléversement :", result.error);
}
```

### 2. Upload avec Suivi de Progression en Temps Réel

```typescript
import { GofileAPI } from "@LeGrizzly/gofile";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

const api = new GofileAPI({ token: "votre_token_gofile" });

const filePath = "./grosses_discographie.zip";
const fileStats = await stat(filePath);

// Utilisation du gestionnaire de progression
const progressHandler = api.createProgressHandler();

progressHandler.on("progress", (data) => {
    console.log(`Progression : ${data.percentage.toFixed(2)}% (${data.transferredBytes} / ${data.totalBytes} octets)`);
});

progressHandler.on("complete", (result) => {
    console.log("Téléversement terminé :", result.downloadPage);
});

// Exécution de l'upload avec le handler attaché
await api.uploadWithProgress(filePath, {
    fileName: "grosses_discographie.zip",
    folderId: "mon_folder_id_optionnel",
    progressHandler,
});
```

### 3. Création et Organisation de Dossiers

```typescript
import { GofileAPI } from "@LeGrizzly/gofile";

const api = new GofileAPI({ token: "votre_token_gofile" });

// Création d'un dossier racine
const folder = await api.createFolder({
    parentFolderId: "root",
    folderName: "Discographie Freeze Corleone",
});

console.log("Dossier créé avec succès :", folder.id);

// Définition d'un mot de passe ou d'une description sur le dossier
await api.setFolderOption(folder.id, "description", "Albums haute fidélité");
```

---

## 🏗️ Architecture Interne

Le package suit les principes de Clean Architecture et de séparation des responsabilités :

```
Gofile/src
├── services/
│   ├── FileUploadService.ts       # Logique d'envoi multipart & négociation serveur
│   ├── ContentService.ts          # Opérations sur les dossiers et fichiers distants
│   ├── AuthenticationService.ts   # Validation de tokens et gestion de sessions
│   └── UploadProgressHandler.ts   # Calculs d'octets et émission d'événements
├── repositories/
│   └── GofileRepository.ts        # Passerelle HTTP vers les endpoints API Gofile
├── interfaces/
│   └── IGofileRepository.ts       # Contrat d'abstraction pour l'inversion de dépendance
└── utils/
    ├── EventEmitter.ts            # Gestionnaire d'événements typé léger
    └── TypeGuards.ts              # Prédicats de validation runtime des réponses
```

---

## 🛠️ Scripts & Développement

```bash
npm run build         # Compilation TypeScript vers dist/
npm run copy          # Copie des fichiers utilitaires
npm run build:copy    # Build complet avec copie
npm run typecheck     # Contrôle de typage strict
npm run lint          # Contrôle Biome
npm run lint:fix      # Correction automatique Biome
npm test              # Exécution des tests unitaires
```

---

## 📄 Licence

Développé par **LeGrizzly** — Licence ISC.
