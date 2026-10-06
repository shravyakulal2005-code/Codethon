"""Study Availability schemas."""

from pydantic import BaseModel, ConfigDict, Field


class AvailabilitySlot(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0=Monday, 1=Tuesday, ..., 6=Sunday")
    start_time: str = Field(description="Format HH:MM e.g. '18:00'")
    end_time: str = Field(description="Format HH:MM e.g. '21:00'")
    available_minutes: int = Field(default=180, ge=15)


class AvailabilityBatchCreate(BaseModel):
    slots: list[AvailabilitySlot]


class AvailabilityRead(AvailabilitySlot):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
