# Design: HTA

**Status:** beslutat (2026-11-10). Rubrikraderna, titelraden, dragfältet och pilnavigeringen är byggda; resten väntar. Utseendet är ritat i Penpot (HTA-filen och HFA DS); tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-hta.en.md](design-hta.en.md).

De generella reglerna står i designprinciperna ([4.10 titelraden](designprinciper.md), [4.11 dragfält](designprinciper.md), [4.12 vyer](designprinciper.md), [4.13 paneler](designprinciper.md), [5.10](designprinciper.md) och [1.6 bilder i AI-stödet](designprinciper.md)). Det här dokumentet beskriver det som gäller för HTA. Samma mönster som [design-stpa.md](design-stpa.md) och [design-bowtie.md](design-bowtie.md): generella regler i designprinciperna, verktygets egna krav här.

## 1. Mål

HTA ska ha **samma struktur som STPA och Bowtie**: en titelrad, paneler som kort med kant och rubrikrad, dragfält mellan panelerna och en analyspanel längst till höger. Den som kan ett verktyg ska kunna de andra.

## 2. Beslut

1. **Skärmen.** Appytan har trädet (*HTA Panel*, 360 px) till vänster och TTA-tabellen (*TTA Panel*) till höger, med ett dragfält emellan (4.11). Analyspanelen (*AI panel*, 420 px, titeln *HTA analysis*) går i full höjd längst till höger med ett dragfält emellan.
2. **Paneler.** *HTA Panel* och *TTA Panel* är kort: `background.elevated` på sidan (`base`), kant 1 px `foreground.muted` och radie 8 (4.13).
3. **Rubrikrad i trädet.** Titeln **HTA** står först och kommandona *Add Child*, *Add Sibling* och *Duplicate* efter den, på samma rad och med samma mittlinje (4.13). Tangenterna är **C**, **S** och **D**, och visas som understrukna bokstäver i knappens text: Add <u>C</u>hild, Add <u>S</u>ibling och <u>D</u>uplicate (5.10). Trädet ligger under raden.
4. **TTA-panelens rubrikrad.** Titeln **TTA** står först och *Columns…*, *Filter*, *Export CSV* och *Add row* efter den. De är *Compact Button* (28 px) och har ingen tangent, så ingen understrykning.
5. **Titelrad.** *Title bar* (4.10, *Tool* = *HTA*, appnamnet *HFA HTA*) går över appytan med *New*, *Open…*, *Save…*, *Undo* och *?* till vänster och *Theme* till höger. När analyspanelen är stängd går titelraden över hela bredden och har *Hide panel* längst till höger. *Save…* har ellips, eftersom den skapar en ny fil (4.4).
6. **Analyspanelen** är komponenten *AI panel* från HFA DS, med samma rubrik, scope, logg och frågefält som i de andra verktygen. Bilder kan klistras in eller dras in i frågefältet (1.6, kraven *STPA-AI-IMG* i [design-stpa.md](design-stpa.md)), eftersom funktionen byggs i den delade panelen.
7. **Typografi.** Alla texter är bundna till typografitokens (Open Sans). De delade TTA-komponenterna i HFA DS (*TTA Table*, *TTA Row*, *TTA Column Picker* med flera) är bundna.

## 3. Krav i Gherkin

Ett krav är en mening med ett id. Under det står scenarierna som visar att det håller. Varje scenario får ett Playwright-test i `tests/hta/` med scenariots id i testets namn. Scenarier med `@later` hoppas över.

### HTA-ADD: kommandona i trädets rubrikrad

**Trädets rubrikrad visar titeln HTA följd av Add Child, Add Sibling och Duplicate på samma rad. Tangenterna C, S och D gör samma sak som knapparna, och tangenten syns som en understruken bokstav i knappen.**

