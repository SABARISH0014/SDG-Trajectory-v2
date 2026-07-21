import sys
import os
from models import generate_narrative
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Force UTF-8 encoding for Windows console to handle LLM output safely
sys.stdout.reconfigure(encoding='utf-8')

def test_llm():
    print("================ OPENROUTER LLM TEST ================")
    
    # 1. Check if the key is loaded
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("[Error] OPENROUTER_API_KEY is not found in your environment or .env file.")
        print("Please make sure you have a .env file in this directory with:")
        print("OPENROUTER_API_KEY=your_key_here")
        return
    else:
        print(f"[Success] API Key found: {api_key[:12]}...{api_key[-4:] if len(api_key)>16 else ''}")

    # 2. Setup mock trajectory statistics
    print("\nSending mock trajectory data to the LLM via OpenRouter...")
    mock_stats = {
        "status": "On-track",
        "baseline_value": 15.2,
        "projected_value_2030": 24.8
    }
    
    # 3. Trigger the function
    try:
        narrative = generate_narrative(mock_stats)
        print("\n--- LLM Response ---")
        print(narrative)
        print("--------------------")
        
        if "moving from a baseline of" in narrative and "Strategic interventions" in narrative:
            print("\n⚠️ Note: This looks like the fallback text. Please check your API key validity and internet connection.")
        else:
            print("\n✅ SUCCESS: The LLM dynamically generated this response!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")

if __name__ == "__main__":
    test_llm()
