class Config:
    SECRET_KEY = 'your-secret-key'  # Change this!
    SQLALCHEMY_DATABASE_URI = 'postgresql://midoassran:direwolf@localhost/bakedinsights'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-key'  # Change this!

    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'noreply@bakedinsights.com'
    MAIL_PASSWORD = 'vbol ampq axbs eqyz'
