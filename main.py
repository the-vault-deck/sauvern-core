import logging
logging.basicConfig(level=logging.DEBUG)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import creators, listings, index, checkout
import os

app = FastAPI(
    title="sauvern-core",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(creators.router)
app.include_router(index.router)
app.include_router(listings.router)
app.include_router(checkout.router, prefix="/checkout", tags=["checkout"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "sauvern-core"}

# Serve React SPA — must come after API routes
DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))
