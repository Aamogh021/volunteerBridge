"""Gemini AI service for survey extraction, embeddings, and crisis reporting."""

import base64
import json
import logging
from io import BytesIO
from typing import Dict, List

import google.generativeai as genai
from PIL import Image

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = (
    "You are an AI assistant for NGO volunteer coordination. "
    "Extract community needs from the provided survey image or text. "
    "Return ONLY valid JSON with these exact fields: "
    "need_type (string), urgency_score (integer 1-10 where 10 is most urgent), "
    "required_skills (array of strings), gps_zone (string), "
    "volunteer_hours_needed (number), confidence_score (float 0-1 representing "
    "your confidence in the extraction), raw_extracted_text (string). "
    "If any field cannot be determined, use reasonable defaults. "
    "urgency_score must reflect genuine urgency - medical emergencies are 9-10, "
    "food/water needs are 7-8, general support is 4-6."
)

CRISIS_REPORT_PROMPT = (
    "You are a crisis coordinator AI. Analyze these active community needs "
    "and generate a situation report. Return ONLY valid JSON with: "
    "zone (most affected area), total_needs (count), critical_needs "
    "(count with urgency >= 8), skill_gaps (list of skills needed but "
    "undersupplied), recommended_actions (list of 3 specific actionable steps), "
    "predicted_escalation (one sentence prediction)"
)


def _parse_json_response(text: str) -> Dict:
    """Extract JSON from a Gemini response, handling markdown code fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        start_idx = 1
        end_idx = len(lines) - 1
        for i, line in enumerate(lines):
            if line.strip().startswith("```") and i > 0:
                end_idx = i
                break
        cleaned = "\n".join(lines[start_idx:end_idx])
    return json.loads(cleaned)


def extract_need_from_image(image_base64: str) -> Dict:
    """Extract community need data from a survey image using Gemini Vision.

    Args:
        image_base64: Base64-encoded image string.

    Returns:
        Dictionary containing extracted need fields.
    """
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_bytes))

    model = genai.GenerativeModel("gemini-3.6-flash")
    response = model.generate_content(
        [EXTRACTION_SYSTEM_PROMPT, image],
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )

    try:
        result = _parse_json_response(response.text)
    except (json.JSONDecodeError, IndexError) as exc:
        logger.error("Failed to parse Gemini image response: %s", exc)
        result = {
            "need_type": "Unknown",
            "urgency_score": 5,
            "required_skills": ["General Support"],
            "gps_zone": "Unknown Zone",
            "volunteer_hours_needed": 4.0,
            "confidence_score": 0.3,
            "raw_extracted_text": response.text,
        }

    return result


def extract_need_from_text(text: str) -> Dict:
    """Extract community need data from text input using Gemini.

    Args:
        text: Raw survey text or need description.

    Returns:
        Dictionary containing extracted need fields.
    """
    model = genai.GenerativeModel("gemini-3.6-flash")
    prompt = f"{EXTRACTION_SYSTEM_PROMPT}\n\nSurvey text:\n{text}"

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )

    try:
        result = _parse_json_response(response.text)
    except (json.JSONDecodeError, IndexError) as exc:
        logger.error("Failed to parse Gemini text response: %s", exc)
        result = {
            "need_type": "Unknown",
            "urgency_score": 5,
            "required_skills": ["General Support"],
            "gps_zone": "Unknown Zone",
            "volunteer_hours_needed": 4.0,
            "confidence_score": 0.3,
            "raw_extracted_text": text,
        }

    return result


def generate_crisis_report(needs: List[Dict]) -> Dict:
    """Generate an AI crisis situation report from active community needs.

    Args:
        needs: List of active need dictionaries.

    Returns:
        Dictionary with crisis report fields.
    """
    model = genai.GenerativeModel("gemini-3.6-flash")
    needs_json = json.dumps(needs, indent=2, default=str)
    prompt = f"{CRISIS_REPORT_PROMPT}\n\nActive needs data:\n{needs_json}"

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=2048,
            ),
        )
        result = _parse_json_response(response.text)
    except Exception as exc:
        logger.error("Failed to generate/parse Gemini crisis report: %s", exc)
        result = {
            "zone": "Unknown",
            "total_needs": len(needs),
            "critical_needs": sum(1 for n in needs if n.get("urgency_score", 0) >= 8),
            "skill_gaps": [],
            "recommended_actions": [
                "Review incoming survey data manually",
                "Deploy available volunteers to highest urgency areas",
                "Contact regional coordinators for status update",
            ],
            "predicted_escalation": "Unable to generate automated prediction. Manual review recommended.",
        }

    return result


def generate_embeddings(text: str) -> List[float]:
    """Generate embedding vector for text using Gemini embedding model.

    Args:
        text: Input text to embed.

    Returns:
        List of floats representing the embedding vector.
    """
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]
