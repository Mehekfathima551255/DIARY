from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import hash_password, verify_password


def get_user_by_email(db: Session, email: str):
    """
    Returns a user if the email exists.
    Otherwise returns None.
    """
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, name: str, email: str, password: str):
    """
    Creates a new user after hashing the password.
    """

    hashed_password = hash_password(password)

    new_user = User(
        name=name,
        email=email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email: str, password: str):
    """
    Checks if the email exists and verifies the password.
    Returns the user if authentication succeeds.
    Otherwise returns None.
    """

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user