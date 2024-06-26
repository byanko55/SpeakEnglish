from sqlalchemy.orm import Session
from sqlalchemy import or_

import models, schemas


def get_item(db: Session, n: int = 0):
    return db.query(models.Item).get(n)


def get_items(db: Session, keyword: str = '', skip: int = 0, limit: int = 15):
    records = db.query(models.Item)
    
    if keyword != '':
        records = records.filter(or_(
            models.Item.translated.contains(keyword),
            models.Item.original.contains(keyword)
        ))
    
    records = records.order_by(models.Item.id).offset(skip).limit(limit).all()
    
    return records


def get_counts(db: Session, keyword: str = ''):
    records = db.query(models.Item)
    
    if keyword != '':
        records = records.filter(models.Item.translated.contains(keyword))
    
    return records.count()


def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item


def delete_item(db: Session, item: schemas.ItemDelete):
    db_item = db.query(models.Item).filter(models.Item.id == item.id).first()
    db.delete(db_item)
    db.commit()
    
    return db_item


def update_item(db: Session, item: schemas.ItemUpdate):
    db_item = db.query(models.Item).filter(models.Item.id == item.id).first()
    
    if item.is_question :
        db_item.translated = item.new_content
    else :
        db_item.original = item.new_content
        
    db.commit()
    
    return db_item