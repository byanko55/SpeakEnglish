from fastapi import Depends, FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from google.cloud import texttospeech
from google.oauth2 import service_account

import io
import csv
import time
import random
import base64
import pandas as pd

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
    
    if cnt == 0 : # fill the table with basic data
        print('fill the table with basic data!!')
        
        with open('sentences.csv', 'r') as f:
            rdr = csv.reader(f)
            
            for i, line in enumerate(rdr):
                crud.create_item(db=db, item=schemas.ItemCreate(
                    translated=line[0],
                    original=line[1]
                ))
                
        cnt = crud.get_counts(db)
    
    QA = random_question(db)
    
    return templates.TemplateResponse("index.html", {
        "request":request, 
        "counts":cnt, 
        "question":QA.translated,
        "question_id":QA.id
    })


@app.get("/reveal")
def get_answer():
    global QA

    return {'answer': QA.original}


@app.get("/next")
def get_nextQA(db: Session = Depends(get_db)):
    global QA

    QA = random_question(db)

    return {'question_id': QA.id, 'question': QA.translated}


@app.get("/play")
def play_answer(text: str):
    credentials = service_account.Credentials.from_service_account_file('credential.json')

    client = texttospeech.TextToSpeechClient(credentials=credentials)

    utter_msg = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=utter_msg, voice=voice, audio_config=audio_config
    )
    
    return {'raw': base64.b64encode(response.audio_content).decode('utf-8')}


@app.get("/count")
def get_count(keyword:str = '', db: Session = Depends(get_db)):
    cnt = crud.get_counts(db, keyword)

    return {'count': cnt}


@app.get("/search")
def get_records(page:int = 1, keyword:str = '', db: Session = Depends(get_db)):
    items = crud.get_items(db, keyword, skip=(page-1)*15, limit=15)
        
    return items


@app.post("/create", response_model=schemas.Item)
def create_records(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db=db, item=item)


@app.delete("/delete", response_model=schemas.Item)
def delete_record(item: schemas.ItemDelete, db: Session = Depends(get_db)):
    return crud.delete_item(db=db, item=item)


@app.put("/edit", response_model=schemas.Item)
def update_record(item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    return crud.update_item(db=db, item=item)


@app.get("/export")
def download_records(db: Session = Depends(get_db)):
    items = crud.get_items(db, '', skip=0, limit=999999)
    
    df = pd.DataFrame(
        data=[(d.id, d.original, d.translated) for d in items], 
        columns=['id', 'original', 'translated']
    )
        
    stream = io.StringIO()
    df.to_csv(stream, index = False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    
    response.headers["Content-Disposition"] = "attachment;filename=English.csv"
    
    print(response)
    
    return response

@app.exception_handler(404)
async def non_exist_page(request, __):
    return templates.TemplateResponse("404.html", {"request": request})