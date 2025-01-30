# 🚀 Gestion des Absences des Employés

Ce projet permet de gérer les absences des employés d'une entreprise. Il est construit avec **React** pour le front-end et **Firebase** pour l'authentification des utilisateurs. L'application propose un système de connexion et de tableau de bord protégé, où les utilisateurs peuvent consulter les informations relatives aux absences. De plus, **la technologie RFID** est utilisée pour la gestion des présences des employés.

## Fonctionnalités 🎯

- **Page de connexion** 🔑 : Permet aux utilisateurs de se connecter avec leur email et mot de passe.
- **Tableau de bord** 📊 : Accès aux informations des employés et de leurs absences.
- **Route protégée** 🔒 : Seul un utilisateur authentifié peut accéder au tableau de bord.
- **Firebase Authentication** 🔥 : Utilisation de Firebase pour gérer l'authentification des utilisateurs.
- **RFID** 📡 : Utilisation de la technologie RFID pour enregistrer les présences des employés.

## Prérequis ⚙️

Avant de pouvoir exécuter ce projet, assurez-vous d'avoir installé les outils suivants :

- [Node.js](https://nodejs.org/) (version 14 ou supérieure)
- [Firebase](https://firebase.google.com/) (pour l'authentification)
- **Lecteur RFID** 📇 : Pour la gestion des présences via RFID.

## Installation 🛠️

1. Clonez le dépôt du projet :

   ```bash
   git clone https://github.com/ton-utilisateur/gestion-absences.git
2. Accédez au répertoire du projet :
    ```bash
    cd gestion-absences
3. Installez les dépendances :
        ```bash
    npm install
4. Configurez Firebase :
    Ajoutez les informations de votre projet Firebase dans le fichier firebase.js sous le répertoire src :
    apiKey
    authDomain
    projectId
    storageBucket
    messagingSenderId
    appId
5. Démarrez l'application :
    ```bash
    npm run dev

 

# rfid_syst
