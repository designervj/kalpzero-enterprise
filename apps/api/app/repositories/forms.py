from datetime import UTC, datetime
from typing import Any
from bson import ObjectId
from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database

def _map_id(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    return doc

async def list_forms(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["forms"].find({}).sort("createdAt", -1)
    docs = await cursor.to_list(length=1000)
    return [_map_id(doc) for doc in docs]

async def get_form(db_name: str, form_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    try:
        oid = ObjectId(form_id)
        doc = await db["forms"].find_one({"_id": oid})
    except Exception:
        doc = await db["forms"].find_one({"_id": form_id})
    return _map_id(doc)

async def create_form(db_name: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    data["createdAt"] = datetime.now(tz=UTC)
    data["updatedAt"] = datetime.now(tz=UTC)
    result = await db["forms"].insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

async def update_form(db_name: str, form_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    data["updatedAt"] = datetime.now(tz=UTC)
    
    # Strip id fields from update data
    data.pop("id", None)
    data.pop("_id", None)
    
    try:
        oid = ObjectId(form_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": form_id}
        
    result = await db["forms"].find_one_and_update(
        query,
        {"$set": data},
        return_document=True
    )
    return _map_id(result)

async def delete_form(db_name: str, form_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    try:
        oid = ObjectId(form_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": form_id}
    result = await db["forms"].delete_one(query)
    return result.deleted_count > 0
