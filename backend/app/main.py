from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

# 👇 IMPORTA TODOS OS MODELS PARA REGISTRAR NO SQLAlchemy (evita erro de relationship por string)
from app.db import base  # noqa: F401

app = FastAPI(title="FinanAppDeep API", openapi_url="/api/v1/openapi.json")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to FinanAppDeep API"}