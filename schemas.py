from pydantic import BaseModel


class ItemBase(BaseModel):
    translated: str
    original: str


class ItemCreate(ItemBase):
    pass


class ItemDelete(BaseModel):
    id: int


class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True