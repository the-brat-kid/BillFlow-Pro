from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BillFlow Pro API"
    API_V1_STR: str = "/api/v1"
    # No hardcoded default on purpose: a fallback secret baked into source
    # code means anyone with the code can forge valid JWTs against any
    # deployment that forgets to set this. Set SECRET_KEY in your .env /
    # environment -- the app will fail to start if it's missing.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # DB Config
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "billflow"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "billflow_audit"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://vatsaai.com",
        "https://www.vatsaai.com",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
