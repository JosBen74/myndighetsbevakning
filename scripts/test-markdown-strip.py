import json
import re

# Read the test response
with open('C:/Users/josef/n8n_test/test-response-v2.json', encoding='utf-8') as f:
    resp = json.load(f)

# Get the raw AI response
raw = resp.get('aiInsights', {}).get('_rawResponse', '')

print("="*60)
print("RAW RESPONSE (first 200 chars):")
print("="*60)
print(raw[:200])
print()

# Apply markdown stripping logic (matching the n8n Code node logic)
clean = raw.strip()
if clean.startswith('```'):
    clean = re.sub(r'^```(?:json)?\n?', '', clean)
    clean = re.sub(r'\n?```$', '', clean)

print("="*60)
print("AFTER MARKDOWN STRIP (first 200 chars):")
print("="*60)
print(clean[:200])
print()

# Try to parse as JSON
try:
    parsed = json.loads(clean)
    print("="*60)
    print("SUCCESSFULLY PARSED JSON!")
    print("="*60)
    print(f"Executive Summary: {parsed.get('executiveSummary', '')[:100]}...")
    print(f"Themes: {len(parsed.get('themes', []))}")
    print(f"Key Quotes: {len(parsed.get('keyQuotes', []))}")
    print(f"Recommendations: {len(parsed.get('recommendations', []))}")

    if parsed.get('themes'):
        print("\nThemes:")
        for i, theme in enumerate(parsed['themes'], 1):
            print(f"  {i}. {theme.get('title', 'N/A')}")

    if parsed.get('recommendations'):
        print("\nRecommendations:")
        for i, rec in enumerate(parsed['recommendations'], 1):
            print(f"  {i}. {rec[:80]}...")

except json.JSONDecodeError as e:
    print("="*60)
    print(f"PARSE ERROR: {e}")
    print("="*60)
