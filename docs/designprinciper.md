# Designprinciper: HFA-familjen

*English version: [design-principles.md](design-principles.md)*

Designbeslut som gäller alla HFA-verktyg (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) och Penpot-filen **HFA DS**. [arkitektur.md](arkitektur.md) beskriver hur repona hänger ihop. Det här dokumentet beskriver vad verktygen ska vara till för, hur de ska se ut, och varför.

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

### 1.6 Bilder i AI-stödet (planerat)

Användaren ska kunna ge AI:n en bild tillsammans med frågan: ett foto av whiteboarden från en workshop, ett skärmklipp av en instruktion eller ett regelverk, eller en skiss av en bowtie från ett tidigare möte. Det passar AI:n som skribent i 1.5: den formulerar det gruppen redan har tagit fram, till exempel ett HTA-träd som ritats på tavlan.

- **Enkelt att lägga till.** Klistra in ett skärmklipp (Ctrl/⌘+V) eller dra in en bildfil i frågefältet. En liten miniatyr med ✕ visar vad som skickas med.
- **Bilder utifrån.** Verktygets egen struktur skickas redan som data, så en bild av verktygets eget diagram tillför lite.
- **Förslaget visas och godkänns som andra förslag** (1.3). AI:n tolkar bilden, men gruppen avgör vad som förs in.
- **Bilden stannar inte kvar.** Den sparas inte i verktyget eller i exporten och skickas inte om vid följdfrågor.
- **Tydligt vad som lämnar datorn.** Ett skärmklipp kan innehålla mer än man tänkt. Vid en molnleverantör ska det framgå vid bilagan; för sekretessbelagda analyser krävs en lokal modell med bildstöd.

Inget av detta är byggt ännu (2026-11-03). **Det ingår i bygget av STPA Workbench (beslutat 2026-11-10):** funktionen byggs i den delade AI-panelen (`ai-assist.js`, 4.7), så att HTA och Bowtie får den samtidigt. Kraven för STPA står i [design-stpa.md](design-stpa.md) (*STPA-AI-IMG*). Den tekniska lösningen beskrivs i [arkitektur.md](arkitektur.md), avsnitt 7.

### 1.7 Anpassningsbara TTA-kolumner (planerat)

TTA-tabellen i HTA används för olika syften: t.ex. felidentifiering enligt HEI (HRA t.ex. SHERPA/HEART/Railway Action Reliability Assessment), men till exempel också som underlag till en STPA, som kan användas för att stötta framtagningen av kontrollstruktur med kolumner som *Description of the task*, *Controller*, *Control and feedback*, *Related Hazards*. Kolumnerna ska därför gå att anpassa, och AI-stödet ska följa dem.

- **Kolumnerna hör till analysen.** Deras namn och betydelse sparas i analysfilen och följer med när den skickas vidare. Det finns bara ett ställe där kolumnerna beskrivs; AI-stödet har ingen egen kolumnlista.
- **Varje kolumn har en kort beskrivning** av vad den betyder och hur den fylls i. Beskrivningen hjälper både människor (som verktygstips på rubriken) och AI:n.
- **Användaren ändrar kolumnerna i tabellen.**
  - Klicka på en rubrik, eller välj kolumnen i panelen *Columns*, för att ändra namn och beskrivning. Beskrivningen visas som verktygstips på rubriken.
  - **+ Kolumn** lägger till en kolumn. Alla kolumner är likvärdiga och kan döpas om eller tas bort, utom *Task Step*, som är kopplingen till uppgiften i HTA-trädet. En ny analys börjar med HEI-kolumnerna, och **Reset** tar tillbaka dem.
  - Ändringar går att ångra och följer med när analysen exporteras.
- **Mallar som utgångspunkt.** Ett val som "HEI (HRA)" eller "Underlag till STPA" fyller i kolumnerna på en gång. Mallen är bara en start; analysen kan ändras efteråt.
- **AI:n följer kolumnerna, den bestämmer dem inte.** Den formulerar innehåll i de kolumner som finns. Ett förslag om nya kolumner visas och godkänns som andra förslag (1.3) och kommer i så fall senare.

Inget av detta är byggt ännu (2026-11-03). Den tekniska lösningen beskrivs i [arkitektur.md](arkitektur.md), avsnitt 8.

## 2. Typografi

### 2.1 Grund: typografisk enkelhet

- **Verktygen använder Open Sans** i bara två vikter: **Regular** och **Bold**.
- Håll **antalet vikter och storlekar så lågt som möjligt**.
- Undvik **understruken och kursiv** text. Använd andra vikter bara i undantagsfall.
- **Versaler** är tillåtna i korta rubriker när sammanhanget kräver det, men aldrig i längre rubriker.
- Text följer WCAG AA, även på bild och färgade plattor: kontrast minst 4,5:1, eller 3:1 för stor text (minst 24 px, eller 18,7 px fet). Vit text på färgade plattor blir mer lättläst med större storlek eller fet vikt.

### 2.2 Typsnittslista: ingen inbäddning

```css
--font-sans: "Open Sans", Arial, sans-serif;
--font-mono: ui-monospace, Consolas, "Courier New", monospace;
```

Varje verktyg är en enda självförsörjande HTML-fil som ska vara **lätt att läsa och uppdatera**, och som ska fungera **air-gapped**. Typsnittet anges därför bara med namn. Det finns ingen `@font-face`, ingen base64-kodad typsnittsdata och inget byggsteg.

| Dator | Typsnitt som visas |
|---|---|
| Open Sans installerad | Open Sans |
| Open Sans inte installerad | Arial, som finns i Windows och har liknande mått |

**Avvägning:** utseendet skiljer sig något mellan datorer. Arial är lite smalare, så radbrytningar kan flytta sig. Det accepteras i utbyte mot enkla filer.

**Varför inte Source Sans 3:** verktygen hade tidigare `"Source Sans 3"` först i listan. Den är, precis som Open Sans, inte förinstallerad i Windows. I praktiken såg de flesta användare därför reservtypsnittet Segoe UI.

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

## 3. Färg

### 3.1 Anpassningsbar profilfärg, tillgänglighet först

