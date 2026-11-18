# Design: HFA Hub

**Status:** startsidan är byggd (2026-11-17) i [hfa-hub](https://github.com/larswpettersson/hfa-hub). Projekt och källbibliotek är en planerad utbyggnad (beslutat 2026-11-18), inte byggd eller ritad. Engelsk version: [design-hub.en.md](design-hub.en.md).

De generella reglerna står i designprinciperna ([4.9 Pill](designprinciper.md), [4.10 titelraden](designprinciper.md), [3.3 ytlager](designprinciper.md), [5.3 indikering](designprinciper.md) och [1.8 spårbarhet](designprinciper.md)). Det här dokumentet beskriver det som gäller för hubben. Samma mönster som [design-stpa.md](design-stpa.md), [design-hta.md](design-hta.md) och [design-bowtie.md](design-bowtie.md).

## 1. Mål

Hubben är ingången till HFA-verktygen: en sida som visar vilka verktyg som finns och öppnar dem. Med tiden blir den också platsen där ett projekts källmaterial samlas, så att det som AI-panelen för in i flera modeller går att spåra tillbaka till samma källor (1.8).

## 2. Startsidan (byggd)

1. **En fil.** `index.html` innehåller markup, CSS och några rader skript för temat. Inget byggsteg och inga anrop till nätet.
2. **Ett kort per verktyg:** namn, metod, en mening om vad verktyget gör och en *Pill* med status. Hela kortet öppnar verktyget. Knappen *One-file version* öppnar den fristående offlinefilen.
3. **RBD visas utan länk** med statusen *Not runnable yet*, tills verktyget är körbart.
4. **Relativa länkar** (`../hfa-hta/HTA.html` och så vidare), så att sidan fungerar på GitHub Pages och från `file://` när repona ligger i mappar bredvid varandra.
5. **Titelraden** har bara appnamnet och Theme. Hubben har inget dokument att skapa, öppna, spara eller ångra (undantaget i 4.10).
6. **Ytor och indikering.** Sidan är `background.base`, titelraden och korten `background.elevated` med kant. Ett kort under musen får `shadow.hovered`, och ett kort med tangentbordsfokus får `shadow.selected`.
7. **Det enda som sparas** är det valda temat (`localStorage`, nyckeln `hfa-hub:theme`).

Färgerna är handskrivna kopior av `tokens.json`, som i de andra verktygen. Testerna i `tests/hub/` och `tests/shared/` kontrollerar sidan.

## 3. Projekt och källbibliotek (planerat)

Hubben byggs ut till en arbetsyta för projekt. Den förblir en sida utan server: projektet sparas som en fil på användarens dator, på samma sätt som verktygen sparar sina analyser (arkitekturen, avsnitt 1).

- **Ett projekt** samlar modellerna (HTA, Bowtie, STPA) som hör till samma analys, källbiblioteket och projektets inställningar.
- **Källbiblioteket** innehåller källorna med deras segment (rader eller stycken). Varje källa läggs in en gång och kan användas av alla modeller i projektet.
- **Projektinställningar:** standardnivån för nya källor, *rad* eller *stycke*. Panelen föreslår den när en källa läggs in, och användaren kan välja den andra (1.8).
- **Visning av en källa** med markeringar för de ställen som modellerna bygger på.
- **Omvänd uppslagning:** markera text i en källa och se vilka element i projektets alla modeller som bygger på den.
- **Hubbens lagringsadapter** ger AI-panelen projektets källbibliotek. Panelen är densamma som i de fristående verktygen; bara adaptern skiljer (arkitekturen, avsnitt 11).

**Öppna frågor:**

- Bäddar projektfilen in modellerna, eller pekar den på modellfilerna?
- Hur får ett verktyg som öppnas från hubben tillgång till projektets källbibliotek? Verktygen är egna sidor i egna repon, och från `file://` kan två sidor inte dela data genom webbläsarens lagring. Alternativen är att hubben visar verktyget inuti sig själv, eller att projektet öppnas som en fil i verktyget.
- Hur ser hubben ut när den har ett projekt öppet, jämfört med startsidan utan projekt? Det ska ritas i Penpot.
