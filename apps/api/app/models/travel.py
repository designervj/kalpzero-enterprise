from datetime import date
from typing import Optional, Any
from app.models.base import TimestampDocument


class TravelPackage(TimestampDocument):
    code: str
    slug: str
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
    package_id: str
    day_number: int
    title: str
    summary: str
    hotel_ref_id: Optional[str] = None
    activity_ref_ids: list[str] = []
    transfer_ref_ids: list[str] = []

    class Settings:
        name = "travel_itinerary_days"


class TravelDeparture(TimestampDocument):
    package_id: str
    departure_date: date
    return_date: date
    seats_total: int
    seats_available: int
    price_override_minor: Optional[int] = None
    status: str = "scheduled"

    class Settings:
        name = "travel_departures"


class TravelLead(TimestampDocument):
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
