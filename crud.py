from sqlalchemy.orm import Session

import models, schemas


def get_item(db: Session, n: int = 0):
    return db.query(models.Item).get(n)


def get_items(db: Session, skip: int = 0, limit: int = 15):
    return db.query(models.Item).offset(skip).limit(limit).all()


def get_items_by_keyword(db: Session, keyword: str, limit: int = 15):
    return db.query(models.Item).filter(models.Item.translated.contains(keyword)).limit(limit).all()


def get_counts(db: Session):
    return db.query(models.Item).count()


def get_counts_by_keyword(db: Session, keyword: str):
    return db.query(models.Item).filter(models.Item.translated.contains(keyword)).count()


def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item