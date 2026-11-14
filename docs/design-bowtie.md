# Design: Bowtie

**Status:** beslutat (2026-11-10). Titelraden, panelen med Add-kommandona, legenden och pilnavigeringen är byggda, och sedan 2026-11-14 också barriärbredden och ångra/gör om; resten väntar. Utseendet är ritat i Penpot (Bowtie-filen); tester och bygge väntar tills grafiken är granskad. Kraven på projekt, barriärbibliotek och länkar mellan diagram (avsnitt 7) är dokumenterade 2026-11-14 och varken ritade eller byggda. Engelsk version: [design-bowtie.en.md](design-bowtie.en.md).

De generella reglerna står i designprinciperna ([4.10 titelraden](designprinciper.md), [4.11 dragfält](designprinciper.md), [4.12 vyer och legend](designprinciper.md), [4.13 paneler](designprinciper.md), [4.14 ångra och gör om](designprinciper.md) och [5.10](designprinciper.md)). Det här dokumentet beskriver det som gäller för Bowtie. Samma mönster som [design-stpa.md](design-stpa.md): generella regler i designprinciperna, verktygets egna krav här.

## 1. Mål

Bowtie ska ha **samma struktur som HTA och STPA**, så att den som kan ett verktyg kan de andra. Diagrammet ligger i en panel med en rubrikrad, och verktygets gemensamma delar (titelrad, analyspanel, dragfält, typografi) är desamma.

## 2. Beslut

1. **Panel.** Diagrammet ligger i panelen *Bowtie Panel* (`background.elevated`, kant 1 px `foreground.muted`, radie 8) på sidan (`base`). Korten och barriärerna ligger som `elevated` direkt på panelen och behåller sin kant (`foreground.base`) och barriärernas statusfärg.
2. **Rubrikrad.** Titeln **Bowtie** står först, och Add-kommandona *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* och *Add Consequence* står efter den, på samma rad (4.13). De var tidigare i ett verktygsfält.
3. **Tangenter.** *Add Cause* **C**, *Add Preventive Barrier* **B**, *Add Reactive Barrier* **R** och *Add Consequence* **Q** (som i hjälpdialogen). Tangenten visas som en understruken bokstav i knappens text (5.10).
4. **Titelrad och analyspanel.** Titelraden (4.10, *Tool* = *Bowtie*) går över appytan. Analyspanelen (420 px, titeln *Bowtie analysis*) går i full höjd längst till höger med ett dragfält emellan (4.11). När panelen är stängd går titelraden över hela bredden och har *Hide panel* längst till höger.
5. **Legenden** ligger i en egen kolumn bredvid panelen, `sunken` med kant, och är vikbar med ▾ (4.12). Den höjer sig inte längre när musen passerar, och den täcker aldrig diagrammet.
6. **Typografi.** Alla texter är bundna till typografitokens (Open Sans).
7. **Barriärens bredd följer texten.** En barriär är så bred som det längsta ordet i beskrivningen, mellan **6 tecken** (medelordlängden i svensk facktext, 5,7, avrundad uppåt) och **12 tecken**. Ord som är längre än 12 tecken avstavas. Kanten och texten har 4 px emellan i sidled och 8 px i höjdled. Bakgrunden står under tabellen nedan.
8. **Ångra och gör om** följer den generella regeln i designprinciperna ([4.14](designprinciper.md)). Det som är eget för Bowtie: länkläget för en barriär är ett steg, som sparas när länkarna verkställs eller avbryts.

**Barriärens bredd i siffror.** Ett tecken räknas som 0,543 em, uppmätt på långa svenska sammansättningar i Open Sans (7,6 px vid 14 px text). Bredden är antalet tecken gånger teckenbredden plus sidopaddingen (2 × 4 px).

| | Tecken | Penpot (14 px text) | Koden (16 px text) |
|---|---|---|---|
| Minsta bredd | 6 | 54 px | 60 px |
| Största bredd | 12 | 100 px | 112 px |

- **Varför 6 och 12.** I svensk facktext är medelordlängden 5,4–6,0 tecken, 90 % av löporden är högst 11 tecken och 95 % högst 13 (Sigurd m.fl. 2004; Björnsson 1968). Barriärtexter består mest av facktermer och har fler långa ord än löptext, så en del ord avstavas.
- **En kolumn är så bred som sin bredaste barriär.** En barriär med korta ord i samma kolumn som en med långa ord blir lika bred som den.
- **I koden** är barriärkolumnerna `min-content`, och barriären har `min-width` och `max-width`. En osynlig kopia av hela beskrivningen utan avstavning ger bredden, så att den synliga texten kan avstavas (`hyphens: auto`) utan att barriären krymper till minsta bredd.
- **I Penpot** har main component *Barrier* (HFA DS, nio varianter) horisontell storlek *Fill* med min 54 och max 100. Penpot kan inte låta bredden följa längsta ordet, se öppna punkter.

Dragfält mellan zonerna i diagrammet (orsaker, topphändelse, konsekvenser) finns inte, eftersom zonerna inte är paneler.

## 3. Krav i Gherkin

Ett krav är en mening med ett id. Under det står scenarierna som visar att det håller. Varje scenario får ett Playwright-test i `tests/bowtie/` med scenariots id i testets namn. Scenarier med `@later` hoppas över.

### BOWTIE-LEGEND: förklaringen

**Legenden kan vikas ihop och fällas ut med en ▾ på rubrikraden. Den ligger i en egen kolumn och täcker aldrig diagrammet, och den höjer sig inte vid hover.**

