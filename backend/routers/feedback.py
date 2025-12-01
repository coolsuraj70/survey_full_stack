from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
import uuid
from sqlmodel import Session
from typing import Optional
from ..database import get_session
from ..models import Feedback
from ..whatsapp import send_whatsapp_message # Import utility
from ..tasks import send_immediate_negative_report

router = APIRouter(prefix="/feedback", tags=["feedback"])

from ..logger import get_logger

logger = get_logger(__name__)

from ..models import FeedbackRead

@router.post("/", response_model=FeedbackRead)
async def submit_feedback(
    background_tasks: BackgroundTasks,
    phone: str = Form(...),
    is_testimonial: bool = Form(False),
    rating_air: Optional[int] = Form(None),
    rating_washroom: Optional[int] = Form(None),
    comment: str = Form(""),
    terms_accepted: bool = Form(...),
    photo_air: Optional[UploadFile] = File(None),
    photo_washroom: Optional[UploadFile] = File(None),
    photo_receipt: Optional[UploadFile] = File(None),
    ro_number: Optional[str] = Form(None),
    source_id: Optional[str] = Form(None), # Backward compatibility
    session: Session = Depends(get_session)
):
    try:
        # Validation: Terms and Conditions
        if not terms_accepted:
            raise HTTPException(status_code=400, detail="Terms and Conditions must be accepted")

        # Validation: At least one rating required
        if rating_air is None and rating_washroom is None:
            raise HTTPException(status_code=400, detail="At least one rating (Air or Washroom) is required")

        # Validation: Phone Number (Basic Length/Digit Check)
        # Allow +, spaces, dashes, but ensure at least 10 digits
        import re
        clean_phone = re.sub(r'\D', '', phone)
        if len(clean_phone) < 10 or len(clean_phone) > 15:
             raise HTTPException(status_code=400, detail="Invalid phone number format")

        # Read file bytes
        photo_air_bytes = await photo_air.read() if photo_air else None
        photo_washroom_bytes = await photo_washroom.read() if photo_washroom else None
        photo_receipt_bytes = await photo_receipt.read() if photo_receipt else None

        feedback = Feedback(
            phone=phone,
            is_testimonial=is_testimonial,
            rating_air=rating_air,
            rating_washroom=rating_washroom,
            comment=comment,
            terms_accepted=terms_accepted,
            ro_number=ro_number or source_id, # Use source_id if ro_number is missing
            feedback_method="web",
            session_id=str(uuid.uuid4()),
            photo_air=photo_air_bytes,
            photo_washroom=photo_washroom_bytes,
            photo_receipt=photo_receipt_bytes
        )
        session.add(feedback)
        session.commit()
        session.refresh(feedback)
        logger.info(f"New feedback received from {phone}")
        
        # Trigger WhatsApp Message
        message = "Thank you for your feedback! We appreciate your time."
        background_tasks.add_task(send_whatsapp_message, phone, message)

        # Trigger Immediate Email if Negative Feedback
        if rating_air == 1 or rating_washroom == 1:
            background_tasks.add_task(send_immediate_negative_report, feedback.id)
        
        # Return response without raw bytes to avoid serialization errors
        from ..models import FeedbackRead
        return FeedbackRead(
            id=feedback.id,
            phone=feedback.phone,
            is_testimonial=feedback.is_testimonial,
            rating_air=feedback.rating_air,
            rating_washroom=feedback.rating_washroom,
            comment=feedback.comment,
            terms_accepted=feedback.terms_accepted,
            ro_number=feedback.ro_number,
            status=feedback.status,
            feedback_method=feedback.feedback_method,
            session_id=feedback.session_id,
            created_at=feedback.created_at,
            photo_air=None, # Do not return raw bytes
            photo_washroom=None,
            photo_receipt=None
        )
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        with open("error_log.txt", "w") as f:
            f.write(str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

from fastapi.responses import Response

@router.get("/{feedback_id}/image/{image_type}")
async def get_feedback_image(
    feedback_id: int, 
    image_type: str, 
    session: Session = Depends(get_session)
):
    feedback = session.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    image_data = None
    if image_type == "air":
        image_data = feedback.photo_air
    elif image_type == "washroom":
        image_data = feedback.photo_washroom
    elif image_type == "receipt":
        image_data = feedback.photo_receipt
    
    if not image_data:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Defaulting to image/jpeg, browsers usually sniff content type correctly anyway
    return Response(content=image_data, media_type="image/jpeg")