HFA DS är ett fristående projekt. Profilfärgen (`brand.*`) och eventuella kompletterande färger ska gå att byta, så att verktygen kan följa en organisations grafiska profil. **Kraven på WCAG och tillgänglighet gäller alltid före profilen:** en profilfärg som bryter mot färgreglerna i `.claude/skills/penpot-color-a11y` får inte användas för text, status eller annat som bär information.

### 3.2 Kompletterande färger mot profilröd

Så här skiljer sig en typisk kompletterande palett, grön `#005F37`, blå `#00375F`, orange `#FF5F00` och gul `#FFD700`, från profilröd `brand.primary` `#D70000` vid simulerat färgseende (Machado m.fl. 2009, svårighetsgrad 1,0, samma metod som färgreglerna). Värdena är ljushetsskillnaden ΔL\*. ⚠️ och ❌ visar var skillnaden understiger kraven i HFA DS (ΔL\* ≥ 15 eller OKLab ΔE ≥ 0,08).

| Färg | Normalt | Protanopi | Deuteranopi | Tritanopi | Gråskala |
|---|---|---|---|---|---|
| Gul `#FFD700` | 42 | 51 | 38 | 34 | 42 |
| Blå `#00375F` | 23 | ⚠️ 9 (ΔE 0,18, skiljs på nyans) | 30 | 25 | 23 |
| Orange `#FF5F00` | 16 | 19 | 15 | ❌ 6 (ΔE 0,07) | 16 |
| Grön `#005F37` | 10 (ΔE 0,32) | ❌ 3 (ΔE 0,05) | 17 | 14 | ⚠️ 10 |

**Slutsatser:**

- **Gul och blå** går att använda bredvid profilröd.
- **Grön `#005F37` ska inte användas som motsats till röd**, till exempel ok/fel eller två serier i ett diagram. Vid protanopi är den nästan lika ljus som profilröd. Behövs en grön bredvid röd ska den skilja sig tydligt i ljushet, minst ΔL\* 15 i alla simuleringar. Riktningen spelar ingen roll, men en ljusare grön är det naturliga valet.
- **Orange ska inte stå bredvid röd.** Den smälter ihop med röd vid tritanopi och ligger nära även vid normalt seende och på projektor.
- **`error` ska skilja sig från profilröd**, så att fel inte förväxlas med profilfärgen. `#5D1A14` klarar det (ΔL\* ≥ 17 i alla simuleringar). Tidigare värden i `tokens.json` (`#C70039` ljust, `#E03E3E` mörkt) gjorde det inte och är ersatta (2026-10-31).
- **Byts profilfärgen** ska tabellen räknas om och slutsatserna kontrolleras på nytt.

### 3.3 Ytlager: base, elevated och sunken

Bakgrundstokens används som tre lager. De ger gruppering och hierarki: vad som ligger ovanpå, vad som ligger under och vad som är bakgrunden. De gäller för arbetsgränssnittet i alla verktyg och i Penpot, oavsett analysmodell (träd, två sidor kring en topphändelse eller en styrstruktur).

| Token | Används för | Tanken |
|---|---|---|
| `background.base` | Sidan bakom allt | Bara bakgrunden. Inget annat ligger i `base`. |
| `background.elevated` | Det man läser eller agerar på: paneler, dialoger och popuper, objekt i diagrammet (uppgift, kort, barriär, block), knappar, tabellceller | Det som ligger ovanpå |
| `background.sunken` | Det som håller något eller är nedsänkt: diagramytan, verktygsraden, inmatningsfält och editorer, tabellens rubrikrad, förklaringen, hovrad rad | Det som ligger under |

**Kontrollregel:** ett objekt har aldrig samma token som det som det ligger direkt på. Ett objekt (`elevated`) på diagramytan (`sunken`) lyfter, medan en uppgift (`elevated`) direkt på en panel (`elevated`) bara skiljs åt av sin kant. Undantag: tabellceller på tabellens panel, där rutnätet skiljer cellerna åt, och **kontroller** (knappar och fält), tabeller och popuper på en `elevated` panel. De skiljs åt av sin kant (minst 3:1), av hover- och tryckt tillstånd och, för en popup, av en skugga (se nedan). Utan det undantaget slår regeln mot varje knapp på en panel.

Statusbakgrunder (`background.success`, `error` och så vidare) ersätter objektets fyllning och ändrar inte reglerna ovan.

**Lagren är hierarki, inte avgränsning.** Skillnaden mellan lagren är liten:

| Tema | elevated / base | elevated / sunken | base / sunken |
|---|---|---|---|
| Ljust (`tokens.json`) | 1,11 | 1,21 | 1,10 |
| Mörkt (HTA och Bowtie) | 1,17 | 1,73 | 1,49 |
| Mörkt (STPA) | 1,17 | 1,37 | 1,18 |

WCAG 1.4.11 kräver 3:1 för det som visar var en komponent börjar. Det uppfylls av **kanten** (1 px `foreground.muted` på komponenter, `foreground.base` på dialoger och kort), inte av bakgrunden. Ett objekt får alltså alltid ha sin kant. På en projektor försvinner skillnaden mellan lagren nästan helt.

#### Ingen fjärde bakgrundstoken

Det går inte att få 3:1 mellan bakgrunder, hur många tokens man än har, så länge färgreglerna kräver 7:1 för `foreground.base` mot varje bakgrund:

| Tema | Kravet på bakgrunden | Största kontrast mellan två bakgrunder |
|---|---|---|
| Ljust | Luminans minst 0,34 | 2,70 |
| Mörkt | Luminans högst 0,095 | 2,90 |

Dessutom finns det ingen plats för en fjärde i ljust tema. Ljusare än `elevated` (`#FAFBFC`) återstår bara `#FFFFFF`, med en skillnad på 1,04. Mörkare än `sunken` (`#E0E6EC`) bryts regel 6: `success` på `sunken` ger 4,8:1 och på `#D3DBE3` 4,3:1, och gränsen är 4,5:1. I mörkt tema blir stegen 1,2 till 1,7, och försvinner på en projektor. Varje ny token skulle dessutom behöva kontrolleras mot alla färgregler i båda teman, ändras i `tokens.json`, i tre verktyg och i Penpot, för en skillnad som knappt syns.

