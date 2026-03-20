import logging
logging.basicConfig(level=logging.DEBUG)

from fastapi import FastAPI
from routers import creators, listings, index, checkout

app = FastAPI(
    title="sauvern-core",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(creators.router, prefix="/api")
app.include_router(index.router, prefix="/api")   # must be registered before listings — avoids /listings/index shadowing
app.include_router(listings.router, prefix="/api")
app.include_router(checkout.router, prefix="/api/checkout", tags=["checkout"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "sauvern-core"}
