from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .database import create_db_and_tables
from .routers import feedback, admin, whatsapp
from .tasks import start_scheduler
from .logger import get_logger

logger = get_logger(__name__)

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"},
    )

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    start_scheduler()
    logger.info("Application started")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(feedback.router)
app.include_router(admin.router)
app.include_router(whatsapp.router)

# Serve frontend files
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")