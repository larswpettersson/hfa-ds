# Design: Bowtie

**Status:** beslutat (2026-11-10). Titelraden, panelen med Add-kommandona, legenden och pilnavigeringen är byggda, och sedan 2026-11-14 också barriärbredden och ångra/gör om; resten väntar. Utseendet är ritat i Penpot (Bowtie-filen); tester och bygge väntar tills grafiken är granskad. Engelsk version: [design-bowtie.en.md](design-bowtie.en.md).

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

**Piltangenterna flyttar indikeringen (en hovrad skugga) till närmaste kort, barriär, fara eller topphändelse åt pilens håll på skärmen (5.2). Musen och piltangenterna delar indikeringen (5.3). Pilar markerar inte och Ctrl/⌘+pil används inte. När ett objekt är markerat flyttar en pil det i de riktningar det kan flyttas, och Alt/Option+pil gör samma sak (5.6). Ett klick var som helst på ett objekt markerar det, texten inräknad, och Enter redigerar texten (5.11). Ctrl/⌘+Enter markerar det indikerade och Enter ensam redigerar det.**

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
    Given indikeringen står på "C2" och inget är markerat
    When användaren trycker ↓
    Then indikeringen flyttas och inget är markerat
    When användaren trycker Ctrl/⌘+→
    Then indikeringen är oförändrad

  @BOWTIE-NAV-8
  Scenario: Alt/Option+pil flyttar de markerade barriärerna
    Given barriären "P4" är markerad med Shift+klick
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
 
  @BOWTIE-NAV-10
  Scenario: En vanlig pil flyttar det markerade objektet i de riktningar det kan flyttas
    Given orsaken "C2" är markerad
    When användaren trycker ↓
    Then "C2" har bytt plats med orsaken under
    When användaren trycker ←
    Then "C2" har inte flyttats
    Given barriären "P4" är markerad
    When användaren trycker ←
    Then "P4" har flyttat en kolumn åt vänster

  @BOWTIE-SEL-3
  Scenario: Ett klick på ett korts text markerar kortet
    Given inget är markerat
    When användaren klickar på texten i orsaken "C2"
    Then "C2" är markerad
    And ingen text har en textmarkör

  @BOWTIE-SEL-4
  Scenario: Ett klick på texten i topphändelsen eller en barriär markerar den
    When användaren klickar på topphändelsens text
    Then topphändelsen är markerad
    When användaren klickar på texten i barriären "P2"
    Then "P2" är markerad

  @BOWTIE-SEL-5
  Scenario: Enter redigerar det markerade objektets text, och ett id går inte att redigera
    Given användaren har klickat på id:t i orsaken "C2"
    Then "C2" är markerad och dess id har ingen textmarkör och går inte att redigera
    When användaren trycker Enter
    Then texten i "C2" har en textmarkör
    When användaren skriver en ny text och trycker Enter
    Then "C2" har den nya texten
