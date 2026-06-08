'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const eventSource = new EventSource(`${API_URL}/api/consultations/${id}/generate`);

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.delta) {
        setText((current) => current + payload.delta);
      }
      if (payload.done) {
        setStreaming(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setStreaming(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [id]);

  const sections = splitSections(text);

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 p-8 sm:p-16 font-sans bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Drafted Output</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {streaming ? 'Generating…' : 'Generation complete'}
        </p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-8">
        <Section title="Medical record summary" content={sections.summary} />
        <Section title="Next steps" content={sections.nextSteps} />
        <Section title="Patient email" content={sections.patientEmail} />
      </div>
    </main>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null;

  return (
    <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// the backend streams raw text with section markers; split it client-side
// so each card can render as soon as its marker appears
function splitSections(text: string) {
  const summaryStart = text.indexOf('===SUMMARY===');
  const nextStepsStart = text.indexOf('===NEXT_STEPS===');
  const emailStart = text.indexOf('===PATIENT_EMAIL===');

  const summary =
    summaryStart === -1
      ? ''
      : text.slice(
          summaryStart + '===SUMMARY==='.length,
          nextStepsStart === -1 ? undefined : nextStepsStart
        );

  const nextSteps =
    nextStepsStart === -1
      ? ''
      : text.slice(
          nextStepsStart + '===NEXT_STEPS==='.length,
          emailStart === -1 ? undefined : emailStart
        );

  const patientEmail =
    emailStart === -1 ? '' : text.slice(emailStart + '===PATIENT_EMAIL==='.length);

  return {
    summary: summary.trim(),
    nextSteps: nextSteps.trim(),
    patientEmail: patientEmail.trim(),
  };
}
