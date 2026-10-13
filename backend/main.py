from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base

# Import all models so Base.metadata.create_all() creates all tables
from models.user import User
from models.elder import Elder
from models.caretaker import Caretaker
from models.booking import Booking
from models.review import Review
from models.sos import SOSAlert
from models.notification import Notification

# Import all routers
from routes.auth import router as auth_router
from routes.elder import router as elder_router
from routes.caretaker import router as caretaker_router
from routes.booking import router as booking_router
from routes.review import router as review_router
from routes.sos import router as sos_router
from routes.notification import router as notification_router
from routes.admin import router as admin_router
from routes.ai import router as ai_router

app = FastAPI(
    title="CareNest API",
    description="AI Powered Elder Care Platform",
    version="1.0.0"
)

# Robust CORS middleware configuration for local development & browser clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://localhost",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all missing database tables safely
Base.metadata.create_all(bind=engine)

# Include API Routers
app.include_router(auth_router)
app.include_router(elder_router)
app.include_router(caretaker_router)
app.include_router(booking_router)
app.include_router(review_router)
app.include_router(sos_router)
app.include_router(notification_router)
app.include_router(admin_router)
app.include_router(ai_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to CareNest Backend 🚀",
        "status": "Backend is running successfully",
        "version": "1.0.0",
        "docs": "/docs"
    }