```

### BOWTIE-TEXT: den synliga texten

**En text visas med högst 100 tecken och 5 rader (5.11). En längre text slutar med tre punkter, `...`. Hela texten finns kvar och visas medan texten redigeras, och i ett verktygstips medan objektet hovras eller indikeras med piltangenterna (5.11). Enter och Esc tar bort verktygstipset. Den längsta texten är 300 tecken, med en varning från 240.**

```gherkin
Feature: Den synliga texten
  @BOWTIE-TEXT-1
  Scenario: En lång text kortas med tre punkter
    Given användaren har skrivit en text på 150 tecken i topphändelsen
    When textredigeringsläget avslutas
    Then topphändelsen visar de första 100 tecknen följda av "..."
    And den sparade filen innehåller fortfarande alla 150 tecknen

  @BOWTIE-TEXT-2
  Scenario: Att hovra ett objekt med kortad text visar hela texten
    Given orsaken "C1" har en text på 159 tecken
    When musen är över "C1"
    Then ett verktygstips intill "C1" visar alla 159 tecknen
    When musen lämnar "C1"
    Then verktygstipset är borta

  @BOWTIE-TEXT-3
  Scenario: En pil visar verktygstipset också, och Enter tar bort det
    Given orsaken "C2" har en kort text och är indikerad
    Then finns inget verktygstips
    When användaren trycker ↑ och indikeringen når "C1"
    Then visas verktygstipset med hela texten i "C1"
    When användaren trycker Enter
    Then är verktygstipset borta och texten i "C1" har en textmarkör

  @BOWTIE-TEXT-4
  Scenario: Den längsta texten är 300 tecken
    Given orsaken "C1" är i textredigeringsläget
    When användaren klistrar in 400 tecken
    Then sätts bara 300 tecken in
    And en varning säger att den längsta texten är 300 tecken och rekommenderar att man hänvisar till ett annat dokument

  @BOWTIE-TEXT-5
  Scenario: Från 240 tecken rekommenderar en varning ett annat dokument
    Given texten i "C1" har 239 tecken i textredigeringsläget
    Then finns ingen varning
    When användaren skriver ett tecken till
    Then säger en varning "240 of 300 characters" och rekommenderar att man hänvisar till ett annat dokument för detaljerna

  @BOWTIE-TEXT-6
  Scenario: Verktygstipset är ett ARIA-verktygstips, också i länkläget, och Esc tar bort det
    Given "C1" har en kortad text och barriären "P3" är markerad
    When musen är över "C1"
    Then visar ett verktygstips med rollen "tooltip" hela texten, och "C1" pekar på det med aria-describedby
    When användaren trycker Esc
    Then är verktygstipset borta och "C1" pekar inte längre på det

  @BOWTIE-TEXT-7
  Scenario: Varje element med data-tip får ett verktygstips
    Given en knapp har attributet data-tip "Ångra senaste ändringen"
    When musen är över knappen
    Then visar ett verktygstips "Ångra senaste ändringen"
    When musen lämnar knappen
    Then är verktygstipset borta

  @BOWTIE-TEXT-8
  Scenario: En text med många korta rader får plats: verktygstipsets höjd är begränsad och det rullar
    Given "C1" har en text på exakt 300 tecken på 150 rader
    When musen är över "C1"
    Then är verktygstipset högst 40 % av fönstret högt, inom fönstret, och rullar för att visa resten
    And kortet visar sina första 5 rader följda av "..." och är lägre än halva fönstret

  @BOWTIE-TEXT-9
  Scenario: En text över 300 tecken från en fil visas hel i verktygstipset
    Given "C1" har en text på 353 tecken från en fil, som slutar med "END"
    When musen är över "C1"
    Then visar verktygstipset hela texten, "END" inräknat

  @BOWTIE-TEXT-10
  Scenario: Pekaren kan vila på verktygstipset, fokus som lämnar döljer det, och andra beskrivningar behålls
    Given knappen Undo har data-tip "Ångra" och aria-describedby "other"
    When musen är över knappen och sedan flyttas in på verktygstipset
    Then ligger verktygstipset kvar, och knappens aria-describedby är "other hfaTooltip"
    When musen lämnar verktygstipset
    Then är verktygstipset borta och aria-describedby är "other" igen
    When knappen får fokus med tangentbordet och användaren trycker Tab
    Then är verktygstipset borta
