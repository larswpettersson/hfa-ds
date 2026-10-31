# Designprinciper: HFA-familjen

*English version: [design-principles.md](design-principles.md)*

Designbeslut som gäller alla HFA-verktyg (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) och Penpot-filen **HFA DS**. [arkitektur.md](../arkitektur.md) beskriver hur repona hänger ihop. Det här dokumentet beskriver vad verktygen ska vara till för, hur de ska se ut, och varför.

## 1. Syfte och enkelhet

### 1.1 Vad verktygen är till för

Verktygen används i två situationer:

- **Analys:** en analytiker eller en arbetsgrupp gör en STPA, HTA, bowtie eller RBD.
- **Möten:** status för säkerhetsrelaterade förlopp presenteras och diskuteras, ofta på projektor och med deltagare som inte själva använder verktyget.

Båda situationerna kräver att verktyget går att förstå direkt, utan introduktion.

### 1.2 Principer

1. **Så enkelt som möjligt.** Varje funktion ska motivera sin plats. Hellre få funktioner som är självklara än många som kräver förklaring.
2. **Intuitivt.** Det som syns på skärmen ska gå att använda utan att läsa hjälpen. Hjälpdialog och kortkommandon är ett komplement, inte en förutsättning.
3. **Användaren gör analysen.** Verktyget stödjer metoden och gör strukturen synlig. Slutsatserna är analytikerns och gruppens.
4. **AI är ett valfritt stöd, inte motorn.** Verktygen ska vara fullt användbara utan modell. En modell kan granska, föreslå eller formulera, men den ska inte lösa analysen åt användaren eller ta stor plats i gränssnittet. Förslag visas i diagrammet och godkänns av användaren (se 1.3).
5. **Fungerar i möten.** Diagram och status ska gå att läsa på avstånd och förstås av den som inte byggt analysen: tydlig hierarki, få färger och inget brus.
6. **Samma sak ser likadan ut i alla verktyg.** Gemensamma komponenter och tokens från HFA DS.
7. **En fil, inget byggsteg.** Varje verktyg är en självförsörjande HTML-fil som går att läsa, ändra och köra utan nätverk (se 2.2).

En ny funktion prövas mot frågan: *blir verktyget enklare att använda i en analys eller i ett möte?* Om svaret är nej hör funktionen inte hemma i verktyget.

### 1.3 Vision: ett AI-förslag syns i diagrammet

Ett förslag från AI ska gå att *se* innan det godkänns: hur det ändrar HTA-trädet, bowtien eller kontrollstrukturen i STPA. Förslaget visas i samma diagram som analysen, inte som JSON eller text som användaren själv måste översätta. Samma visning ska fungera i möten, där gruppen kan jämföra nuläge och förslag.

*Riktning för kommande implementering.* Inget av detta är byggt ännu (2026-10-31). Ny kod som visar AI-förslag ska följa riktningen nedan, och avsteg ska motiveras.

- **Före / Efter / Skillnad.** Ett förslag öppnar en granskningsvy med en omkopplare i tre lägen. *Före* visar analysen som den är och *Efter* som den blir. *Skillnad* visar båda i samma diagram med markerade ändringar. Läget lämnas med **Godkänn** eller **Avvisa**.
- **Ändringar markeras med form och symbol, inte bara färg** (färgblindhet, projektor):

  | Ändring | Markering |
  |---|---|
  | Tillagd | Streckad ram och märket **+** |
  | Borttagen | Blek, med genomstruken text och märket **−**. Den ligger kvar på sin plats så att man ser vad som försvinner. |
  | Ändrad | Ram och märket **~**. Gammalt värde står genomstruket under det nya. |
  | Oförändrad | Som vanligt, något nedtonad i läget *Skillnad* |

  Färgerna är de semantiska tokens för success, error och warning. Markeringen ska gå att läsa även i gråskala.
