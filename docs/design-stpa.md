# Design: redigera kontrollstrukturen direkt i STPA-diagrammet

**Status:** beslutat (2026-11-08). Inget av detta är byggt. Utseendet ritas i Penpot i en annan chatt; tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-stpa.en.md](design-stpa.en.md).

De generella reglerna står i [5.10 i designprinciperna](designprinciper.md). Det här dokumentet beskriver det som gäller för STPA. Samma mönster används för HTA och Bowtie: generella regler i designprinciperna, verktygets egna krav i `design-<verktyg>.md`.

## 1. Mål

Användaren ska kunna bygga och ändra kontrollstrukturen direkt i diagrammet, utan AI, med så enkel interaktion som möjligt. Det följer av principerna i [1.2](designprinciper.md): *användaren gör analysen* och *AI är ett valfritt stöd, inte motorn*. Tangentbord och mus gör samma sak (5.4).

## 2. Beslut

Svaren på de åtta öppna frågorna, i korthet:

1. **Namn:** *Add Above*, *Add Below* och *Add Beside*, med tangenterna **A**, **B** och **S**. Orden *Child*, *Parent* och *Sibling* används inte i STPA.
2. **Typ:** typen följer läget. Ett block med något under sig är en *controller*, och blocket längst ned är en *controlled process*. I JSON finns skillnaden kvar, som i Penpot-designen av processblock. Ingen typ väljs vid skapandet.
3. **Aktuator och sensor:** normalt används bara styråtgärd och återkoppling. *Convert to actuator* och *Convert to sensor* ska finnas för båda och vara lätta att hitta.
4. **Länkar:** ett nytt block får alltid både en styråtgärd och en återkoppling, utan text. Användaren skriver texten. Länkarna *L* och *F* byggs inte.
5. **Tangenter:** A, B och S. **A** var redan genväg för AI-panelen; den flyttas till **I** (se 5.4 och 4.7).
6. **Flera markerade:** ett gemensamt nytt block som kopplas till alla markerade.
7. **Nytt diagram** börjar med en controller och en controlled process, kopplade med styråtgärd och återkoppling.
8. **Tabeller och JSON** behålls som de är. Markeringen visas i tabellen och texten redigeras där (5.9).

Dra för att koppla är inte relevant för STPA. Vänster och höger sparas inte i modellen: sidordningen följer länkarna och listordningen i JSON, och *Add Beside* anger ingen sida.

## 3. Krav i Gherkin

Ett krav är en mening med ett id. Under det står scenarierna som visar att det håller, med löpnummer. Then beskriver modellen och vad användaren ser, inte hur det ritas. Varje scenario får ett Playwright-test i `tests/stpa/` med scenariots id i testets namn, till exempel `STPA-ADD-1: Add Below ger ett block med länkar`.

### STPA-ADD: lägga till ett block

**Add Above, Add Below och Add Beside lägger till ett block i förhållande till det markerade blocket, kopplar det med styråtgärd och återkoppling utan text, markerar det och ger namncellen i tabellen fokus. Hela tillägget är ett steg som går att ångra.**