```

### BOWTIE-LINK: koppla en barriär till orsaker och konsekvenser

**En markerad barriär kopplas till de orsaker (eller konsekvenser) den skyddar. Numren är numren i id:n (C12 är 12, K3 är 3), inte radnumren. 1–9 växlar kopplingen direkt. Ett tal över 9 skrivs med Alt/Option nedtryckt: Alt+1+2, släpp sedan Alt, växlar nummer 12. En rad bredvid Add-knapparna listar id:n på det barriären skyddar.**

```gherkin
Feature: Koppla med nummer
  Background:
    Given Bowtie är öppet med exempeldiagrammet och 9 orsaker till (C5–C13)
    And barriären "P3" är markerad

  @BOWTIE-LINK-1
  Scenario: Ett tal över 9 skrivs med Alt nedtryckt
    When användaren håller Alt/Option, trycker 1 och sedan 2
    Then raden visar "Alt+1+2"
    When användaren släpper Alt/Option
    Then "P3" skyddar "C12"
    When användaren gör samma sak igen
    Then "P3" skyddar inte längre "C12"

  @BOWTIE-LINK-2
  Scenario: Siffrorna 1–9 följer id:t, inte raden
    Given "C1" och "C3" har bytt rad, så att "C3" står på rad 1 och "C1" på rad 3
    When användaren trycker 3
    Then skyddar "P3" "C3" och inte "C1"

  @BOWTIE-LINK-3
  Scenario: En rad listar id:n på det barriären skyddar
    Then raden visar "P3 protects causes: C4"
    When användaren trycker 3
    Then raden visar "C3, C4"
    When användaren trycker Esc
    Then raden är dold
```

### BOWTIE-EDIT: fokus och övergångarna vid redigering

**Ett klick på ett objekt flyttar tangenterna till diagrammet, en redigering går aldrig förlorad när man går vidare, och Tab bekräftar (5.11).**

```gherkin
Feature: Fokus och övergångarna vid redigering
  @BOWTIE-FOCUS-1
  Scenario: Enter efter ett klick redigerar objektet och skickar inte AI-frågan
    Given frågefältet i AI-panelen har utkastet "ett utkast" och fokus
    When användaren klickar på texten i orsaken "C1" och trycker Enter
    Then har texten i "C1" en textmarkör
    And utkastet ligger kvar i frågefältet och inget har skickats

  @BOWTIE-EDIT-1
  Scenario: En redigering efter en Enter-bekräftad redigering behålls när användaren klickar på ett annat objekt
    Given användaren har redigerat "C1" och bekräftat med Enter
    When användaren redigerar "C2" och sedan klickar på texten i "C3"
    Then behålls båda redigeringarna och "C3" är markerad

  @BOWTIE-EDIT-2
  Scenario: Tab bekräftar redigeringen
    Given användaren redigerar texten i "C1"
    When användaren trycker Tab
    Then behålls den nya texten i "C1"
```

### BOWTIE-KEYS: Alt+siffror i alla webbläsare

**Alt/Option+siffror är vägen till ett nummer över 9 (BOWTIE-LINK). Det måste fungera i Chrome, Edge, Safari och Firefox på Windows, macOS och Linux och får inte ta webbläsarens egna genvägar (5.12). Testerna körs i Chromium, WebKit och Firefox med operativsystemet simulerat av sina händelser; de riktiga genvägarna kontrolleras för hand (5.12).**

```gherkin
Feature: Alt+siffror och webbläsaren
  Background:
    Given Bowtie är öppet med 13 orsaker och barriären "P3" är markerad

  @BOWTIE-KEYS-1
  Scenario: Alt+1+2 länkar nummer 12
    When användaren håller Alt, trycker 1 och 2 och släpper Alt
    Then skyddar "P3" "C12"

  @BOWTIE-KEYS-2
  Scenario: macOS Option ger andra tecken, och koden avgör
    When tangenterna kommer som Option+1 ("¡") och Option+2 ("™") med koderna Digit1 och Digit2
    Then skyddar "P3" "C12"

  @BOWTIE-KEYS-3
  Scenario: Sifferblocket fungerar också
    When användaren håller Alt och trycker 1 och 2 på sifferblocket
    Then skyddar "P3" "C12"

  @BOWTIE-KEYS-4
  Scenario: Sidan tar tangenterna så att webbläsarens genväg inte körs
    When användaren trycker Alt+1
    Then har sidan anropat preventDefault
    When användaren släpper Alt efter kombinationen
    Then har sidan anropat preventDefault, så att menyraden inte får fokus

  @BOWTIE-KEYS-5
  Scenario: Webbläsarens egna genvägar lämnas ifred
    When användaren trycker Ctrl+1, ⌘+1, Ctrl+Alt+1 (AltGr), Alt+Shift+1 eller Ctrl+Shift+1
    Then har sidan inte anropat preventDefault
    And ingen länk har ändrats

  @BOWTIE-KEYS-6
  Scenario: Utanför länkläget tas inget
    Given ingen barriär är markerad
    When användaren trycker Alt+1 och släpper Alt
    Then har sidan inte anropat preventDefault

  @BOWTIE-KEYS-7
  Scenario: Alt+pil flyttar barriären och tas från webbläsarens bakåt och framåt
    When användaren trycker Alt+←
    Then har sidan anropat preventDefault
    And barriären har flyttat en kolumn åt vänster eller står kvar vid kanten
