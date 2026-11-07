# Arbetssätt: HFA-familjen

*English version: [ways-of-working.md](ways-of-working.md)*

Det här dokumentet beskriver hur vi arbetar med HFA-verktygen (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) och Penpot-filen **HFA DS**. [designprinciper.md](designprinciper.md) beskriver vad verktygen ska vara och hur de ska se ut. Det här dokumentet beskriver hur vi tar oss dit.

Varje kapitel beskriver ett arbetssätt. Fler kapitel läggs till efter hand.

## 1. Penpot och AI-stödd kodgenerering

Designändringar görs i Penpot. En AI-assistent (till exempel Claude Code) läser designen och genererar eller ändrar koden i verktygen. Ju tydligare designen är, desto mindre behöver AI:n gissa.

### 1.1 Vad AI:n kan läsa

| Källa | Vad AI:n får ut | Bedömning |
|---|---|---|
| **Penpot-filen via Penpot-MCP** | Boards, lager och namn, komponenter och varianter, tokens, färger, typsnitt, storlekar och layout (flex och grid) | Bäst. Exakt information som går att översätta till kod. Kräver att MCP-servern är kopplad på datorn där arbetet görs. |
| **Skärmbilder och exporterade bilder** | Vad som visas, hierarki och markeringar | Bra komplement. Mått och avstånd blir uppskattningar, och beteende syns inte. |
| **Delningslänk till en prototyp** | Nästan ingenting. Prototypen ritas av JavaScript i webbläsaren. | Till för människor, inte för AI. |
| **Prototypens interaktioner** ("klick → gå till board X") | Osäkert om de går att läsa via MCP | Lita inte på dem som enda beskrivning av ett flöde. |

Vid arbete via MCP utgår AI:n från **det som är markerat** i Penpot (se [CLAUDE.md](../CLAUDE.md)). Markera det som ska ändras innan du ber om en ändring.

### 1.2 Principer i Penpot

1. **Namnge lager och komponenter som i koden**, till exempel `review-switch`, `badge/added` eller `task-box`. Ett lager som heter "Rectangle 23" går inte att koppla till kod.
2. **Använd varianter för tillstånd.** En komponent med till exempel `change=added|removed|changed|none` och `state=default|hover|selected` motsvarar direkt CSS-klasser i verktygen.
3. **Använd bara tokens från HFA DS.** Inga fria färg- eller storleksvärden. Då kan varje värde mappas till `tokens.json` och CSS-variablerna.
4. **Använd flex- eller grid-layout i stället för fria positioner.** Då kan AI:n läsa ut regeln ("jämnt avstånd 8 px, radbrytning") i stället för koordinater.
5. **Gör en board per tillstånd i ett flöde**, till exempel "HTA – Före", "HTA – Efter" och "HTA – Skillnad". Låt boardnamnen följa avsnitten i [designprinciper.md](designprinciper.md), så hittar både människor och AI rätt.
6. **Skriv anteckningar i ett textlager på boarden**, med prefixet `_not`. Penpots kommentarer går sannolikt inte att läsa via MCP, men ett textlager på boarden gör det.
7. **Beskriv vad du ändrade.** AI:n ser hur designen ser ut nu, inte vad som ändrats sedan sist. En mening som "badge för borttagen: från röd fyllning till genomstruken text" gör att rätt sak ändras i koden.

### 1.3 Beskriv flöden och beteende utanför Penpot

Utseende beskrivs bäst i Penpot. Beteende beskrivs bäst i text och data i repot, med hänvisning till boardnamnen.

| Beskrivning | Passar för | Hur väl AI tolkar den |
|---|---|---|
| **Tillstånd och övergångar i en tabell**: tillstånd → händelse → nästa tillstånd → vad som syns | Flöden, till exempel Före/Efter/Skillnad och Godkänn/Avvisa | Mycket bra och entydig |
| **Exempeldata före och efter** (JSON), med vilka markeringar som ska synas | Det mesta i en implementation | Bäst av allt. Exemplen kan direkt bli tester. |
| **Scenarier i text**, som avsnitt 1.5 i designprinciperna | Syfte och sammanhang | Bra för att förstå varför något behövs, mindre bra för detaljer |
| **Exporterade bilder och delningslänk** | Dokumentation och möten | För människor, komplement för AI |

Viktigast är exempeldata: ett exempel på en analys före och efter en ändring, och vilka markeringar som ska synas. Det gör det tydligt både vad koden ska göra och hur den ska testas.

### 1.4 Annotationer på komponenter

Hur en komponent ska implementeras beskrivs i dess **annotation** i Penpot. Det är det primära sättet; prototyper med länkade flöden byggs inte för närvarande. Annotationen går att läsa via MCP (`LibraryComponent.annotation` i Plugin API:t, kontrollerat 2026-10-31). Ett textlager `_not` på boarden (1.2) är reserv där en annotation inte räcker.

Regler:

- **Högst 300 tecken.**
- **Skriv på engelska**, som koden.
- **Först designen, sedan `App:`.** Inled med det som syns i designen och som inte framgår av komponenten själv, gärna med skälet (mått, tillstånd, varför). Efter `App:` står det som bara finns i koden: beteende, fokus, tooltip, tillgänglighet, textbehandling.
- **Skriv bara det som behövs för komponenten.** Det finns ingen fast uppsättning fält; en knapp beskriver tillstånd, en barriär mått och textbehandling.

**Exempel från HFA DS** (2026-10-31):

Action Button (264 tecken):

```
Toolbar button. Default: elevated + 1 px muted border. Hovered: sunken + base border. Pressed/selected: inverted (base fill, elevated text). App: 2 px info focus ring with 2 px offset on :focus-visible; tooltip and aria-label with the full name (e.g. "Add cause").
```

