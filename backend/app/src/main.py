import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import init_db
from routes import router

app = FastAPI(
    title="Kawe API",
    description="Serves API endpoints for the kawe platform.",
    version="1.0.0",
)

# Enable CORS for local cross-origin requests if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
os.makedirs("data/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="data/static"), name="static")

# Include api routes
app.include_router(router)

# Initialize database tables on module load
init_db()


# Startup and Shutdown events
@app.get("/startup")
def startup_event():
    env = os.getenv("DEBUG", False)
    if env:
        return {"message": "Environ working."}
    return {"message": "Environ not working."}
