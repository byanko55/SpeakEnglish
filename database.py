from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from secret import DB_USER, DB_PASSWORD

SQLALCHEMY_DATABASE_URL = "postgresql://%s:%s@localhost/sentencedb"%(DB_USER, DB_PASSWORD)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()