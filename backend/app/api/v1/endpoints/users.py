from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import settings, get_password_hash
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate

router = APIRouter()


def _clean_email(email: str) -> str:
    return (email or "").strip().lower()


def _clean_name(name: str) -> str:
    # Evita nome vazio com espaços
    name = (name or "").strip()
    return name


def _clean_password(password: str) -> str:
    # Remove espaços acidentais (muito comum em copy/paste)
    return (password or "").strip()


def _bcrypt_validate(password: str) -> None:
    # Bcrypt limita em 72 bytes (não caracteres). Se passar disso, o passlib pode explodir.
    # Melhor retornar 422 e orientar.
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password too long for bcrypt (max 72 bytes). Use a shorter password.",
        )


def get_current_user(request: Request, db: Session = Depends(deps.get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    raw_token = token.split(" ", 1)[1]

    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        try:
            user_id = UUID(str(sub))
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    email = _clean_email(user_in.email)
    name = _clean_name(user_in.name)
    password = _clean_password(user_in.password)

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name is required.",
        )

    if not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is required.",
        )

    _bcrypt_validate(password)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    try:
        password_hash = get_password_hash(password)
    except ValueError as e:
        # Aqui cai exatamente aquele erro do bcrypt (72 bytes) e quaisquer ValueError do backend
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception:
        # Evita 500 “mudo” e ajuda debug sem vazar stacktrace pro cliente
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to hash password.",
        )

    user_obj = User(
        email=email,
        password_hash=password_hash,
        name=name,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user.
    """
    return current_user