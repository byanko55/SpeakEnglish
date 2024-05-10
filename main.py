from fastapi import Depends, FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

import time
import random

import crud, models, schemas
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

QA = None

# Dependency
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def random_question(db: Session = Depends(get_db)):
    global QA

    random.seed(time.time())
    cnt = crud.get_counts(db)

    rint = int(cnt * random.random())
    return crud.get_item(db, n=rint)


@app.get("/", response_class=HTMLResponse)
async def index(request:Request, db: Session = Depends(get_db)):
    global QA

    cnt = crud.get_counts(db)
    QA = random_question(db)
    
    return templates.TemplateResponse("index.html", {
        "request":request, 
        "counts":cnt, 
        "question":QA.translated,
        "question_id":QA.id + 1
    })


@app.get("/reveal")
def get_answer():
    global QA

    return [{'answer': QA.original}]


@app.get("/next")
def get_nextQA(db: Session = Depends(get_db)):
    global QA

    QA = random_question(db)

    return [{'question_id': QA.id + 1, 'question': QA.translated}]


@app.get("/count")
def get_count(keyword:str = '', db: Session = Depends(get_db)):
    cnt = crud.get_counts(db)

    return [{'count': cnt}]


@app.get("/search")
def get_records(page:int = 1, keyword:str = '', db: Session = Depends(get_db)):
    """
    if keyword != '':
        cnt = crud.get_counts_by_keyword(db, keyword)
        
        return 0
    """ 
    items = crud.get_items(db, skip=(page-1)*15, limit=15)
        
    return items


@app.post("/create", response_model=schemas.Item)
def create_records(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db=db, item=item)

"""
@app.get("/item/", response_model=list[schemas.Item])
def read_items(n: int = 4, db: Session = Depends(get_db)):
    items = crud.get_item(db, n=n)
    return items


@app.get("/items/", response_model=list[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_items(db, skip=skip, limit=limit)
    return items
"""

@app.exception_handler(404)
async def non_exist_page(request, __):
    return templates.TemplateResponse("404.html", {"request": request})