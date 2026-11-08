# Design: redigera kontrollstrukturen direkt i STPA-diagrammet

**Status:** förslag och öppna frågor (2026-11-08). Inget av detta är byggt. När frågorna är besvarade skrivs beslutet in som avsnitt 5.10 i [designprinciper.md](designprinciper.md) och [design-principles.md](design-principles.md).

## 1. Bakgrund och mål

I dag byggs kontrollstrukturen i STPA Workbench i JSON-editorn och i tabellerna under diagrammet, eller med hjälp av AI. Diagrammet kan bara markera. Det strider mot principerna i [1.2](designprinciper.md): *användaren gör analysen* och *AI är ett valfritt stöd, inte motorn*.

Målet är att användaren ska kunna bygga och ändra kontrollstrukturen direkt, utan AI, med så enkel interaktion som möjligt:

- **Tangentbordsbaserat:** snabbt lägga till en styrenhet eller styrd process och koppla ihop dem med en styrlänk och en återkopplingslänk.
- **Samma sak med musen**, enligt 5.4 (tangenterna speglar musen).
- **Samma tänkesätt som HTA och Bowtie:** man bygger ett träd nedåt med *child* och *sibling*, och hjälpen finns på **?**.

## 2. Förslag

### 2.1 Bygg nedåt, som i HTA

I HTA är **C** lägg till barn, **S** lägg till syskon, **D** duplicera och **?** visa hjälpen. Samma tangenter gäller i STPA, så att den som kan HTA kan STPA.

### 2.2 Barn: det snabba sättet att bygga

- Markera en styrenhet och tryck **C**. Ett nytt block dyker upp en nivå längre ned, med namnfältet öppet för att skriva.
- En **styrlänk nedåt** och en **återkopplingslänk uppåt** skapas automatiskt mellan dem.
- Barnet blir som standard en styrd process. Typen byts direkt med en tangent (fråga 2).
- **Enter** bekräftar namnet. **C** igen fortsätter nedåt, så en hel loop kan skrivas utan mus.

### 2.3 Förälder och syskon

- **P** lägger till en **förälder**: en ny styrenhet ovanför som tar över länkarna uppåt. Det saknas i HTA och Bowtie, men en kontrollstruktur behöver det, eftersom man ofta först i efterhand inser att det finns en tillsynsnivå ovanför.
- **S** lägger till ett **syskon** på samma nivå, utan länkar. Länkar till det läggs till efteråt.

### 2.4 Egna länkar mellan valfria block

- Markera två block (Shift+klick finns redan) och tryck **L** för en styrlänk eller **F** för en återkopplingslänk.
- Riktningen går från det först markerade till det sist markerade, och den visas innan den bekräftas.
- Med musen: tryck **L** eller **F** och klicka sedan på målet. Det är samma länkläge som Bowtie har för barriärer.
- Länkens namn öppnas för att skrivas direkt. Ett tomt namn ger en etikett som kan fyllas i senare.

### 2.5 Ta bort, byta namn och flytta

- **Delete** tar bort det markerade. Ett block tar med sig sina länkar. Det går att ångra med Ctrl/⌘+Z.
- **Enter** eller **F2** byter namn (5.4). **Alt/Option+pil** flyttar (5.6).

### 2.6 Hjälp och knappar

- **?** öppnar samma hjälpruta som i HTA, med en kort lista över C, P, S, L, F, Delete och Enter.
- Verktygsfältet över diagrammet får knapparna *+ Child*, *+ Parent*, *+ Sibling*, *Control link* och *Feedback link*, med tangenten i hovertexten. Knapparna är inaktiva när de inte går att använda, så de visar vad som är möjligt.
- Bokstavstangenterna är avstängda medan man skriver, som i HTA.

## 3. Genomförbarhet och lämplighet

| Del | Bedömning |
|---|---|
| Barn med länkar | Går att bygga i dag och ger mest nytta. Byggs först. |
| Syskon, ta bort, byta namn | Går att bygga i dag; tabellerna gör redan samma ändringar. |
| Egna länkar (L och F) | Går att bygga. Länkläget finns som mönster i Bowtie. |
| Förälder | Genomförbart, men länkarna ska flyttas, så det är den del som är mest osäker. |
| Dra för att koppla | Möjligt men skjuts upp: kräver träffytor och förhandsvisning och är inte tangentbordsbaserat. L/F med klick räcker som första version. |

Datamodellen har redan block, styråtgärder, återkoppling och typbyte. Diagrammet ritas om från JSON, så varje ändring blir ett steg som går att ångra, på samma sätt som i tabellerna.

## 4. Öppna frågor

1. **Namn:** ska knapparna heta *Child*, *Parent* och *Sibling* som i HTA, eller något som passar kontrollstrukturen bättre, som *Below*, *Above* och *Beside*? Child och Parent är lätta att känna igen, men "barn" är ett ovant ord när en styrenhet styr en process.
2. **Vad blir barnet:** ska det som standard vara en styrd process, eller ska typen väljas vid skapandet? Finns det fall där nästa nivå nästan alltid är en annan styrenhet?
3. **Aktuator och sensor:** ska en styrlänk till en process automatiskt få en aktuator emellan, eller ska användaren lägga in dem själv? I dag görs det med *Convert to actuator*.
4. **En eller flera länkar:** ska ett barn alltid få både styrning och återkoppling, eller ska man kunna välja bara styrning, till exempel för att visa en öppen loop som en varning (5.8)?
5. **Tangenter:** är C, P, S, L och F bra, eller krockar de med något som används redan?
6. **Flera markerade:** när flera block är markerade och C trycks, ska varje block få ett eget barn, eller ska det bli ett gemensamt barn som alla styr?
7. **Var börjar man:** ska ett tomt diagram (efter *New*) börja med en enda styrenhet, eller med en styrenhet och en process som redan är kopplade?
8. **Tabeller och JSON:** ska de finnas kvar som de är, så att diagrammet och tabellerna är två vägar till samma sak? Eller ska tabellerna bli något man tittar på, och diagrammet det man redigerar i?

## 5. Nästa steg

1. Besvara frågorna ovan och lägg till egna förslag.
2. Analysera vad som är genomförbart och lämpligt, och justera förslaget.
3. Skriv beslutet som avsnitt 5.10 i designprinciperna (svenska och engelska) och uppdatera kortkommandona i 5.4.
4. Rita gränssnittet i Penpot (verktygsfältet, länkläget, hjälpen) och bygg det sedan i STPA Workbench, med tester i `tests/stpa/`.
