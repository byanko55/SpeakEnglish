from pydantic import BaseModel


class ItemBase(BaseModel):
    translated: str
    original: str


class ItemCreate(ItemBase):
    pass
    

class ItemDelete(BaseModel):
    id: int


class ItemUpdate(BaseModel):
    id: int
    new_content: str
    is_question: bool
    

class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True