```gherkin
Feature: Lägga till block i kontrollstrukturen
  Background:
    Given STPA Workbench är öppen med controllern "Driver" och processen "Brakes", kopplade med en styråtgärd och en återkoppling
    And ingen text redigeras

  @STPA-ADD-1
  Scenario: Add Below ger ett block med länkar
    Given "Driver" är markerad
    When användaren trycker B
    Then modellen har ett nytt block under "Driver"
    And modellen har en styråtgärd från "Driver" till det nya blocket, utan text
    And modellen har en återkoppling från det nya blocket till "Driver", utan text
    And det nya blocket är markerat
    And namncellen på det nya blockets rad i tabellen har fokus

  @STPA-ADD-2
  Scenario: En kedja nedåt skrivs med tangentbordet
    Given "Driver" är markerad
    When användaren trycker B
    And skriver "ECU"
    And trycker Enter
    And trycker Esc
    And trycker B
    Then modellen har blocket "ECU" under "Driver"
    And modellen har ett nytt block under "ECU", med länkar
    And det nya blocket är markerat

  @STPA-ADD-3
  Scenario: Add Above tar över länkarna uppåt
    Given "Brakes" är markerad
    When användaren trycker A
    Then modellen har ett nytt block mellan "Driver" och "Brakes"
    And styråtgärden och återkopplingen som gick mellan "Driver" och "Brakes" går nu mellan "Driver" och det nya blocket, med oförändrad text
    And det nya blocket har en ny styråtgärd och en ny återkoppling till "Brakes", utan text

  @STPA-ADD-4
  Scenario: Add Beside får samma överordnade som det markerade blocket
    Given "Brakes" är markerad
    When användaren trycker S
    Then modellen har ett nytt block på samma nivå som "Brakes"
    And "Driver" har en styråtgärd till och en återkoppling från det nya blocket, utan text

  @STPA-ADD-5
  Scenario: Flera markerade får ett gemensamt nytt block under sig
    Given "Driver" och "Supervisor" är markerade
    When användaren trycker B
    Then modellen har ett enda nytt block
    And både "Driver" och "Supervisor" har en styråtgärd till och en återkoppling från det nya blocket

  @STPA-ADD-6
  Scenario: Flera markerade får ett gemensamt nytt block ovanför sig
    Given "Brakes" och "Steering" är markerade
    When användaren trycker A
    Then modellen har ett enda nytt block
    And det nya blocket har en styråtgärd till och en återkoppling från både "Brakes" och "Steering"

  @STPA-ADD-7
  Scenario: Add Beside för block som inte hör ihop varnar och ändrar inget
    Given "Driver" och "Brakes" är markerade
    When användaren trycker S
    Then ett meddelande säger att blocken inte har samma överordnade
    And modellen är oförändrad
    And markeringen ligger kvar

  @STPA-ADD-8
  Scenario: Ångra tar bort blocket och länkarna i ett steg
    Given användaren har lagt till ett block med B
    When användaren trycker Ctrl/⌘+Z
    Then modellen saknar det nya blocket och dess länkar

  @STPA-ADD-9
  Scenario: Bokstavstangenter är avstängda medan man skriver
    Given namncellen för ett nytt block redigeras
    When användaren skriver "Bab"
    Then cellen innehåller "Bab"
    And inga nya block har lagts till

  @STPA-ADD-10
  Scenario: Utan markering gör tangenterna ingenting
    Given inget block är markerat
    When användaren trycker A
    Then modellen är oförändrad
    And knapparna Add Above, Add Below och Add Beside är inaktiva
```

Esc i namncellen lämnar tabellen men tar inte bort blocket (5.9). Ett block utan namn visas med sitt id och kan ångras med Ctrl/⌘+Z.

### STPA-TYPE: typen följer läget

**Ett block med något under sig är en controller och blocket längst ned är en controlled process. Typen byts automatiskt när läget ändras, och fälten för den gamla typen bevaras.**

```gherkin
Feature: Typen följer läget
  @STPA-TYPE-1
  Scenario: Add Below på en controlled process gör den till controller
    Given "Brakes" är en controlled process och är markerad
    When användaren trycker B
    Then "Brakes" är en controller
    And det nya blocket är en controlled process

  @STPA-TYPE-2
  Scenario: Att ta bort det sista blocket under en controller gör den till controlled process
    Given "ECU" är en controller med ett enda block under sig
    When blocket under "ECU" tas bort
    Then "ECU" är en controlled process

  @STPA-TYPE-3
  Scenario: Fälten för den gamla typen kommer tillbaka
    Given "Brakes" har tillstånd som controlled process
    When "Brakes" blir controller och sedan controlled process igen
    Then "Brakes" har kvar sina tillstånd
```

### STPA-LINK: länkar utan text, Convert

**Länkar som skapas av ett tillägg har ingen text, och går att markera och fylla i i tabellen. *Convert to actuator* och *Convert to sensor* finns för styråtgärder respektive återkopplingar och går att hitta även när inget är markerat.**

