from typing import Any
from app.repositories import forms as forms_repository

async def list_forms(db_name: str) -> list[dict[str, Any]]:
    return await forms_repository.list_forms(db_name)

async def create_form(db_name: str, data: dict[str, Any]) -> dict[str, Any]:
    return await forms_repository.create_form(db_name, data)

async def update_form(db_name: str, form_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await forms_repository.update_form(db_name, form_id, data)

async def delete_form(db_name: str, form_id: str) -> bool:
    return await forms_repository.delete_form(db_name, form_id)
