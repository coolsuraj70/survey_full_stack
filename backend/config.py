from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    MAIL_TO: str
    
    REPORT_INTERVAL_MINUTES: int = 1440 # Default to 24 hours if not set

    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    ENABLE_WHATSAPP: bool = False

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
