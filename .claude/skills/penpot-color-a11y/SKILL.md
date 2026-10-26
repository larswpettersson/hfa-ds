---
name: penpot-color-a11y
description: Färgregler för HFA DS (färgblindhet och projektor) i ljust och mörkt tema. Använd när färger, färgtokens eller bibliotekets färger läses, föreslås eller ändras i Penpot eller i tokens.json, och innan en färgändring godkänns.
---

# Färgregler för HFA DS: CVD och projektor

Verktygen används i rum med projektor och av personer med nedsatt färgseende. Statusfärgerna (error, success, warning, info) ska vara tydligt särskiljbara för alla. Vad färgerna betyder förklaras av en legend i appen, så det finns inga krav på vilken färg som är ljusast eller mörkast.

## Regler

Alla regler gäller **varje tema** (`mode/light`, `mode/dark`) och kontrolleras i **simulerat** färgseende, inte bara normalt seende. `L*` är CIE-ljushet (0–100).

| # | Regel | Ljust | Mörkt |
|---|---|---|---|
| 1 | Ljushetsskillnad mellan `error` och `success` (förgrund): `\|ΔL*\| ≥ 15` | ✓ | ✓ |
| 2 | Ljushetsskillnad mellan `background.error` och `background.success`: `\|ΔL*\|` | ≥ 15 | ≥ 8 |
| 3 | `foreground.base` på varje `background.*`: kontrast ≥ 7:1 | ✓ | ✓ |
| 4 | Statusfärgerna i förgrund (`error`, `success` …) parvis åtskilda: OKLab `ΔE` | ≥ 0.08 | ≥ 0.08 |
| 5 | Statusbakgrunderna (`background.error` …) parvis åtskilda: OKLab `ΔE` | ≥ 0.08 | ≥ 0.06 |
| 6 | Förgrundsfärgerna för status på `background.{base,elevated,sunken}`: kontrast ≥ 4.5:1 | ✓ | ✓ |

Regel 1–3 och 6 kontrolleras för normalt seende, protanopi, deuteranopi, tritanopi och akromatopsi. Regel 4–5 kontrolleras för alla utom akromatopsi, eftersom den redan täcks av regel 1–2.

**Status anges bara med fyllnadsfärg.** Kantens tjocklek och form är reserverade för barriärstyrka i apparna. Föreslå därför aldrig färgade eller tjockare kanter för att skilja statusar åt. Kanten har samma färg på alla kort (`foreground.base`) och skiljer bara kortet från duken.

**Förgrundsfärger för status (`error`, `success`, `warning`, `info`) används bara på neutrala bakgrunder** (`background.base`, `background.elevated`, `background.sunken`), till exempel som feltext, list eller diagramlinje. På en statusbakgrund används `foreground.base` för både text och ikoner. Där visar redan bakgrunden statusen, och `foreground.base` har 7:1 mot alla bakgrunder. Förgrundsfärgerna används som text, så de ska klara 4,5:1 (WCAG AA). Det betyder att warning blir brun i ljust tema, eftersom gul text inte går att läsa på ljus bakgrund. Den gula identiteten bärs av `background.warning`.

### Varför reglerna ser ut så här