```gherkin
Feature: Kommandona i trädets rubrikrad
  Background:
    Given HTA är öppen med ett träd där uppgiften "1" är markerad

  @HTA-ADD-1
  Scenario: Rubrikraden har titeln och kommandona på samma rad
    Then rubrikraden visar HTA, Add Child, Add Sibling och Duplicate på samma rad

  @HTA-ADD-2
  Scenario: Add Child lägger till en underuppgift
    When användaren klickar Add Child
    Then modellen har en ny uppgift under "1"
    And den nya uppgiften är markerad

  @HTA-ADD-3
  Scenario: Knapparna och tangenterna gör samma sak
    When användaren trycker C
    Then modellen har ytterligare en uppgift under "1"
    When användaren trycker S
    Then modellen har en ny uppgift bredvid den markerade
    When användaren trycker D
    Then modellen har en kopia av den markerade uppgiften

  @HTA-ADD-4
  Scenario: Tangenten syns som en understruken bokstav
    Then Add Child visar en understruken C, Add Sibling en understruken S och Duplicate en understruken D

  @HTA-ADD-5
  Scenario: Bokstavstangenterna är avstängda medan man skriver
    Given en uppgifts namn redigeras
    When användaren skriver "Cd"
    Then fältet innehåller "Cd"
    And inga nya uppgifter har lagts till
```

### HTA-TTA: TTA-panelens rubrikrad

**TTA-panelens rubrikrad visar titeln TTA följd av Columns…, Filter, Export CSV och Add row på samma rad.**

```gherkin
Feature: TTA-panelens rubrikrad
  @HTA-TTA-1
  Scenario: Rubrikraden har titeln och kommandona på samma rad
    When HTA är öppen
    Then TTA-panelens rubrikrad visar TTA, Columns…, Filter, Export CSV och Add row på samma rad
    And knapparna har ingen understruken tangent
```

### HTA-AI: analyspanelen och titelraden

**Analyspanelen går i full höjd längst till höger, och titelraden går över appytan. När panelen stängs går titelraden över hela bredden och panelväxlingen visas i den.**

```gherkin
Feature: Analyspanelen och titelraden
  @HTA-AI-1
  Scenario: Titelraden går över appytan när panelen är öppen
    Given analyspanelen är öppen
    Then titelraden går över trädet och TTA-tabellen men inte över analyspanelen
    And titelraden visar Theme men inte Hide panel

  @HTA-AI-2
  Scenario: Titelraden expanderar när panelen stängs
    Given analyspanelen är öppen
    When användaren klickar panelväxlingen i panelens rubrik
    Then analyspanelen är dold
    And titelraden går över hela bredden
    And titelraden visar Theme och Hide panel längst till höger

  @HTA-AI-3
  Scenario: Hide panel öppnar panelen igen
    Given analyspanelen är stängd
    When användaren klickar Hide panel i titelraden
    Then analyspanelen är öppen
    And Hide panel är borta ur titelraden
```

### HTA-NAV: indikering, markering och pilnavigering

**Piltangenterna flyttar indikeringen (en hovrad skugga) till närmaste uppgift åt pilens håll på skärmen (5.2). Musen och piltangenterna delar indikeringen (5.3). Pilar markerar inte, Ctrl/⌘+pil används inte, och Alt/Option+pil flyttar den markerade uppgiften (5.6). Ctrl/⌘+Enter markerar den indikerade uppgiften och Enter ensam redigerar den.**

