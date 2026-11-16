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

**Titelraden går över hela bredden, och analyspanelen är ett kort under den, längst till höger. Panelväxlingen sitter på samma plats på skärmen vare sig panelen är öppen (sist i panelens rubrik) eller stängd (i appytans övre högra hörn). Temaväxlaren står längst till höger i titelraden (designprinciper 4.7 och 4.10).**

```gherkin
Feature: Analyspanelen och titelraden
  @HTA-AI-1
  Scenario: Titelraden går över hela bredden och panelen ligger under den
    Given analyspanelen är öppen
    Then titelraden går över trädet, TTA-tabellen och analyspanelen
    And analyspanelen börjar under titelraden
    And titelraden visar temaväxlaren men inte panelväxlingen
    And panelväxlingen sitter sist i panelens rubrik

  @HTA-AI-2
  Scenario: Appytan tar hela bredden när panelen stängs
    Given analyspanelen är öppen
    When användaren klickar panelväxlingen i panelens rubrik
    Then analyspanelen är dold
    And trädet och TTA-tabellen tar hela bredden
    And panelväxlingen står kvar på samma plats på skärmen, i appytans övre högra hörn
    And titelraden visar temaväxlaren men inte panelväxlingen

  @HTA-AI-3
  Scenario: Panelväxlingen öppnar panelen igen
    Given analyspanelen är stängd
    When användaren klickar panelväxlingen i appytans övre högra hörn
    Then analyspanelen är öppen
    And panelväxlingen sitter sist i panelens rubrik
```

### HTA-NAV: indikering, markering och pilnavigering

**Piltangenterna flyttar indikeringen (en hovrad skugga) till närmaste uppgift åt pilens håll på skärmen (5.2). Musen och piltangenterna delar indikeringen (5.3). Pilar markerar inte och Ctrl/⌘+pil används inte. När en uppgift är markerad flyttar en pil den i de riktningar den kan flyttas, och Alt/Option+pil gör samma sak (5.6). Ett klick var som helst på en uppgift markerar den, texten inräknad, och Enter redigerar texten (5.11). Ctrl/⌘+Enter markerar den indikerade uppgiften och Enter ensam redigerar den.**

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
    Given indikeringen står på "1" och inget är markerat
    When användaren trycker ↓
    Then indikeringen flyttas och inget är markerat
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
 
  @HTA-NAV-9
  Scenario: En vanlig pil flyttar den markerade uppgiften
    Given "1.1" är markerad
    When användaren trycker →
    Then "1.1" har bytt plats med "1.2"

  @HTA-SEL-3
  Scenario: Ett klick på en uppgifts text markerar uppgiften
    Given inget är markerat
    When användaren klickar på texten i "1.1"
    Then "1.1" är markerad
    And ingen text har en textmarkör

  @HTA-SEL-4
  Scenario: Enter redigerar den markerade uppgiftens text, och ett id går inte att redigera
    Given användaren har klickat på id:t i "1.1"
    Then "1.1" är markerad och dess id går inte att redigera
    When användaren trycker Enter
    Then texten i "1.1" har en textmarkör

  @HTA-SEL-5
  Scenario: Ett klick på en annan uppgifts id medan en text redigeras bekräftar redigeringen och markerar den uppgiften
    Given användaren redigerar texten i "1.1"
    When användaren klickar på id:t i "1.2"
    Then behålls den nya texten i "1.1" och "1.2" är markerad
    When användaren genast klickar på "1"
    Then är "1" markerad och inte "1.2" (nästa klick sväljs inte)

  @HTA-FOCUS-1
  Scenario: Enter efter ett klick redigerar uppgiften och skickar inte AI-frågan
    Given frågefältet i AI-panelen har utkastet "ett utkast" och fokus
    When användaren klickar på texten i "1.1" och trycker Enter
    Then har texten i "1.1" en textmarkör
    And utkastet ligger kvar i frågefältet och inget har skickats

  @HTA-EDIT-1
  Scenario: En redigering efter en Enter-bekräftad redigering behålls när användaren klickar på en annan uppgift
    Given användaren har redigerat "1.1" och bekräftat med Enter
    When användaren redigerar "1.2" och sedan klickar på "1"
    Then behålls båda redigeringarna

  @HTA-EDIT-2
  Scenario: Ctrl/⌘+Z medan en text redigeras är fältets egen ångra
    Given "1.1" har duplicerats, så att kopian är "1.2" och den gamla "1.2" är "1.3"
    And användaren redigerar texten i "1.2"
    When användaren trycker Ctrl/⌘+Z
    Then är uppgifterna oförändrade och texten i "1.3" är som förut
    When användaren trycker Enter
    Then är texten i "1.3" fortfarande som förut

  @HTA-TAB-1 @later
  Scenario: Tab från en redigerad text fortsätter längs hela TTA-raden
    Given användaren redigerar texten i uppgiften "1.1"
    When användaren trycker Tab
    Then bekräftas redigeringen och fokus går till första cellen i TTA-raden för "1.1"
    When användaren trycker Tab igen
    Then går fokus till nästa cell i raden, och så vidare till sista kolumnen och sedan till radens ✕-knapp
    And Shift+Tab går tillbaka på samma sätt

  @HTA-FILE-1
  Scenario: Save skriver formatkommentaren först (designprincip 4.15)
    When användaren trycker Save
    Then är filens första nyckel "$comment", lika med verktygets formatkommentar

  @HTA-FILE-2
  Scenario: Datafilerna har samma kommentar
    Then har varje JSON-fil i hfa-hta/data och hfa-hta/fixtures verktygets formatkommentar som "$comment"
