import os

# Os testes desta pasta são offline: não tocam na base de dados nem na rede.
# A Settings exige DATABASE_URL, por isso damos um valor fictício antes de
# qualquer import da app (setdefault: um .env/ambiente real tem prioridade).
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
os.environ.setdefault("ENVIRONMENT", "test")
