# Prompt — Jalon 4b — Backend progression complet

## Contexte

Application éducative React (Vite + Tailwind) + backend FastAPI.
Jalons 0 à 4 terminés — les fake users fonctionnent,
la progression est en localStorage.

On branche maintenant **toute la progression sur le backend**
avec le fake user comme cobaye réel.
La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

**Backend FastAPI :**
- Toutes les tables SQLite : users, user_progress, user_exercise_history,
  user_xp, user_skill_scores, user_badges, user_trophies, user_streaks,
  user_event_history, ia_calls
- Tous les endpoints de progression, XP, skills, badges, streak, événements
- Auth temporaire : accepte les fake tokens (`fake-token-{uid}`) en mode `ENV=development`

**Frontend React :**
- `progressService.js` : sync backend en fire and forget
  (localStorage reste la source de vérité, backend reçoit tout en arrière-plan)
- `scoreService.js` : transmet les skills au backend
- `SplashScreen` : appel `checkStreak` au démarrage

---

## Règle absolue

**Le backend n'est jamais bloquant pour l'UI.**
`backendPost` attrape toutes les erreurs silencieusement.
Si le backend est injoignable, l'app fonctionne normalement
avec localStorage seul.

**Commentaires JALON 7 dans le code.**
Dans `auth.py` et `progressService.js`, ajouter des commentaires
explicites indiquant ce qui sera remplacé au jalon 7
(Firebase Admin SDK pour le token, vrai uid Firebase).

---

## Vérification finale

Après implémentation, vérifier manuellement :
1. Lancer le backend : `uvicorn main:app --reload`
2. Ouvrir l'app React, se connecter en tant que "Léo"
3. Compléter un exercice
4. Ouvrir `parcours.db` avec DBeaver ou DB Browser
5. Vérifier que les lignes existent dans :
   - `user_exercise_history`
   - `user_skill_scores`
   - `user_xp`
   - `user_progress`
   - `user_streaks`

Si les 5 tables ont des données → jalon 4b validé.

Voir la spec en pièce jointe pour tous les détails.