### 1.5 Arbetsgång

1. **Designa i Penpot** med namngivna komponenter, varianter och tokens, och beskriv implementationen i komponentens annotation (1.4).
2. **Beskriv flödet i repot**: en kort text med tillståndstabell och exempeldata före och efter, som hänvisar till boardnamnen och delningslänken.
3. **Vid en ändring:** markera det ändrade i Penpot och skriv en mening om vad som ändrades. AI:n läser markeringen via MCP och ändrar koden.
4. **Kontrollera** resultatet i verktyget och med testerna (`npm test` i hfa-ds).

## 2. Dokumentation, Gherkin och tester

Det här kapitlet beskriver kedjan från dokumentation till verifierad kod, och hur en AI-assistent förväntas strukturera sina förslag. Kapitel 1 handlar om vad AI:n läser i Penpot; det här kapitlet handlar om vad som händer därefter.

### 2.1 Kedjan

Arbetet drivs av dokumentationen, inte av enskilda önskemål om komponenter:

1. **Dokumentation.** Kravet beskrivs eller ändras först i [arkitektur.md](../arkitektur.md), [designprinciper.md](designprinciper.md) eller det här dokumentet. Inget implementeras som inte är dokumenterat.
2. **Plan.** AI-assistenten översätter principerna, och eventuella skärmbilder eller felfångster, till en strukturerad plan (2.4).
3. **Gherkin.** Beteendet formuleras som ett scenario med *Given–When–Then* (2.2) innan koden skrivs.
4. **Implementation.** HTML, CSS och JavaScript skrivs så att scenariot uppfylls.
5. **Playwright.** Testerna visar att koden gör det scenariot säger, och fångar att något annat har gått sönder (2.3).

### 2.2 Gherkin som acceptanskriterium

Ett scenario beskriver ett beteende, inte en implementation:

```gherkin
Feature: Öppna en fil
  Scenario: Osparade ändringar frågar först
    Given analysen har osparade ändringar
    When användaren trycker på Open…
    Then en dialog frågar Save, Don't save eller Cancel
```

- **Ett scenario per beteende.** Given anger utgångsläget, When en handling och Then ett resultat som Playwright kan kontrollera.
- **Then är det som testet kontrollerar.** Skriv det så konkret att det går att säga ja eller nej: en synlig dialog, ett värde i modellen, en markering på ett objekt.
- **Nuläge:** scenarierna skrivs i planen och i PR-beskrivningen, och testernas namn speglar dem (se till exempel `tests/shared/new-unsaved.spec.mjs`). Det finns inga `.feature`-filer och ingen `playwright-bdd` än. Om scenarierna ska köras direkt är det ett eget beslut: då läggs de i `tests/features/<namn>.feature`, och testsviten får ett steg som kör dem.

### 2.3 Testerna

- **Playwright** kör testerna mot verktygen i de andra repona (`npm test`, se [arkitektur.md](../arkitektur.md) avsnitt 9). Sidorna öppnas direkt som filer, utan webbserver.
- **Filändelsen `.mjs`** gör att Node läser filen som en ES-modul, med `import` och `export`, oavsett inställningar. hfa-ds har dessutom `"type": "module"` i `package.json`; `.mjs` fungerar också i repon som inte har det.
- **Antalet tester:** en körning ger i dag ungefär 78 tester (77 godkända och 1 överhoppat när `hfa-rbd` saknas). Det beror på att de gemensamma testerna körs mot varje verktyg och att varje verktyg har egna tester. Det är **en** webbläsare, Chromium; konfigurationen har inga projekt för Firefox, WebKit eller mobil.
- **Tillstånd** som hover, disabled och markerad prövas där de ändrar beteende, inte för varje komponent.

### 2.4 Mall för AI-assistentens plan

När en AI-assistent (till exempel Claude Code) tar fram en plan eller ett prompt för en ändring används den här strukturen. Rollen är **AI Coding Strategist**: bryggan mellan visuellt underlag (skärmbilder, felfångster), dokumentationen och kodverktyget. Den läser underlaget tillsammans med användarens riktning, formulerar kraven som Gherkin och skriver en exakt, strukturerad instruktion.

```
Task: [en mening som beskriver uppgiften, utifrån design- eller arkitekturändringen]

Visual Analysis & System Context:
- [det viktiga som syns i skärmbilden eller önskemålet]
- [vilken regel i arkitektur.md, designprinciper.md eller arbetssatt.md som tillämpas eller ändras]

Behavioral Specification (Gherkin):
Feature: [namn]
  Scenario: [namn]
    Given [utgångsläge]
    When [handling]
    Then [förväntat resultat, tydligt nog för att Playwright ska kunna kontrollera det]

Scope / File Suggestions:
- Vilka filer som berörs, till exempel verktygets HTML eller script, och vilket test som skapas eller ändras.

Implementation Instructions:
1. [Skriv eller uppdatera scenariot]
2. [Layout och struktur]
3. [Logik, tillstånd och interaktion som uppfyller stegen]
4. [Stil, tokens och responsivitet]

Acceptance Criteria:
- Playwright-testerna för scenariot går igenom.
- [en konkret signal i gränssnittet, till exempel "dialogen visas mitt på sidan"]
```

Mallen är på engelska eftersom den är ett prompt. Dokumentationen och beskrivningarna som den hänvisar till kan vara på svenska.

### 2.5 När används kedjan?

- **Nytt eller ändrat beteende:** hela kedjan. Dokumentera, skriv scenariot, implementera och testa.
- **Rena utseendeändringar från Penpot:** kapitel 1 räcker, och `npm test` kontrollerar att färgerna fortfarande stämmer med `tokens.json`.
- **Små rättelser** (stavning, en etikett): ingen plan behövs, men testerna körs.
