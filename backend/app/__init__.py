# Loaded here so that .env is read before any module reads os.getenv at import
# time (database.py and auth.py both do).
from dotenv import load_dotenv

load_dotenv()