```gherkin
Feature: Förklaringen (legenden)
  Background:
    Given Bowtie är öppen med ett diagram och legenden öppen

  @BOWTIE-LEGEND-1
  Scenario: Legenden viks ihop med ett klick på rubrikraden
    When användaren klickar på legendens rubrikrad
    Then legenden visar bara rubrikraden
    And pilen visar ▸
    And diagrammet har fortfarande hela sin yta

  @BOWTIE-LEGEND-2
  Scenario: Legenden styrs med tangentbordet
    Given fokus är på legendens rubrikrad
    When användaren trycker Enter eller mellanslag
    Then legenden öppnas eller stängs
    And rubrikraden har aria-expanded som visar läget

  @BOWTIE-LEGEND-3
  Scenario: Valet sparas
    Given användaren har stängt legenden
    When sidan laddas om
    Then legenden är fortfarande stängd

  @BOWTIE-LEGEND-4
  Scenario: Legenden täcker aldrig diagrammet
    Given fönstret är smalare än diagrammet och legenden tillsammans
    Then diagrammet skrollar inne i panelen
    And legenden ligger kvar i sin egen kolumn
    And ingen orsak, barriär eller konsekvens döljs av legenden

  @BOWTIE-LEGEND-5
  Scenario: Legenden höjer sig inte vid hover
    When pekaren hålls över legenden
    Then legenden ändrar varken plats, storlek eller lager
```

### BOWTIE-ADD: Add-kommandona i panelens rubrikrad

**Panelens rubrikrad visar titeln Bowtie följd av Add-kommandona på samma rad. Tangenterna C, B, R och Q gör samma sak som knapparna, och tangenten syns på knappen.**

```gherkin
Feature: Add-kommandona
  @BOWTIE-ADD-1
  Scenario: Rubrikraden har titeln och Add-kommandona på samma rad
    When Bowtie är öppen
    Then rubrikraden visar Bowtie, Add Cause, Add Preventive Barrier, Add Reactive Barrier och Add Consequence på samma rad

  @BOWTIE-ADD-2
  Scenario: Knapparna och tangenterna gör samma sak
    Given diagrammet har en topphändelse
    When användaren klickar Add Cause
    Then modellen har en ny orsak
    When användaren trycker C
    Then modellen har ytterligare en orsak

  @BOWTIE-ADD-3
  Scenario: Tangenten syns på knappen
    When Bowtie är öppen
    Then varje Add-knapp visar sin tangent som en understruken bokstav i texten (C, B, R eller Q)
```

### BOWTIE-NAV: indikering, markering och pilnavigering

**Piltangenterna flyttar indikeringen (en hovrad skugga) till närmaste kort, barriär, fara eller topphändelse åt pilens håll på skärmen (5.2). Musen och piltangenterna delar indikeringen (5.3). Pilar markerar inte, Ctrl/⌘+pil används inte, och Alt/Option+pil flyttar det markerade (5.6). Ctrl/⌘+Enter markerar det indikerade och Enter ensam redigerar det.**

```gherkin
Feature: Indikering, markering och pilnavigering
  Background:
    Given Bowtie är öppen med exempeldiagrammet (orsakerna C1–C4, barriärerna P1–P4, faran, topphändelsen, R1–R3 och konsekvenserna K1–K3)

  @BOWTIE-NAV-1
  Scenario: En pil flyttar indikeringen
    Given indikeringen står på topphändelsen
    When användaren trycker →
    Then indikeringen står på ett objekt till höger om topphändelsen och visas som en hovrad skugga
    And markeringen är oförändrad

  @BOWTIE-NAV-2
  Scenario: Objekt på samma rad går först
    Given indikeringen står på orsaken "C1"
    When användaren trycker →
    Then indikeringen står på en barriär på samma rad som "C1"

  @BOWTIE-NAV-3
  Scenario: Vid kanten stannar indikeringen
    Given indikeringen står på konsekvensen "K3", längst ned och längst till höger
    When användaren trycker ↓ och sedan →
    Then indikeringen står kvar på "K3"

  @BOWTIE-NAV-4
  Scenario: Musen tar över indikeringen
    Given indikeringen står på ett objekt efter en piltryckning
    When musen rör sig över "K2"
    Then indikeringen står på "K2" och det förra objektet har ingen indikering
    When användaren trycker ↑
    Then indikeringen flyttas från "K2"

  @BOWTIE-NAV-5
  Scenario: Piltangenten tar över från musen
    Given musen hovrar över "C1"
    When användaren trycker ↓
    Then indikeringen står på ett annat objekt
    And "C1" har ingen hovrad skugga längre

  @BOWTIE-NAV-6
  Scenario: Bara verklig musrörelse räknas
    Given indikeringen står på ett objekt efter en piltryckning
    When ett annat objekt hamnar under en stilla muspekare, till exempel när diagrammet rullas
    Then indikeringen står kvar

  @BOWTIE-NAV-7
  Scenario: Pilar markerar inte, och Ctrl/⌘+pil används inte
    Given "C2" är markerad
    When användaren trycker ↓
    Then indikeringen flyttas men "C2" är fortfarande markerad
    When användaren trycker Ctrl/⌘+→
    Then indikeringen är oförändrad

  @BOWTIE-NAV-8
  Scenario: Alt/Option+pil flyttar de markerade barriärerna
    Given barriären "P4" är markerad med Shift+klick
    When användaren trycker ←
    Then barriären står kvar
    When användaren trycker Alt/Option+←
    Then barriären har flyttat en kolumn åt vänster

  @BOWTIE-NAV-9
  Scenario: Alt/Option+pil flyttar det markerade kortet en rad
    Given orsaken "C2" är markerad
    When användaren trycker Alt/Option+↓
    Then "C2" har bytt plats med orsaken under

  @BOWTIE-SEL-1
  Scenario: Ctrl/⌘+Enter markerar det indikerade objektet
    Given indikeringen står på "C3"
    When användaren trycker Ctrl/⌘+Enter
    Then "C3" är markerad

  @BOWTIE-SEL-2
  Scenario: Enter ensam går in i textredigeringsläget och markerar inte
    Given indikeringen står på "C3" och inget är markerat
    When användaren trycker Enter
    Then kortets text har en textmarkör
    And "C3" är inte markerad
```

