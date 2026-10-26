# BarBar — Հայերեն խոսքի սղագրման համակարգ (Armenian Speech-to-Text Platform)

<div align="center">

[![Production Live App](https://img.shields.io/badge/🌐_Production_App-bar--bar--project.vercel.app-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://bar-bar-project.vercel.app)
[![Status](https://img.shields.io/badge/Status-Online_/_Live-success?style=for-the-badge)](https://bar-bar-project.vercel.app)

</div>

**BarBar**-ը հայերեն խոսքի սղագրման ժամանակակից, ամբողջական (full-stack) հարթակ է, որը նախատեսված է ձայնային խոսքը բարձր ճշգրտությամբ գրավոր տեքստի վերածելու համար։

> **Կարգախոս՝** _Խոսքդ՝ բառ առ բառ։_  
> 🔗 **Production URL՝** [https://bar-bar-project.vercel.app](https://bar-bar-project.vercel.app)

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

### 7. Գրանցում և Մուտք (Registration & Login)
- 🔐 **Անվտանգ նույնականացում (Authentication):** Օգտատերերի գրանցման (`/register`) և մուտքի (`/login`) ամբողջական մեխանիզմ՝ գաղտնաբառերի կրիպտոգրաֆիկ հեշավորմամբ (`scrypt` + salt) և ստորագրված `HttpOnly` սեսիոն cookie-ներով (`HMAC-SHA256` JWT)։
- 🛡️ **Մուտքի իրավունքների վերահսկում (Route Protection):** Հարթակի էջերը բաժանված են բաց և նույնականացում պահանջող (protected) երթուղիների (Next.js Edge Middleware + Client Route Guard + API Auth Verification).
  - **Ազատ հասանելի (Public) rout-ներ՝**
    - `/` (**«Սղագրություն»**) — հիմնական սղագրման աշխատատարածք
    - `/evaluation` (**«Գնահատում»**) — WER/CER փորձարարական գնահատման հարթակ
    - `/login` (**«Մուտք»**) և `/register` (**«Գրանցում»**)
  - **Միայն Authentication-ից հետո հասանելի (Protected) rout-ներ՝**
    - 🔒 `/history` (**«Պատմություն»**) — օգտատիրոջ պահպանված սղագրությունների պատմություն, որոնում, վերանվանում և հեռացում
    - 🔒 `/glossary` (**«Բառարան»**) — անհատական համատեքստային հայերենացման բառարանի և հատուկ տերմինների (Special Terms) կառավարում
    - 🔒 `/settings` (**«Կարգավորումներ»**) — խոսափողի, ճանաչման մոդելի և տեքստային մշակման անհատական կարգավորումների պահպանում (PostgreSQL + LocalStorage սինխրոնացմամբ)
- Առանց մուտք գործելու `/history`, `/glossary` կամ `/settings` հասցեներին դիմելիս համակարգը ավտոմատ վերահասցեավորում է դեպի `/login` (պահպանելով `callbackUrl`-ը՝ մուտքից հետո նույն էջ վերադառնալու համար)։

---

## Ծրագրային կառուցվածք (Architecture)

```
BarBar/
├── src/                          # Next.js 16 Web Tier (React 19, TypeScript, Tailwind)
│   ├── middleware.ts             # Next.js Route Guard (/history, /glossary, /settings)
│   ├── app/                      # App Router էջեր և API Routes
│   │   ├── page.tsx              # Հիմնական սղագրման տարածք (Workspace - Public)
│   │   ├── login/page.tsx        # Օգտատիրոջ մուտքի էջ (Login)
│   │   ├── register/page.tsx     # Օգտատիրոջ գրանցման էջ (Registration)
│   │   ├── history/page.tsx      # Պատմության կառավարում (Protected - Auth Required)
│   │   ├── glossary/page.tsx     # Բառարան և հատուկ եզրույթներ (Protected - Auth Required)
│   │   ├── settings/page.tsx     # Կարգավորումներ (Protected - Auth Required)
│   │   ├── evaluation/page.tsx   # WER / CER գնահատման հարթակ (Public)
│   │   └── api/                  # RESTful API Endpoints (Auth, Sessions, Transcribe, Glossary, Export)
│   ├── context/                  # AuthContext (օգտատիրոջ սեսիայի և կարգավորումների կառավարում)
│   ├── components/               # Նուրբ UI բաղադրիչներ (Navbar, ProtectedRoute, TranscriptEditor, Modals)
│   └── lib/
│       ├── auth/                 # Password hashing (scrypt) և HMAC-SHA256 Session Token վավերացում
│       ├── db/                   # Sequelize ORM (PostgreSQL singleton + User, Session, Glossary Models)
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
└── .env                          # PostgreSQL և միջավայրի փոփոխականներ
```

---

## Գործարկման հրահանգներ (How to Run)

### Տարբերակ 1. Ամպային արտադրական տեղակայում (Cloud Production: Vercel + Render + Neon)

Ամբողջ համակարգը նախագծված է արտադրական ժամանակակից Cloud սերվերներում deploy լինելու համար՝
- **Տվյալների բազա՝** [Neon](https://neon.tech) (Serverless PostgreSQL 16)
- **ASR & NLP Backend՝** [Render](https://render.com) (Python FastAPI Web Service)
- **Վեբ Ինտերֆեյս և Gateway՝** [Vercel](https://vercel.com) (Next.js 16)

#### Քայլ 1. Տվյալների բազայի կարգավորում (Neon PostgreSQL)
1. Գրանցվեք **[neon.tech](https://neon.tech)** հարթակում և ստեղծեք նոր նախագիծ (օրինակ՝ `barbar-db`)։
2. Պատճենեք տրամադրված `Connection String`-ը (օր․՝ `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`)։
3. Ոչինչ ավելացնել պետք չէ. համակարգի առաջին իսկ հարցումից Sequelize ORM-ը ինքնուրույն կստեղծի բոլոր աղյուսակները և կտեղադրի հայերեն բառարանը։

#### Քայլ 2. Python Backend-ի տեղակայում (Render.com)
1. Մուտք գործեք **[render.com](https://render.com)** և սեղմեք **New +** → **Web Service**։
2. Կցեք Ձեր GitHub ռեպոզիտորիան (կամ օգտագործեք Render Blueprint-ը՝ `render.yaml`)։
3. Սահմանեք պարամետրերը՝
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --upgrade pip && pip install -r python_backend/requirements.txt`
   - **Start Command:** `cd python_backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/`
4. Ավելացրեք միջավայրի փոփոխականները (**Environment Variables**)՝
   - `PYTHON_VERSION`: `3.11.9`
   - `WHISPER_MODEL`: `base` *(խորհուրդ է տրվում Free Tier-ի համար)*
   - `CORS_ORIGINS`: `*` *(կամ Ձեր Vercel դոմեյնը)*
5. Սեղմեք **Deploy Web Service** և պատճենեք ստացված հղումը (օր․՝ `https://barbar-backend.onrender.com`)։

#### Քայլ 3. Վեբ Հարթակի տեղակայում (Vercel)
1. Մուտք գործեք **[vercel.com](https://vercel.com)**, սեղմեք **Add New...** → **Project** և ներմուծեք նույն GitHub ռեպոզիտորիան։
2. Framework Preset-ը ավտոմատ կընտրվի **Next.js**։
3. **Environment Variables** բաժնում ավելացրեք հետևյալ փոփոխականները՝
   - `DATABASE_URL`: `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` *(Neon-ի connection string-ը)*
   - `DB_SSL`: `true`
   - `NEXT_PUBLIC_PYTHON_BACKEND_URL`: `https://barbar-backend.onrender.com` *(Միասնական URL՝ թե՛ WebSocket-ի, թե՛ API-ի համար)*
   - `AUTH_SECRET`: `ձեր-գաղտնի-բանալին` *(Սեսիոն JWT նշանների ստորագրման գաղտնի բանալի)*
4. Սեղմեք **Deploy**։

---

### Տարբերակ 2. Տեղային գործարկում (Local Development)

### Նախապայմաններ (Prerequisites)

1. **Node.js** (v18.0 կամ ավելի նոր)
2. **Python** (v3.11, v3.12 կամ v3.13)
3. **PostgreSQL** (14+ կամ 16+)
   - **macOS (Homebrew):** `brew install postgresql@14 && brew services start postgresql@14`
   - **Ubuntu/Debian:** `sudo apt install postgresql && sudo systemctl start postgresql`
4. **FFmpeg** (աուդիո/տեսանյութերի մշակման համար)
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

# 2. Կարգավորել .env (լռելյայն արդեն նշված է PostgreSQL-ը)
# DATABASE_URL=postgres://localhost:5432/barbar

# 3. Գործարկել development սերվերը
npm run dev
```

Այժմ բացեք բրաուզերում՝ **[http://localhost:3000](http://localhost:3000)**:

> **PostgreSQL տվյալների բազայի ինքնաշխատ ստեղծում և սինխրոնացում՝**  
> Սերվերը գործարկվելիս ավտոմատ միանում է PostgreSQL-ին, եթե `barbar` բազան գոյություն չունի, այն ինքնաշխատ ստեղծվում է, Sequelize ORM-ը գեներացնում է բոլոր աղյուսակները (tables, foreign keys) և լրացնում նախնական հայերեն բառարանն ու հատուկ եզրույթները (initial seed)։

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
| **AUTH & SECURITY** | Գրանցում/Մուտք և `/history`, `/glossary`, `/settings` երթուղիների պաշտպանում | `middleware.ts`, `ProtectedRoute.tsx`, `/api/auth/*`, `User` model |
