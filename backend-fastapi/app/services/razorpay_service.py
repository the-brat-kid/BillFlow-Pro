import razorpay
from app.core.config import settings

def get_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_order(amount: float, receipt: str):
    client = get_client()
    if not client:
        return {"id": "mock_order_id", "amount": int(amount * 100), "currency": "INR"}
    
    data = {
        "amount": int(amount * 100),
        "currency": "INR",
        "receipt": receipt
    }
    return client.order.create(data=data)

def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    client = get_client()
    if not client:
        return True # Mock success
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except Exception:
        return False
