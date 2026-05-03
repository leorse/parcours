# Prompt — Jalon 3quater — Correction IA

## Contexte

Application éducative React (Vite + Tailwind) + backend FastAPI.
Jalons 0 à 3ter terminés — tous les exercices fonctionnent,
les tests unitaires passent, le build est protégé.

On implémente le dernier type d'exercice : **le texte libre corrigé par IA**.
La spec technique complète est en pièce jointe.

---

## Ce qu'on fait

**Backend FastAPI :**
- Nouveau endpoint `POST /api/ai/correct`
- Appel à `https://api.1min.ai/api/chat-with-ai` (non-streaming)
- Prompt système + utilisateur structurés et précis
- Log complet dans une table `ia_calls` (prompt, réponse, métadonnées 1min.ai)
- Gestion du flag `inappropriate`

**Frontend React :**
- `FreeTextExercise.jsx` — implémentation complète (textarea, compteur mots, loading)
- Appel au backend avec le token Firebase
- Affichage du feedback IA dans `ExerciseResult` (points réussis, à améliorer)

---

## Points critiques

**Le prompt doit être le plus précis possible.**
L'IA ne réfléchit pas — elle compare la réponse aux critères fournis dans le YAML.
Le contexte (`ai_correction.context`) contient exactement ce qui est attendu,
y compris les éléments visuels si c'est une image (les personnes présentes, les monuments...).

**La clé API 1min.ai ne sort jamais du backend.**
`ONEMIN_API_KEY` est dans le `.env` backend uniquement.
Le frontend envoie le token Firebase, pas la clé IA.

**Nettoyer la réponse IA avant JSON.parse.**
Malgré la consigne, l'IA peut ajouter des balises ```json.
Toujours nettoyer avant de parser.

**Timeout 30s sur l'appel httpx.**
Un modèle léger répond en 1-2s, mais prévoir le pire.

---

## Variables d'environnement à créer

Backend `.env` :
```
ONEMIN_API_KEY=<clé 1min.ai>
AI_MODEL=gpt-4o-mini
```

Frontend `.env.local` (dev, ne pas committer) :
```
VITE_BACKEND_URL=http://localhost:8000
```

Frontend `.env` (prod) :
```
VITE_BACKEND_URL=https://ton-domaine.cloudflare.com
```

---

## Livrable attendu

1. `POST /api/ai/correct` répond avec `{ score, feedback, points_reussis, a_ameliorer, flag, xp_earned }`
2. Chaque appel est loggé dans `ia_calls` avec tous les champs métadonnées 1min.ai
3. L'exercice free_text est jouable dans le navigateur
4. Le compteur de mots s'affiche en temps réel
5. Le message "Correction en cours..." s'affiche pendant l'appel
6. Un texte offensant retourne `flag: "inappropriate"` et `score: 0`
7. `npm run build` passe (tests unitaires free_text inclus)

Voir la spec en pièce jointe pour tous les détails.