### BOWTIE-WIDTH: barriärens bredd

**En barriär är så bred som det längsta ordet i sin beskrivning, minst 6 och högst 12 tecken bred. En kolumn är så bred som sin bredaste barriär, och ord som är längre än största bredden bryts.**

```gherkin
Feature: Barriärens bredd
  Background:
    Given Bowtie är öppen med exempeldiagrammet
    And barriären "P4" står ensam i sin kolumn

  @BOWTIE-WIDTH-1
  Scenario: Bredden följer det längsta ordet
    When beskrivningen av "P4" är "Backventil på ledning"
    Then "P4" är så bred som ordet "Backventil" plus sidopadding och kant
    And bredden ligger mellan minsta och största bredd

  @BOWTIE-WIDTH-2
  Scenario: Korta ord ger minsta bredden
    When beskrivningen av "P4" är "Lås på lucka"
    Then "P4" har minsta bredden (6 tecken)

  @BOWTIE-WIDTH-3
  Scenario: Ett ord som är längre än största bredden bryts
    When beskrivningen av "P4" är "Skydd vid extremvädersförhållanden"
    Then "P4" har största bredden (12 tecken)
    And texten sticker inte ut utanför barriären i sidled

  @BOWTIE-WIDTH-4
  Scenario: En kolumn är så bred som sin bredaste barriär
    Given "P1", "P2" och "P3" står i samma kolumn
    When beskrivningen av "P2" är "Vakt vid port" och "P1" har ett ord som är längre än 12 tecken
    Then "P1", "P2" och "P3" är lika breda

  @BOWTIE-WIDTH-5
  Scenario: Bredden och kopplingslinjerna följer med medan man skriver
    Given beskrivningen av "P4" är "Lås på lucka"
    When användaren skriver "Hastighetsövervakning" i beskrivningen utan att lämna fältet
    Then "P4" har största bredden
    And kopplingslinjerna slutar fortfarande vid kortens och barriärernas kanter
```

### BOWTIE-UNDO: ångra och gör om

**Bowtie ångrar och gör om enligt den generella regeln (4.14): varje ändring är ett steg som kan ångras med knappen Undo eller Ctrl/⌘+Z och göras om med Ctrl/⌘+Shift+Z eller Ctrl+Y, upp till 100 steg. Att länka en barriär är ett steg.**

```gherkin
Feature: Ångra och gör om
  Background:
    Given Bowtie är öppen med exempeldiagrammet

  @BOWTIE-UNDO-1
  Scenario: Knappen Undo är aktiv och säger till när det inte finns något att ångra
    Then knappen Undo är aktiv och verktygstipset är "Undo the last change (Ctrl/⌘+Z)"
    When användaren klickar Undo
    Then statusmeddelandet är "Nothing to undo"

  @BOWTIE-UNDO-2
  Scenario: Ctrl/⌘+Z ångrar en ändring i taget, Ctrl/⌘+Shift+Z och Ctrl+Y gör om
    Given användaren har lagt till en orsak och ändrat beskrivningen av "P1"
    When användaren trycker Ctrl/⌘+Z
    Then beskrivningen av "P1" är som förut och den nya orsaken finns kvar
    When användaren trycker Ctrl/⌘+Z igen
    Then den nya orsaken är borta
    When användaren trycker Ctrl/⌘+Shift+Z och sedan Ctrl+Y
    Then båda ändringarna är tillbaka
    When användaren trycker Ctrl+Y igen
    Then statusmeddelandet är "Nothing to redo"

  @BOWTIE-UNDO-3
  Scenario: Att ångra tillbaka till det öppnade diagrammet lämnar inga osparade ändringar
    Given användaren har lagt till en orsak
    When användaren klickar Undo
    Then diagrammet har inga osparade ändringar

  @BOWTIE-UNDO-4
  Scenario: En ny ändring efter en ångring tar bort stegen att göra om
    Given användaren har lagt till en orsak och ångrat det
    When användaren lägger till en konsekvens och trycker Ctrl/⌘+Shift+Z
    Then statusmeddelandet är "Nothing to redo"

  @BOWTIE-UNDO-5
  Scenario: I ett textfält är Ctrl/⌘+Z fältets egen ångra
    Given användaren har lagt till en orsak och skriver i beskrivningen av "P1"
    When användaren trycker Ctrl/⌘+Z i fältet
    Then den nya orsaken finns kvar

  @BOWTIE-UNDO-6
  Scenario: Att länka en barriär är ett steg
    Given användaren har ändrat vilka orsaker "P2" skyddar i länkläget och verkställt med Enter
    When användaren trycker Ctrl/⌘+Z
    Then "P2" skyddar samma orsaker som förut
    When användaren trycker Ctrl/⌘+Shift+Z
    Then ändringen är tillbaka

  @BOWTIE-UNDO-7
  Scenario: Ctrl/⌘+Z ångrar New
    When användaren klickar New
    Then frågan säger "Ctrl/⌘+Z undoes it"
    When användaren svarar New och sedan trycker Ctrl/⌘+Z
    Then det tidigare diagrammet är tillbaka

  @BOWTIE-UNDO-8 @later
  Scenario: Ett AI-förslag kan ångras, och Open… startar en ny historik
    Given användaren har tillämpat ett förslag från analyspanelen
    When användaren trycker Ctrl/⌘+Z
    Then diagrammet är som före förslaget
    When användaren öppnar en fil och trycker Ctrl/⌘+Z
    Then statusmeddelandet är "Nothing to undo"
```

## 4. Det som inte ingår