```gherkin
Feature: Länkar och konvertering
  @STPA-LINK-1
  Scenario: En länk utan text syns och går att markera
    Given användaren har lagt till ett block med B
    Then diagrammet visar styråtgärden och återkopplingen utan text
    And båda går att markera

  @STPA-LINK-2
  Scenario: Texten skrivs i tabellen
    Given den nya styråtgärden är markerad
    When användaren skriver "ApplyBrakes" i dess textcell och trycker Enter
    Then modellen har styråtgärden med texten "ApplyBrakes"
    And diagrammet visar texten

  @STPA-LINK-3
  Scenario: Convert finns för både styråtgärd och återkoppling
    Given en styråtgärd är markerad
    Then knappen Convert to actuator är synlig i verktygsfältet och aktiv
    And knappen Convert to sensor är synlig men inaktiv, med ett verktygstips som säger varför
```

### STPA-NEW: nytt diagram

```gherkin
Feature: Ett nytt diagram
  @STPA-NEW-1
  Scenario: New ger en controller och en controlled process, kopplade
    When användaren väljer New
    Then modellen har en controller och en controlled process
    And de är kopplade med en styråtgärd och en återkoppling, utan text
```

### STPA-KEYS: tangenter och hjälp

**Add-tangenterna fungerar bara utan Ctrl, ⌘ och Alt och när ingen text redigeras. Varje kommando har en knapp i verktygsfältet över diagrammet, med tangenten i verktygstipset. AI-panelen växlas med I.**

```gherkin
Feature: Tangenter och knappar
  @STPA-KEYS-1
  Scenario: Knapparna och tangenterna gör samma sak
    Given "Driver" är markerad
    When användaren klickar knappen Add Below
    Then resultatet är detsamma som när användaren trycker B

  @STPA-KEYS-2
  Scenario: Tangenten I växlar AI-panelen, A gör det inte
    Given AI-panelen är öppen
    When användaren trycker I
    Then AI-panelen är dold
    When användaren trycker A utan att något är markerat
    Then AI-panelen är fortfarande dold

  @STPA-KEYS-3
  Scenario: Delete tar bort markerade block med deras länkar
    Given "ECU" är markerad
    When användaren trycker Delete
    Then modellen saknar "ECU" och alla länkar som hör till den
    And Ctrl/⌘+Z återställer dem i ett steg
```

## 4. Det som inte ingår

- Länkarna *L* och *F* och att dra för att koppla. Länkar mellan befintliga block ändras i tabellerna (5.1).
- Orden Child, Parent och Sibling i STPA.
- Att ange vänster eller höger. Sidordningen följer länkarna och listan.

## 5. Öppna punkter att avgöra vid bygget

- **Länk utan text:** diagrammet visar i dag länkens id när texten saknas. Hur en tom länk ritas ska avgöras i Penpot (en tom etikett, en markör eller ett id).
- **Add Above med en befintlig överordnad (STPA-ADD-3):** det nya blocket sätts in mellan dem och tar över länkarna. Det är den mest osäkra delen, eftersom länkarna flyttas.
- **Convert och blockens typ:** *Convert to actuator* gäller i dag bara styråtgärder som går till en controlled process. När ett block i mitten är en controller blir det oklart om konvertering ska vara möjlig dit.
- **Var Convert sitter:** i dag finns knapparna bara i markeringsraden under diagrammet, och bara när något är markerat. Det är därför de är svåra att hitta.
- **A och I:** att flytta AI-växlingen från A till I ändrar HTA och Bowtie, 4.7 och testerna `tests/shared/ai-panel-toggle.spec.mjs` och `tests/hta/ai-assist.spec.mjs`.

## 6. Nästa steg

1. Rita verktygsfältet, de inaktiva lägena och hjälpen i Penpot (görs i en annan chatt).
2. Granska grafiken.
3. Skriv testerna i `tests/stpa/` och bygg i STPA Workbench, med *Add Below* först, sedan *Add Beside* och *Add Above*.
4. Lägg till det gemensamma testet som kontrollerar att varje `@STPA-…`-id här har ett test.
