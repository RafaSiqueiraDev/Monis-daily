import logging

from app.core.config import settings

logger = logging.getLogger("monis_daily.email")


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """
    Stub de envio de email. Sem provedor SMTP configurado, isto apenas
    regista a mensagem nos logs do backend (visíveis no dashboard do Render).

    Para ligar a um provedor real (ex. Resend, SendGrid, AWS SES), substitui
    o corpo desta função por uma chamada HTTP/SDK ao provedor escolhido —
    nenhum outro ficheiro do projeto precisa de mudar.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    logger.warning(
        "EMAIL NÃO ENVIADO (sem provedor configurado). "
        "Link de reset para %s: %s",
        to_email,
        reset_link,
    )
