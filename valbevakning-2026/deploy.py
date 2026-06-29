"""Deploy valbevakning-2026 till n8n cloud. Skapar (POST) första gången, uppdaterar (PUT) sen.

Modell: deploy_veckorapport.py (pattern 20260427-001). Aktiverar INTE automatiskt — Josef
aktiverar efter granskning. Sparar workflow-id i deploy.json för framtida PUT.

Kör:  python deploy.py            # skapa/uppdatera (inaktiv)
      python deploy.py --verify   # bara hämta live + kontrollera markörer
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

BASE = "https://josben.app.n8n.cloud/api/v1"
LOCAL = Path(r"C:\Users\josef\myndighetsbevakning\workflows\valbevakning-2026.json")
API_KEY_FILE = Path(r"C:\Users\josef\myndighetsbevakning\scripts\update-corrected-workflows.js")
STATE = Path(__file__).parent / "deploy.json"
NOTION_CFG = Path(__file__).parent / "notion.json"
SECRETS = Path(__file__).parent / "secrets.local.json"  # gitignored — riktiga Notion-token


def inject_secrets(payload: dict) -> dict:
    """Den committade workflow-JSON:en har __NOTION_TOKEN__ som platshållare.
    Injicera riktiga token vid deploy (skrivs aldrig till disk/repo)."""
    raw = json.dumps(payload)
    if "__NOTION_TOKEN__" not in raw:
        return payload
    if not SECRETS.exists():
        raise SystemExit("secrets.local.json saknas — kan inte injicera Notion-token. "
                         "Skapa {\"notion_token\": \"ntn_...\"} i projektmappen.")
    token = json.loads(SECRETS.read_text(encoding="utf-8"))["notion_token"]
    return json.loads(raw.replace("__NOTION_TOKEN__", token))


def api_key() -> str:
    for line in API_KEY_FILE.read_text(encoding="utf-8").splitlines():
        if "N8N_API_KEY" in line and "eyJ" in line:
            return line.split("'")[1]
    raise SystemExit("n8n API-nyckel hittades inte i " + str(API_KEY_FILE))


def req(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(f"{BASE}{path}", data=data, method=method,
                               headers={"X-N8N-API-KEY": api_key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read())


def verify(live: dict) -> bool:
    nodes = {n["name"]: n for n in live["nodes"]}
    def code(n): return nodes.get(n, {}).get("parameters", {}).get("jsCode", "")
    db = json.loads(NOTION_CFG.read_text(encoding="utf-8"))["database_id"] if NOTION_CFG.exists() else "?"
    checks = {
        "webhook-path = valbevakning-2026": nodes.get("Webhook Trigger", {}).get("parameters", {}).get("path") == "valbevakning-2026",
        "fyra teman i synthesis": all(t in code("Prepare Synthesis Request") for t in ["valsystemet", "rostrakningen", "myndigheternas_roll", "demokratinarrativ"]),
        "narrativeFlags-källkritik": "narrativeFlags" in code("Prepare Synthesis Request"),
        "HTML trafikljus + badge": "trafik(" in code("Generate HTML Email") and "konfBadge" in code("Generate HTML Email"),
        "dagligt läge": "dailyMode" in code("Detect Execution Mode"),
        "Notion-arkiv inkopplat": db in nodes.get("Fetch Previous Themes", {}).get("parameters", {}).get("url", ""),
        "Riksdag-KW val/demokrati": "vallag" in code("Parse Riksdag Documents"),
    }
    for name, ok in checks.items():
        print(f"  {'OK ' if ok else 'FEL'} {name}")
    return all(checks.values())


def main() -> int:
    if "--verify" in sys.argv:
        if not STATE.exists():
            raise SystemExit("deploy.json saknas — deploya först.")
        wid = json.loads(STATE.read_text(encoding="utf-8"))["workflow_id"]
        return 0 if verify(req("GET", f"/workflows/{wid}")) else 1

    local = json.loads(LOCAL.read_text(encoding="utf-8"))
    allowed = {"name", "nodes", "connections", "settings", "staticData"}
    payload = {k: v for k, v in local.items() if k in allowed}
    payload.setdefault("settings", {})
    payload = inject_secrets(payload)  # platshållare → riktiga token vid deploy

    state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    wid = state.get("workflow_id")

    if wid:
        result = req("PUT", f"/workflows/{wid}", payload)
        print(f"UPPDATERAD workflow {wid} — updatedAt {result.get('updatedAt')}, aktiv {result.get('active')}")
    else:
        result = req("POST", "/workflows", payload)
        wid = result.get("id")
        STATE.write_text(json.dumps({"workflow_id": wid}, indent=2), encoding="utf-8")
        print(f"SKAPAD workflow {wid} (INAKTIV). Sparat i deploy.json.")

    print("\nVerifiering mot live:")
    ok = verify(req("GET", f"/workflows/{wid}"))
    print(f"\nWebhook (blir live när workflowet aktiveras):")
    print(f"  https://josben.app.n8n.cloud/webhook/valbevakning-2026")
    print(f"Aktivera i n8n-UI (rekommenderat efter granskning) eller via API:")
    print(f"  POST {BASE}/workflows/{wid}/activate")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