- **Per verktyg:**
  - **HTA:** nya uppgifter syns streckade i trädet. Borttagna ligger kvar blekt. En flyttad uppgift visar en skugga på den gamla platsen. Ändrade TTA-celler visar gammalt och nytt värde. Bara innehåll markeras, inte omnumrering av id.
  - **Bowtie:** nya och borttagna orsaker, konsekvenser och barriärer markeras som ovan. Ändrad status eller styrka visas som gammalt → nytt på barriären. Nya kopplingar ritas streckade och borttagna prickade och bleka.
  - **STPA:** nya och borttagna block, styråtgärder och återkopplingar markeras på samma sätt. Byte av typ (t.ex. aktuator → styrd process) visas med ett märke. Ändrade rader i tabellerna för förluster, faror, UCA:er och krav markeras.
- **Implementering: ett gemensamt sätt att räkna fram skillnaden.** Förslaget tillämpas på en kopia, och kopian jämförs med nuläget per id. Diagrammet ritas från "efter" plus de borttagna elementen, med en CSS-klass per ändringstyp. Det blir ingen separat vy att underhålla.

### 1.4 Följder för pågående arbete (2026-10-31)

- **hfa-stpa:** workbenchen har blivit komplex. Chatt, flera modelleverantörer, MCP och patchar har vuxit fram, och AI-modellen löser mycket åt användaren. Den ska ses över mot principerna ovan: vad behövs vid analys och i möten, och vad kan tas bort eller döljas?
- **AI i hfa-hta och hfa-bowtie** (grenen `claude/ai-assistant`) och **Hugging Face-konfigurationen** i hfa-ds är inte testkörda. De granskas mot principerna innan något mergas.

### 1.5 Scenario: HTA-workshop med AI som skribent

Scenariot visar hur visionen i 1.3 används i en typisk workshop där en HTA och dess TTA detaljeras. AI:n agerar **teknisk skribent**: den sammanfattar det som sagts och föreslår ändringar, men analyserar inte själv. Ändringarna syns i trädet och tabellen innan gruppen godkänner dem.

**Deltagare:** Anna (HF-specialist och facilitator, styr verktyget på projektorn), Erik (lokförare), Maria (vagnsvisitör) och Johan (säkerhetssamordnare). AI-skribenten får diskussionen som Annas stödanteckningar eller som transkribering.

#### Fas 1: hierarkin tar form

Anna har förberett ett grovt träd: *1 Genomföra bromsprov före avgång* med 1.1 Förbereda prov, 1.2 Fylla huvudledning, 1.3 Kontrollera broms och 1.4 Rapportera resultat.

> **Maria:** "Kontrollera broms" är egentligen tre saker. Föraren ansätter, jag går längs tåget och tittar på varje vagn, och sen signalerar jag tillbaka.
>
> **Erik:** Och sen ska bromsen lossas och kontrolleras igen. Det glöms ofta bort i analyser.
>
> **Johan:** Rapporteringen, är den verkligen en egen uppgift? Den sker ju i samma samtal.
>
> **Maria:** Nej, den är skriftlig hos oss. Den ska vara kvar.

Anna ber skribenten sammanfatta. Förslaget visas i trädet i läget *Skillnad*: 1.3.1 Ansätta broms från förarplats, 1.3.2 Gå längs tåget och kontrollera varje vagns broms, 1.3.3 Signalera "broms till" till föraren och 1.4 Lossa broms och kontrollera visas som tillagda (streckad ram och +). Att "Rapportera resultat" numreras om från 1.4 till 1.5 markeras inte, eftersom innehållet är detsamma.

Skribenten noterar också en **öppen fråga**: ska rapporteringen vara en egen uppgift? Johan var tveksam och Maria vill behålla den. Ingen ändring görs.

Gruppen ser direkt att 1.4 "Lossa broms" borde delas upp på samma sätt som 1.3. Anna godkänner 1.3.1–1.3.3, avvisar 1.4 i den här formen och ber om en ny uppdelning. Den öppna frågan sparas i protokollet.

#### Fas 2: TTA, ett löv i taget

Anna markerar lövet *1.3.2 Gå längs tåget och kontrollera varje vagns broms*. Diskussion och förslag gäller nu bara det lövet.

> **Maria:** Det vanligaste är att man hoppar över en vagn. Mörker, regn, det är bråttom.
>
> **Erik:** Ibland går man bara halva tåget för att man "vet" att resten är okej.
>
> **Johan:** Båda förekommer. Det första är en glömska, det andra en genväg.
>
> **Erik:** Då går en vagn med urkopplad broms ut, och bromsförmågan blir sämre än föraren tror. Det upptäcks kanske vid en hård inbromsning, och då är det för sent.

