# Mon journal de gratitude

Un journal de gratitude simple, mobile-first, entièrement en HTML, CSS et JavaScript vanilla.

## Ce que fait l’application

- accueil personnalisé au premier lancement avec demande du prénom
- journal quotidien de gratitude en local sur le navigateur
- prompts inspirants qui changent selon la date
- sélection d’humeur avec une échelle de positif à négatif
- section de rappel des choses pour lesquelles on est reconnaissant
- historique des entrées avec modification et suppression
- compteur de série d’entrées consécutives
- stockage local via localStorage pour fonctionner sur mobile sans backend
- support d’ajout à l’écran d’accueil sur iPhone / Android

## Structure du projet

- `index.html` : structure de la page
- `styles.css` : design mobile-first et mise en page
- `script.js` : logique du journal, prompts, humeurs et localStorage

## Utilisation

1. Ouvrir `index.html` dans un navigateur, ou
2. lancer un petit serveur local comme :

```bash
python -m http.server 5500
```

Puis ouvrir :

```text
http://localhost:5500/
```

## Fonctionnement

- La première ouverture demande le prénom de la personne.
- Le nom est enregistré dans le navigateur pour éviter de redemander à chaque ouverture.
- Les prompts changent à chaque nouvelle journée ou actualisation de page.
- Les données sont enregistrées localement dans le navigateur, ce qui les rend accessibles sans compte ni base de données.

## Remarques

Cette application est pensée pour un usage personnel sur mobile. Elle n’utilise pas de backend ni de synchronisation cloud.
