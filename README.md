# Healthcare AI

Turns raw consultation notes into a record summary, next steps, and a patient email — streamed live as the model writes.

<div align="center">

![Stars](https://img.shields.io/github/stars/euginevd/healthcare-ai?style=for-the-badge&logo=github)
![Forks](https://img.shields.io/github/forks/euginevd/healthcare-ai?style=for-the-badge&logo=github)
![Issues](https://img.shields.io/github/issues/euginevd/healthcare-ai?style=for-the-badge&logo=github)
![License](https://img.shields.io/github/license/euginevd/healthcare-ai?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

</div>

---

## 🩺 What is this?

Doctors leave a consultation with notes scribbled in shorthand, and then spend extra time turning those notes into a clean record entry, a checklist of next steps, and a message the patient can actually understand. This app takes the raw notes, sends them to an LLM, and streams back all three of those artifacts side by side as they're generated — so the write-up that used to take ten minutes after each visit takes one.

---

## ✨ What it does

| Feature | Description |
| --- | --- |
| Consultation intake | A form to log a patient name, visit date, and free-text notes, which is saved to Postgres. |
| Live AI generation | Server-Sent Events stream the model's output token by token into three markdown cards: summary, next steps, patient email. |
| Authentication | Sign-in and session handling via Clerk, gating both the UI and the API behind a logged-in user. |

---

## 🏗️ How it's built

```
healthcare-ai/
├── app/
│   ├── page.tsx              # Landing page + sign-in (Clerk)
│   ├── layout.tsx            # Root layout, ClerkProvider, page metadata
│   └── consult/
│       ├── new/page.tsx      # Intake form: patient, visit date, notes
│       └── [id]/page.tsx     # Live SSE view of the generated sections
├── api/
│   └── index.py              # FastAPI backend: Postgres + OpenAI streaming
├── proxy.ts                  # Clerk auth middleware (renamed from `middleware` in this Next.js version)
├── requirements.txt          # Python deps for the FastAPI backend
└── public/
```

The frontend is Next.js (App Router). The backend is a small FastAPI service that stores consultations in Postgres and calls the OpenAI API with `client.responses.stream(...)`, asking the model to emit three sections delimited by `===SUMMARY===`, `===NEXT_STEPS===`, and `===PATIENT_EMAIL===` markers. The frontend opens an `EventSource` connection to `/generate`, splits the incoming text on those markers, and renders each section as markdown with `react-markdown` as it arrives.

---

## 🚀 Quick start

1. Install frontend and backend dependencies:

```bash
npm install
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in `OPENAI_API_KEY`, `DATABASE_URL`, and your Clerk keys:

```bash
cp .env.example .env
```

3. Run both services (in separate terminals):

```bash
uvicorn api.index:app --reload --port 8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and start a new consultation.

---

## 🧰 Tech stack

**Frontend**
Next.js 16, React 19, TypeScript, Tailwind CSS, `react-markdown` + `remark-gfm` for rendering streamed sections, `react-day-picker` for the visit date.

**Backend**
FastAPI, `psycopg` for Postgres access, native Server-Sent Events for streaming.

**Integrations**
Clerk for authentication, OpenAI (`gpt-4o-mini`) for generation.

---

## 🤝 Contributing

This is a personal project, not yet set up for outside contributions. If you spot a bug or have a suggestion, please open an [issue](https://github.com/euginevd/healthcare-ai/issues).

---

## 🗺️ Roadmap

| Status | Item |
| --- | --- |
| ✅ | Consultation intake, streaming generation, and auth |
| 🔜 | Editable/regeneratable sections after first generation |
| 🔜 | Exporting the patient email directly to a messaging integration |

---

## 📄 License

Released under the [MIT License](./LICENSE).
