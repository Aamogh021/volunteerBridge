"""Firebase Cloud Messaging service for push notifications."""

import logging
from typing import Dict

from firebase_admin import messaging

logger = logging.getLogger(__name__)


def send_task_notification(fcm_token: str, need: Dict, match_score: float) -> bool:
    """Send a push notification to a volunteer about a matched task.

    Args:
        fcm_token: The volunteer's FCM registration token.
        need: Dictionary containing need details (need_type, urgency_score, id).
        match_score: The volunteer's match score as a float 0-1.

    Returns:
        True if the notification was sent successfully, False otherwise.
    """
    need_type = need.get("need_type", "Community Need")
    urgency_score = str(need.get("urgency_score", 5))
    need_id = need.get("id", "unknown")

    message = messaging.Message(
        notification=messaging.Notification(
            title=f"Urgent: {need_type} Needed",
            body=f"You are top match ({match_score:.0%}). Tap to accept.",
        ),
        data={
            "need_id": need_id,
            "urgency_score": urgency_score,
            "need_type": need_type,
        },
        token=fcm_token,
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id="volunteer_tasks",
                priority="high",
                default_sound=True,
            ),
        ),
        apns=messaging.APNSConfig(
            headers={"apns-priority": "10"},
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=f"Urgent: {need_type} Needed",
                        body=f"You are top match ({match_score:.0%}). Tap to accept.",
                    ),
                    badge=1,
                    sound="default",
                ),
            ),
        ),
    )

    try:
        response = messaging.send(message)
        logger.info("FCM notification sent successfully: %s", response)
        return True
    except messaging.UnregisteredError:
        logger.warning("FCM token is no longer valid for token: %s...", fcm_token[:20])
        return False
    except Exception as exc:
        logger.error("Failed to send FCM notification: %s", exc)
        return False
