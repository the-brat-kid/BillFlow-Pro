import os
import ssl
import logging
import asyncio
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("billflow.email")

# --- Gmail / generic SMTP config ---------------------------------------
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
# YAHAN DEFAULT PORT 587 KIYA HAI (Kyunki ye 465 se jyada reliable hai)
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME or "onboarding@resend.dev")

# --- Resend config (used only if SMTP isn't configured) -----------------
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
resend.api_key = RESEND_API_KEY

# Values left as placeholders in .env.example / .env.production.example --
# treat these as "not actually configured" so we don't try to use them.
_PLACEHOLDER_MARKERS = ("CHANGE_ME", "your-", "re_egzWwiZF")


def _is_configured(value: str) -> bool:
    if not value:
        return False
    return not any(marker in value for marker in _PLACEHOLDER_MARKERS)


SMTP_CONFIGURED = _is_configured(MAIL_USERNAME) and _is_configured(MAIL_PASSWORD)
RESEND_CONFIGURED = _is_configured(RESEND_API_KEY)


class EmailSendError(Exception):
    """Raised when the invoice email genuinely fails to send."""


def _build_html(invoice_number: str, amount: float) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <p style="font-size: 15px;">Dear Customer,</p>
        <p style="font-size: 15px;">Thank you for your purchase. Please find attached invoice
        <strong>#{invoice_number}</strong> for <strong>&#8377;{amount:,.2f}</strong>.</p>
        <p style="font-size: 15px;">If you have any questions about this invoice, just reply to this email.</p>
        <p style="font-size: 15px; margin-top: 24px;">Thanks for your business!</p>
    </div>
    """


def _send_via_gmail_smtp(email_to: str, invoice_number: str, amount: float, pdf_bytes: bytes = None) -> None:
    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"Your Invoice {invoice_number}"
    msg["From"] = MAIL_FROM
    msg["To"] = email_to
    msg.attach(MIMEText(_build_html(invoice_number, amount), "html"))

    if pdf_bytes:
        part = MIMEApplication(pdf_bytes, Name=f"{invoice_number}.pdf")
        part["Content-Disposition"] = f'attachment; filename="{invoice_number}.pdf"'
        msg.attach(part)

    def attempt_send(port, use_ssl):
        context = ssl.create_default_context()
        if use_ssl:
            with smtplib.SMTP_SSL(MAIL_SERVER, port, context=context, timeout=20) as server:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, [email_to], msg.as_string())
        else:
            with smtplib.SMTP(MAIL_SERVER, port, timeout=20) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, [email_to], msg.as_string())

    try:
        # First attempt with configured port
        attempt_send(MAIL_PORT, MAIL_PORT == 465)
        
    except ssl.SSLError as exc:
        # AUTOMATIC FALLBACK: Agar 465 pe EOF error aata hai, toh seamlessly Port 587 try karega
        if "UNEXPECTED_EOF_WHILE_READING" in str(exc) and MAIL_PORT == 465:
            logger.warning("Port 465 failed with SSL EOF. Auto-falling back to port 587 (STARTTLS)...")
            try:
                attempt_send(587, False)
            except Exception as fallback_exc:
                logger.error("Fallback to port 587 also failed: %s", fallback_exc)
                raise EmailSendError(str(fallback_exc)) from fallback_exc
        else:
            raise EmailSendError(str(exc)) from exc
            
    except smtplib.SMTPAuthenticationError as exc:
        logger.error("Gmail SMTP auth failed for %s: %s", MAIL_USERNAME, exc)
        raise EmailSendError(
            "Gmail rejected the login. Make sure MAIL_PASSWORD is a 16-character "
            "App Password (myaccount.google.com/apppasswords), not your normal Gmail password."
        ) from exc
    except Exception as exc:
        logger.error("Gmail SMTP send failed for invoice %s -> %s: %s", invoice_number, email_to, exc)
        raise EmailSendError(str(exc)) from exc

    logger.info("Invoice email sent via Gmail SMTP: invoice=%s to=%s", invoice_number, email_to)


def _send_via_resend(email_to: str, invoice_number: str, amount: float, pdf_bytes: bytes = None) -> None:
    payload = {
        "from": MAIL_FROM,
        "to": email_to,
        "subject": f"Your Invoice {invoice_number}",
        "html": _build_html(invoice_number, amount),
    }
    if pdf_bytes:
        payload["attachments"] = [{
            "filename": f"{invoice_number}.pdf",
            "content": base64.b64encode(pdf_bytes).decode("utf-8"),
        }]

    try:
        result = resend.Emails.send(payload)
    except Exception as exc:
        logger.error("Resend send failed for invoice %s -> %s: %s", invoice_number, email_to, exc)
        raise EmailSendError(str(exc)) from exc

    if isinstance(result, dict) and result.get("id"):
        logger.info("Invoice email sent via Resend: invoice=%s to=%s id=%s", invoice_number, email_to, result["id"])
    else:
        logger.warning("Resend returned an unexpected response for invoice %s: %r", invoice_number, result)


def _send_sync(email_to: str, invoice_number: str, amount: float, pdf_bytes: bytes = None) -> None:
    # Prefer Gmail SMTP (matches the credentials already in .env), fall
    # back to Resend if SMTP isn't configured.
    if SMTP_CONFIGURED:
        _send_via_gmail_smtp(email_to, invoice_number, amount, pdf_bytes)
        return
    if RESEND_CONFIGURED:
        _send_via_resend(email_to, invoice_number, amount, pdf_bytes)
        return

    raise EmailSendError(
        "No email provider is configured. Set MAIL_USERNAME + MAIL_PASSWORD (Gmail App "
        "Password) in .env, or set a real RESEND_API_KEY."
    )


async def send_invoice_email(email_to: str, invoice_number: str, amount: float, pdf_bytes: bytes = None) -> None:
    """
    Send an invoice email. Raises EmailSendError on any failure so callers
    can record/report the real status instead of always reporting success.
    """
    await asyncio.to_thread(_send_sync, email_to, invoice_number, amount, pdf_bytes)


async def send_invoice_email_background(email_to: str, invoice_number: str, amount: float, pdf_bytes: bytes = None) -> None:
    """
    Safe wrapper for use with FastAPI BackgroundTasks. BackgroundTasks run
    after the response is sent, so a raised exception here cannot be
    returned to the client -- it must be logged loudly instead, or it
    disappears and looks like the email "did nothing".
    """
    try:
        await send_invoice_email(email_to, invoice_number, amount, pdf_bytes)
    except EmailSendError as exc:
        logger.error("Background invoice email failed for %s (invoice %s): %s", email_to, invoice_number, exc)