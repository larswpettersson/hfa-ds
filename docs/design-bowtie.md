# Design: Bowtie

**Status:** beslutat (2026-11-10). Inget av detta är byggt. Utseendet är ritat i Penpot (Bowtie-filen); tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-bowtie.en.md](design-bowtie.en.md).

De generella reglerna står i designprinciperna ([4.10 titelraden](designprinciper.md), [4.11 dragfält](designprinciper.md), [4.12 vyer och legend](designprinciper.md), [4.13 paneler](designprinciper.md) och [5.10](designprinciper.md)). Det här dokumentet beskriver det som gäller för Bowtie. Samma mönster som [design-stpa.md](design-stpa.md): generella regler i designprinciperna, verktygets egna krav här.

## 1. Mål

Bowtie ska ha **samma struktur som HTA och STPA**, så att den som kan ett verktyg kan de andra. Diagrammet ligger i en panel med en rubrikrad, och verktygets gemensamma delar (titelrad, analyspanel, dragfält, typografi) är desamma.

## 2. Beslut

1. **Panel.** Diagrammet ligger i panelen *Bowtie Panel* (`background.elevated`, kant 1 px `foreground.muted`, radie 8) på sidan (`base`). Korten och barriärerna ligger som `elevated` direkt på panelen och behåller sin kant (`foreground.base`) och barriärernas statusfärg.
2. **Rubrikrad.** Titeln **Bowtie** står först, och Add-kommandona *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* och *Add Consequence* står efter den, på samma rad (4.13). De var tidigare i ett verktygsfält.
3. **Tangenter.** *Add Cause* **C**, *Add Preventive Barrier* **B**, *Add Reactive Barrier* **R** och *Add Consequence* **Q** (som i hjälpdialogen). Tangenten visas på knappen (4.13).
4. **Titelrad och analyspanel.** Titelraden (4.10, *Tool* = *Bowtie*) går över appytan. Analyspanelen (420 px, titeln *Bowtie analysis*) går i full höjd längst till höger med ett dragfält emellan (4.11). När panelen är stängd går titelraden över hela bredden och har *Hide panel* längst till höger.
5. **Legenden** ligger i en egen kolumn bredvid panelen, `sunken` med kant, och är vikbar med ▾ (4.12). Den höjer sig inte längre när musen passerar, och den täcker aldrig diagrammet.
6. **Typografi.** Alla texter är bundna till typografitokens (Open Sans).

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
    Then varje Add-knapp visar sin tangent (C, B, R eller Q)
```

## 4. Det som inte ingår

- Dragfält mellan zonerna i diagrammet.
- Hjälpdialogens innehåll utöver det som redan finns (*Help – Keyboard shortcuts*).

## 5. Öppna punkter att avgöra vid bygget

- **Legenden i HFA DS.** Komponenten *Legend* har ingen rubrikrad och inga tillstånd (*Expanded* och *Collapsed*) än, och ingen kant. Det görs i HFA DS, och därefter ritas det stängda läget i Bowtie-filen.
- **Smala fönster.** Ska legenden vara stängd som standard under en viss bredd? Ett förslag, inte ett beslut.
- **Tangentens utseende på knappen.** En tangentbricka efter texten (till exempel en liten ruta med **B**) eller tangenten i parentes (*Add Cause (C)*). Jag föreslår brickan.
- **Skärmens bredd.** Det öppna läget är 2014 px bred, eftersom diagrammet (1294 px) och legenden behåller sin storlek. Det är bredare än STPA och HTA. Det avgörs vid granskningen.
- **Hover-höjningen** tas bort ur Bowtie-koden vid bygget.

## 6. Nästa steg

1. Rita *Legend* med ▾, kant och tillstånden *Expanded* och *Collapsed* i HFA DS, och lägg in dem i Bowtie-filen.
2. Granska grafiken.
3. Skriv testerna i `tests/bowtie/` och bygg i Bowtie, med legenden och rubrikraden först.
4. Lägg till det gemensamma testet som kontrollerar att varje `@BOWTIE-…`-id här har ett test. Scenarier med `@later` hoppas över.
