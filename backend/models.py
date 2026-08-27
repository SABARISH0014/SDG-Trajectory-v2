import logging
import os
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

async def generate_narrative(stats: dict) -> str:
    """
    Generates an intuitive, 2-sentence summary of the trajectory in plain layman language.
    Does NOT block the ASGI event loop, preventing FastAPI from hanging.
    """
    status = stats.get('status', 'Unknown')
    baseline = stats.get('baseline_value', 'N/A')
    projection = stats.get('projected_value_2030', 'N/A')
    
    if status == 'Insufficient Data':
        return "Historical data coverage is currently insufficient to model a reliable 2030 forecast. Strengthened data monitoring is required."
        
    # Format strings nicely if they are floats
    baseline_str = f"{baseline:.2f}" if isinstance(baseline, (int, float)) else str(baseline)
    projection_str = f"{projection:.2f}" if isinstance(projection, (int, float)) else str(projection)

    if status == "On-track":
        fallback_narrative = "The country is sustaining strong developmental momentum and is on course to meet its 2030 milestone under current conditions, improving local resilience and living standards."
    elif status == "At-risk":
        fallback_narrative = "Progress is advancing but at a fragile pace that risks falling short of 2030 commitments. Accelerated investment and administrative follow-through will be necessary."
    else:
        fallback_narrative = "The indicator trajectory is currently lagging behind required benchmarks. Targeted policy overhauls and increased resource mobilization are needed to reverse this trend."
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return fallback_narrative
        
    try:
        # ASYNC HTTP call to prevent server blocking
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemma-4-26b-a4b-it:free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a public policy communications specialist. Write a concise, 2-sentence explanation of what this SDG trend means for everyday citizens in simple, layman terms. Do NOT list raw numbers or technical regression jargon."
                        },
                        {
                            "role": "user",
                            "content": f"The SDG target trajectory is currently '{status}'. It moves from a baseline value of {baseline_str} to a projected 2030 value of {projection_str}."
                        }
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.ReadTimeout:
        logger.error("OpenRouter API call timed out. Falling back.")
        return fallback_narrative
    except Exception as e:
        logger.error(f"OpenRouter API call failed: {e}")
        return fallback_narrative
