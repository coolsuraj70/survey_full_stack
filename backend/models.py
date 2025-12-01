from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str
    is_testimonial: bool = False
    rating_air: Optional[int] = None
    rating_washroom: Optional[int] = None
    comment: Optional[str] = None
    photo_air: Optional[bytes] = None
    photo_washroom: Optional[bytes] = None
    photo_receipt: Optional[bytes] = None
    terms_accepted: bool = False
    ro_number: Optional[str] = None
    status: str = Field(default="pending")
    feedback_method: str = Field(default="web") # web or whatsapp
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WhatsAppState(SQLModel, table=True):
    phone: str = Field(primary_key=True)
    state: str = Field(default="GREETING")
    temp_data: str = Field(default="{}") # JSON string
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FeedbackRead(SQLModel):
    id: Optional[int]
    phone: str
    is_testimonial: bool
    rating_air: Optional[int]
    rating_washroom: Optional[int]
    comment: Optional[str]
    photo_air: Optional[str] = None
    photo_washroom: Optional[str] = None
    photo_receipt: Optional[str] = None
    terms_accepted: bool
    ro_number: Optional[str]
    status: str
    feedback_method: str
    session_id: Optional[str]
    created_at: datetime