- Dragfält mellan zonerna i diagrammet.
- Hjälpdialogens innehåll utöver det som redan finns (*Help – Keyboard shortcuts*).

## 5. Öppna punkter att avgöra vid bygget

- **Legenden i HFA DS.** Komponenten *Legend* har ingen rubrikrad och inga tillstånd (*Expanded* och *Collapsed*) än, och ingen kant. Det görs i HFA DS, och därefter ritas det stängda läget i Bowtie-filen.
- **Smala fönster.** Ska legenden vara stängd som standard under en viss bredd? Ett förslag, inte ett beslut.
- **Tangentens utseende** är beslutat: en understruken bokstav i knappens text (5.10). *Compact Button* har ett valfritt element, *Key*, för det. *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* och *Add Consequence* får understruket **C**, **B**, **R** och **Q**.
- **Skärmens bredd.** Det öppna läget är 2014 px bred, eftersom diagrammet (1294 px) och legenden behåller sin storlek. Det är bredare än STPA och HTA. Det avgörs vid granskningen.
- **Hover-höjningen** tas bort ur Bowtie-koden vid bygget.
- **Pilnavigering** är byggd (BOWTIE-NAV och BOWTIE-SEL ovan): pilarna följer skärmen och gäller bara riktningen (ett objekt långt åt sidan räknas inte), och att flytta har gått från pilarna till Alt/Option+pil, också i länkläget för barriärer. Länkläget i övrigt är oförändrat.

- **Barriärens bredd i Penpot.** Penpot har ingen storleksregel som följer längsta ordet i en radbruten text, och min/max gäller bara när storleken är *Fill*. I Bowtie-filen är barriärkolumnerna därför fasta, och bredden räknas om med ett skript när en text ändras. Ett önskemål om innehållsstyrd storlek med min/max är formulerat för Penpots utvecklare.
- **Textstorlek i barriären.** Penpot har 14 px beskrivning och 12 px id, koden har 16 px för båda. Gränserna är satta i tecken och ger därför olika pixelvärden (se tabellen i avsnitt 2). Vilken storlek som ska gälla avgörs vid granskningen.
- **Barriärtokens.** Teckenbredden 0,543 em och gränserna 6 och 12 tecken finns bara i Bowtie-koden och i Penpot-komponenten, inte i `tokens.json`.

## 6. Nästa steg

1. Rita *Legend* med ▾, kant och tillstånden *Expanded* och *Collapsed* i HFA DS, och lägg in dem i Bowtie-filen.
2. Granska grafiken.
3. Skriv testerna i `tests/bowtie/` och bygg i Bowtie, med legenden och rubrikraden först.
4. Lägg till det gemensamma testet som kontrollerar att varje `@BOWTIE-…`-id här har ett test. Scenarier med `@later` hoppas över.

## 7. Projekt, barriärbibliotek och länkar mellan diagram

**Status:** krav dokumenterade 2026-11-14. Inget är ritat eller byggt. Nästa steg är design i Penpot ([arbetssatt.md](arbetssatt.md)); ingen kod skrivs utifrån det här avsnittet. Alla scenarier har `@later`.

De generella reglerna står i designprinciperna, [kapitel 6](designprinciper.md): projektläge (6.1), stabila id:n (6.2), länkformatet (6.3), navigering (6.4), filformatet (6.5) och AI-panelen (6.6). Här står det som är eget för Bowtie.

**Ordval.** Bowtie har redan ett *länkläge*, där en barriär kopplas till orsaker eller konsekvenser i samma diagram. Länken mellan diagram kallas här **kedjelänk**, så att de två inte blandas ihop.

### 7.1 Beslut

1. **Projekt.** Ett Bowtie-projekt är en mapp med ett diagram per JSON-fil och, om det finns delade barriärer, filen `bibliotek.json` (6.1). Enkelfilsläget finns kvar.
2. **Stabila id:n.** Diagrammet, varje orsak, varje konsekvens och varje barriär har ett `uid` (6.2). De visade id:na (*C1*, *P1*, *R1*, *K1*) finns kvar i `id` och fungerar som i dag.
3. **Barriärbibliotek.** `bibliotek.json` innehåller projektets delade barriärer. En barriär i ett diagram med `"ref": "<uid i biblioteket>"` hämtar beskrivning, styrka och status därifrån. Plats, visat id och vilka orsaker eller konsekvenser den skyddar är alltid diagrammets egna. En barriär utan `ref` fungerar som i dag.
4. **Kedjning.** En konsekvens kan ha `links` som pekar på orsaker i andra diagram (6.3). Bara utgående länkar sparas. En konsekvens med utgående kedjelänk och en orsak med inkommande kedjelänk visar en länkikon. Saknas målet visas länken som bruten.
5. **Navigering.** Ett klick på länkikonen öppnar måldiagrammet med målelementet markerat. Har elementet flera länkar visas en lista att välja ur. Brödsmulestigen och historiken följer 6.4.
6. **Ändra en delad barriär.** När texten i en barriär med `ref` ändras varnar verktyget och visar vilka diagram som använder den. Diagrammen i listan går att klicka på, och användaren kommer tillbaka till samma fråga med sin ändrade text kvar. Valen är **ändra överallt** och **gör till ny, egen barriär**. Det andra valet är primary, eftersom det bara ändrar det här diagrammet (4.5).
7. **Förslag vid ny barriär.** Medan användaren skriver beskrivningen visas diskreta förslag på liknande barriärer, som autokomplettering. Ett valt förslag ger en `ref`; annars blir det en ny, egen barriär. Förslagen får aldrig blockera skrivandet: de tar inte fokus, flyttar inte texten och väljs aldrig av Enter ensam.
8. **Filformatet** följer 6.5. Fältordningen står i 7.2.
9. **Analyspanelen** får diagrammet som indata som i dag. Omfånget (aktuellt diagram, aktuellt och direkt länkade, hela projektet), verktyget `get_diagram` och commit-meddelandet följer 6.6. Av biblioteket skickas bara de barriärer som diagrammen i omfånget använder.

