import logging
logging.basicConfig(level=logging.DEBUG)

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import creators, listings, index, checkout, submissions, admin

app = FastAPI(
    title="sauvern-core",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(creators.router, prefix="/api")
app.include_router(index.router, prefix="/api")       # before listings — avoids /listings/index shadowing
app.include_router(listings.router, prefix="/api")
app.include_router(checkout.router, prefix="/api/checkout", tags=["checkout"])
app.include_router(submissions.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "service": "sauvern-core"}

# Static files + SPA catch-all — must come after all API routes
DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa_catchall(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))