#### Djup bortom tre lager

En dialog ovanpå en panel ovanpå sidan får sitt djup på andra sätt än med en ny yta:

- **Skugga** på det som ligger ovanpå: *raised* för kort och popuper, *overlay* för dialoger. I mörkt tema syns skuggor dåligt, där bär kanten och att `elevated` är ljusare än `base` höjden.
- **Toning bakom modala dialoger.** Allt under dialogen dämpas, till exempel `foreground.base` vid 40–50 %, i stället för att dialogen får en egen yta. Webbläsarens `<dialog>` har redan en `::backdrop` för det. Toningen är ingen bakgrund som text ligger på, så färgreglerna för bakgrunder gäller den inte.
- **Kant alltid**, enligt ovan.

Skuggorna är i dag fasta värden i Penpot-komponenterna (till exempel *Process Block*). Penpot har tokentypen *shadow*, men HFA DS har inga definierade. De första som införs är `shadow.hovered` och `shadow.selected` för indikering och markering (5.3), och då i Penpot och `tokens.json` samtidigt.

#### Gäller inte

- **Den grafiska profilen** (profilröd och kompletterande färger) styrs av Trafikverkets manual och av 3.1 och 3.2.
- **Utskrifter och bilder** av analyserna, där bakgrunden ofta ska vara vit.

**Nuläge (2026-11-07):**

| Verktyg eller del | Avvikelse från 3.3 |
|---|---|
| Penpot: ✕ i tabellen | `foreground.subtle` ger 2,97:1 mot `elevated` (ljust), 4,30:1 (mörkt) och 1,46:1 mot en markerad rad. Bör vara `foreground.muted`. |
| HTA | Knapparna är `base`; bör vara `elevated` |
| Bowtie | Korten och barriärerna är `base`; bör vara `elevated`. Diagramytan är redan `sunken`. |
| STPA | Procesblocken är `sunken`; bör vara `elevated` på en `sunken` yta |

**Provat i Example (2026-11-07):** de fasta färgerna i *TTA Row*, *TTA Toolbar* (nu instanser av *Action Button*) och *TTA Column Dialog* är ersatta med tokens, och HTA-panelen har en `sunken` diagramyta med `elevated` uppgifter. Kontrollerat mot tokenvärdena i båda teman: alla kanter klarar 3:1 mot ytan under, och text i `foreground.base` klarar 7:1. Det enda som föll var ✕ ovan. Regeln om samma token på samma token slog mot knappar, tabellen och kolumnväljaren på en `elevated` panel, vilket är bakgrunden till undantaget för kontroller. Markerade rader i TTA-tabellen använder `background.info` med en röd markering, alltså en egen markering utanför de tre lagren (5.5).

## 4. Knappar och dialoger

### 4.1 Knappar som öppnar en dialog slutar med …

En knapp som öppnar en dialog, en panel eller ett filval, där användaren behöver göra något mer innan något händer, slutar med **…**. Då syns det i förväg att knappen inte gör något direkt.

| Knappen | Exempel |
|---|---|
| Öppnar en dialog, panel eller ett filval: slutar med … | **AI…**, **Columns…**, **Settings…**, **+ Column…**, **Open…**, **Save As…** |
| Gör något direkt: inget … | **New**, **Save**, **Export CSV**, **Add row**, **+ Child**, **Light**, **Dark**, och **Save** och **Cancel** i en dialog |

- Använd tecknet **…** (U+2026), inte tre punkter, och inget mellanslag före.
- Regeln gäller knappens text. Verktygstips och `aria-label` skrivs utan ….
- **Undantag:** knappar som bara visar en symbol, som hjälpknappen **?**, får inget ….
- Införs i verktygen efter hand (2026-11-03).

### 4.2 Ta bort rader i tabeller

- **Redigerbara tabeller har ett ✕ sist på varje rad.** Det är dämpat men alltid synligt, så att det går att upptäcka, fungerar på pekskärm och syns för den som följer med på projektorn.
- **Verktygstipset säger vad som tas bort**, även kopplade data, till exempel "Delete c1 and its control actions and feedback".
- **Ångra i stället för att fråga.** Raden tas bort direkt, och ett statusmeddelande säger vad som togs bort och att Ctrl/⌘+Z ångrar. Verktyget frågar först bara när borttagningen påverkar mycket utanför raden, till exempel en kolumn med värden på många rader.
- **Kräver en regel raden töms den i stället.** I HTA har varje uppgift minst en TTA-rad; för uppgiftens sista rad heter knappen *Clear*.
- **Tabeller som räknas fram ur annan data har inget ✕.** De ändras där datan finns, som säkerhetstabellerna i STPA.
- **✕ är en riktig knapp**, som nås med Tab och fungerar med tangentbordet.

STPA-workbenchens strukturtabeller följer redan principen (2026-11-03). TTA-tabellen i HTA får den i samma veva som de anpassningsbara kolumnerna.

### 4.3 New: ett minimalt, generiskt exempel

AI-stödet utgår från analysen som är öppen. Ligger det en stor eller domänspecifik analys i verktyget, till exempel ett förval eller ett tidigare projekt, präglar den modellens svar redan från första frågan. Därför ska varje verktyg ha en knapp **New** som rensar analysen och i stället visar ett **minimalt, generiskt exempel**.

- **Exemplet använder hela JSON-strukturen**, med så få element som möjligt och neutrala namn utan domän. Då visar det vad verktyget kan, och AI:n ser datamodellen utan att färgas av ett visst ämne.
  - **STPA:** en förlust, en fara, ett säkerhetskrav, två styrenheter i hierarki med processmodell (variabler och antaganden), en styrd process, en aktuator, en sensor, styråtgärder och återkopplingar (även via aktuator och sensor) och en UCA.
  - **HTA:** ett övergripande mål, två deluppgifter varav en med två operationer, TTA-kolumnerna med beskrivningar, en ifylld rad och övriga tomma.
  - **Bowtie:** fara, topphändelse, två orsaker, två konsekvenser, en förebyggande och en återställande barriär med styrka och status, och en barriär som skyddar två vägar.