- **Ljushet för error och success, oavsett riktning.** Det spelar ingen roll vilken av dem som är ljusast, men de måste skilja sig i ljushet. Röd och grön skiljer sig annars främst i nyans, och nyansen försvinner både vid rödgrön färgblindhet och när en projektor bleker ut bilden.
- **ΔL\* i stället för ΔY ≥ 0.15.** En absolut skillnad i luminans går inte att uppnå med mörka färger (en mörk bakgrund har Y < 0.1). L\* är perceptuellt jämn och betyder ungefär samma sak i båda teman. ΔL\* 15 motsvarar ungefär ΔY 0.15 i mellanregistret.
- **Lägre krav för bakgrunder i mörkt läge (regel 2).** Statusbakgrunderna i mörkt läge måste vara mörka för att regel 3 ska hålla. Det finns inte plats för ΔL\* 15 mellan dem. Statusbakgrunder visas alltid tillsammans med text eller ikon, så ljusheten är en extra signal och inte den enda.
- **Lägre krav för statusbakgrunder i mörkt läge (regel 5).** Vit text på 7:1 kräver att bakgrunderna har L\* ≤ ca 36. Inom det registret gick det inte att nå ΔE ≥ 0,08 för alla typer av färgseende. En sökning bland flera miljoner kombinationer gav högst ≈ 0,069. Det räcker med 0,06 eftersom appen har en legend och korten har text, så färgen behöver bara gå att skilja åt, inte kunna identifieras på egen hand.
- **Simulerat seende.** WCAG-luminans gäller normalt seende. Vid deuteranopi upplevs ett blåaktigt rött (#C70039) och ett gräsgrönt (#228B22) som nästan lika ljusa, trots att de skiljer sig med ΔL\* 9 för normalt seende.
- **Projektor.** En projektor höjer svartnivån och sänker kontrasten. Kravet 7:1 (WCAG AAA) ger marginal för det. Undvik att lösa en kontrastbrist genom att sänka mättnaden: avmättade färger med liknande ljushet smälter ihop först.

Simuleringen följer Machado m.fl. (2009) med svårighetsgrad 1,0 (dikromati). Det är värsta fallet. Anomal trikromati (deuteranomali, ca 5 % av män) är mildare, så den täcks också.

## Arbetsflöde i Penpot

Följ Penpot-reglerna i `CLAUDE.md`. Läs alltså selection först, ta inga skärmbilder och håll payloads små.

1. **Läs färgerna.**
   - Gäller ändringen det användaren har markerat? Läs i så fall `penpot.selection`, och därefter `fills` och `strokes` för de valda formerna.
   - Gäller den biblioteket? Läs `penpot.library.local.colors` och returnera bara `{ name, path, color }`.
   - Om API:t för tokens behövs, slå upp det med `penpot_api_info` i stället för att gissa.
2. **Mappa färgerna till tokennamn och tema** (`error`, `background.success`, `foreground.base` …). Om det är oklart vilken färg som motsvarar vilken token, fråga användaren.
3. **Kör kontrollen** på det nuvarande läget och på förslaget:
   ```bash
   node .claude/skills/penpot-color-a11y/check-colors.mjs            # repo-tokens.json
   node .claude/skills/penpot-color-a11y/check-colors.mjs --stdin <<'EOF'
   {"mode/light": {"error": "#…", "success": "#…", "foreground.base": "#…", "background.base": "#…"},
    "mode/dark":  {"error": "#…", "success": "#…", "foreground.base": "#…", "background.base": "#…"}}
   EOF
   ```
   Skicka med alla tokens i temat. Ett förslag ska inte bryta en regel för en färg som inte ändras.
4. **Föreslå ändringen.** Redovisa före och efter: hex-värde, vilka regler som gick från FAIL till PASS och vilka som fortfarande faller. Ändra L\* i första hand och nyans i andra hand.
5. **Skriv till Penpot först när användaren har godkänt.** Uppdatera samma värde i `tokens.json`, så att `npm test` (`tokens-sync.spec.mjs`) fortsätter att stämma med verktygen.
6. **Kör kontrollen igen** efter ändringen och rapportera resultatet som det är, även om något fortfarande faller.

## Typiska åtgärder

- *error och success smälter ihop vid deuteranopi:* Flytta isär dem i ljushet, i valfri riktning. Ett exempel är ett mörkare, mer rödbrunt error (mindre blått) tillsammans med ett ljusare, mer gulgrönt success.
- *info och success smälter ihop vid tritanopi:* Ge dem olika L\*. Det går inte att lita på blått mot grönt.
- *Kontrasten för text på `background.error` är för låg:* Gör bakgrunden ljusare i ljust tema och mörkare i mörkt tema. Kontrollera regel 3 efteråt.