Skribenten föreslår två TTA-rader. Nya rader och ifyllda celler markeras i tabellen:

| Kolumn | Rad 1 | Rad 2 |
|---|---|---|
| External Error Mode | Omission (vagn hoppas över) | Omission (delar av tåget kontrolleras inte) |
| Human Error Type | Lapse | Violation (genväg) |
| Consequence | Vagn med urkopplad broms går ut, sämre bromsförmåga än föraren tror | samma |
| Recovery | *Ingen säker återhämtning identifierad (Erik: "kanske vid hård inbromsning")* | samma |
| PSFs | Mörker, väder, tidspress | Tidspress, rutin |
| Comments | Johan: checklista och pannlampa bör ses över som åtgärd | Johan: förekommer, omfattningen okänd |

Att Recovery saknas står kvar uttryckligen. Skribenten lägger inte till egna åtgärder; förslaget i Comments är Johans och står med hans namn. Gruppen godkänner raderna och går vidare till nästa löv.

#### Fas 3: avslut

Skribenten sammanställer ett protokoll: godkända och avvisade ändringar i hierarkin, de TTA-rader som fyllts i, öppna frågor och föreslagna åtgärder med vem som tog upp dem. Gruppen går igenom protokollet på skärmen. Analysen i verktyget är redan uppdaterad och blir underlag för nästa workshop.

#### Vad scenariot kräver av verktyget

1. **AI:n är skribent, inte analytiker.** Den formulerar bara det som sagts, markerar oenighet och osäkerhet och lämnar celler tomma när gruppen inte kom fram till något.
2. **Ändringarna syns i både träd och tabell** i lägena Före / Efter / Skillnad (1.3).
3. **Varje ändring godkänns eller avvisas för sig**, inte bara hela förslaget.
4. **Öppna frågor sparas som en lista** och ändrar inte analysen.
5. **Fokus på ett löv** begränsar diskussion och förslag till den markerade uppgiften.
6. **Protokollet kan exporteras** med ändringar, beslut och öppna frågor.
7. **Inmatning och integritet avgörs senare.** Diskussionen kan komma in som anteckningar, transkribering eller båda. En inspelning av ett möte som skickas till en molnmodell är känslig; en lokal modell eller bara anteckningar kan vara ett krav.

#### Visualisering

Visualiseringen görs i Penpot (HFA DS), med HTA-verktygets egen layout, och kopplas hit så här:

- **Bild i dokumentet:** boards exporteras som SVG eller PNG till `docs/img/` och visas med `![…](img/…)`. Bilden länkar till prototypen.
- **Länk till prototypen:** en delningslänk från Penpots View mode (*Share → Get link*), som kan öppnas utan Penpot-konto. *Länk läggs in när prototypen finns.*

## 2. Typografi

### 2.1 Grund: Trafikverkets grafiska profil