- **AI-samtalet rensas samtidigt**, eftersom tidigare frågor och svar gäller den gamla analysen.
- **New frågar först**, eftersom hela analysen ersätts (4.2), och ändringen går att ångra med Ctrl/⌘+Z. Finns osparade ändringar påminner frågan om **Save**.
- Exempel och förval, som ACA759 eller STPA-workbenchens förval, laddas som tidigare. New är det neutrala startläget.

### 4.4 Open… och Save i alla verktyg

Analysfilen hanteras på samma sätt i alla verktyg, som i de flesta program (Windows, macOS, Office):

- **Open…** öppnar ett filval och öppnar en analys (JSON). Den ersätter analysen som är öppen och frågar först om det finns osparade ändringar. Den slutar med …, eftersom den alltid öppnar ett filval (4.1).
- **Save…** sparar analysen som en ny JSON-fil och slutar med …, eftersom den öppnar en dialog för namn och plats (4.1). I webbläsaren blir det i dag en nedladdning av en ny fil, inte en uppdatering av den gamla. Där webbläsaren tillåter det kan en senare **Save** skriva tillbaka till samma fil.
- Namnen ersätter **Import** och **Export** i HTA och Bowtie.
- Export till *andra* format än analysfilen heter fortfarande **Export**, till exempel **Export CSV** i HTA och **Export .md** för AI-samtalet.
- Kortkommandona Ctrl/⌘+O och Ctrl/⌘+S följer samma namn, där de införs.

**Nuläge (2026-11-04):**

| Verktyg | Rensa till exempel | Analysfil |
|---|---|---|
| STPA | Saknas; bara *Load preset…* och *New chat* (rensar bara samtalet) | **Open…** och **Save** |
| HTA | **New** (2026-11-04) | **Open…** och **Save**; Open… frågar om osparade ändringar |
| Bowtie | **New** (2026-11-04); kan inte ångras, eftersom Bowtie saknar ångra | **Open…** och **Save**; Open… frågar om osparade ändringar |
| Penpot (HFA DS) | **New** (komponenten Action Button) | **Open…** och **Save** (komponenten Action Button) |

Införs i verktygen efter hand.

### 4.5 Primary-knappen aktiveras med Enter

En **primary-knapp** är en knapp med röd fyllning (`brand.primary`) och vit text (`brand.on_primary`). Den är det som användaren oftast vill göra härnäst.

- **Enter aktiverar den.** I ett frågefält är det *Send*, och i en dialog är det dialogens primary-knapp. Esc avbryter eller svarar nej.
- **Det finns bara en aktiv primary-knapp i gränssnittet vid varje givet tillfälle.** När en dialog är öppen är det dialogens knapp; knapparna bakom den är inte aktiva och räknas inte.
- **Går primary-knappen inte att använda** visas den som inaktiv, i neutral stil och inte röd, så att en annan knapp kan vara primary. Utan en leverantör är till exempel *Send* inaktiv, och då är ingen knapp primary; *Settings…* är en vanlig knapp, eftersom det är *Send* som Enter aktiverar.
- **I en dialog som varnar för något är det säkra valet primary**, så att Enter aldrig utför det som är svårare att ångra. Det farligare valet görs med flit, med en vanlig knapp.

**Att kontrollera i verktygen:** att varje skärm och dialog har högst en röd knapp, och att Enter aktiverar den.

### 4.6 Frågefält: Enter skickar, Shift+Enter ger en ny rad

- **Enter skickar** frågan, som en aktivering av primary-knappen *Send* (4.5). **Shift+Enter** ger en radbrytning. Fältets text ska säga det: *Ask about the analysis… (Enter sends, Shift+Enter for a new line)*.
- **Ett tomt fält skickar inget.** Enter under pågående inmatning med inmatningsmetod (IME, till exempel för kinesiska eller japanska) skickar inte.
- **Ctrl/⌘+Enter skickar inte längre** (det var regeln tidigare). Den tangenten betyder *markera* (5.4).

**Nuläge (2026-11-08):** HTA, Bowtie (`ai-assist.js`) och STPA följer regeln: Enter skickar, Shift+Enter ger en ny rad, och Ctrl/⌘+Enter skickar inte. Ett tomt fält skickar inget, och Enter gör inget medan ett svar pågår (det avbryts bara med *Stop*) eller under IME-inmatning. Testet `tests/shared/enter-sends.spec.mjs` kontrollerar det i alla tre.

### 4.7 AI-panelen: en växlingsknapp, öppen som standard

- **Panelen ligger på höger sida och är öppen som standard.** En ikonknapp (ett fönster med en panel till höger) visar och döljer den. Knappen sitter på samma plats på skärmen i alla verktyg: längst till höger i verktygsraden när panelen är dold, och i panelens rubrik när den är öppen. Den ersätter ✕ och knappen *AI…*.
- **Ikonen har bara tillstånden Hovered och Pressed**, inget statustillstånd. *Pressed* är tillfälligt: det gäller medan musknappen är nedtryckt, till dess att användaren släpper den och klicket är slut. Om panelen är öppen eller dold syns på panelen själv.
- **Knappen har ingen …**, eftersom den bara visar eller döljer en panel och inte öppnar en dialog (4.1). Verktygstipset heter till exempel *Show AI panel* eller *Hide AI panel*.
- **Saknas en leverantör** är det tydligt i panelen: leverantörsfältet visar *No provider*, en ruta överst i loggen säger att man ska öppna *Settings…*, *Settings…* är en vanlig knapp och snabbåtgärder, frågefält och *Send* är inaktiva.
- **Tangenten I visar och döljer panelen** i alla verktyg, när ingen text redigeras (5.4). Den ersätter A, som *Add Above* (5.10) ska använda; tills *Add Above* är byggt gäller A.
- **Leverantörsfältet visar den valda leverantören** (till exempel *Local*), inte om kopplingen svarar.

