from fastapi import FastAPI
from database import engine, Base
from routers import creators, listings, index

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="sauvern-core",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(creators.router)
app.include_router(index.router)   # must be registered before listings — avoids /listings/index shadowing
app.include_router(listings.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "sauvern-core"}
