# This sets the schema for the MonkeyMind database

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, ForeignKey
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.orm import sessionmaker, relationship, backref, scoped_session

engine = create_engine("sqlite:///monkeymind.db", echo=False)
db = scoped_session(sessionmaker(bind=engine, autocommit = False, autoflush = False))

Base = declarative_base()
Base.query = db.query_property()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key= True)
    rdio_id = Column(String(64), nullable= True)
    first_name = Column(String(64), nullable=True)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key= True)
    datetime = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    playlist = Column(String(120), nullable= True)
    median_integral = Column(Float, nullable=True)
    total_pauses = Column(Integer, nullable=True)
    total_time = Column(Integer, nullable=True)

    user = relationship("User", backref=backref("sessions",order_by=id))

def main():
    pass

if __name__ == "__main__":
    main()