**Nuläge (2026-11-08):** HTA, Bowtie och STPA (`ai-assist.js`) följer 4.7: panelen är öppen som standard, ikonknappen ersätter *AI…* och ✕, och utan leverantör visas *No provider*, en varningsruta, *Settings…* som vanlig knapp, och inaktiva *Send* (primary först när det finns en leverantör) och frågefält. Valet med knappen sparas. Testet `tests/shared/ai-panel-toggle.spec.mjs` kontrollerar det. STPA använder sedan 2026-11-08 samma panel som de andra (arkitektur.md, avsnitt 10), så knappen och läget utan leverantör är lika i alla tre. Snabbåtgärderna finns kvar i verktygen, medan designen i Penpot har tagit bort dem.

### 4.8 Auto: stegvis analys eller auto

- **Stegvis är förval.** AI:n föreslår ett steg i taget och användaren avgör varje förslag.
- **Auto ligger i Settings för AI-konfigurationen**, som ett reglage `Auto` som är av som standard. Det tar ingen plats i panelen.
- **Det visas en varningstext under reglaget, hela tiden, och ingen dialogruta när man slår på det.** Texten säger att AI:n i Auto tar fram stora delar av analysen på en gång, och att man behöver känna till underlaget för att förstå och bedöma analysmodellen. En enkel text under reglaget är bättre än logik för när en varning ska visas.
- **Varningen är en ruta med `background.warning`** och text i `foreground.base`. Status anges bara med fyllnadsfärg (3.3).
- **Auto ändrar inte** att AI:ns förslag visas före och efter (1.3) och att de går att ångra.

### 4.9 Smal knapp och Pill

- **Den smala åtgärdsknappen** (till exempel *Compress*, *Expand*, *Clear* och *Export .md* i AI-panelen) är en variant av Action Button: `Type = Narrow`, med samma tillstånd (*Default*, *Hovered*, *Pressed*) och tokens som de andra. Texten är 12 px (`typography.caption`), marginalen 4 och 8 px och hörnradien 4.
- **Pill** är en komponent med egenskapen `Status`: *Neutral*, *Info*, *Success*, *Warning* och *Error*. Statusen anges bara med fyllnadsfärgen (`background.info`, `success`, `warning`, `error`), texten är `foreground.base`, och kanten är `foreground.muted` på *Neutral* och `foreground.base` på statusvarianterna, så att den klarar 3:1. Leverantörsfältet i AI-panelen är en *Pill*: *Neutral* med leverantörens namn, och *Warning* med texten *No provider*.

### 4.10 Titelraden

Varje verktyg har en titelrad överst, lika i alla verktyg:

- **Appnamnet** står längst till vänster, med en liten ruta i primary-färg (`brand.primary`) före namnet.
- **Generella kommandon för hela applikationen** ligger efter namnet: *New*, *Open…*, *Save…*, *Undo*, *Settings…* och *?* (hjälp). De är **Compact Button**, en lägre variant av Action Button (28 px) med tillstånden *Default*, *Hovered* och *Pressed*.
- **Theme och panelväxlingen** (*Hide panel*, 4.7) ligger längst till höger. Theme är en växlingsknapp med sol i ljust läge och halvmåne i mörkt. Nya generella knappar läggs i den högra gruppen.
- **Verktygsspecifika kommandon** hör inte hemma i titelraden. Add-kommandona i STPA, HTA och Bowtie ligger i en rad över diagrammet (5.10).
- **Alla verktyg har samma knappar** i titelraden, även när ett verktyg inte använder alla (till exempel *Undo*). Det är bara appnamnet som skiljer.
- **Raden är responsiv i verktygen.** Bredden 1440 px gäller bara komponenten *Title bar* i HFA DS (varianterna `Tool` = STPA, HTA, Bowtie); i verktyget fyller raden bredden och den högra gruppen ligger kvar längst till höger.

**Nuläge (2026-11-09):** ritad i Penpot (HFA DS), inte byggd. De gamla verktygsfälten (komponenten *Toolbar*) ligger kvar i HFA DS.

### 4.11 Dragfält mellan paneler

Mellan alla paneler i alla verktyg finns ett **dragfält** för att ändra panelernas bredd:

- **Utseende:** ett 16 px brett fält (`background.base`) med en 4 px bred, avrundad stapel (`background.info`) mitt i, 28 px kortare än fältet i båda ändar. Det är komponenten *Drag bar* i HFA DS.
- **Var:** mellan alla paneler, inklusive mellan TTA-tabellen och analyspanelen i HTA och mellan diagrammet, tabellerna och analyspanelen i STPA.
- **Tangentbord:** pilarna ←/→ ändrar bredden när fältet har fokus, som AI-panelens dragfält gör i dag (`ai-resize`, 4.7). Fältet har `role="separator"`.
- Dragfält ersätter knappar som bara ändrar panelbredd.

**Nuläge (2026-11-09):** ritad i Penpot för STPA, inte byggd. AI-panelen har ett osynligt dragfält i dag (8 px, syns först vid hover). Tillstånden för hover och dragning är inte ritade.

### 4.12 Vyer öppnas och stängs med ▾

Varje vy (till exempel diagrammet, tabellerna och Safety case i STPA) har en vybar med en **▾ före titeln**:

- **Ett klick på pilen eller titeln öppnar och stänger vyn**, och hela raden är klickbar. ▾ betyder öppen och ▸ stängd. Med tangentbordet gäller Enter eller mellanslag på raden, och raden har `aria-expanded`.
- **Pilen är 16 px** (titeln 12 px, versaler, `font-weight` 600). Det är samma ▾ som chattens expanderbara rader, så mönstret är bekant.
- **Det finns inga knappar för *Compress* och *Expand* i vybarerna.** Öppna vyer delar den lediga höjden, och stänger man en tar de andra platsen. Panelens bredd ändras med dragfälten (4.11). Diagrammet har dessutom *Full page*.
- *Compress* och *Expand* i AI-panelen (4.9) gäller svaren i loggen och ändras inte av den här regeln.
- **Förklaringen (legenden) följer samma mönster.** Dess rubrikrad, **▾ Legend**, öppnar och stänger den, och stängd är den bara rubrikraden. Valet sparas. Legenden ligger i en egen kolumn bredvid panelen och **täcker aldrig diagrammet**, och den höjer sig inte när musen passerar (det fungerar inte med tangentbord eller pekskärm).

