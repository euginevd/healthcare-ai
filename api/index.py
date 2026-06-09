import json
import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

DATABASE_URL = os.environ["DATABASE_URL"]

# create the consultations table on startup if it doesn't exist yet
with psycopg.connect(DATABASE_URL) as conn:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS consultations (
            id SERIAL PRIMARY KEY,
            patient_name TEXT NOT NULL,
            visit_date DATE NOT NULL,
            notes TEXT NOT NULL,
            summary TEXT,
            next_steps TEXT,
            patient_email TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


class ConsultationIn(BaseModel):
    patient_name: str
    visit_date: str
    notes: str


SECTION_PROMPT = (
    "You are a clinical documentation assistant. Given a doctor's raw "
    "consultation notes, produce three sections separated by the exact "
    "markers shown below. Do not add any other text.\n\n"
    "===SUMMARY===\n"
    "A concise, professional summary suitable for the medical record.\n\n"
    "===NEXT_STEPS===\n"
    "A short, actionable list of next steps for the doctor.\n\n"
    "===PATIENT_EMAIL===\n"
    "A warm, plain-language email to the patient summarizing the visit "
    "and any follow-up actions, written at an 8th-grade reading level."
)


@app.post("/api/consultations")
def create_consultation(consultation: ConsultationIn):
    with psycopg.connect(DATABASE_URL) as conn:
        row = conn.execute(
            """
            INSERT INTO consultations (patient_name, visit_date, notes)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (consultation.patient_name, consultation.visit_date, consultation.notes),
        ).fetchone()

    return {"id": row[0]}


@app.get("/api/consultations/{consultation_id}/generate")
async def generate(consultation_id: int):
    with psycopg.connect(DATABASE_URL) as conn:
        row = conn.execute(
            "SELECT notes FROM consultations WHERE id = %s", (consultation_id,)
        ).fetchone()
    notes = row[0]

    async def stream():
        full_text = ""
        with client.responses.stream(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": SECTION_PROMPT},
                {"role": "user", "content": notes},
            ],
        ) as response_stream:
            for event in response_stream:
                if event.type == "response.output_text.delta":
                    full_text += event.delta
                    yield f"data: {json.dumps({'delta': event.delta})}\n\n"

        sections = _split_sections(full_text)
        with psycopg.connect(DATABASE_URL) as conn:
            conn.execute(
                """
                UPDATE consultations
                SET summary = %s, next_steps = %s, patient_email = %s
                WHERE id = %s
                """,
                (
                    sections["summary"],
                    sections["next_steps"],
                    sections["patient_email"],
                    consultation_id,
                ),
            )

        yield f"data: {json.dumps({'done': True, 'sections': sections})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


def _split_sections(text: str) -> dict:
    parts = text.split("===SUMMARY===")
    rest = parts[1] if len(parts) > 1 else text
    summary, _, rest = rest.partition("===NEXT_STEPS===")
    next_steps, _, patient_email = rest.partition("===PATIENT_EMAIL===")
    return {
        "summary": summary.strip(),
        "next_steps": next_steps.strip(),
        "patient_email": patient_email.strip(),
    }
