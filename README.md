# BarBar — Հայերեն խոսքի սղագրման համակարգ (Armenian Speech-to-Text Platform)

**BarBar**-ը հայերեն խոսքի սղագրման ժամանակակից, ամբողջական (full-stack) հարթակ է, որը նախատեսված է ձայնային խոսքը բարձր ճշգրտությամբ գրավոր տեքստի վերածելու համար։

> **Կարգախոս՝** _Խոսքդ՝ բառ առ բառ։_

Համակարգը կառուցված է `functional-document.md` (FRS-STT-001) և `technical-document.md` (SDD-STT-001) տեխնիկական և ֆունկցիոնալ պահանջների հիման վրա՝ նուրբ, մինիմալիստական և օգտագործողի համար հարմարավետ ինտերֆեյսով (subtle & elegant UI styles)։

---

## Հիմնական հնարավորություններ (Key Features)

### 1. Սղագրման 3 ռեժիմներ (Three Transcription Modes)
- 🎙️ **Կենդանի խոսք (Real-Time Live Microphone):** Ցածր հապաղմամբ իրական ժամանակում սղագրում Web Audio API (16 kHz PCM) և WebSocket հոսքով։ Միջանկյալ արդյունքների (interim hypothesis) և վերջնականացված հատվածների (finalized segments) տարանջատում։ Լռության զտում Silero VAD-ով։
- 🎵 **Աուդիո ֆայլեր (Audio File Processing):** WAV, MP3, M4A, FLAC, OGG ֆայլերի ներմուծում (drag-and-drop), բազմափուլ առաջընթացի ցուցադրում (նախամշակում → սղագրում → ավարտ)։
- 🎬 **Տեսանյութեր (Video File Processing):** MP4, AVI, MKV, MOV, WebM տեսանյութերից աուդիոյի ինքնաշխատ առանձնացում (FFmpeg worker) առանց սկզբնական ֆայլը փոփոխելու, ժամանակային նշումների (timestamps) գեներացում։

### 2. Համատեքստային հայերենացում (Contextual Armenianization)
- Փոխառյալ և օտար լեզուներով տերմինների ինքնաշխատ հայերենացում ըստ համատեքստի (օր. `meeting-ի` → `հանդիպման`, `report-ը` → `հաշվետվությունը`)։
- Հայերեն հոլովական և հոդային վերջավորությունների ճշգրիտ կցում (մորֆոլոգիական անալիզատոր)։
- **Մեկ հպումով վերականգնում (One-click Revert):** Տեքստում հայերենացված բառերը նշվում են նուրբ ինդիկատորով. կտտացնելիս բացվում է պատուհան, որտեղից հնարավոր է մեկ սեղմումով տվյալ բառը վերադարձնել իր բնօրինակ տեսքին։
- **Հատուկ եզրույթներ (Special Terms):** Ապրանքանիշները (Google, Apple, Microsoft), անձնանունները և ծրագրային նույնականացուցիչները չեն թարգմանվում։

### 3. Հայերեն կետադրություն և ֆորմատավորում (Armenian Punctuation)
- Կետերի փոխարինում հայերեն վերջակետով (`։`, `U+0589`)։
- Հարցական (`?`) և բացականչական (`!`) նշանների պահպանում։
- Հայերեն մեծատառերի ուղղում նախադասությունների սկզբում (`Ա`–`Ֆ`)։
- Պարբերությունների ձևավորում երկարատև դադարների դեպքում ($\ge 1.8$ վրկ)։

### 4. Տեքստի խմբագրիչ և արտահանում (Editor & Lossless Export)
- Հարուստ խմբագրման տարածք, պատճենման հնարավորություն (Copy all), չպահպանված փոփոխությունների ինդիկատոր։
- **Արտահանում 3 ձևաչափով՝**
    1. **TXT (UTF-8 + BOM):** ապահովում է հայերեն տառերի ճիշտ բացումը Windows Notepad-ում և Office-ում։
    2. **DOCX (Microsoft Word):** ֆորմատավորված փաստաթուղթ Noto Sans Armenian և Sylfaen տառատեսակներով։
    3. **SRT (SubRip):** տեսանյութերի ենթագրեր ճշգրիտ միլիվայրկյանային ժամանակացույցով (`00:00:01,240 --> 00:00:03,820`)։

### 5. Պատմություն և համաժամեցված նվագարկիչ (History & Audio Sync)
- Տեղային տվյալների բազա (PostgreSQL / SQLite via Sequelize ORM)՝ բոլոր սղագրությունների պատմությամբ, որոնմամբ և ֆիլտրերով։
- Համաժամեցված աուդիո նվագարկիչ՝ հատվածի վրա սեղմելիս աուդիոյի համապատասխան վայր ցատկելու հնարավորությամբ (Audio-to-text sync)։

### 6. Փորձարարական գնահատման հարթակ (Evaluation & Benchmark)
- **WER (Word Error Rate)** և **CER (Character Error Rate)** հաշվիչ՝ հայերեն տեքստի նորմալիզացիայով և Լևենշտեյնի ալգորիթմով։
- Մոդելների համեմատական աղյուսակ (`small`, `base`, `taruma/whisper-small-armenian`)։

---

## Ծրագրային կառուցվածք (Architecture)

