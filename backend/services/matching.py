"""Volunteer-to-need matching engine with multi-factor scoring."""

import math
from typing import Dict, List

import numpy as np


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors.

    Args:
        vec1: First embedding vector.
        vec2: Second embedding vector.

    Returns:
        Cosine similarity score between 0 and 1.
    """
    a = np.array(vec1, dtype=np.float64)
    b = np.array(vec2, dtype=np.float64)
    dot_product = np.dot(a, b)
    magnitude_a = np.linalg.norm(a)
    magnitude_b = np.linalg.norm(b)

    if magnitude_a == 0.0 or magnitude_b == 0.0:
        return 0.0

    return float(dot_product / (magnitude_a * magnitude_b))


def proximity_score(volunteer_location: Dict, need_location: Dict) -> float:
    """Calculate proximity score using the Haversine formula.

    Closer volunteers receive higher scores. The score decays with distance
    using the formula: 1 / (1 + distance_km / 10).

    Args:
        volunteer_location: Dict with 'lat' and 'lng' keys.
        need_location: Dict with 'lat' and 'lng' keys.

    Returns:
        Proximity score between 0 and 1.
    """
    lat1 = math.radians(volunteer_location["lat"])
    lat2 = math.radians(need_location["lat"])
    dlat = math.radians(need_location["lat"] - volunteer_location["lat"])
    dlng = math.radians(need_location["lng"] - volunteer_location["lng"])

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    earth_radius_km = 6371.0
    distance_km = earth_radius_km * c

    return 1.0 / (1.0 + distance_km / 10.0)


def reliability_score(volunteer: Dict) -> float:
    """Calculate volunteer reliability score from historical performance.

    Weighted combination of completion rate (70%) and experience capped
    at 50 tasks (30%).

    Args:
        volunteer: Dict with 'completion_rate' and 'tasks_completed' keys.

    Returns:
        Reliability score between 0 and 1.
    """
    completion = volunteer.get("completion_rate", 1.0)
    tasks = volunteer.get("tasks_completed", 0)
    experience_factor = min(tasks, 50) / 50.0
    return (completion * 0.7) + (experience_factor * 0.3)


def compute_final_score(
    skill_score: float, proximity: float, reliability: float
) -> float:
    """Compute weighted final match score.

    Weights: skill 50%, proximity 30%, reliability 20%.

    Args:
        skill_score: Skill match score (0-1).
        proximity: Proximity score (0-1).
        reliability: Reliability score (0-1).

    Returns:
        Weighted final score between 0 and 1.
    """
    return (0.5 * skill_score) + (0.3 * proximity) + (0.2 * reliability)


def _compute_skill_score(need_skills: List[str], volunteer_skills: List[str]) -> float:
    """Compute skill overlap score between need and volunteer.

    Args:
        need_skills: List of required skill strings.
        volunteer_skills: List of volunteer's skill strings.

    Returns:
        Fraction of required skills the volunteer possesses (0-1).
    """
    if not need_skills:
        return 1.0

    need_set = {s.lower().strip() for s in need_skills}
    vol_set = {s.lower().strip() for s in volunteer_skills}
    overlap = need_set.intersection(vol_set)
    return len(overlap) / len(need_set)


def match_volunteers(need: Dict, volunteers: List[Dict]) -> List[Dict]:
    """Match and rank volunteers for a community need using multi-factor scoring.

    Computes deterministic skill (50%), proximity (30%), and reliability (20%) scores,
    extracts matched/missing skills, calculates distance in km, and compiles match reasons.

    Args:
        need: Dict representing the community need with 'required_skills'
              and 'location' keys.
        volunteers: List of volunteer dicts.

    Returns:
        Top candidate match results as list of enriched dicts.
    """
    results: List[Dict] = []
    need_location = need.get("location", {"lat": 0, "lng": 0})
    need_skills = need.get("required_skills", [])
    need_skills_norm = [s.strip() for s in need_skills if s and s.strip()]

    for volunteer in volunteers:
        if not volunteer.get("availability", False):
            continue

        vol_skills = volunteer.get("skills", [])
        vol_skills_set = {s.lower().strip() for s in vol_skills if s and s.strip()}

        matched_skills = [s for s in need_skills_norm if s.lower() in vol_skills_set]
        missing_skills = [s for s in need_skills_norm if s.lower() not in vol_skills_set]

        skill = _compute_skill_score(need_skills, vol_skills)

        vol_location = volunteer.get("location", {"lat": 0, "lng": 0})
        v_lat = vol_location.get("lat", 0.0)
        v_lng = vol_location.get("lng", 0.0)
        n_lat = need_location.get("lat", 0.0)
        n_lng = need_location.get("lng", 0.0)

        has_coords = (v_lat != 0.0 or v_lng != 0.0) and (n_lat != 0.0 or n_lng != 0.0)

        if has_coords:
            lat1 = math.radians(v_lat)
            lat2 = math.radians(n_lat)
            dlat = math.radians(n_lat - v_lat)
            dlng = math.radians(n_lng - v_lng)
            a = (
                math.sin(dlat / 2) ** 2
                + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance_km = round(6371.0 * c, 1)
            prox = 1.0 / (1.0 + distance_km / 10.0)
            travel_minutes = round((distance_km / 30.0) * 60.0, 1)
        else:
            distance_km = None
            travel_minutes = None
            vol_zone = vol_location.get("zone", "").lower()
            need_zone = need_location.get("zone", "").lower()
            if vol_zone and need_zone and vol_zone == need_zone:
                prox = 0.9
            else:
                prox = 0.5

        rel = reliability_score(volunteer)
        final = compute_final_score(skill, prox, rel)

        match_reasons = []
        if skill >= 0.8:
            match_reasons.append("Strong skill match")
        elif skill > 0 and need_skills_norm:
            match_reasons.append(f"{len(matched_skills)} of {len(need_skills_norm)} required skills matched")
        elif not need_skills_norm:
            match_reasons.append("General support role")

        if missing_skills:
            match_reasons.append(f"Missing required skill: {', '.join(missing_skills)}")

        if distance_km is not None:
            match_reasons.append(f"Located {distance_km} km from the need")
        elif vol_location.get("zone"):
            match_reasons.append(f"Zone: {vol_location.get('zone')}")

        if volunteer.get("availability", True):
            match_reasons.append("Currently available")

        comp_rate = volunteer.get("completion_rate", 1.0)
        if comp_rate >= 0.85:
            match_reasons.append(f"{int(comp_rate * 100)}% task completion rate")

        tasks_done = volunteer.get("tasks_completed", 0)
        if tasks_done > 0:
            match_reasons.append(f"{tasks_done} tasks completed")

        reasoning = (
            f"Skill match: {skill:.0%} | "
            f"Distance score: {prox:.0%} | "
            f"Reliability: {rel:.0%}"
        )

        results.append({
            "volunteer": volunteer,
            "overall_score": round(final, 4),
            "skill_score": round(skill, 4),
            "proximity_score": round(prox, 4),
            "reliability_score": round(rel, 4),
            "final_score": round(final, 4),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "distance": distance_km,
            "availability": volunteer.get("availability", True),
            "completion_rate": volunteer.get("completion_rate", 1.0),
            "tasks_completed": tasks_done,
            "avg_response_minutes": volunteer.get("avg_response_minutes", 10.0),
            "match_reasons": match_reasons,
            "travel_minutes": travel_minutes,
            "reasoning": reasoning,
        })

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results[:5]