### 7.2 Filformat

Nya fält är markerade med ←. Allt annat är som i dag.

Ett diagram, till exempel `solkurva.json` (förkortat):

```json
{
  "version": 1,
  "uid": "5c1d2a70-3e4b-4f6a-8b9c-0d1e2f3a4b5c",              ← nytt
  "meta": { "…": "…" },
  "hazard": { "id": "HZ", "label": "…" },
  "topEvent": { "id": "TE", "label": "…" },
  "left": {
    "causes": [
      { "id": "C1", "uid": "9a8b7c6d-…", "description": "…", "row": 1 }          ← uid
    ],
    "barriers": [
      { "barrierId": "p1", "id": "P1", "uid": "1f2e3d4c-…",                      ← uid
        "ref": "7d6c5b4a-…",                                                     ← valfritt
        "col": 2, "protects": ["id-C1"] }
    ]
  },
  "right": {
    "consequences": [
      { "id": "K1", "uid": "2b3c4d5e-…", "description": "Urspårning", "row": 1,  ← uid
        "links": [                                                               ← valfritt
          { "diagram": "kollision.json", "element": "0b6f4c1e-…" }
        ] }
    ]
  }
}
```

`bibliotek.json`:

```json
{
  "version": 1,
  "barriers": [
    {
      "uid": "7d6c5b4a-…",
      "description": "Hastighetsövervakning",
      "strength": "High",
      "status": "Implemented"
    }
  ]
}
```

- **Fältordning.** `uid` står direkt efter `id` (i diagrammet direkt efter `version`), `ref` direkt efter `uid`, och `links` sist i konsekvensen. Övriga fält behåller dagens ordning.
- **En barriär med `ref`** sparar inte `description`, `strength` och `status` i diagrammet. De finns bara i biblioteket, så att en ändring där ger en diff i en fil.
- **Nya barriärer i biblioteket läggs sist**, och listan sorteras aldrig om.
- **En `ref` som inte finns i biblioteket** är en bruten referens: barriären visas med sitt visade id och en markering för bruten referens, och filen sparas oförändrad.

### 7.3 Krav i Gherkin

Samma form som i avsnitt 3. Exempelprojektet i scenarierna är mappen *Bana* med `solkurva.json` (konsekvensen *K1 Urspårning*), `kollision.json` (orsaken *C1 Urspårat tåg*, konsekvensen *K2 Brand*), `brand.json` (orsaken *C1 Kollision*) och `bibliotek.json` med barriären *Hastighetsövervakning*, som används i `solkurva.json` och `kollision.json`. *K1* i Solkurva är länkad till *C1* i Kollision, och *K2* i Kollision till *C1* i Brand.

#### BOWTIE-PROJ: projektläge

**Bowtie kan öppna en hel projektmapp. I Edge och Chrome sparas ändrade filer direkt i mappen; i Safari och Firefox laddas de ned. Enkelfilsläget fungerar som förut.**

```gherkin
Feature: Projektläge
  @BOWTIE-PROJ-1 @later
  Scenario: En mapp öppnas som projekt
    When användaren öppnar mappen "Bana"
    Then projektet har diagrammen Solkurva, Kollision och Brand
    And ett av dem visas, och de andra går att välja i en lista

  @BOWTIE-PROJ-2 @later
  Scenario: Save skriver bara ändrade filer i mappen (Edge och Chrome)
    Given projektet "Bana" är öppet med File System Access API
    When användaren ändrar en orsak i Solkurva och klickar Save
    Then "solkurva.json" i mappen har ändringen
    And "kollision.json", "brand.json" och "bibliotek.json" är orörda

  @BOWTIE-PROJ-3 @later
  Scenario: Utan File System Access API sparas ändrade filer som nedladdning
    Given webbläsaren saknar showDirectoryPicker
    When användaren öppnar mappen "Bana" med mappvalet, ändrar Solkurva och klickar Save
    Then "solkurva.json" laddas ned
    And hela projektet går att ladda ned som en zip-fil

  @BOWTIE-PROJ-4 @later
  Scenario: Enkelfilsläget fungerar som förut
    When användaren öppnar "solkurva.json" med Open…
    Then diagrammet visas och går att ändra och spara som i dag
    And kedjelänken på "K1" visas som bruten

  @BOWTIE-PROJ-5 @later
  Scenario: En trasig fil stoppar inte projektet
    Given mappen innehåller en fil som inte är giltig JSON
    When användaren öppnar mappen
    Then de andra diagrammen öppnas
    And ett meddelande säger vilken fil som inte gick att läsa

  @BOWTIE-PROJ-6 @later
  Scenario: Byte av diagram behåller osparade ändringar
    Given användaren har ändrat Solkurva utan att spara
    When användaren öppnar Kollision och går tillbaka till Solkurva
    Then ändringen finns kvar, och ingen fråga om att spara har visats
    And Solkurva visas som ändrad
```

#### BOWTIE-UID: stabila id:n

**Diagrammet och varje orsak, konsekvens och barriär har ett uid som aldrig ändras. Gamla filer får uid vid inläsning.**

```gherkin
Feature: Stabila id:n
  @BOWTIE-UID-1 @later
  Scenario: En gammal fil får uid vid inläsning
    Given en fil utan uid
    When filen öppnas
    Then diagrammet och varje orsak, konsekvens och barriär har ett uid som är ett UUID
    And de visade id:na (C1, P1, R1, K1) är oförändrade

  @BOWTIE-UID-2 @later
  Scenario: uid följer med när elementet ändras
    Given orsaken "C2" har ett uid
    When användaren ändrar texten, flyttar orsaken en rad och sparar
    Then orsaken har samma uid i filen

  @BOWTIE-UID-3 @later
  Scenario: En kopia får ett nytt uid
    When användaren kopierar och klistrar in en barriär
    Then kopian har ett annat uid än originalet
```

