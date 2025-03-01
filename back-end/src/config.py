class Config:
    SECRET_KEY = 'your-secret-key'  # Change this!
    SQLALCHEMY_DATABASE_URI = 'postgresql://hegazy:direwolf@localhost/bakedinsights'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-key'  # Change this!
