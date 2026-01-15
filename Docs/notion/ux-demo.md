# UX/UI

## Översikt

Detta dokument beskriver UX/UI‑definitionen för första versionen av planeringsapplikationen för en lego‑plasttillverkare. Fokus är ett professionellt, cleant gränssnitt med hög informationsdensitet och utan visuella distraktioner.

- **Stil:** minimalistisk, ingen avancerad animation, inga gradients
- **Tema:** mörkt tema (dark mode som standard)
- **Användningsfall:** produktionsplanerare, sälj/plan, eventuellt ledning som vill förstå prognoser och kapacitetsutnyttjande

---

## Layout & Navigationsstruktur

### Global layout
- **Huvudlayout:**
    - **Vänster sidebar:** primär navigation (Main tabs)
    - **Toppsektion per vy:** filter, sekundär navigation (sub‑tabs) och huvudåtgärder
    - **Huvudinnehåll:** tabell‑/grafvy beroende på tab

### Primär navigation (vänster sidebar)

Sidebar innehåller huvudflikar:

1. **Orders**
2. **Models**
3. **Machine Schedule / Results** (arbetsnamn: *Results* tills slutligt namn bestäms)

Varje tab har egna undermenyer eller kontext‑navigation högst upp i vyn (t.ex. sub‑tabs för *Översikt* / *Parametrar* osv.).

---

## Tab 1: Orders

Syfte: Ge en tidslinjevy över historiska och framtida orders per kund och produkt, inklusive skillnad mellan riktiga och predicerade orders, och kopplingen till kundens egna prognos.

### Huvudflöde

1. **Urval av kund & produkt**
    - Dropdown eller combo‑sök för **Customer** (t.ex. "Volvo")
    - Dropdown eller combo‑sök för **Product** (t.ex. "Produkt A")
    - När både kund och produkt är valda laddas tidslinjen för den kombinationen
2. **Tidslinje för ordervolym**
    - Horisontell tidsaxel (veckor som minsta enhet i MVP)
    - Varje tidsenhet (t.ex. vecka) visar:
        - **Ordertyp:**
            - *Real order* (lagd order) – tydlig tag/ikon, t.ex. label "Order" eller ikon + annan färg
            - *Predicted order* – markerat med egen tag/ikon, t.ex. "Predicted" i annan färg/opacity
        - **Kvantity:** antal enheter för perioden (t.ex. "5 000 st vecka 3")
        - **Error‑värde** för predicerade orders (se avsnitt *Error‑modell*)
3. **Aggregerade summeringar**
    - För vald kund+produkt visas aggregerade tal:
        - **Per månad:** total producerad/predicerad volym per månad
        - **Per år:** total volym för hela året
    - Visas i en sammanfattningsrad ovanför eller nedanför tidslinjen, t.ex.
        - "2026‑01: 25 000 st"
        - "2026 total (confirmed): X st"
        - "2026 total (predicted): Y st"
4. **Kundens egna prognos**
    - En separat siffra/sektion på skärmen visar:
        - **Customer forecast for year** (t.ex. "Customer forecast: 1 000 000 st")
    - Syfte: att visuellt kunna jämföra:
        - Kundens egen årsprognos
        - Våra bekräftade orders
        - Våra predicerade orders

### Visualisering av error

**Definition:**

- För riktiga orders är **Error = 0**.
- För predicerade orders beräknas error baserat på historisk skillnad mellan kundens prognoser och faktisk ordervolym, per tidsenhet.

**Exempel på logik (konceptuellt):**

- För ett år: kunden prognostiserar 1 000 000 st, faktiskt utföll 900 000 st
    - Error = (1 000 000 − 900 000) / 1 000 000 = 10 %
- Detta görs per tidsenhet (år, månad etc.) och viktas med större vikt på nyare data än äldre
    - Viktad modell snarare än enkel medelvärdesberäkning

**I UI:t (per vecka/månad framåt):**

- För vald kund+produkt och en tidpunkt T i framtiden beräknas ett **Error%** (t.ex. 17 % för två månader framåt)
- Prediktionen för en vecka visas då som ett intervall:
    - Lägre gräns: `Predicted quantity × (1 − Error)`
    - Övre gräns: `Predicted quantity × (1 + Error)`