Trafikverkets grafiska manual ([Typografisk enkelhet](https://bransch.trafikverket.se/grafisk-profil/trafikverkets-grafiska-profil/grafisk-manual/typografi/), granskad 2025-02-19) har följande regler:

- **Digitala produktioner använder Open Sans** i bara två vikter: **Regular** och **Bold**. Whitney används för tryck och Arial/Georgia för MS Office.
- Håll **antalet vikter och storlekar så lågt som möjligt**.
- Undvik **understruken och kursiv** text. Använd andra vikter bara i undantagsfall.
- **Versaler** är tillåtna i korta rubriker när sammanhanget kräver det, men aldrig i längre rubriker.
- Text på bild och färgade plattor kräver kontrast på minst 3:1. Vit text på färgade plattor blir mer lättläst med större storlek eller fet vikt.

### 2.2 Typsnittslista: ingen inbäddning

```css
--font-sans: "Open Sans", Arial, sans-serif;
--font-mono: ui-monospace, Consolas, "Courier New", monospace;
```

Varje verktyg är en enda självförsörjande HTML-fil som ska vara **lätt att läsa och uppdatera**, och som ska fungera **air-gapped**. Typsnittet anges därför bara med namn. Det finns ingen `@font-face`, ingen base64-kodad typsnittsdata och inget byggsteg.

| Dator | Typsnitt som visas |
|---|---|
| Open Sans installerad | Open Sans, som följer profilen |
| Open Sans inte installerad | Arial, som är Trafikverkets Office-typsnitt, finns i Windows och fortfarande ingår i profilen |

**Avvägning:** utseendet skiljer sig något mellan datorer. Arial är lite smalare, så radbrytningar kan flytta sig. Det accepteras i utbyte mot enkla filer.

**Varför inte Source Sans 3:** verktygen hade tidigare `"Source Sans 3"` först i listan. Den ingår inte i Trafikverkets profil och är, precis som Open Sans, inte förinstallerad i Windows. I praktiken såg de flesta användare därför reservtypsnittet Segoe UI, som inte heller ingår i profilen.

**Framtida alternativ:** om verktygen måste se exakt likadana ut överallt kan Open Sans bäddas in (Regular och Bold, latinska tecken inklusive å/ä/ö, cirka 25–35 kB per vikt som WOFF2), men bara i `*_offline.html`-filerna och i ett tydligt avgränsat block sist i filen. Källfilerna som redigeras förblir rena. Både Open Sans och Source Sans 3 har licensen SIL Open Font License, som tillåter inbäddning.

### 2.3 Typografisk skala

Sex storlekar och två vikter. Namnen motsvarar tokens i seten `mode/light` och `mode/dark` i Penpot-filen **HFA DS**.

| Token | Storlek | Vikt | Radavstånd | Användning i verktygen |
|---|---|---|---|---|
| `font.size.xs` / `typography.caption`, `caption-bold` | 12 px | Regular / Bold | 1.35 | Sekundär text: ID, metadata, chips, pills, förklaringar, tips, tabellhuvuden, undertexter i diagram |
| `font.size.sm` / `typography.small` | 14 px | Regular | 1.5 | **Standardtext i gränssnittet**: brödtext, knappar, formulär, tabeller, paneler, statusmeddelanden, etiketter i diagram |
| `font.size.md` / `typography.body`, `body-bold` | 16 px | Regular / Bold | 1.5 | Panel- och avsnittsrubriker (Bold), längre läsbar text som hjälpdialoger |
| `font.size.lg` / `typography.heading-3` | 20 px | Bold | 1.3 | Applikationstitel |
| `font.size.xl` / `typography.heading-2` | 24 px | Bold | 1.25 | Sidrubriker i rapporter och exporter |
| `font.size.2xl` / `typography.heading-1` | 32 px | Bold | 1.25 | Bara webb och rapporter, används inte i verktygen |

Regler:

1. **14 px är grundstorlek i alla verktyg.** Verktygen är täta arbetsgränssnitt med tabeller, diagram och formulär. STPA och RBD använder redan 14 px, och det gör även det befintliga tokenet `size.normal`.
2. **12 px är minsta storlek.** Använd inte 10, 10,5 eller 11 px. Text på 12 px måste ha en kontrast på minst 4,5:1.
3. **Bara hela storlekar från skalan.** Avrunda 12,5 och 13 till 12 (sekundär text) eller 14 (primär text), och 15 och 18 till 16.
4. **Bara vikterna 400 och 700.** Ersätt 600 (semibold) med 700 och 500 med 400. Skälen är tre:
   - Manualen anger två vikter, Regular och Bold, och Open Sans Bold är 700.
   - Reservtypsnittet Arial har bara 400 och 700, så på datorer utan Open Sans visas 600 redan som 700. Med 700 ser verktygen likadana ut på alla datorer.
   - Tokens i Penpot har bara `font.weight.regular` och `font.weight.bold`, så design och kod stämmer överens.
5. **Skilj nivåer åt med vikt före storlek.** Till exempel en rubrik på 16 px Bold över text på 14 px Regular.
6. **Versaler** är bara tillåtna i korta etiketter som panelrubriker. Etiketter med versaler är 12 px Bold.
7. **Monospace** används bara för kod och JSON, i 12 px.

### 2.4 CSS-variabler i verktygen

Varje verktyg deklarerar samma variabler i `:root`, med namn efter tokens. RBD använder redan det här mönstret.

```css
:root {
  --font-sans: "Open Sans", Arial, sans-serif;
  --font-mono: ui-monospace, Consolas, "Courier New", monospace;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
}
body { font: var(--font-size-sm)/1.5 var(--font-sans); }
```

Reglerna använder variablerna, inte pixelvärden, till exempel `font-size: var(--font-size-xs)`.

### 2.5 Nuläge och föreslagna ändringar per verktyg

Inventering av huvudfilerna 2026-10-26. Värden som inte ändras finns inte med.

**Alla verktyg:**

- Byt typsnittslistan från Source Sans 3 till `"Open Sans", Arial, sans-serif`.
- Ändra `font-weight: 600` till 700. Det används för rubriker och fet text i alla fyra verktygen.
- Ändra `font-weight: 500` till 400. Det används på ett ställe vardera i HTA och RBD.

**hfa-hta** (`HTA.html`; `hta-editor.html` och `hta-editor2.html` följer samma mönster)

| Element | I dag | Förslag |
|---|---|---|
| `body` | 16 | 14 |
| `.help-dialog`, `.help-dialog h3` | 13 | 14 (h3 Bold) |
| `.tta-table`, `.column-picker`, `.status-message` | 13 | 14 |
| `.tta-table th` | 11 | 12 Bold |
| `.task-id` | 10 | 12 |
| Editortitel (`hta-editor.html`) | 24 | 20 |

**hfa-bowtie** (`Bowtie.html`)

| Element | I dag | Förslag |
|---|---|---|
| `body` | 16 | 14 |
| `.desc-text` | 16 | 14 |
| `.id-tag` | 16 | 12 |
| `.legend-row` | 14 | 12 |
| `.help-dialog`, `.help-dialog h3` | 13 | 14 (h3 Bold) |

**hfa-stpa** (`workbench/index.html`)

| Element | I dag | Förslag |
|---|---|---|
| `header h1` | 16 | 20 Bold |
| `.panel > .bar h2` (versaler) | 13 | 12 Bold |
| `#issues`, `.msg table`, `#drawer label` | 13 | 14 |
| `#safetyCaseWrap summary` | 13 / 600 | 14 / 700 |
| `#safetyCaseWrap table` | 12,5 | 14 |
| `#drawer h2` | 15 | 16 Bold |
| `#diagram text` | 12 | 14 (kontrollera diagramlayouten) |
| `#diagram .sub` | 10,5 | 12 |
| `.lbl-ca`, `.lbl-fb`, `.chip`, `.pill`, `.msg .meta` | 11 | 12 |
| Kodvy (`font: 12.5px … mono`) | 12,5 | 12 |
| Skalning av Penpot-text, `clamp(…, 8, 22)` | 8–22 | 12–20 |

**hfa-rbd** (`styles/rbd.css`, där storleksvariablerna redan följer skalan)

| Element | I dag | Förslag |
|---|---|---|
| `h1` | 24 | 20 |
| `.panel-heading` | 18 | 16 Bold |
| `.stack-caption` | 13 | 12 |
| `.analysis-detail` | 13 | 14 |

**Obs:** när brödtexten går från 16 till 14 px i HTA och Bowtie, och diagramtexten från 12 till 14 px i STPA, ändras layouten. Kontrollera nodstorlekar, radbrytningar och avstånd i diagram visuellt när ändringen görs.

### 2.6 Tokens

| Plats | Status |
|---|---|
| Penpot **HFA DS**, seten `mode/light` och `mode/dark` (samma värden i båda) | `font.family.base`, `font.family.mono`, `font.weight.regular/bold`, `font.size.xs–2xl`, `typography.heading-1/2/3`, `body`, `body-bold`, `small`, `caption`, `caption-bold` och `code` är skapade. De äldre `roboto-base` och `size.normal` pekar på `{font.family.base}` och `{font.size.sm}`. Boarden **Fonter** visar ett prov av varje stil. |
| `tokens.json` | Innehåller fortfarande bara de äldre tokens `roboto-base` (Source Sans 3-listan) och `size.normal` (14). Den uppdateras via exportflödet i [sync-workflow.md](sync-workflow.md). |

De äldre tokens `roboto-base` och `size.normal` kan tas bort när inga Penpot-filer eller verktyg längre refererar till dem.