#### BOWTIE-LIB: delat barriärbibliotek

**En barriär med ref hämtar beskrivning, styrka och status från bibliotek.json. En barriär utan ref fungerar som i dag.**

```gherkin
Feature: Barriärbiblioteket
  Background:
    Given projektet "Bana" är öppet

  @BOWTIE-LIB-1 @later
  Scenario: En barriär med ref visar bibliotekets text och egenskaper
    Then barriären med ref i Solkurva visar "Hastighetsövervakning" med bibliotekets styrka och status
    And den syns som delad

  @BOWTIE-LIB-2 @later
  Scenario: En barriär utan ref fungerar som i dag
    When användaren ändrar texten i en barriär utan ref
    Then ändringen sparas i diagrammets fil och ingen varning visas

  @BOWTIE-LIB-3 @later
  Scenario: En ref som saknas i biblioteket kraschar inte
    Given en barriär har en ref som inte finns i "bibliotek.json"
    When diagrammet visas
    Then barriären visas med sitt visade id och en markering för bruten referens
    And resten av diagrammet fungerar
```

#### BOWTIE-CHAIN: kedjelänkar

**En konsekvens kan länka till en orsak i ett annat diagram. Bara utgående länkar sparas; inkommande räknas fram. Länkade element visar en länkikon, och en länk utan mål visas som bruten.**

```gherkin
Feature: Kedjelänkar
  Background:
    Given projektet "Bana" är öppet

  @BOWTIE-CHAIN-1 @later
  Scenario: Länkikon på konsekvensen och på orsaken
    Then "K1" i Solkurva visar en länkikon
    And "C1" i Kollision visar en länkikon

  @BOWTIE-CHAIN-2 @later
  Scenario: Bara utgående länkar sparas
    When projektet sparas
    Then "K1" i "solkurva.json" har länken i links
    And "C1" i "kollision.json" har inget fält för inkommande länkar

  @BOWTIE-CHAIN-3 @later
  Scenario: En länk utan mål visas som bruten
    Given "kollision.json" saknas i mappen
    When projektet öppnas
    Then "K1" i Solkurva visar länken som bruten, med symbol och inte bara färg
    And ett klick på den säger att målet saknas och byter inte diagram
    And länken står kvar oförändrad i filen när projektet sparas

  @BOWTIE-CHAIN-4 @later
  Scenario: Indexet följer ändringarna
    When användaren tar bort länken på "K1" i Solkurva
    Then "C1" i Kollision visar ingen länkikon längre

  @BOWTIE-CHAIN-5 @later
  Scenario: Användaren skapar en kedjelänk
    Given konsekvensen "K2" i Solkurva är markerad
    When användaren väljer orsaken "C1" i Brand som mål
    Then "K2" har en utgående länk till "C1" i Brand
    And ändringen är ett steg som går att ångra
```

#### BOWTIE-CRUMB: navigering och brödsmulestig

**Ett klick på en länk öppnar måldiagrammet med målet markerat. Brödsmulestigen visar vägen, varje steg är klickbart, och bakåtknappen går ett steg tillbaka till exakt samma läge.**

```gherkin
Feature: Navigering mellan diagram
  Background:
    Given projektet "Bana" är öppet med Solkurva

  @BOWTIE-CRUMB-1 @later
  Scenario: Ett klick på länken öppnar målet
    When användaren klickar på länkikonen på "K1"
    Then Kollision visas med orsaken "C1" markerad och synlig
    And brödsmulestigen visar "Solkurva › Kollision"

  @BOWTIE-CRUMB-2 @later
  Scenario: Stigen växer och varje steg är klickbart
    Given användaren har gått Solkurva › Kollision › Brand
    When användaren klickar på "Solkurva" i stigen
    Then Solkurva visas med "K1" markerad

  @BOWTIE-CRUMB-3 @later
  Scenario: Tillbaka landar exakt där man var
    Given "K1" är markerad och diagrammet är rullat åt höger
    When användaren följer länken och sedan går tillbaka
    Then Solkurva visas med "K1" markerad och samma rullningsläge

  @BOWTIE-CRUMB-4 @later
  Scenario: Webbläsarens bakåt- och framåtknapp följer stigen
    Given användaren har gått Solkurva › Kollision › Brand
    When användaren trycker på webbläsarens bakåtknapp
    Then Kollision visas med "K2" markerad
    When användaren trycker på framåtknappen
    Then Brand visas med "C1" markerad

  @BOWTIE-CRUMB-5 @later
  Scenario: Länken följs med tangentbordet
    Given indikeringen står på "K1"
    When användaren aktiverar länken med tangentbordet
    Then Kollision visas med "C1" markerad
```

#### BOWTIE-SHARED: ändra en delad barriär

**När texten i en delad barriär ändras varnar Bowtie, visar vilka diagram som använder den och låter användaren välja mellan att ändra överallt och att göra en ny, egen barriär.**

