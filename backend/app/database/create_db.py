from app.database.database import Base, engine

# Import all models
from app.models.user import User
from app.models.memory import Memory

print("Creating database...")

Base.metadata.create_all(bind=engine)

print("Database created successfully!")