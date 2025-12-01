from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import List
import os
from jose import JWTError, jwt
from ..database import get_session
from ..models import Feedback
from ..config import settings
from ..security import create_access_token, verify_password, get_password_hash # In real app, hash the config password

router = APIRouter(prefix="/admin", tags=["admin"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username != settings.ADMIN_USERNAME:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import List
import os
from jose import JWTError, jwt
from datetime import timedelta
from ..database import get_session
from ..models import Feedback
from ..config import settings
from ..security import create_access_token, verify_password, get_password_hash # In real app, hash the config password
from ..logger import get_logger

router = APIRouter(prefix="/admin", tags=["admin"])

logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username != settings.ADMIN_USERNAME:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Compare plain text password directly since it's stored as plain text in .env
    if form_data.username != settings.ADMIN_USERNAME or form_data.password != settings.ADMIN_PASSWORD:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    logger.info(f"Admin logged in: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

import base64
from ..models import Feedback, FeedbackRead

@router.get("/reports", response_model=List[FeedbackRead])
async def get_reports(
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_admin)
):
    try:
        feedbacks = session.exec(select(Feedback)).all()
        results = []
        for f in feedbacks:
            # Convert bytes to base64 string
            f_dict = f.model_dump()
            if f.photo_air:
                f_dict['photo_air'] = base64.b64encode(f.photo_air).decode('utf-8')
            if f.photo_washroom:
                f_dict['photo_washroom'] = base64.b64encode(f.photo_washroom).decode('utf-8')
            if f.photo_receipt:
                f_dict['photo_receipt'] = base64.b64encode(f.photo_receipt).decode('utf-8')
            results.append(FeedbackRead(**f_dict))
        return results
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail="Error fetching reports")

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_admin)
):
    try:
        feedback = session.get(Feedback, feedback_id)
        if not feedback:
            logger.warning(f"Attempt to delete non-existent feedback: {feedback_id}")
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Images are stored in DB, so they will be deleted with the record


        session.delete(feedback)
        session.commit()
        logger.info(f"Feedback deleted: {feedback_id}")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting feedback {feedback_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting feedback")

@router.patch("/feedback/{feedback_id}/status")
async def update_feedback_status(
    feedback_id: int,
    status_update: dict,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_admin)
):
    try:
        feedback = session.get(Feedback, feedback_id)
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        # Lock if already resolved
        if feedback.status == "resolved":
             raise HTTPException(status_code=400, detail="Cannot update resolved feedback")

        new_status = status_update.get("status")
        if new_status not in ["pending", "resolved"]:
             raise HTTPException(status_code=400, detail="Invalid status")

        feedback.status = new_status
        session.add(feedback)
        session.commit()
        session.refresh(feedback)
        logger.info(f"Feedback {feedback_id} status updated to {new_status}")
        return feedback
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating feedback status {feedback_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating feedback status")