```

### BOWTIE-FILE: filen beskriver sitt format

**En sparad fil börjar med en "$comment" som anger formatet och dess begränsningar (designprincip 4.15). Datafilerna i repot har samma kommentar, och en fil med en text över gränsen öppnas med en varning.**

```gherkin
Feature: Filen beskriver sitt format
  @BOWTIE-FILE-1
  Scenario: Save skriver formatkommentaren först
    When användaren trycker Save
    Then är filens första nyckel "$comment", lika med verktygets formatkommentar, som säger att en text är högst 300 tecken

  @BOWTIE-FILE-2
  Scenario: Datafilerna har samma kommentar
    Then har varje JSON-fil i hfa-bowtie/data och hfa-bowtie/fixtures verktygets formatkommentar som "$comment"

  @BOWTIE-FILE-3
  Scenario: En fil med en text över 300 tecken öppnas med en varning och texten behålls
    When användaren öppnar en fil där "C1" har en text på 320 tecken
    Then säger en varning att den längsta texten är 300 tecken
    And efter "Öppna ändå" har "C1" alla 320 tecknen
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
- **Pilnavigering** är byggd (BOWTIE-NAV och BOWTIE-SEL ovan): pilarna följer skärmen och gäller bara riktningen (ett objekt långt åt sidan räknas inte), och ett markerat kort flyttas upp och ned och en markerad barriär åt vänster och höger med pilarna (Alt/Option+pil gör samma sak), också i länkläget för barriärer, där ↑/↓ fortfarande bläddrar bland länkmålen. Flera markerade kort flyttas inte som en grupp (5.6).

- **Barriärens bredd i Penpot.** Penpot har ingen storleksregel som följer längsta ordet i en radbruten text, och min/max gäller bara när storleken är *Fill*. I Bowtie-filen är barriärkolumnerna därför fasta, och bredden räknas om med ett skript när en text ändras. Ett önskemål om innehållsstyrd storlek med min/max är formulerat för Penpots utvecklare.
- **Textstorlek i barriären.** Penpot har 14 px beskrivning och 12 px id, koden har 16 px för båda. Gränserna är satta i tecken och ger därför olika pixelvärden (se tabellen i avsnitt 2). Vilken storlek som ska gälla avgörs vid granskningen.
- **Barriärtokens.** Teckenbredden 0,543 em och gränserna 6 och 12 tecken finns bara i Bowtie-koden och i Penpot-komponenten, inte i `tokens.json`.

## 6. Nästa steg

1. Rita *Legend* med ▾, kant och tillstånden *Expanded* och *Collapsed* i HFA DS, och lägg in dem i Bowtie-filen.
2. Granska grafiken.
3. Skriv testerna i `tests/bowtie/` och bygg i Bowtie, med legenden och rubrikraden först.
4. Lägg till det gemensamma testet som kontrollerar att varje `@BOWTIE-…`-id här har ett test. Scenarier med `@later` hoppas över.