```gherkin
Feature: Ändra en delad barriär
  Background:
    Given projektet "Bana" är öppet med Solkurva
    And användaren har ändrat texten i barriären "Hastighetsövervakning" till "ATC-övervakning"

  @BOWTIE-SHARED-1 @later
  Scenario: Varningen visar var barriären används
    Then en dialog säger att barriären är delad
    And den listar Solkurva och Kollision
    And valen är att ändra överallt, att göra en ny egen barriär och att avbryta

  @BOWTIE-SHARED-2 @later
  Scenario: Ändra överallt
    When användaren väljer att ändra överallt
    Then barriären heter "ATC-övervakning" i Solkurva och i Kollision
    And bara "bibliotek.json" är ändrad

  @BOWTIE-SHARED-3 @later
  Scenario: Gör till ny, egen barriär
    When användaren väljer att göra en ny egen barriär
    Then barriären i Solkurva heter "ATC-övervakning" och har ingen ref
    And barriären i Kollision heter fortfarande "Hastighetsövervakning"
    And "bibliotek.json" är oförändrad

  @BOWTIE-SHARED-4 @later
  Scenario: Titta i ett diagram och komma tillbaka
    When användaren klickar på Kollision i dialogens lista
    Then Kollision visas med barriären markerad
    When användaren går tillbaka
    Then dialogen visas igen med texten "ATC-övervakning" kvar

  @BOWTIE-SHARED-5 @later
  Scenario: Enter väljer det säkra valet
    When användaren trycker Enter i dialogen
    Then barriären blir en ny egen barriär
    When användaren i stället trycker Esc
    Then texten är "Hastighetsövervakning" igen
```

#### BOWTIE-SUGGEST: förslag vid ny barriär

**Medan användaren skriver en ny barriär visas förslag på liknande barriärer. Ett valt förslag blir en ref. Förslagen blockerar aldrig skrivandet.**

```gherkin
Feature: Förslag vid ny barriär
  Background:
    Given projektet "Bana" är öppet med Brand
    And användaren har lagt till en barriär och skriver i beskrivningen

  @BOWTIE-SUGGEST-1 @later
  Scenario: Liknande barriärer föreslås
    When användaren skriver "hast"
    Then "Hastighetsövervakning" visas som förslag under fältet

  @BOWTIE-SUGGEST-2 @later
  Scenario: Ett valt förslag blir en ref
    When användaren väljer förslaget med ↓ och Enter, eller med ett klick
    Then barriären har en ref till "Hastighetsövervakning" i biblioteket

  @BOWTIE-SUGGEST-3 @later
  Scenario: Enter ensam sparar det skrivna
    When användaren skriver "Hastighetsskylt" och trycker Enter utan att välja ett förslag
    Then barriären heter "Hastighetsskylt" och har ingen ref

  @BOWTIE-SUGGEST-4 @later
  Scenario: Förslagen stör inte skrivandet
    When förslagen visas eller byts medan användaren skriver
    Then fokus och textmarkören är kvar i fältet
    And varje tangenttryckning hamnar i fältet
    And fältet och diagrammet flyttar sig inte

  @BOWTIE-SUGGEST-5 @later
  Scenario: Esc stänger förslagen men inte redigeringen
    When användaren trycker Esc medan förslagen visas
    Then förslagen försvinner och texten är kvar i fältet
```

#### BOWTIE-FILE: filformatet

**Filerna är bakåtkompatibla, skrivs med stabil fältordning och innehåller varken författare eller tidsstämplar.**

```gherkin
Feature: Filformatet
  @BOWTIE-FILE-1 @later
  Scenario: En fil utan de nya fälten öppnas som i dag
    When en fil utan uid, ref och links öppnas
    Then diagrammet visas utan fel eller varning

  @BOWTIE-FILE-2 @later
  Scenario: Att spara utan ändring ger samma fil
    Given en fil som är sparad med den här versionen
    When filen öppnas och sparas utan ändring
    Then den sparade filen är identisk med den öppnade, byte för byte

  @BOWTIE-FILE-3 @later
  Scenario: En ändring ger en liten diff
    When användaren ändrar texten i en orsak och sparar
    Then bara raden med den texten skiljer sig i filen

  @BOWTIE-FILE-4 @later
  Scenario: Varken författare eller tidsstämplar sparas
    When projektet sparas
    Then ingen fil innehåller ett fält för författare, datum eller klockslag

  @BOWTIE-FILE-5 @later
  Scenario: Tomma valfria fält utelämnas
    Given en konsekvens utan kedjelänkar och en barriär utan ref
    When diagrammet sparas
    Then konsekvensen har inget fält links och barriären inget fält ref
```

#### BOWTIE-AICTX: analyspanelen i ett projekt

**Användaren väljer hur mycket av projektet som skickas med frågan. En modell med tool use hämtar länkade diagram själv med get_diagram. På begäran ger panelen ett enradigt commit-meddelande.**

```gherkin
Feature: Analyspanelen i ett projekt
  Background:
    Given projektet "Bana" är öppet med Solkurva

  @BOWTIE-AICTX-1 @later
  Scenario: Bara aktuellt diagram
    Given omfånget är aktuellt diagram
    When användaren skickar en fråga
    Then frågan innehåller Solkurva och de biblioteksbarriärer som Solkurva använder
    And inget annat diagram

  @BOWTIE-AICTX-2 @later
  Scenario: Aktuellt diagram och direkt länkade
    Given omfånget är aktuellt diagram och direkt länkade
    When användaren skickar en fråga
    Then frågan innehåller Solkurva och Kollision, men inte Brand

  @BOWTIE-AICTX-3 @later
  Scenario: Hela projektet
    Given omfånget är hela projektet
    When användaren skickar en fråga
    Then frågan innehåller Solkurva, Kollision och Brand
    And av biblioteket bara de barriärer som används

  @BOWTIE-AICTX-4 @later
  Scenario: Modellen hämtar ett länkat diagram
    Given leverantören har tool use
    When modellen anropar get_diagram med "kollision.json"
    Then den får Kollision som JSON ur minnet, med de biblioteksbarriärer som används där
    And inget nätverksanrop görs för att hämta diagrammet

  @BOWTIE-AICTX-5 @later
  Scenario: Ett diagram som saknas ger ett felsvar
    When modellen anropar get_diagram med "saknas.json"
    Then den får ett felsvar som säger att diagrammet inte finns
    And samtalet fortsätter

  @BOWTIE-AICTX-6 @later
  Scenario: Commit-meddelande på begäran
    Given användaren har lagt till en barriär i Solkurva och ändrat en delad barriär
    When användaren ber om ett commit-meddelande
    Then panelen svarar med en rad som sammanfattar ändringarna och går att kopiera
```

