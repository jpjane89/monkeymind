from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, ForeignKey
from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.orm import sessionmaker, relationship, backref, scoped_session

engine = create_engine("sqlite:///monkeymind.db", echo=False)
db = scoped_session(sessionmaker(bind=engine, autocommit = False, autoflush = False))

Base = declarative_base()
Base.query = db.query_property()

### Class declarations go here

#edit to login with Rdio
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key= True)
    # rdio_name =
    # rdio_id = 
    email = Column(String(64), nullable= True)
    password = Column(String(64), nullable=True)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key= True)
    # datetime = Column(Date, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    playlist = Column(String(120), nullable= True)
    baseline_blink = Column(Integer, nullable=True)
    baseline_change = Column(Integer, nullable=True)
    end_blink = Column(Integer, nullable=True)
    end_change = Column(Integer, nullable=True)
    total_blink = Column(Integer, nullable=True)
    total_change = Column(Integer, nullable=True)
    total_time = Column(Integer, nullable=True)

    user = relationship("User", backref=backref("sessions",order_by=id))

### End class declarations

def main():
    pass

if __name__ == "__main__":
    main()