```
BarBar/
├── src/                          # Next.js 16 Web Tier (React 19, TypeScript, Tailwind)
│   ├── app/                      # App Router էջեր և API Routes
│   │   ├── page.tsx              # Հիմնական սղագրման տարածք (Workspace)
│   │   ├── history/page.tsx      # Պատմության կառավարում (History)
│   │   ├── glossary/page.tsx     # Բառարան և հատուկ եզրույթներ (Special Terms)
│   │   ├── evaluation/page.tsx   # WER / CER գնահատման հարթակ
│   │   ├── settings/page.tsx     # Կարգավորումներ
│   │   └── api/                  # RESTful API Endpoints (Sessions, Transcribe, Export, Revert)
│   ├── components/               # Նուրբ UI բաղադրիչներ (TranscriptEditor, AudioSync, Modals)
│   └── lib/
│       ├── db/                   # Sequelize ORM (PostgreSQL & SQLite singleton + Models)
│       ├── nlp/                  # Համատեքստային հայերենացման և կետադրության մոդուլներ
│       └── export/               # TXT (BOM), DOCX, SRT արտահանման գեներատորներ
│
├── python_backend/               # Python 3.11+ FastAPI ASR & NLP Microservice
│   ├── main.py                   # FastAPI WebSocket Stream & HTTP Endpoints
│   ├── download_model.py         # Whisper մոդելի ինտերակտիվ ներբեռնիչ (% պրոգրես բարով)
│   ├── engine/                   # Hugging Face Faster-Whisper & Transformers Engines
│   ├── nlp/                      # Մորֆոլոգիական անալիզատոր, հայերենացում, կետադրություն
│   ├── audio/                    # FFmpeg վիդեո/աուդիո մշակիչ, Silero VAD
│   ├── evaluation/               # WER և CER չափման մոդուլ
│   └── tests/                    # Թեստային փաթեթ (AC-006, AC-007, FR-030)
│
├── run_backend.sh                # Python backend-ի գործարկման ավտոմատացված script
├── package.json
└── barbar.sqlite                 # Տեղային տվյալների բազա (ավտոմատ գեներացվող)
```

---

## Գործարկման հրահանգներ (How to Run)

### Նախապայմաններ (Prerequisites)

1. **Node.js** (v18.0 կամ ավելի նոր)
2. **Python** (v3.11, v3.12 կամ v3.13)
3. **FFmpeg** (աուդիո/տեսանյութերի մշակման համար)
   - **macOS (Homebrew):** `brew install ffmpeg`
   - **Ubuntu/Debian:** `sudo apt update && sudo apt install ffmpeg`
   - **Windows:** տեղադրել [ffmpeg.org](https://ffmpeg.org/download.html)-ից և ավելացնել PATH-ում։

---

### Քայլ 1. Գործարկել Python ASR Backend-ը

Առաջին տերմինալում գործարկեք.

```bash
./run_backend.sh
# կամ
npm run backend
```

**Ի՞նչ է տեղի ունենում այս հրամանով՝**
- Ավտոմատ ստուգվում և ստեղծվում է Python-ի վիրտուալ միջավայրը (`python_backend/venv`):
- Տեղադրվում են բոլոր անհրաժեշտ գրադարանները (`requirements.txt`):
- Առաջին գործարկման ժամանակ Hugging Face-ից ներբեռնվում է Whisper նեյրոնային ցանցը՝ **իրական ժամանակում տոկոսային պրոգրես բարով (`%`)**:
- Գործարկվում է FastAPI սերվերը `http://127.0.0.1:8000` հասցեով (ակտիվ նեյրոնային ճանաչմամբ և WebSocket հոսքով)։

---

### Քայլ 2. Գործարկել Next.js Վեբ Ինտերֆեյսը

Երկրորդ տերմինալում գործարկեք.

```bash
# 1. Տեղադրել Node.js կախվածությունները
npm install

# 2. Գործարկել development սերվերը
npm run dev
```

Այժմ բացեք բրաուզերում՝ **[http://localhost:3000](http://localhost:3000)**:
---

## Production Build

Եթե ցանկանում եք ստուգել կամ գործարկել օպտիմիզացված տարբերակը.

```bash
npm run build
npm start
```

---

## Համապատասխանություն պահանջներին (Compliance Matrix)

| Պահանջի ID          | Նկարագրություն                                      | Իրականացում BarBar-ում                                             |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| **FR-001 – FR-007** | Աուդիո ֆայլերի ներմուծում, վավերացում, պրոգրես      | `AudioFileUploader.tsx`, `ffmpeg_worker.py`, `TranscriptionSession`|
| **FR-008 – FR-012** | Տեսանյութերից աուդիոյի առանձնացում, timestamps      | `VideoFileUploader.tsx`, `ffmpeg_worker.py`, SRT timestamps        |
| **FR-013 – FR-023** | Կենդանի խոսափող, միջանկյալ տեքստ, VAD, Latency      | `LiveMicrophoneTranscriber.tsx`, WebSocket stream, Audio meter     |
| **FR-028 – FR-032** | Համատեքստային հայերենացում, բառարան, Revert         | `armenianizer.py`, `TranscriptEditor.tsx` (One-click Revert)       |
| **FR-033 – FR-035** | Հայերեն վերջակետ (`։`), մեծատառեր, պարբերություններ | `punctuation.py`, `ArmenianPunctuationEngine`                      |
| **FR-038 – FR-039** | Արտահանում TXT, DOCX, SRT                     | `ExportModal.tsx`, `txt-exporter`, `docx-exporter`, `srt-exporter` |
| **FR-040 – FR-041** | Պատմության կառավարում, որոնում, ֆիլտրեր             | `HistoryPage.tsx`, Sequelize ORM models                            |
| **FR-042**          | Աուդիոյի նվագարկում և տեքստի համաժամեցում           | `AudioPlayerSync.tsx`, interactive timestamps                      |
| **AC-004 – AC-005** | WER/CER գնահատում և Latency չափում                  | `EvaluationPage.tsx`, `metrics.py` framework                       |
