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


def random_question(db: Session):
    global QA

    random.seed(time.time())
    cnt = crud.get_counts(db)

    rint = int(cnt * random.random())
    QA = crud.get_item(db, n=rint)

    print(type(QA))


@app.get("/", response_class=HTMLResponse)
async def index(request:Request, db: Session = Depends(get_db)):
    global QA

    cnt = crud.get_counts(db)
    random_question(db)
    
    return templates.TemplateResponse("index.html", {
        "request":request, 
        "counts":cnt, 
        "question":QA.translated,
        "question_id":QA.id
    })


@app.get("/reveal")
def get_answer():
    global QA

    return [{'answer': QA.original}]


@app.get("/item/", response_model=list[schemas.Item])
def read_items(n: int = 4, db: Session = Depends(get_db)):
    items = crud.get_item(db, n=n)
    return items


@app.get("/items/", response_model=list[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_items(db, skip=skip, limit=limit)
    return items


@app.exception_handler(404)
async def non_exist_page(request, __):
    return templates.TemplateResponse("404.html", {"request": request})