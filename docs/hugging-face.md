# HFA-verktygen på Hugging Face

Två saker hänger ihop här:

1. **Var sidorna ligger:** en *statisk* Space, `huggingface.co/spaces/larswpettersson/hfa-tools`, som serverar STPA, HTA och Bowtie som enstaka HTML-filer. Det kostar inget.
2. **Vilken modell som svarar:** AI-panelen anropar leverantören direkt från webbläsaren. Leverantören *Hugging Face* (i HTA och Bowtie) går via `router.huggingface.co`, Hugging Face Inference Providers, med din egen `hf_…`-token.

Space:n kör alltså ingen modell. En statisk Space har ingen server, och modellen körs hos en av Inference Providers (t.ex. Novita, Together, Nebius, Groq …).

## Vad kostar det?

Inference Providers debiteras per token på det konto som äger token. Gratiskonton har haft en liten månadskredit (0,10 USD) och PRO (9 USD/mån) 2 USD i månaden. Det finns uppgifter från oktober 2026 om att gratiskrediten har tagits bort. Kontrollera därför [prissidan](https://huggingface.co/docs/inference-providers/pricing) och ditt saldo under [Billing](https://huggingface.co/settings/billing) innan du räknar med den.

Som grov storleksordning: Gemma 4 31B kostar runt 0,14 USD per miljon in-token och 0,40 USD per miljon ut-token. En fråga med en medelstor analys (~5 000 token in, ~1 500 ut) kostar då ungefär 0,001 USD. 0,10 USD räcker till runt hundra frågor, och 2 USD (PRO) till runt tvåtusen. När krediten är slut svarar routern med HTTP 402, och panelen säger det.

Helt gratis utan kreditgräns blir det bara om modellen körs lokalt, till exempel `gemma4` i Ollama på en dator med tillräckligt minne. Använd då leverantören *Local*. Alternativet är Gemini API:s gratisnivå om Gemma-modellerna finns där (leverantören *Gemini*, modell-id enligt Google AI Studio). Kontrollera det själv: Gemma-modeller i Gemini API har tidigare inte tagit emot en separat systemprompt.

## Sätt upp token för AI-panelen

1. Gå till [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens), välj **Create new token** och sedan **Fine-grained**.
2. Kryssa bara i **Inference → Make calls to Inference Providers**. Den här token ska inte ha skrivrätt.
3. Öppna HTA eller Bowtie, tryck **AI** och sedan **Settings**. Välj *Hugging Face (Inference Providers)* och klistra in token.
4. Modellen är `google/gemma-4-31B-it` från början. **Refresh model list** hämtar de modeller routern erbjuder. Lägg till `:cheapest`, `:fastest` eller `:<leverantör>` (t.ex. `google/gemma-4-31B-it:novita`) om du vill styra vem som kör den.

Token sparas bara i webbläsarens `localStorage` (om *Remember API keys* är ikryssat). Den delas av verktygen som ligger på samma adress, alltså av alla tre i Space:n.

**STPA-workbenchen** har ännu ingen egen Hugging Face-leverantör. Använd *Local* där:

| Fält | Värde |
|---|---|
| Endpoint | `https://router.huggingface.co/v1` |
| Model | `google/gemma-4-31B-it` |
| API key | din `hf_…`-token |

## Publicera Space:n

### Med GitHub Actions (rekommenderas)

1. Skapa en token till på Hugging Face, **Fine-grained** med **Repositories → Write** för ditt konto (för att skapa och uppdatera Space:n). Använd inte samma token som i AI-panelen.
2. I hfa-ds på GitHub går du till **Settings → Secrets and variables → Actions → New repository secret**. Namnet ska vara `HF_TOKEN` och värdet token från steg 1.
3. Under **Actions → Deploy Hugging Face Space → Run workflow**, ange
   - `tools_ref`: `claude/ai-assistant` tills AI-grenen är mergad i hfa-hta och hfa-bowtie, därefter `main`
   - `stpa_ref`: `main`
   - `space`: `larswpettersson/hfa-tools`
4. Första körningen skapar Space:n. Sidan blir `https://larswpettersson-hfa-tools.static.hf.space/` och syns även på `huggingface.co/spaces/larswpettersson/hfa-tools`.

Workflowet hämtar de tre verktygsrepona bredvid hfa-ds (som testerna gör), bygger med `scripts/hf-space/build.sh` och laddar upp med `scripts/hf-space/deploy.py`. Uppladdningen speglar bygget, så filer som tagits bort försvinner också från Space:n.

### Från en egen dator

```bash
cd hfa-ds
scripts/hf-space/build.sh                 # → dist/hf-space (verktygen hämtas från ../hfa-*)
pip install huggingface_hub
HF_TOKEN=hf_… python3 scripts/hf-space/deploy.py dist/hf-space --space larswpettersson/hfa-tools
```

Lägg till `--private` första gången om Space:n bara ska synas för dig. En privat Space kräver inloggning på Hugging Face för att öppnas.

## Innehåll

| Fil | Roll |
|---|---|
| `huggingface/space/README.md` | Space-kortet. YAML-huvudet säger `sdk: static` och `app_file: index.html`. |
| `huggingface/space/index.html` | Startsidan med länkar till de tre verktygen |
| `scripts/hf-space/build.sh` | Bygger `dist/hf-space/` med `stpa/`, `hta/` och `bowtie/` (offline-filerna, där skripten är inbäddade) |
| `scripts/hf-space/deploy.py` | Skapar Space:n vid behov och laddar upp mappen |
| `.github/workflows/deploy-hf-space.yml` | Manuell deploy (workflow_dispatch) |

## Inte med (medvetet)

En Space med en egen proxy (Docker eller Gradio) som har `HF_TOKEN` som hemlighet skulle låta besökare använda AI utan egen token. Men då betalar ditt konto för alla som hittar sidan, och en publik Space hittas. Gör det i så fall bara som privat Space, eller med inloggning (`hf_oauth: true`) och en kvot per användare.

Att köra Gemma 4 31B *i* en gratis Space går inte: gratis-hårdvaran är CPU med 16 GB RAM. En liten kvantiserad modell (några miljarder parametrar) med llama.cpp i en Docker-Space går, men den blir långsam.
