"""Skapa Notion-databasen Val2026-Teman under samma föräldersida som civiltforsvar-arkivet.

Återanvänder integrationstoken + förälder ur den klonade workflowen (samma integration har
redan åtkomst). Skriver nya databas-id till notion.json. Idempotent: hoppar om notion.json
redan har ett id (kör med --force för att skapa ny ändå).

Kör: python create_notion_db.py
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

WF = Path(r"C:\Users\josef\myndighetsbevakning\workflows\valbevakning-2026.json")
OUT = Path(__file__).parent / "notion.json"
OLD_DB = "2f4a50aab0bd80769fa8f27ba962369f"  # civiltforsvar-arkivet — används bara för att hitta förälder
NOTION_VER = "2022-06-28"

SCHEMA = {
    "Namn": {"title": {}},
    "Datum": {"date": {}},
    "Sammanfattning": {"rich_text": {}},
    "Teman": {"multi_select": {}},
    "Vecka": {"number": {}},
    "Period": {"rich_text": {}},
}


def token_from_workflow() -> str:
    wf = json.loads(WF.read_text(encoding="utf-8"))
    for n in wf["nodes"]:
        for h in n.get("parameters", {}).get("headerParameters", {}).get("parameters", []):
            if h.get("name") == "Authorization" and str(h.get("value", "")).startswith("Bearer "):
                return h["value"].split(" ", 1)[1]
    raise SystemExit("Hittade ingen Notion-token i workflowet.")


def api(method: str, url: str, token: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Notion-Version", NOTION_VER)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Notion API {e.code}: {e.read().decode('utf-8')[:400]}")


def main() -> int:
    force = "--force" in sys.argv
    if OUT.exists() and not force:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
        print("notion.json finns redan:", existing.get("database_id"), "(kör --force för ny)")
        return 0

    token = token_from_workflow()

    # 1. Föräldersida. Ange med --parent <page_id> (sidan MÅSTE vara delad med integrationen).
    #    Faller tillbaka på befintligt arkivs förälder — men civiltforsvar-arkivet ligger på
    #    workspace-roten, vilket Notion inte tillåter som DB-förälder via API.
    parent_page = None
    for i, a in enumerate(sys.argv):
        if a == "--parent" and i + 1 < len(sys.argv):
            parent_page = sys.argv[i + 1].replace("-", "")
        if a == "--find" and i + 1 < len(sys.argv):
            # Sök upp en delad sida på titel (slipp kopiera id).
            want = sys.argv[i + 1].lower()
            res = api("POST", "https://api.notion.com/v1/search", token,
                      {"filter": {"value": "page", "property": "object"}, "page_size": 50})
            matches = []
            for p in res.get("results", []):
                title = ""
                for v in p.get("properties", {}).values():
                    if v.get("type") == "title":
                        title = "".join(t.get("plain_text", "") for t in v.get("title", []))
                        break
                if want in title.lower():
                    matches.append((title, p["id"].replace("-", "")))
            if not matches:
                raise SystemExit(
                    f"Hittade ingen delad sida vars titel innehåller {want!r}.\n"
                    "Kontrollera att sidan skapats OCH delats med integrationen 'n8n Veckorapport'."
                )
            if len(matches) > 1:
                print("Flera träffar:", matches, "\nVäljer första.")
            parent_page = matches[0][1]
            print(f"Hittade sida: {matches[0][0]!r} ({parent_page})")
    if not parent_page:
        old = api("GET", f"https://api.notion.com/v1/databases/{OLD_DB}", token)
        parent = old.get("parent", {})
        if parent.get("type") != "page_id":
            raise SystemExit(
                "Ingen --parent angiven och arkivet ligger på workspace-roten "
                f"(parent={parent.get('type')}).\n"
                "Skapa en sida i Notion (t.ex. 'Valbevakning 2026'), dela den med integrationen "
                "(••• → Connections → välj integrationen), och kör:\n"
                "  python create_notion_db.py --parent <sid-id-ur-URL>"
            )
        parent_page = parent["page_id"]
    print("Föräldersida:", parent_page)

    # 2. Skapa databasen
    body = {
        "parent": {"type": "page_id", "page_id": parent_page},
        "title": [{"type": "text", "text": {"content": "Val2026-Teman"}}],
        "properties": SCHEMA,
    }
    created = api("POST", "https://api.notion.com/v1/databases", token, body)
    db_id = created["id"].replace("-", "")
    print("Skapad databas Val2026-Teman:", db_id)
    print("URL:", created.get("url", "(okänd)"))

    OUT.write_text(json.dumps({"database_id": db_id, "parent_page": parent_page}, indent=2), encoding="utf-8")
    print("Skrivet:", OUT.name, "— kör nu: python patch.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
