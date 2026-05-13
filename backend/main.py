from pathlib import Path
from dotenv import load_dotenv

# Charger le .env depuis le répertoire du fichier, pas depuis le répertoire de lancement
load_dotenv(Path(__file__).parent / ".env")

import gzip
import logging
import os
import shutil
from logging.handlers import RotatingFileHandler
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import ai_correction, progress

# ── Handler de rotation avec compression gzip (aucune suppression) ────────────

class GzipRotatingFileHandler(RotatingFileHandler):
    """Compresse le fichier archivé en .gz au lieu de le supprimer."""

    def doRollover(self):
        if self.stream:
            self.stream.close()
            self.stream = None

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        gz_path = f"{self.baseFilename}.{timestamp}.log.gz"

        with open(self.baseFilename, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

        open(self.baseFilename, "w").close()

        if not self.delay:
            self.stream = self._open()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Parcours Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_correction.router)
app.include_router(progress.router)


@app.on_event("startup")
async def configure_file_logging():
    """
    Ajout du handler fichier APRÈS le démarrage d'uvicorn,
    pour ne pas être écrasé par sa propre configuration de logging.
    """
    log_dir = Path(os.getenv("LOG_DIR", "logs"))
    log_dir.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler = GzipRotatingFileHandler(
        log_dir / "backend.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=0,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    # Ajoute le handler au root logger + loggers uvicorn
    for name in (None, "uvicorn", "uvicorn.access", "uvicorn.error", "backend"):
        logging.getLogger(name).addHandler(file_handler)

    logging.getLogger(__name__).info("Logging fichier initialisé → %s", log_dir / "backend.log")


@app.get("/health")
async def health():
    return {"status": "ok"}