**Nuläge (2026-11-09):** ritad i Penpot för STPA. Verktyget har fortfarande knapparna *Compress* och *Expand* i vybarerna, och ett klick på titeln komprimerar redan i dag.

### 4.13 Paneler: titel och kommandon på samma rad

Alla verktyg har sina paneler uppbyggda på samma sätt:

- **Panelen är ett kort:** `background.elevated` på sidan (`base`), kant 1 px `foreground.muted` inåt och radie 8 (3.3). Kanten bär kontrasten, eftersom `elevated` och `base` bara skiljer sig med 1,11:1. En panel utan kant fungerar inte som en egen yta.
- **Rubrikraden har titeln först och panelens kommandon efter den, på samma rad och med samma mittlinje.** Kommandona är *Compact Button* (4.10). Exempel: **HTA** med *Add Child*, *Add Sibling* och *Duplicate*; **Bowtie** med *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* och *Add Consequence*; **TTA** med *Columns…*, *Filter*, *Export CSV* och *Add row*; **▾ CONTROL STRUCTURE** med *Add Below*, *Add Beside* och *Add Above*. Kommandon som gäller en markering (*Convert to actuator*, *Convert to sensor* och *Delete*) kan ligga i en rad under rubrikraden när de inte ryms på den.
- **Kommandon för hela applikationen** ligger i titelraden (4.10), inte i panelens rubrikrad.
- **Förklaringen (legenden)** ligger utanför panelerna, är `sunken` med samma kant, och är vikbar (4.12).
- **Tangenten visas på knappen som en understruken bokstav i texten**, till exempel Add <u>B</u>elow, inte bara i verktygstipset (5.10).

**Nuläge (2026-11-10):** ritad i Penpot för HTA, Bowtie och STPA, inte byggd. I STPA ligger *Add Below*, *Add Beside* och *Add Above* på samma rad som vybarens titel *▾ CONTROL STRUCTURE*, och *Convert to actuator*, *Convert to sensor* och *Delete* i en rad under.

## 5. Navigera, markera och flytta objekt

Samma principer gäller i alla verktyg och alla diagramtyper: uppgifter i HTA, kort, barriärer, fara och topphändelse i Bowtie, och block i STPA. Målet är att den som vill ska kunna arbeta i diagrammet med tangentbordet, utan att behöva klicka med musen på varje enskilt objekt.

### 5.1 Objekten i modellen är navigerbara

- **Det som går att navigera till, markera och flytta är objekten i analysmodellen**, det vill säga de rutor som diagrammet ritar för modellens delar.
- **Kopplingar är inte navigeringsmål.** Linjer, pilar och kanter mellan objekten (till exempel styråtgärder och återkopplingar i STPA, linjerna mellan uppgifter i HTA och barriärernas koppling till orsaker i Bowtie) hoppar man inte till med piltangenterna. De nås och ändras via objektet de hör till, via en tabell eller via en dialog.
- **Varje verktyg anger vilka objekt som är navigerbara.** Navigeringen i 5.2 behöver inte känna till modellen, bara var objekten ligger.
- Tabeller, till exempel TTA-tabellen, följer tabellernas egna konventioner och omfattas inte av 5.2; se 5.9.

### 5.2 Piltangenterna följer skärmen, inte modellen

En pil flyttar indikeringen (5.3) till närmaste objekt åt det håll pilen pekar på skärmen. Samma regel gäller för alla diagramtyper, oavsett om modellen är ett träd, två sidor kring en topphändelse eller en styrstruktur:

1. Utgå från det indikerade objektet.
2. Ta bara med objekt som ligger åt pilens håll.
3. **Objekt på samma rad eller i samma kolumn går först**, det vill säga objekt som överlappar det nuvarande i höjdled vid ←/→ och i sidled vid ↑/↓.
4. Välj det närmaste. Avståndet åt sidan väger tyngre än avståndet framåt, så att pilen hellre går rakt än snett.
5. Finns inget på samma rad eller i samma kolumn, välj det närmaste åt pilens håll.
6. **Vid kanten stannar indikeringen.** Den hoppar inte runt till andra sidan.

Exempel: → från en uppgift i HTA går till närmaste ruta till höger på samma nivå, även om den hör till en annan gren. → från en barriär i Bowtie går till det som ligger närmast till höger, en annan barriär eller topphändelsen beroende på var barriären står.

**Ctrl/⌘+pil används inte för navigering.** Bara vanliga pilar flyttar indikeringen, och de markerar aldrig något (5.3).

### 5.3 En indikering för mus och tangentbord

Det som musen hovrar över och det som piltangenterna pekar ut är samma sak, som i menyer i Windows och macOS:

- **Det finns en indikering.** Både musen och pilarna sätter den, och den ser likadan ut oavsett vilket som satte den.
- **När musen passerar ett objekt flyttas indikeringen dit**, och tangentbordets indikering försvinner.
- **Nästa pil fortsätter från det objekt musen senast var över.** Lämnar musen objekten för tom yta släcks indikeringen, men utgångspunkten sparas.
- **Bara verklig musrörelse räknas.** När ett tangenttryck rullar diagrammet och ett annat objekt hamnar under en stilla muspekare, ska det objektet inte ta indikeringen.
- **Tre lägen, tre tangenter och tre utseenden.** *Indikeringen* ger objektet den hovrade skuggan (State = Hovered), och den sätts av musen eller av en vanlig pil. *Markeringen* ger objektet en suddig skugga runt hela objektet (State = Selected), och den sätts av ett klick eller av **Ctrl/⌘+Enter**. *Textredigeringsläget* (en textmarkör i objektets text, i STPA i namncellen i tabellen, 5.9) startas av **Enter** (eller F2 eller dubbelklick). Enter bekräftar texten, och Esc avbryter. Enter ensam markerar alltså inte, och en pil markerar inte.
- **Skuggorna är tokens, lika för alla objekt.** `shadow.hovered` (indikeringen) och `shadow.selected` (markeringen: en suddig skugga runt hela objektet, spridning 4 px, oskärpa 2 px, `foreground.base` vid 40 %) definieras en gång i Penpot (HFA DS), exporteras till `tokens.json` och används av alla objekt i alla verktyg, så att indikering och markering ser likadana ut överallt (1.2, punkt 6). Värdet för `shadow.hovered` avgörs när skuggorna definieras.
- **Indikering, markering och redigering är skilda saker.** Indikeringen visar var man är, markeringen vad kommandon gäller, och redigeringen sker i textfältet. Musen tar aldrig bort markeringen, bara indikeringen.

