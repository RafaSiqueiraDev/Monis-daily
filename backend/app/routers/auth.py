from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    get_current_user,
)
from app.core.config import settings
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserRead,
    Token,
    UserCountriesUpdate,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Autenticacao"])

VALID_COUNTRY_CODES = {"PT", "BR"}


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    if user_in.invite_code != settings.REGISTRATION_INVITE_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Código de convite inválido. Esta aplicação está em beta fechado.",
        )

    normalized_email = user_in.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Este email já está registado")

    new_user = User(
        name=user_in.name.strip(),
        email=normalized_email,
        password_hash=hash_password(user_in.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(func.lower(User.email) ==
                           form_data.username.strip().lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou password incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/countries", response_model=UserRead)
async def update_active_countries(
    payload: UserCountriesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cleaned = [c for c in dict.fromkeys(
        payload.active_countries) if c in VALID_COUNTRY_CODES]
    if not cleaned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Seleciona pelo menos um país válido.")

    current_user.active_countries = cleaned
    # Qualquer submissão deste endpoint (mesmo "só um país") conclui o onboarding.
    current_user.onboarding_completed = True
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    user = result.scalar_one_or_none()

    debug_token = None
    if user is not None:
        reset_token = create_password_reset_token(str(user.id))
        await send_password_reset_email(user.email, reset_token)
        if settings.ENVIRONMENT == "development":
            debug_token = reset_token

    return ForgotPasswordResponse(
        message="Se existir uma conta com esse email, vais receber instruções de recuperação em breve.",
        debug_token=debug_token,
    )


@router.post("/reset-password", response_model=UserRead)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_id_str = decode_password_reset_token(payload.token)
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Token inválido ou expirado.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Utilizador não encontrado.")

    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(user)
    return user