```

## 4. Det som inte ingår

- Tangenter på TTA-knapparna (*Columns…*, *Filter*, *Export CSV* och *Add row*).
- Kolumnväljaren (*TTA Column Picker*) och kolumndialogen (*TTA Column Dialog*) ändras inte, förutom typografin.
- Bilderna i AI-panelen specificeras i [design-stpa.md](design-stpa.md) (*STPA-AI-IMG*) och gäller HTA likadant.

## 5. Öppna punkter att avgöra vid bygget

- **Pilnavigering** är byggd (HTA-NAV och HTA-SEL ovan): pilarna följer skärmen, och en markerad uppgift flyttas med pilarna, i de riktningar den kan flyttas; Alt/Option+pil gör samma sak (5.6). Markering av flera uppgifter finns inte i HTA (en sort, en i taget), så Shift+Ctrl/⌘+Enter gör inget än.
- **Tab in i TTA-tabellen (en senare release, `HTA-TAB-1`).** Tab från en redigerad uppgiftstext bekräftar redigeringen och går in i TTA-tabellen, vilket är avsett beteende, men Tab besöker sedan bara de två första kolumnerna i raden. Den ska fortsätta längs hela raden, genom varje synlig kolumn till ✕-knappen. Inte undersökt än; en trolig orsak är att varje cells blur bekräftar redigeringen och ritar om tabellkroppen, vilket ersätter den cell som skulle få fokus. Rättelsen är att behålla fokus genom omritningen (till exempel genom att bara rita om när ett värde har ändrats, eller genom att flytta tillbaka fokus till cellen med samma rad och kolumn efter omritningen). Hittades när första versionen provades för hand (2026-11-15).
- **Ångra** är byggt i HTA som i de andra verktygen (4.14); medan en uppgifts text redigeras är Ctrl/⌘+Z textfältets egen ångra (`HTA-EDIT-2`).
- **TTA-tabellens bredd.** I det öppna läget är *TTA Panel* 746 px bred, men de sex kolumnerna är tillsammans cirka 880 px. Tabellen skrollar i sidled eller kolumnerna krymper. Det avgörs vid granskningen.
- **Tangenten för panelväxlingen.** I dag är den **A**, och planen är att den flyttas till **I** när *Add Above* byggs (4.7). Den delade panelen avgör det vid bygget.
- **Trädets placering.** Trädet och kopplingslinjerna är flyttade 40 px nedåt för att ge plats åt kommandona. Det är en ritning med fria former, och vid bygget placeras trädet av layouten.
- **Delade komponenter.** *Legend*, *Compact Button* (med *Key*) och *AI panel* kommer från HFA DS och måste publiceras för att HTA-filen ska se ändringarna.

## 6. Nästa steg

1. Granska grafiken.
2. Skriv testerna i `tests/hta/` och bygg i HTA, med rubrikraden och kommandona först.
3. Lägg till det gemensamma testet som kontrollerar att varje `@HTA-…`-id här har ett test. Scenarier med `@later` hoppas över.
4. Bygg bildinklistringen i den delade AI-panelen tillsammans med STPA.
