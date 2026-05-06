import os
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    import firebase_admin
    if not firebase_admin._apps:
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if creds_path:
            from firebase_admin import credentials
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred)
        else:
            # Tente l'initialisation avec les credentials par défaut (GCP)
            firebase_admin.initialize_app()
    _firebase_initialized = True


def verify_firebase_token(token: str) -> dict:
    # Bypass pour le développement local — ne jamais activer en production
    if os.getenv("SKIP_FIREBASE_AUTH", "false").lower() == "true":
        logger.warning("SKIP_FIREBASE_AUTH=true — auth Firebase désactivée (dev uniquement)")
        return {"uid": f"dev-user"}

    try:
        _init_firebase()
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token Firebase invalide")
