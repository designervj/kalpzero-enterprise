from datetime import date
from typing import Optional, Any
from beanie import Indexed
from app.models.base import TimestampDocument


class TravelPackage(TimestampDocument):
    tenant_id: Indexed(str)
    code: Indexed(str)
    slug: Indexed(str)
    title: str
    summary: Optional[str] = None
    origin_city: str
    destination_city: str
    destination_country: str
    duration_days: int
    base_price_minor: int
    currency: str = "INR"
    status: str = "active"

    class Settings:
        name = "travel_packages"


class TravelItineraryDay(TimestampDocument):
    tenant_id: Indexed(str)
    package_id: Indexed(str)
    day_number: int
    title: str
    summary: str
    hotel_ref_id: Optional[str] = None
    activity_ref_ids: list[str] = []
    transfer_ref_ids: list[str] = []

    class Settings:
        name = "travel_itinerary_days"


class TravelDeparture(TimestampDocument):
    tenant_id: Indexed(str)
    package_id: Indexed(str)
    departure_date: date
    return_date: date
    seats_total: int
    seats_available: int
    price_override_minor: Optional[int] = None
    status: str = "scheduled"

    class Settings:
        name = "travel_departures"


class TravelLead(TimestampDocument):
    tenant_id: Indexed(str)
    source: str
    interested_package_id: Optional[str] = None
    departure_id: Optional[str] = None
    customer_id: Optional[str] = None
    contact_name: str
    contact_phone: str
    travelers_count: int = 1
    desired_departure_date: Optional[date] = None
    budget_minor: Optional[int] = None
    currency: str = "INR"
    status: str = "new"
    notes: Optional[str] = None

    class Settings:
        name = "travel_leads"


TRAVEL_MODELS = [
    TravelPackage,
    TravelItineraryDay,
    TravelDeparture,
    TravelLead,
]
