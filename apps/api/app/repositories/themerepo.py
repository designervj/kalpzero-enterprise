from datetime import UTC, datetime
from typing import Any
from bson import ObjectId
from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database
from app.utlis.utlis import serialize_mongo
from pymongo import ReturnDocument


async def get_theme(db_name: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["business_blueprints"].find({}).sort("createdAt", -1)
    docs = await cursor.to_list(length=1)
    res = [serialize_mongo(doc) for doc in docs]
    return res[0]


async def update_theme(db_name: str, id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    updatedAt = datetime.now(tz=UTC)
    data_dict = data.model_dump()
    result = await db["business_blueprints"].find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": {
            "payload.public_theme": data_dict, 
            "updatedAt": updatedAt
        }},
        return_document=ReturnDocument.AFTER
    )


    serialised = serialize_mongo(result)
    return serialised
