from pydantic import BaseModel


class ItemBase(BaseModel):
    translated: str
    original: str


class ItemCreate(ItemBase):
    pass


class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True