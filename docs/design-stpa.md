# Design: redigera kontrollstrukturen direkt i STPA-diagrammet

**Status:** beslutat (2026-11-08). Inget av detta är byggt, och *Add Above* skjuts upp till en senare version. Utseendet ritas i Penpot i en annan chatt; tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-stpa.en.md](design-stpa.en.md).

De generella reglerna står i [5.10 i designprinciperna](designprinciper.md). Det här dokumentet beskriver det som gäller för STPA. Samma mönster används för HTA och Bowtie: generella regler i designprinciperna, verktygets egna krav i `design-<verktyg>.md`.

## 1. Mål

Användaren ska kunna bygga och ändra kontrollstrukturen direkt i diagrammet, utan AI, med så enkel interaktion som möjligt. Det följer av principerna i [1.2](designprinciper.md): *användaren gör analysen* och *AI är ett valfritt stöd, inte motorn*. Tangentbord och mus gör samma sak (5.4).

## 2. Beslut

Svaren på de åtta öppna frågorna, i korthet:

1. **Namn:** *Add Above*, *Add Below* och *Add Beside*, med tangenterna **A**, **B** och **S**. Orden *Child*, *Parent* och *Sibling* används inte i STPA.
2. **Typ:** typen följer läget. Ett block med något under sig är en *controller*, och blocket längst ned är en *controlled process*. I JSON finns skillnaden kvar, som i Penpot-designen av processblock. Ingen typ väljs vid skapandet.
3. **Aktuator och sensor:** normalt används bara styråtgärd och återkoppling. Varje styråtgärd kan konverteras till ett aktuatorblock och varje återkoppling till ett sensorblock, oavsett vilka block de går mellan. *Convert to actuator* och *Convert to sensor* ska vara lätta att hitta.
4. **Länkar:** ett nytt block får alltid både en styråtgärd och en återkoppling, utan text. Användaren skriver texten. Länkarna *L* och *F* byggs inte.
5. **Tangenter:** A, B och S. **A** är redan genväg för AI-panelen; den flyttas till **I** när *Add Above* byggs (se 5.4 och 4.7). Tills dess ligger AI-växlingen kvar på A.
6. **Flera markerade:** ett gemensamt nytt block som kopplas till alla markerade.
7. **Nytt diagram** börjar med en controller och en controlled process, kopplade med styråtgärd och återkoppling.
8. **Tabeller och JSON** behålls som de är. Markeringen visas i tabellen och texten redigeras där (5.9).
9. **Markering:** klick eller Enter på ett block markerar det. Esc eller klick utanför tar bort markeringen. Shift+klick och Ctrl/⌘+klick väljer flera objekt av samma sort.
10. **Länkar och block utan text** visar sitt id (princip i 5.10).
11. **Add Above** skjuts upp. *Add Beside* och namnfältet i tabellen är godkända.
12. **Layout:** tre kolumner med dragfält emellan (4.11): kontrollstrukturen (diagrammet) till vänster, tabellerna i mitten och AI-analysen till höger, som i HTA. Titelraden (4.10) ligger överst. Rubrikraden i panelen försvinner, eftersom vybaren *CONTROL STRUCTURE* redan visar samma rubrik.
13. **Kommandona** ligger som *Compact Button* (4.10) i vänstra panelen: *Add Below*, *Add Beside* och *Add Above* på samma rad som vybarens titel *▾ CONTROL STRUCTURE* (4.13), och *Convert to actuator*, *Convert to sensor* och *Delete* i en rad under.
14. **JSON visas inte i gränssnittet.** JSON-editorn och *Format* tas bort. Vill användaren se JSON ber hen AI-panelen lista den.
15. **Open example…** flyttas från panelens rubrikrad till hjälpdialogen (*?*), som en lägre kontroll (28 px).
16. **Vyer** öppnas och stängs med en ▾ före titeln (4.12). *Compress* och *Expand* tas bort ur vybarerna.
17. **Tangenten** visas som en understruken bokstav i knappens text: Add <u>B</u>elow, Be<u>s</u>ide och <u>A</u>bove (5.10). *Delete* och *Convert …* har ingen understrykning. Hjälpdialogen får en rad överst om att den understrukna bokstaven är tangenten, och att den trycks ensam, utan Alt.

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

  # Skjuts upp: byggs inte i första versionen
  @STPA-ADD-3 @later
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

  # Skjuts upp: byggs inte i första versionen
  @STPA-ADD-6 @later
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
    And knapparna Add Below och Add Beside är inaktiva
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