- Visuellt kan detta visas som:
    - En stapel eller punkt för **baseline prediction** (t.ex. 5 000 st)
    - Ett band / intervall runt baseline (t.ex. 4 150 – 5 850 st för 17 % error)
    - Tooltip med exakta värden vid hover

### Parametrar‑subtab i Orders

Inuti Orders finns en subtab (t.ex. **Parameters**) där användaren kan styra hur prognoser används.

**Exempelparametrar:**

- **Max allowed error threshold**
    - Slider eller numeriskt fält (t.ex. 0–100 %)
    - Om prediktionens error > threshold:
        - Markera denna prediktion som **"unreliable"** och exkludera från planering, eller
        - Visa den i nedtonad färg / med varningsikon
- Ytterligare parametrar (framtida):
    - Val av tidsupplösning (vecka/månad)
    - Inställning för hur hårt ny data ska viktas (t.ex. låg/medium/hög)

---

## Tab 2: Models

Syfte: Ge en strukturerad översikt över vilka modeller systemet använder (lagerkostnad, setup‑tider, prognosmodeller etc.) och vilka parametrar de bygger på. Denna tab är mer statisk och fokuserar på transparens och konfigurering.

### Struktur

1. **Modell‑lista**
    - Tabell eller kortvy med en rad per modell, t.ex.:
        - Lagerkostnadsmodell
        - Maskin‑setup‑modell (state‑till‑state)
        - Prognosmodell för produktionsvolym
    - Kolumner:
        - Modellnamn
        - Typ (lager / setup / forecast / övrigt)
        - Kort beskrivning (1–2 meningar)
        - Status (aktiv / under utveckling / read‑only)
2. **Detaljvy för vald modell**
    
    När en modell klickas öppnas en panel eller detaljsida med:
    
    - Förklaring av **vad modellen gör** (på business‑språk)
    - Lista över **parametrar**:
        - Parameternamn
        - Typ (t.ex. kostnad, tid, faktor, bool)
        - Enhet (kr/st, timmar, % etc.)
        - Värde (readonly eller redigerbart)

### Exempel på modeller och parametrar

1. **Lagerkostnadsmodell**
    - Syfte: beräkna kostnaden för att lagra produkt Y för företag X över en viss tid och volym.
    - Exempelparametrar:
        - Kostnad per lagermedarbetare
        - Antal lagermedarbetare
        - Kostnad per kvadratmeter lager
        - Ränta / kapitalkostnad
2. **Maskin‑setup‑modell**
    - Syfte: modellera hur lång tid det tar att byta maskin från **state X** till **state Y**.
    - "State" inkluderar t.ex.:
        - Temperaturintervall
        - Tryckintervall
        - Materialtyp
        - Verktyg / form
    - Parametrar kan vara:
        - Bas‑setup‑tid
        - Extra tid vid materialbyte
        - Extra tid vid temperaturbyte utanför visst spann
3. **Prognosmodell för produktionsvolym**
    - Syfte: modellera framtida produktionsvolymer per kund+produkt
    - Parametrar (exempel):
        - Tidsfönster (t.ex. hur många veckor framåt)
        - Metodval (t.ex. enkel vs mer avancerad metod)
        - Hur mycket senaste observationer viktas jämfört med äldre

### Interaktion

- Vissa parametrar ska kunna vara **read‑only** (sätts av systemet eller av expertanvändare)
- Andra parametrar ska kunna **redigeras** via UI:t (t.ex. värden för kostnader och trösklar)
- Ändringar i parametrar påverkar:
    - Orders‑fliken (hur prognoser beräknas och visas)
    - Machine Schedule / Results (hur schema optimeras, t.ex. setup‑tider)

---

## Tab 3: Machine Schedule / Results

Arbetsnamn: **Results**. Syfte är att ge en grafisk översikt över maskin‑ och produktionsschemat över tid, samt möjliggöra interaktiva ändringar och visa OEE.

### Överkant (filter & kontroller)

Högst upp i vyn finns en kontrollrad med:

- **Tidsintervall‑val:** t.ex. vecka/månad + start/slutdatum
- **Vy‑läge:**
    1. **Per maskin (default)**
    2. **Per kund + produkt**
- **Filter:**
    - Välj enskilda maskiner (t.ex. maskin 32)
    - Välj kund(er)
    - Välj produkt(er)
