"""
Unified AI client wrapper for OpenAI and Gemini.
Provides: key validation (format + lightweight check), text generation, speech-to-text.
"""
import asyncio
import re


def get_openai_client(api_key: str):
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=api_key)


def get_gemini_client(api_key: str):
    from google import genai
    return genai.Client(api_key=api_key)


async def validate_api_key(api_key: str, provider: str) -> dict:
    """
    Validate API key with a FAST lightweight check:
    - Format check (instant)
    - Then a single minimal API call with a short timeout
    """
    api_key = api_key.strip()

    if not api_key or len(api_key) < 10:
        raise ValueError("API key is too short. Please paste the full key.")

    result = {
        "text_generation": False,
        "speech_to_text": False,
        "provider": provider,
    }

    if provider == "openai":
        # OpenAI keys always start with 'sk-'
        if not api_key.startswith("sk-"):
            raise ValueError("Invalid OpenAI key format. OpenAI keys start with 'sk-'. Get yours at platform.openai.com/api-keys")
        try:
            client = get_openai_client(api_key)
            # Use a very fast models.list() call with explicit short timeout
            response = await asyncio.wait_for(
                client.models.list(),
                timeout=10.0,
            )
            result["text_generation"] = True
            result["model"] = "gpt-4o"
            result["speech_to_text"] = True
        except asyncio.TimeoutError:
            raise ValueError("Connection to OpenAI timed out. Check your internet connection.")
        except Exception as e:
            err = str(e)
            if "401" in err or "invalid_api_key" in err or "Incorrect API" in err:
                raise ValueError("OpenAI key rejected (401). Double-check your key at platform.openai.com/api-keys")
            raise ValueError(f"OpenAI error: {err[:200]}")

    elif provider == "gemini":
        # Gemini keys from AI Studio start with 'AIza'
        if not api_key.startswith("AIza"):
            raise ValueError("Invalid Gemini key format. Gemini keys start with 'AIza'. Get yours at aistudio.google.com/apikey")
        try:
            loop = asyncio.get_running_loop()
            client = get_gemini_client(api_key)
            # Fast: list models, no token cost
            models = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: list(client.models.list())),
                timeout=10.0,
            )
            result["text_generation"] = True
            result["model"] = "gemini-2.0-flash"
            result["speech_to_text"] = False
        except asyncio.TimeoutError:
            raise ValueError("Connection to Gemini timed out. Check your internet connection.")
        except Exception as e:
            err = str(e)
            if "API_KEY_INVALID" in err or "401" in err or "403" in err:
                raise ValueError("Gemini key rejected. Double-check your key at aistudio.google.com/apikey")
            raise ValueError(f"Gemini error: {err[:200]}")

    else:
        raise ValueError(f"Unknown provider '{provider}'. Choose 'openai' or 'gemini'.")

    return result


async def generate_text(prompt: str, api_key: str, provider: str) -> str:
    """Generate text using the appropriate LLM."""
    if provider == "openai":
        client = get_openai_client(api_key)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert career coach and technical interview preparation specialist.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=3000,
            temperature=0.7,
        )
        return response.choices[0].message.content

    elif provider == "gemini":
        from google.genai import types
        loop = asyncio.get_running_loop()
        client = get_gemini_client(api_key)
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an expert career coach and technical interview preparation specialist.",
                    max_output_tokens=3000,
                ),
            )
        )
        return response.text

    raise ValueError(f"Unsupported provider: {provider}")


async def speech_to_text(
    audio_bytes: bytes,
    api_key: str,
    provider: str,
    filename: str = "audio.webm",
) -> str:
    """Convert audio to text using OpenAI Whisper."""
    if provider != "openai":
        raise ValueError("Speech-to-text requires an OpenAI API key (Whisper).")

    import io
    client = get_openai_client(api_key)
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
    )
    return transcript.text