**Länkar som skapas av ett tillägg har ingen text. En länk eller ett block utan text visar sitt id, så att den syns, går att markera och fyllas i i tabellen. Varje styråtgärd kan konverteras till ett aktuatorblock och varje återkoppling till ett sensorblock. *Convert to actuator* och *Convert to sensor* går att hitta även när inget är markerat.**

```gherkin
Feature: Länkar och konvertering
  @STPA-LINK-1
  Scenario: En länk utan text syns och går att markera
    Given användaren har lagt till ett block med B
    Then diagrammet visar id:t som etikett på styråtgärden och på återkopplingen
    And båda går att markera

  @STPA-LINK-2
  Scenario: Texten skrivs i tabellen och ersätter id:t
    Given den nya styråtgärden är markerad
    When användaren skriver "ApplyBrakes" i dess textcell och trycker Enter
    Then modellen har styråtgärden med texten "ApplyBrakes"
    And diagrammet visar texten i stället för id:t

  @STPA-LINK-3
  Scenario: Convert finns för både styråtgärd och återkoppling
    Given en styråtgärd är markerad
    Then knappen Convert to actuator är synlig i verktygsfältet och aktiv
    And knappen Convert to sensor är synlig men inaktiv, med ett verktygstips som säger varför

  @STPA-LINK-4
  Scenario: Convert gäller alla länkar, oavsett vilka block de går mellan
    Given en styråtgärd mellan två controllers är markerad
    When användaren väljer Convert to actuator
    Then modellen har ett aktuatorblock mellan de två blocken
    And styråtgärden går via aktuatorblocket

  @STPA-LINK-5
  Scenario: En återkoppling blir ett sensorblock
    Given en återkoppling är markerad
    When användaren väljer Convert to sensor
    Then modellen har ett sensorblock på återkopplingens väg
```

### STPA-SEL: markera och avmarkera

**Ett klick eller Enter på ett block markerar det och ger namncellen på dess rad fokus. Esc eller ett klick utanför tar bort markeringen. Shift+klick och Ctrl/⌘+klick lägger till eller tar bort objekt av samma sort (regeln i 5.5): blocken är en sort, styråtgärderna en och återkopplingarna en.**

Det skiljer sig från 5.4, där Ctrl/⌘+Enter motsvarar klick och Enter redigerar. I STPA gör Enter och Ctrl/⌘+Enter samma sak som ett klick, eftersom ett klick redan flyttar fokus till namncellen. Första Esc i namncellen lämnar tabellen och behåller markeringen (5.9). Esc i diagrammet tar bort markeringen (5.5).

```gherkin
Feature: Markera och avmarkera
  @STPA-SEL-1
  Scenario: Klick markerar ett block
    Given inget är markerat
    When användaren klickar på blocket "Driver"
    Then bara "Driver" är markerad
    And namncellen på dess rad i tabellen har fokus

  @STPA-SEL-2
  Scenario: Enter markerar det indikerade blocket
    Given indikeringen står på "Driver"
    When användaren trycker Enter
    Then resultatet är detsamma som vid ett klick på "Driver"

  @STPA-SEL-3
  Scenario: Esc i diagrammet tar bort markeringen
    Given "Driver" är markerad och fokus är i diagrammet
    When användaren trycker Esc
    Then inget är markerat

  @STPA-SEL-4
  Scenario: Klick utanför tar bort markeringen
    Given "Driver" är markerad
    When användaren klickar på en tom yta i diagrammet
    Then inget är markerat

  @STPA-SEL-5
  Scenario: Shift+klick och Ctrl/⌘+klick väljer flera av samma sort
    Given "Driver" är markerad
    When användaren Shift+klickar på "Brakes"
    Then "Driver" och "Brakes" är markerade
    When användaren Ctrl/⌘+klickar på "Brakes"
    Then bara "Driver" är markerad

  @STPA-SEL-6
  Scenario: Ett objekt av en annan sort ersätter markeringen
    Given blocket "Driver" är markerat
    When användaren Shift+klickar på en styråtgärd
    Then bara styråtgärden är markerad
```

