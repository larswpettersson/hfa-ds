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

Hur en komponent ska implementeras beskrivs i dess **annotation** i Penpot. Det är det primära sättet; prototyper med länkade flöden byggs inte för närvarande. Annotationen går att läsa via MCP (`LibraryComponent.annotation` i Plugin API:t, kontrollerat 2026-10-31 på Action Button). Ett textlager `_not` på boarden (1.2) är reserv där en annotation inte räcker.

Regler:

- **Högst 300 tecken.**
- **Skriv på engelska**, som koden.
- **Fast ordning:** kodkoppling, tillstånd, beteende, tokens, hänvisning. Utelämna det som inte behövs.

Mall (134 tecken):

```
Code: <class> (<tools>). States: <variant=a|b> or <state: look>. Behaviour: <what happens>. Tokens: <token names>. See: <doc section>.
```

**Exempel: Action Button, som den stod i HFA DS före mallen** (264 tecken):

```
Toolbar button. Default: elevated + 1 px muted border. Hovered: sunken + base border. Pressed/selected: inverted (base fill, elevated text). App: 2 px info focus ring with 2 px offset on :focus-visible; tooltip and aria-label with the full name (e.g. "Add cause").
```

Den beskriver tillstånden kort och tydligt och skiljer på utseende i designen och beteende som bara finns i appen (`App:`). Jämfört med mallen saknas två saker:

- **Kodkoppling.** Det står inte vilken CSS-klass och vilka verktyg komponenten motsvarar.
- **Exakta tokennamn.** "elevated", "sunken", "muted" och "base" pekar ut tokens, men inte entydigt: är "muted border" `foreground.muted`?

**Samma annotation enligt mallen**, som den nu står i HFA DS (266 tecken):

```
Code: .action-btn (HTA, Bowtie). Default: background.elevated, 1 px foreground.muted border. Hover: background.sunken, foreground.base border. Pressed/selected: inverted (base fill, elevated text). Focus: 2 px info ring, 2 px offset. Tooltip + aria-label: full name.
```

### 1.5 Arbetsgång

1. **Designa i Penpot** med namngivna komponenter, varianter och tokens, och beskriv implementationen i komponentens annotation (1.4).
2. **Beskriv flödet i repot**: en kort text med tillståndstabell och exempeldata före och efter, som hänvisar till boardnamnen och delningslänken.
3. **Vid en ändring:** markera det ändrade i Penpot och skriv en mening om vad som ändrades. AI:n läser markeringen via MCP och ändrar koden.
4. **Kontrollera** resultatet i verktyget och med testerna (`npm test` i hfa-ds).
5. **Dokumentera för människor**: exportera bilder av boards till `docs/img/` och länka till prototypen från dokumentationen.