### 7.4 Det som inte ingår

- Ingen översiktsvy med flera diagram. Ett diagram i taget, med länkar emellan.
- Ingen inbyggd versionshantering; verktyget kör aldrig git.
- Länkar från HTA och STPA till Bowtie-element. Formatet är förberett (6.3), men inget byggs nu.
- Länkar från andra element än konsekvenser, och till andra element än orsaker.

### 7.5 Öppna punkter att avgöra i designen

Var och en har ett förslag. Inget av dem är beslutat.

1. **Fältnamnet `uid`.** Uppdraget säger "id", men `id` är redan det visade id:t (*C1*). Förslag: nytt fält `uid`, och `id` orört.
2. **När sparas tilldelade uid?** En gammal fil som får uid vid inläsning ger en diff i hela filen en gång. Förslag: i projektläge räknas filen som ändrad och skrivs vid nästa Save; i enkelfilsläge räknas tilldelningen inte som en osparad ändring, så att Open… inte frågar i onödan.
3. **Kopierade filer.** En diagramfil som kopieras i mappen får samma uid som originalet. Förslag: verktyget upptäcker dubbletter vid inläsning, säger vilka filer det gäller och ger kopian nya uid först när användaren godkänner det.
4. **Omdöpta filer.** En länk pekar på ett filnamn. Förslag: saknas filen men elementets uid finns i ett annat diagram i projektet, räknas länken som hel och filnamnet rättas vid nästa Save.
5. **Diagrammets namn** i brödsmulestigen och i listor. Förslag: filnamnet utan `.json`. Alternativet är topphändelsens text, som ofta är för lång.
6. **Vad hämtas från biblioteket?** Uppdraget säger text och egenskaper. Förslag: beskrivning, styrka och status. Frågan är om status (till exempel *Implemented*) hellre ska vara diagrammets egen, eftersom samma barriär kan vara införd på en plats och planerad på en annan.
7. **Varnar ändrad styrka eller status** på en delad barriär på samma sätt som ändrad text? Förslag: ja, samma dialog.
8. **Hur hamnar en barriär i biblioteket?** Förslag: förslagen (BOWTIE-SUGGEST) hämtas både från biblioteket och från egna barriärer i projektets andra diagram. Väljs en egen barriär flyttas den till biblioteket, och båda diagrammen får en `ref`. Det ändrar då en fil till, vilket ska synas.
9. **Hur skapas en kedjelänk?** Uppdraget anger inte det. Förslag: ett kommando på den markerade konsekvensen som öppnar en dialog med projektets diagram och deras orsaker. Namn, tangent och utseende avgörs i Penpot.
10. **Byta diagram utan länk.** Projektets diagram behöver gå att öppna även när ingen länk leder dit. Förslag: en lista i titelraden. Det är en lista med namn, inte en översiktsvy.
11. **Flera inkommande länkar** på en orsak. Förslag: ikonen öppnar en lista med källorna, som dialogen i punkt 6 i 7.1.
12. **Ångra för biblioteket.** *Ändra överallt* ändrar `bibliotek.json`, inte diagrammet. Förslag: det är ett steg i det aktuella diagrammets historik, och att ångra återställer biblioteket.
13. **Brödsmulestigens plats.** Förslag: i panelens rubrikrad eller direkt under titelraden, och bara synlig i projektläge. Avgörs i Penpot.
14. **Länkikonen** behöver en komponent i HFA DS med tillstånden hel och bruten, och en markering för delad barriär. Skillnaden ska synas utan färg (penpot-color-a11y).
15. **Knapparnas namn** (engelska i gränssnittet). Förslag: *Open folder…*, *Change everywhere*, *Make separate barrier*, *Commit message*.
16. **Zip utan bibliotek.** Verktyget ska vara en fil utan beroenden. Förslag: en egen, okomprimerad zip-skrivare, eller bara nedladdning fil för fil om det räcker.
17. **Att prova i webbläsarna:** att `showDirectoryPicker` och `history.pushState` fungerar när verktyget öppnas från `file://` i Edge, och mappval och historik i Safari. Arbetsplatsens policy kan stänga av mappåtkomst i Edge; då gäller nedladdningsvägen (6.1).
18. **Temat i filen.** `meta.theme` sparas i dag i diagramfilen, så ett temabyte ger en diff. Temat är en inställning och inte en del av analysen (4.14). Förslag: sluta spara det i filen.
19. **Commit-meddelandets jämförelsepunkt och språk.** Verktyget ser inte git, och användaren sparar oftast före commit. Förslag: ändringarna räknas från att projektet öppnades eller från förra commit-meddelandet, och meddelandet skrivs på engelska i imperativ, högst 72 tecken.
20. **`get_diagram` och leverantörerna.** Panelen behöver översätta verktygsbeskrivningen till Claudes och Geminis format och till OpenAI-formatet för lokal modell och Hugging Face, och veta om den valda modellen har tool use. Förslag: en inställning per leverantör, med omfångsvalet som reserv.

### 7.6 Nästa steg

1. Granska kraven i 7.1–7.5 och [kapitel 6](designprinciper.md) i designprinciperna, och avgör de öppna punkterna.
2. Rita i Penpot: länkikonen (hel och bruten) och markeringen för delad barriär i HFA DS, brödsmulestigen, diagramlistan, dialogen för delad barriär, förslagslistan och omfångsvalet i analyspanelen.
3. Därefter tester och bygge enligt [arbetssatt.md](arbetssatt.md) (2.1), ett krav i taget, med `@later` borttaget efter hand.
