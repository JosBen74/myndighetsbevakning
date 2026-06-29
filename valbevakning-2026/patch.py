"""Patch valbevakning-2026.json: injicera valspecifika nodkroppar + identitet.

Mönster från myndighetsbevakning/scripts/kontinuitet_patch.py. Idempotent.
Kör: python patch.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

WF = Path(r"C:\Users\josef\myndighetsbevakning\workflows\valbevakning-2026.json")
NODES = Path(__file__).parent / "nodes"

# nodnamn -> källfil med ny jsCode
CODE_PATCHES = {
    "Detect Execution Mode": "detect-execution-mode.js",
    "Source Config (Fas 3)": "source-config.js",
    "Aggregate All Results": "aggregate.js",
    "Prepare Synthesis Request": "prepare-synthesis.js",
    "Parse Synthesis Response": "parse-synthesis.js",
    "Generate HTML Email": "generate-html.js",
    "Prepare Notion Archive": "prepare-notion-archive.js",
    "Parse Riksdag Documents": "parse-riksdag-documents.js",
}

OLD_DB = "2f4a50aab0bd80769fa8f27ba962369f"  # civiltforsvar-arkiv — byts om notion.json finns

NEW_NAME = "Valbevakning 2026 — länsstyrelsernas valorganisationer"
NEW_WEBHOOK = "valbevakning-2026"


def main() -> None:
    backup = WF.with_suffix(".json.backup-pre-valpatch")
    if not backup.exists():
        shutil.copy(WF, backup)
        print(f"Backup: {backup.name}")

    wf = json.loads(WF.read_text(encoding="utf-8"))
    nodes = {n["name"]: n for n in wf["nodes"]}

    # 1. Identitet
    wf["name"] = NEW_NAME
    print(f"name -> {NEW_NAME}")

    # 2. Webhook-path + id på Webhook Trigger
    wt = nodes.get("Webhook Trigger")
    if wt:
        wt["parameters"]["path"] = NEW_WEBHOOK
        if "webhookId" in wt:
            wt["webhookId"] = NEW_WEBHOOK
        print(f"webhook path -> {NEW_WEBHOOK}")

    # 3. Notion-arkiv-id (om skapat via create_notion_db.py)
    notion_cfg = Path(__file__).parent / "notion.json"
    new_db = None
    if notion_cfg.exists():
        new_db = json.loads(notion_cfg.read_text(encoding="utf-8")).get("database_id")

    # 4. Kodnoder
    patched = []
    for node_name, fname in CODE_PATCHES.items():
        n = nodes.get(node_name)
        if not n:
            print(f"  SAKNAS: {node_name}")
            continue
        code = (NODES / fname).read_text(encoding="utf-8")
        if new_db:
            code = code.replace("__VAL2026_TEMAN_DB_ID__", new_db)
        n["parameters"]["jsCode"] = code
        patched.append(node_name)
    print("kodnoder patchade:", ", ".join(patched))

    # 5. Notion-DB-id i HTTP-noder (Fetch Previous Themes query-URL)
    if new_db:
        fpt = nodes.get("Fetch Previous Themes")
        if fpt and "url" in fpt["parameters"]:
            fpt["parameters"]["url"] = fpt["parameters"]["url"].replace(OLD_DB, new_db)
        print(f"Notion-arkiv-id -> {new_db}")
    else:
        print("OBS: notion.json saknas — kör create_notion_db.py för att skapa Val2026-Teman.")

    WF.write_text(json.dumps(wf, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Skrivet:", WF.name)


if __name__ == "__main__":
    main()