- Eventuellt en knapp för **"Reset filters"** samt zoom‑kontroller på tidslinjen

### Vy 1: Per maskin (default)

**Layout:**

- Vertikala **rader** = maskiner (Maskin 1, Maskin 2, Maskin 3, ...)
- Horisontell **tidslinje** = datum/tid (t.ex. dagar/veckor och klockslag)
- På varje rad visas **block** som representerar produktionskörningar

**Block (produktionskörning):**

- Visuellt block på tidslinjen med:
    - Produktnamn
    - Kundnamn
    - Eventuellt volym (t.ex. "10 000 st")
- Interaktion:
    - **Hover:** tooltip med nyckelinfo (produkt, kund, volym, start/slut, OEE‑bidrag etc.)
    - **Click:** öppnar en pop‑up / sidopanel med detaljer:
        - Inställningar (temperatur, tryck, material, form etc.)
        - Planerad setup‑tid
        - Cykeltider
        - Beräknad OEE för blocket

**Filtrering:**

- Uppe i filterbaren kan användaren t.ex. välja **Maskin 32**
    - I så fall visas endast den raden
- Möjlighet att filtrera på specifika produkter eller kunder även i maskin‑läget

### Vy 2: Per kund + produkt

**Layout:**

- Varje rad representerar en **kund + produkt** kombination (t.ex. "ABC – Produkt A")
- Tidslinjen är samma som i maskin‑läget

**Block:**

- Varje block representerar en planerad produktionskörning för vald kund+produkt
- På blocket visas:
    - Vilka maskiner som används (en eller flera)
        - T.ex. "M1" eller "M1+M2"
    - Producerad kvantitet (t.ex. "10 000 st")

**Prognos vs faktiskt producerat:**

- På tidslinjen visas **pointers / bubblor** kopplade till vissa datum/månader:
    - Bubblor för **prognos** (t.ex. "Forecast: 10 000")
    - Bubblor eller ikoner för **faktiskt producerat** (t.ex. "Actual: 12 000")
- Syfte: Användaren ska visuellt kunna se om de producerar mer eller mindre än prognos vid specifika tidpunkter

**Flera rader:**

- Användaren ska kunna lägga till fler rader (t.ex. Produkt A och Produkt B för kund ABC)
- Detta gör det möjligt att jämföra flera produkter samtidigt i samma vy

### OEE‑visning

På denna skärm visas OEE både per maskin och globalt.

1. **Per maskin**
    - För varje maskin beräknas OEE enligt:
        - Tillgänglig tid: t.ex. 08:00–16:00 (12 h)
        - Planerad produktionstid från schemat: t.ex. 11 h
        - **OEE = produktionstid / tillgänglig tid** (i ex. 11/12 ≈ 91,7 %)
    - Visas som procent per maskin, t.ex. i en liten indikator till vänster om maskinens rad eller vid hover på raden
2. **Global OEE**
    - En övergripande OEE‑indikator (t.ex. uppe till höger)
    - Aggregerar alla maskiner för valt tidsintervall
    - Uppdateras dynamiskt när användaren ändrar schemat

### Interaktiv redigering av schema

Användaren ska kunna justera schemat visuellt:

- **Dra & släpp block:**
    - Flytta en körning till en annan tidpunkt på samma maskin
    - Flytta en körning till en annan maskin (om kompatibel)
- **Ändra volym i block:**
    - Klicka på blocket och redigera planerad kvantitet (t.ex. från 5 000 till 10 000 st)
- När ändringar görs ska:
    - OEE per maskin och globalt uppdateras
    - Eventuella konflikter/överlappningar markeras visuellt (t.ex. röd kontur eller varningsikon)

---

## Sammanfattning av UX‑principer

- **Fokus på klarhet:** minimera visuellt brus, använd mörk bakgrund och tydliga kontraster
- **Prediktion vs verklighet:** alltid tydligt skiljt mellan:
    - Riktiga orders
    - Predicerade orders
    - Kundens egna prognoser
- **Transparens:** användaren ska kunna se vilka modeller och parametrar som ligger bakom beslut (Models‑tab)
- **Interaktivitet där det gör mest nytta:** grafiska block i maskinschemat kan flyttas och ändras för att testa scenarier och direkt se effekt på OEE