### STPA-VIEW: vyer och exempel

**JSON-editorn visas inte. Användaren redigerar i diagrammet och tabellerna, och ber AI-panelen lista JSON när hen vill se den. *Open example…* finns i hjälpdialogen.**

```gherkin
Feature: Vyer och exempel
  @STPA-VIEW-1
  Scenario: JSON-editorn och Format finns inte i gränssnittet
    When STPA Workbench är öppen
    Then ingen JSON-editor syns
    And det finns ingen knapp Format

  @STPA-VIEW-2
  Scenario: AI-panelen listar JSON på begäran
    Given en analys är öppen
    When användaren ber AI-panelen att visa JSON
    Then svaret innehåller analysens JSON, i samma form som när den sparas

  @STPA-VIEW-3
  Scenario: Open example… finns i hjälpdialogen
    When användaren trycker ? eller klickar på hjälpknappen
    Then en dialog med tangentlistan och Open example… visas
    And Open example… är en kontroll av vanlig höjd (28 px)

  @STPA-VIEW-4
  Scenario: Ett exempel ersätter analysen efter bekräftelse
    Given hjälpdialogen är öppen
    When användaren väljer ett exempel i Open example…
    Then en bekräftelse frågar om analysen ska ersättas (4.2)
    And efter bekräftelsen visar diagrammet och tabellerna exemplet

  @STPA-VIEW-5
  Scenario: Titelraden öppnar och stänger en vy
    Given vyn Safety case är öppen
    When användaren klickar på dess titelrad
    Then vyn är stängd och pilen visar ▸
    And de andra vyerna i kolumnen tar den lediga höjden

  @STPA-VIEW-6
  Scenario: Vybarerna har inga knappar för Compress och Expand
    When STPA Workbench är öppen
    Then ingen vybar har knapparna Compress eller Expand
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

  # Skjuts upp tillsammans med Add Above
  @STPA-KEYS-2 @later
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
- *Add Above* (och tangenten A) i första versionen. Kraven finns kvar med taggen `@later`.
- Markering av blandade sorter (5.5): markeringen innehåller bara en sort, så en AI-fråga kan inte avgränsas till ett block och en länk samtidigt (5.5).

## 5. Öppna punkter att avgöra vid bygget

- **Add Above med en befintlig överordnad (STPA-ADD-3):** skjuts upp. Det nya blocket sätts in mellan dem och tar över länkarna, vilket är den mest osäkra delen, eftersom länkar flyttas.
- **Aktuator- och sensorblock i layouten:** i dag ritas alla aktuatorer och sensorer på en rad ovanför processraden. När en styråtgärd mellan två controllers konverteras (STPA-LINK-4) ska blocket hamna mellan de två nivåerna. Schemat säger i dag att aktuatorns mål och sensorns källa är en controlled process, och den begränsningen ska bort.
- **JSON-editorn i koden:** testerna läser och skriver modellen via `#editor`. När editorn inte visas ska elementet ändå finnas kvar (dolt), eller så skrivs testerna om. Det avgörs vid bygget.
- **Hjälpdialogen** är inte ritad i Penpot (kvarstår från anteckningen i STPA-filen), med tangentlistan, *Open example…* och en primär knapp *Close*.
- **A och I:** att flytta AI-växlingen från A till I ändrar HTA och Bowtie, 4.7 och testerna `tests/shared/ai-panel-toggle.spec.mjs` och `tests/hta/ai-assist.spec.mjs`. Det görs när *Add Above* byggs.

## 6. Nästa steg

1. Rita verktygsfältet, de inaktiva lägena och hjälpen i Penpot (görs i en annan chatt).
2. Granska grafiken.
3. Skriv testerna i `tests/stpa/` och bygg i STPA Workbench, med *Add Below* först, sedan *Add Beside*, markeringen (STPA-SEL) och Convert. *Add Above* byggs senare.
4. Lägg till det gemensamma testet som kontrollerar att varje `@STPA-…`-id här har ett test. Scenarier med `@later` hoppas över.
