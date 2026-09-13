from datetime import datetime
from app.core.database import mongo_db

async def log_audit(action: str, user_id: str, business_profile_id: str, entity_type: str, entity_id: str, details: dict):
    if mongo_db is not None:
        collection = mongo_db["audit_logs"]
        log_entry = {
            "action": action,
            "user_id": str(user_id),
            "business_profile_id": str(business_profile_id),
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "details": details,
            "timestamp": datetime.utcnow()
        }
        await collection.insert_one(log_entry)