### 5.4 Tangenterna speglar musen

Varje tangent har en motsvarighet med musen:

| Mus | Tangentbord |
|---|---|
| Hovra | Pil (5.2) |
| Klick: markera, eller det verktyget annars gör vid klick, till exempel länkläge för en barriär | Ctrl/⌘+Enter |
| Shift+klick eller Ctrl/⌘+klick: lägg till i eller ta bort ur markeringen | Shift+Ctrl/⌘+Enter |
| Dubbelklick: textredigering | Enter eller F2 |
| Dra: flytta | Alt/Option+pil (5.6) |
| Verktygsfältets knappar *Add Above*, *Add Below* och *Add Beside* (5.10) | STPA: **B**, **S** och **A** (*Add Above*, byggs senare). HTA: **C** (barn), **S** (syskon), **D** (duplicera) |
| Ta bort markerade objekt | Delete (5.10) |
| Knappen som visar och döljer AI-panelen (4.7) | **I** (tills *Add Above* är byggt: **A**) |
| Hjälpknappen | **?** |

Pil, Shift+pil (utöka markeringen) och Alt/Option+pil (flytta) följer samma mönster som i textredigerare och listor. Ctrl/⌘+pil används inte.

**Bokstavstangenterna** (A, B, C, D, I, S, ?) gäller bara när ingen text redigeras och inte när Ctrl, ⌘ eller Alt hålls nere. Varje bokstav har en enda betydelse i ett verktyg.

### 5.5 Markera flera objekt

- **Shift+klick och Ctrl/⌘+klick** lägger till ett objekt i markeringen eller tar bort det ur den. Shift+klick är konventionen i ritverktyg och Ctrl/⌘+klick i listor; båda gör samma sak, så att vanan från båda fungerar. Ett vanligt klick ersätter markeringen.
- **Markeringen innehåller bara en sorts objekt.** Shift+klick och Ctrl/⌘+klick lägger bara till objekt av samma sort som de redan markerade. Ett objekt av en annan sort ersätter markeringen, som ett vanligt klick. Varje verktyg anger sina sorter i `design-<verktyg>.md`; i STPA är block, styråtgärder och återkopplingar var sin sort (5.10).
- **Markerade objekt ser likadana ut** i alla verktyg: samma skugga runt objektet.
- **Esc eller ett klick utanför** tar bort markeringen.
- **Markeringen avgränsar AI-frågor:** hela analysen skickas som sammanhang, men frågan gäller de markerade objekten. Eftersom markeringen bara har en sort går det inte att avgränsa en fråga till objekt av olika sorter på en gång.

**Nuläge (2026-11-09):** regeln är inte byggd i något verktyg. HTA har bara en sort. STPA låter i dag blocken, styråtgärderna och återkopplingarna blandas i en markering, och Bowtie har olika modifierare för barriärer och kort; båda behöver ändras och kontrolleras.

### 5.6 Flytta markerade objekt

- **Alt/Option+pil flyttar alla markerade objekt ett steg tillsammans**, i den riktning pilen pekar och efter modellens struktur: kolumn för barriärer, rad för kort, plats bland syskon eller nivå för uppgifter, nivå eller ordning inom nivån för block. Vanliga pilar navigerar (5.2) och flyttar aldrig.
- **De behåller sin inbördes ordning**, och inget flyttas om något av dem redan står vid kanten.
- **Varje flytt går att ångra** med Ctrl/⌘+Z där verktyget har ångra.
- Alt+←/→ betyder bakåt och framåt i webbläsaren på Windows och Linux; verktyget måste stoppa det när tangenterna används i diagrammet.

### 5.7 Objekt överlappar aldrig

- **Två objekt får aldrig ta samma plats**, till exempel två barriärer i samma kolumn som täcker samma rad. Regeln gäller efter varje ändring och när en fil öppnas.
- **Det objekt som just ändrades eller flyttades får sin plats; ett objekt som skulle krocka får en egen plats direkt efter.** Ändras till exempel vilka orsaker en barriär skyddar, är det den barriären som flyttar undan.
- **Ordningen bevaras**, till exempel ordningen längs vägen till och från topphändelsen, och tomma platser tas bort.

### 5.8 Varning när objekten inte hör ihop

En flytt av flera objekt måste ha en gemensam mening. Hör de markerade objekten inte ihop, till exempel förebyggande och återställande barriärer, eller uppgifter under olika överordnade uppgifter, ska verktyget **varna**:

- **Flytten genomförs inte**, och ett meddelande säger varför och vilka objekt som kan flyttas tillsammans.
- **Markeringen ligger kvar**, så att användaren kan ta bort det som inte hör dit med Shift+klick.
- Markeringen i sig är tillåten, eftersom den också används för att avgränsa AI-frågor (5.5). Det är flytten som varnar. Objekt av olika sorter kan aldrig vara markerade tillsammans (5.5), så varningen gäller objekt av samma sort som ändå inte hör ihop.

### 5.9 Länkade vyer

När samma modell visas i två vyer, till exempel diagrammet och TTA-tabellen i HTA eller diagrammet och strukturtabellerna i STPA, **delas markeringen mellan vyerna, men fokus stannar i den vy man arbetar i.** Den andra vyn följer med genom att visa och rulla fram markeringen. Den tar inte över tangentbordet. Så fungerar till exempel VS Code, Visio och Utforskaren.

