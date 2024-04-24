from sqlalchemy import Column, Integer, String

from database import Base


class Item(Base):
    __tablename__ = "sentencetable"

    id = Column(Integer, primary_key=True)
    translated = Column(String, nullable=False)
    original = Column(String, nullable=False)