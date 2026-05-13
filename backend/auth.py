import os
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def verify_token(token: str) -> dict:
    """
    Jalon 4b : accepte les fake tokens en mode development.
    ═══════════════════════════════════════════════════════
    JALON 7 — remplacer cette fonction par :
        decoded = firebase_admin.auth.verify_id_token(token)
        return { "uid": decoded["uid"], "fake": False }
    ═══════════════════════════════════════════════════════
    """
    env = os.getenv("ENV", "development")

    if env == "development" and token.startswith("fake-token-"):
        uid = token.replace("fake-token-", "")
        if not uid:
            raise HTTPException(status_code=401, detail="UID manquant dans le token fictif")
        logger.debug("Fake token accepté (dev) — uid: %s", uid)
        return {"uid": uid, "fake": True}

    # En production : uniquement Firebase (activé au jalon 7)
    raise HTTPException(status_code=401, detail="Token invalide")


# Alias maintenu pour ai_correction.py (jalon 3quater)
verify_firebase_token = verify_token
