from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification_schema import NotificationResponse

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    seen_messages = set()
    unique_notifs = []
    to_delete = []
    for n in notifications:
        if n.message in seen_messages:
            to_delete.append(n.id)
        else:
            seen_messages.add(n.message)
            unique_notifs.append(n)

    if to_delete:
        db.query(Notification).filter(Notification.id.in_(to_delete)).delete(synchronize_session=False)
        db.commit()

    return unique_notifs

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/", response_model=NotificationResponse)
def create_notification(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    # Deduplicate: if an identical message exists for this user, reuse it instead of creating duplicates
    existing = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.message == message
    ).order_by(Notification.created_at.desc()).first()

    if existing:
        existing.is_read = False
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    notification = Notification(user_id=current_user.id, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification



@router.delete("/read", status_code=204)
def clear_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == True
    ).delete()
    db.commit()