- **Markeringen följer med, inte indikeringen.** En pil i diagrammet (5.2) rullar inte tabellen. Markering i diagrammet markerar och rullar fram objektets rader i tabellen. ↑/↓ till en rad som hör till ett annat objekt markerar det objektet i diagrammet, på samma sätt som ett klick på raden.
- **Den andra vyn rullar bara om markeringen inte syns**, till närmaste läge och inte centrerat, så att den inte hoppar vid varje radbyte. Vid klick med musen får objektet centreras.
- **Varje vy är ett enda Tab-stopp.** Tab och Shift+Tab flyttar mellan vyerna; inne i en vy används piltangenterna. Fälten i diagrammets objekt nås inte med Tab, de redigeras med Enter eller F2 (5.4).
- **När man kommer in i tabellen** hamnar fokus på den första raden för det markerade objektet. **När man kommer in i diagrammet** hamnar indikeringen på det markerade objektet.
- **I tabellen gäller tabellernas konventioner:** pilar mellan celler när man inte redigerar, Enter eller F2 (eller att börja skriva) redigerar cellen. Medan man redigerar sparar Enter, Esc avbryter och Tab går till nästa cell. **Esc utan pågående redigering** lämnar tabellen och går till objektet i diagrammet. ✕ nås med Tab (4.2).
- **Ett objekt med flera rader:** markering i diagrammet markerar alla raderna och fokus hamnar på den första. ↑/↓ mellan rader för samma objekt ändrar inte markeringen i diagrammet.

**Nuläge (2026-11-04):**

| Verktyg | Navigera med pilar | Mus och tangentbord | Länkade vyer | Markera flera | Flytta flera | Ingen överlappning | Varning |
|---|---|---|---|---|---|---|---|
| STPA | Saknas | – | Klick i diagrammet visar raden i strukturtabellen | Shift+klick på block, styråtgärder och återkopplingar (kopplingarna bör i stället nås via tabellen, 5.1) | Saknas (diagrammet placerar själv) | Diagrammet placerar själv | – |
| HTA | Efter trädet: ↑ förälder, ↓ nästa i trädordning, ←/→ bara bland syskon | Musen tar inte bort tangentbordets indikering | Med musen i båda riktningarna; med tangentbordet saknas det, och Tab går mellan textfälten i uppgifterna | Saknas (en uppgift åt gången) | Saknas; vanliga pilar flyttar en markerad uppgift | Trädet placerar själv | – |
| Bowtie | Egna regler per objekttyp | Musen tar inte bort tangentbordets indikering | – (ingen tabell) | Shift+klick på barriärer, Ctrl/⌘+klick på kort | ←/→ flyttar markerade barriärer, Alt+↑/↓ flyttar kort | Ja | Ja: förebyggande och återställande barriärer flyttas inte tillsammans |

### 5.10 Bygga och ändra strukturen i diagrammet

Användaren ska kunna bygga och ändra analysens struktur direkt i diagrammet, med tangentbord och mus och utan AI (1.2, punkt 3 och 4). AI-panelen är ett komplement. Reglerna är gemensamma; varje verktyg anger sina egna krav i `design-<verktyg>.md`, för STPA [design-stpa.md](design-stpa.md).

- **Tre sätt att lägga till: ovanför, nedanför och bredvid det markerade objektet.** Kommandona heter *Add Above*, *Add Below* och *Add Beside*. Orden säger var det nya objektet hamnar i diagrammet, inte hur det hör ihop i modellen. Är inget markerat går kommandona inte att använda.
- **Ett kommando gör hela jobbet.** Objektet läggs till, kopplas enligt modellens regler, markeras, och dess namn kan skrivas direkt: fokus hamnar på namncellen på objektets rad i tabellen (5.9), inte i en ruta i diagrammet. Texter som användaren ska skriva lämnas tomma; verktyget hittar inte på något.
- **Hela tillägget är ett steg att ångra** (Ctrl/⌘+Z), även när flera länkar skapades.
- **Flera markerade objekt får ett gemensamt nytt objekt**, som kopplas till alla. Hör de markerade objekten inte ihop, till exempel för *Add Beside* när de har olika överordnade, varnar verktyget enligt 5.8 och ändrar ingenting.
- **Objekt och länkar utan text visar sitt id.** En länk eller ett objekt som användaren inte har skrivit något till syns ändå, går att markera och visar var texten saknas. Id:t ersätts av texten när den skrivs. Exempel: en ny styråtgärd utan text visas med etiketten *ca3*, och med *ApplyBrakes* när den är ifylld.
- **Delete tar bort det markerade tillsammans med det som hör till det**, till exempel länkarna, och går att ångra i ett steg.
- **Varje kommando har en knapp i verktygsfältet över diagrammet**, med tangenten i verktygstipset (5.4). Knappen är inaktiv när kommandot inte går att använda, så att den visar vad som är möjligt. Det är vanliga knappar: Enter är primary-knappens tangent (4.5).
- **Tangenten är en understruken bokstav i knappens text.** Den tar ingen plats, och knapparna är redan breda. Bokstaven är en ensam tangent som trycks utan Alt, med objektet markerat. Understrykningen betyder i Windows annars "tryck Alt + bokstaven" i menyer, så det förklaras på tre ställen:
  - hjälpdialogen (*?*) har överst raden "Den understrukna bokstaven är tangenten. Tryck den ensam, utan Alt.",
  - verktygstipset visar tangenten utan modifierare, till exempel *Add Below (B)*,
  - knappen har `aria-keyshortcuts`, så att skärmläsare också får tangenten.
- **Knappar utan bokstav i texten har ingen understrykning.** *Delete* visar sin tangent i verktygstipset (en understruken **D** skulle peka på *Duplicate* i HTA), och *Convert to actuator* och *Convert to sensor* har ingen tangent. *Compact Button* har ett valfritt element, *Key*, för den understrukna bokstaven.
- **Bokstavstangenterna är avstängda medan man skriver**, och **?** öppnar hjälpen med de tangenter som gäller.
- **Kopplingar mellan befintliga objekt** ändras i tabellerna, inte med egna länklägen (5.1).
- **Diagram och tabeller är två vägar till samma modell.** Markeringen delas och texten redigeras i tabellen (5.9).

**Nuläge (2026-11-08):** inte byggt, och *Add Above* skjuts upp. STPA är första verktyget (se [design-stpa.md](design-stpa.md)). HTA har i dag *C*, *S* och *D* med verktygets egna ord *Child*, *Sibling* och *Duplicate*; att samordna orden i alla verktyg är ett eget beslut.
