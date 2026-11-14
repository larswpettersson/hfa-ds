# Design: Bowtie

**Status:** beslutat (2026-11-10). Titelraden, panelen med Add-kommandona, legenden och pilnavigeringen är byggda, och sedan 2026-11-14 också barriärbredden och ångra/gör om; resten väntar. Utseendet är ritat i Penpot (Bowtie-filen); tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-bowtie.en.md](design-bowtie.en.md).

De generella reglerna står i designprinciperna ([4.10 titelraden](designprinciper.md), [4.11 dragfält](designprinciper.md), [4.12 vyer och legend](designprinciper.md), [4.13 paneler](designprinciper.md) och [5.10](designprinciper.md)). Det här dokumentet beskriver det som gäller för Bowtie. Samma mönster som [design-stpa.md](design-stpa.md): generella regler i designprinciperna, verktygets egna krav här.

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
8. **Ångra och gör om** fungerar som i HTA och STPA: knappen *Undo* i titelraden och Ctrl/⌘+Z ångrar, Ctrl/⌘+Shift+Z och Ctrl+Y gör om. Det finns ingen egen knapp för gör om.

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

**Varje ändring är ett steg som kan ångras med knappen Undo eller Ctrl/⌘+Z och göras om med Ctrl/⌘+Shift+Z eller Ctrl+Y, upp till 100 steg. New och ett AI-förslag kan ångras, Open… startar en ny historik, och i ett textfält är Ctrl/⌘+Z fältets egen ångra.**

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
- En egen knapp för gör om (som i HTA och STPA).
- Temat i ångra-historiken: ljust eller mörkt tema är en inställning och inget steg.

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
