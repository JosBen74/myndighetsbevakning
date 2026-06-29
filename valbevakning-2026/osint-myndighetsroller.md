# Rollkarta — myndigheternas roll vid riksdagsvalet 2026 (tema 3)

Källa: OSINT-utredning 2026-06-29 (workflow `regeringsuppdrag-val-2026`, 4 finders +
adversariell verifiering + syntes, modell Opus 4.8). Primärkällebelagd. Bakad in som
domänkontext i `nodes/prepare-synthesis.js`. **Reservation:** regleringsbreven för 2026
kunde inte fulltextläsas (binära PDF:er via Statskontoret/ESV) — ev. valspecifika
uppdrag/återrapporteringskrav där är obekräftade.

## Verifierad rollkarta

| Myndighet | Roll (kort) | Rättslig grund | Konfidens |
|---|---|---|---|
| **Valmyndigheten** | Central valmyndighet: planerar/samordnar genomförandet, fastställer resultat, fördelar mandat. Sedan 1 dec 2025 även ansvar att samordna skyddet av val + driva nationellt valnätverk. **2026-uppdrag:** utlandssvenskars rösträtt (regeringsbeslut mars 2026). | Vallagen (2005:837), valförordn. (2005:874), förordn. (2007:977) instruktion; prop. 2024/25:181 (bet. 2025/26:KU4) ikraft 2025-12-01 | HÖG |
| **MPF** | Stående roll mot otillbörlig informationspåverkan: hotanalys, kunskapshöjande kommunikation, utbildning av kommuner/länsstyrelser, plattformsdialog. Inget separat valuppdrag. | Förordn. (2021:936) instruktion, 2 § p.6 + p.1; vallagen | HÖG |
| **Säkerhetspolisen** | Stående roll: motverkar främmande makts påverkan mot demokratiska statsskicket (författningsskydd), personskydd av statsledningen, underrättelser/hotavvärjning inför valet. Inget separat valuppdrag. | Förordn. (2022:1719) instruktion (senast SFS 2026:20), 3 § polislagen | HÖG |
| **MCF** (f.d. MSB, namnbyte 2026-01-01) | Deltar i valnätverket: beredskap, skydd av samhällsviktig verksamhet/kritisk infrastruktur. Desinformation ligger INTE här. Inget eget valuppdrag 2026 bekräftat. | Förordn. (2008:1002) instruktion (rubrik → MCF 2026-01-01), förordn. (2022:524); bet. 2025/26:FöU4 | MEDEL |

## Viktiga korrigeringar (från adversariell verifiering)

1. **"MSB" = MCF** i valåret 2026 (samma myndighet, nytt namn 2026-01-01). MSB-branding kvar i vissa digitala tjänster under övergångsåret.
2. **Desinformation/informationspåverkan → MPF, inte MCF.** Ledtråden om "desinformationsstöd från MSB" matchade fel myndighet.
3. **Länsstyrelserna = regional valmyndighet** (slutlig rösträkning).
4. **NCSC (vid FRA)** har det enda tydligt identifierade *nya, riktade* valuppdraget 2026 (cybersäkerhetsstöd, beslut 2025-11-28) — ingår ej i kartan men är relevant kontext.

## Starkaste primärkällor

- MPF-instruktion: https://svenskforfattningssamling.se/doc/2021936.html
- Säpo-instruktion (2022:1719): https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-20221719-med-instruktion-for_sfs-2022-1719/
- MCF tydligare ansvar: https://www.regeringen.se/pressmeddelanden/2026/01/myndigheten-for-civilt-forsvar-far-ett-tydligare-ansvar/
- Valmynd. utlandssvenskar-uppdrag: https://www.regeringen.se/pressmeddelanden/2026/03/regeringen-starker-utlandssvenskars-rostningsmojligheter/
- Regeringens samlade valpåverkanssida: https://www.regeringen.se/regeringens-politik/valpaverkan/
- Prop. 2024/25:181 / bet. 2025/26:KU4 (säkerhet/tillgänglighet vid val)

## Kvarvarande osäkerheter (att stänga vid behov)

- Regleringsbrev 2026 (MPF/MCF/Valmynd.) ej fulltextlästa → ev. valuppdrag där obekräftade.
- Frånvaro av separata valuppdrag = negativt fynd från öppna källor (utesluter ej sekretessbelagda).
- Valnätverkets exakta sammansättning delvis från sekundär sammanfattning (regeringen.se).
- Riksrevisionens granskning av statens valsamordning pågår (resultat dec 2026) — ej bekräftelse.
