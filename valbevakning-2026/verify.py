"""valbevakning_verify — strukturell verifiering av valbevakning-2026.json.

Kör INGET mot n8n-molnet (det kräver deploy + credentials). Verifierar i stället
att den patchade workflowen är välformad och internt konsistent:
  1. Giltig JSON, oförändrat nodantal.
  2. De tre kodnoderna patchade (markörer finns).
  3. Källkonsistens: varje sourceKey i Source Config läses i Aggregate (byKey).
  4. Tema-kontinuitet: Fetch/Parse Previous Themes finns + previousWeeks läses.
  5. Fyra fasta teman + källkritik-konfidensnivåer i syntesprompten.
  6. Notion-arkiv-id satt (varnar om civiltforsvar-id ärvts oförändrat).
Kör: python verify.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

WF = Path(r"C:\Users\josef\myndighetsbevakning\workflows\valbevakning-2026.json")
EXPECTED_NODES = 74
CIVILT_NOTION_DB = "2f4a50aab0bd80769fa8f27ba962369f"  # civiltforsvar-arkivet — ska bytas
THEME_IDS = ["valsystemet", "rostrakningen", "myndigheternas_roll", "demokratinarrativ"]
KONFIDENS = ["HÖG", "MEDEL", "LÅG", "FLAGGA"]

ok: list[str] = []
warn: list[str] = []
err: list[str] = []


def code_of(nodes: dict, name: str) -> str:
    n = nodes.get(name)
    return (n or {}).get("parameters", {}).get("jsCode", "") if n else ""


def main() -> int:
    if not WF.exists():
        print("FEL: workflow saknas:", WF)
        return 2
    try:
        wf = json.loads(WF.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print("FEL: ogiltig JSON —", e)
        return 2

    nodes = {n["name"]: n for n in wf["nodes"]}

    # 1. Nodantal
    n = len(wf["nodes"])
    (ok if n == EXPECTED_NODES else warn).append(f"Nodantal: {n} (väntat {EXPECTED_NODES})")

    # 2. Identitet
    name = wf.get("name", "")
    (ok if "Valbevakning 2026" in name else err).append(f"Workflow-namn: {name!r}")

    src = code_of(nodes, "Source Config (Fas 3)")
    agg = code_of(nodes, "Aggregate All Results")
    syn = code_of(nodes, "Prepare Synthesis Request")

    # 3. Källkonsistens: sourceKey i config vs byKey() i aggregate
    keys_cfg = set(re.findall(r"sourceKey:\s*'([^']+)'", src))
    keys_agg = set(re.findall(r"byKey\('([^']+)'\)", agg))
    if not keys_cfg:
        err.append("Inga sourceKey i Source Config")
    missing = keys_cfg - keys_agg
    extra = keys_agg - keys_cfg
    if missing:
        err.append(f"sourceKeys i config men ej lästa i Aggregate: {sorted(missing)}")
    if extra:
        err.append(f"byKey i Aggregate utan källa i config: {sorted(extra)}")
    if keys_cfg and not missing and not extra:
        ok.append(f"Källkonsistens OK ({len(keys_cfg)} källor: {', '.join(sorted(keys_cfg))})")

    # 4. Tema-kontinuitet
    for nd in ["Fetch Previous Themes", "Parse Previous Themes"]:
        (ok if nd in nodes else err).append(f"Nod finns: {nd}")
    (ok if "previousWeeks" in agg and "Parse Previous Themes" in agg else err).append(
        "Aggregate läser previousWeeks"
    )
    (ok if "kontinuitet" in syn and "utveckling" in syn else err).append(
        "Syntes injicerar tema-kontinuitet"
    )

    # 5. Fyra teman + källkritik
    miss_t = [t for t in THEME_IDS if t not in syn]
    (ok if not miss_t else err).append(
        "Fyra fasta teman i prompt" + (f" — SAKNAS: {miss_t}" if miss_t else "")
    )
    miss_k = [k for k in KONFIDENS if k not in syn]
    (ok if not miss_k else err).append(
        "Källkritik-konfidensnivåer i prompt" + (f" — SAKNAS: {miss_k}" if miss_k else "")
    )
    (ok if "narrativeFlags" in syn else err).append("narrativeFlags-schema i prompt")

    # 5b. Verifierad rollkarta (OSINT) inbakad som domänkontext (tema 3)
    roll_ok = "VERIFIERAD ROLLKARTA" in syn and "MCF" in syn and "MPF" in syn
    (ok if roll_ok else err).append("Verifierad myndighetsrollkarta inbakad (tema 3)")

    # 6. HTML-mall (Generate HTML Email)
    html = code_of(nodes, "Generate HTML Email")
    html_markers = ["trafik(", "narrativeFlags", "konfBadge", "kontBadge", "Valbevakning 2026"]
    miss_h = [m for m in html_markers if m not in html]
    (ok if not miss_h else err).append(
        "HTML-mall: 4 teman + trafikljus + källkritik-badge" + (f" — SAKNAS: {miss_h}" if miss_h else "")
    )
    subj_ok = "daglig radar ${config.dateTo}" in html and "Valbevakning 2026 — ${config.dateFrom}" in html
    (ok if subj_ok else err).append("HTML returnerar Valbevakning-subject (vecko + dagligt)")

    # 6c. Dagligt intensivläge
    dem = code_of(nodes, "Detect Execution Mode")
    daily_ok = "dailyMode" in dem and "'daily'" in dem and "config.dailyMode" in html
    (ok if daily_ok else err).append("Dagligt intensivläge (24h-fönster + radar-rubrik)")

    # 6b. Riksdag-sökord omriktade till val/demokrati
    rdcode = code_of(nodes, "Parse Riksdag Documents")
    has_val = any(t in rdcode for t in ["vallag", "rösträkn", "valmyndighet"])
    no_def = "civilförsvar" not in rdcode and "totalförsvar" not in rdcode
    (ok if has_val and no_def else err).append(
        "Riksdag-KW omriktad till val/demokrati" + ("" if has_val and no_def else " — försvarstermer kvar")
    )

    # 7. Notion-arkiv-id
    fpt_url = nodes.get("Fetch Previous Themes", {}).get("parameters", {}).get("url", "")
    arc_code = code_of(nodes, "Prepare Notion Archive")
    placeholder = "__VAL2026_TEMAN_DB_ID__"
    if CIVILT_NOTION_DB in fpt_url or placeholder in arc_code:
        warn.append("Notion-arkiv ej kopplat (civiltforsvar-DB/placeholder kvar) — kör create_notion_db.py + patch.py (BUILD.md steg 2)")
    else:
        ok.append("Notion-arkiv Val2026-Teman kopplat (Fetch + Archive)")

    # Rapport
    print("=== valbevakning_verify ===")
    for s in ok:
        print("  OK   ", s)
    for s in warn:
        print("  VARN ", s)
    for s in err:
        print("  FEL  ", s)
    print(f"\n{len(ok)} OK · {len(warn)} varningar · {len(err)} fel")
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main())