```gherkin
Feature: Indikering, markering och pilnavigering
  Background:
    Given HTA är öppen med uppgiften "1" och, under den, "1.1" och "1.2" på samma rad

  @HTA-NAV-1
  Scenario: En pil flyttar indikeringen
    Given indikeringen står på "1"
    When användaren trycker ↓
    Then indikeringen står på en annan uppgift och visas som en hovrad skugga
    And markeringen är oförändrad

  @HTA-NAV-2
  Scenario: Uppgifter på samma rad går först
    Given indikeringen står på "1.1"
    When användaren trycker →
    Then indikeringen står på "1.2"
    When användaren trycker ←
    Then indikeringen står på "1.1"

  @HTA-NAV-3
  Scenario: Vid kanten stannar indikeringen
    Given indikeringen står på "1.2", längst till höger och längst ned
    When användaren trycker → och sedan ↓
    Then indikeringen står kvar på "1.2"

  @HTA-NAV-4
  Scenario: Musen tar över indikeringen
    Given indikeringen står på "1.2" efter en piltryckning
    When musen rör sig över "1"
    Then indikeringen står på "1" och "1.2" har ingen indikering
    When användaren trycker ↓
    Then indikeringen flyttas från "1"

  @HTA-NAV-5
  Scenario: Piltangenten tar över från musen
    Given musen hovrar över "1.1"
    When användaren trycker →
    Then indikeringen står på "1.2"
    And "1.1" har ingen hovrad skugga längre

  @HTA-NAV-6
  Scenario: Bara verklig musrörelse räknas
    Given indikeringen står på "1.2" efter en piltryckning
    When en uppgift hamnar under en stilla muspekare, till exempel när trädet rullas
    Then indikeringen står kvar på "1.2"

  @HTA-NAV-7
  Scenario: Pilar markerar inte, och Ctrl/⌘+pil används inte
    Given "1" är markerad
    When användaren trycker ↓
    Then indikeringen flyttas men "1" är fortfarande markerad
    When användaren trycker Ctrl/⌘+→
    Then indikeringen är oförändrad

  @HTA-NAV-8
  Scenario: Alt/Option+pil flyttar den markerade uppgiften
    Given "1.1" är markerad
    When användaren trycker Alt/Option+→
    Then "1.1" har bytt plats med "1.2"

  @HTA-SEL-1
  Scenario: Ctrl/⌘+Enter markerar den indikerade uppgiften
    Given indikeringen står på "1.1"
    When användaren trycker Ctrl/⌘+Enter
    Then bara "1.1" är markerad

  @HTA-SEL-2
  Scenario: Enter ensam går in i textredigeringsläget och markerar inte
    Given indikeringen står på "1.1" och inget är markerat
    When användaren trycker Enter
    Then uppgiftens text har en textmarkör
    And inget är markerat
```

## 4. Det som inte ingår

- Tangenter på TTA-knapparna (*Columns…*, *Filter*, *Export CSV* och *Add row*).
- Kolumnväljaren (*TTA Column Picker*) och kolumndialogen (*TTA Column Dialog*) ändras inte, förutom typografin.
- Bilderna i AI-panelen specificeras i [design-stpa.md](design-stpa.md) (*STPA-AI-IMG*) och gäller HTA likadant.

## 5. Öppna punkter att avgöra vid bygget

- **Pilnavigering** är byggd (HTA-NAV och HTA-SEL ovan): pilarna följer skärmen, och att flytta den markerade uppgiften har flyttats från pilarna till Alt/Option+pil (5.6). Markering av flera uppgifter finns inte i HTA (en sort, en i taget), så Shift+Ctrl/⌘+Enter gör inget än.
- **Undo.** *Title bar* har *Undo* i alla verktyg, men HTA saknar ångra i dag. Antingen byggs ångra i HTA, eller så visas knappen inaktiv tills den finns.
- **TTA-tabellens bredd.** I det öppna läget är *TTA Panel* 746 px bred, men de sex kolumnerna är tillsammans cirka 880 px. Tabellen skrollar i sidled eller kolumnerna krymper. Det avgörs vid granskningen.
- **Tangenten för panelväxlingen.** I dag är den **A**, och planen är att den flyttas till **I** när *Add Above* byggs (4.7). Den delade panelen avgör det vid bygget.
- **Trädets placering.** Trädet och kopplingslinjerna är flyttade 40 px nedåt för att ge plats åt kommandona. Det är en ritning med fria former, och vid bygget placeras trädet av layouten.
- **Delade komponenter.** *Legend*, *Compact Button* (med *Key*) och *AI panel* kommer från HFA DS och måste publiceras för att HTA-filen ska se ändringarna.

## 6. Nästa steg

1. Granska grafiken.
2. Skriv testerna i `tests/hta/` och bygg i HTA, med rubrikraden och kommandona först.
3. Lägg till det gemensamma testet som kontrollerar att varje `@HTA-…`-id här har ett test. Scenarier med `@later` hoppas över.
4. Bygg bildinklistringen i den delade AI-panelen tillsammans med STPA.
