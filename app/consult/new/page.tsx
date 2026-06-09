'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';

export default function NewConsultationPage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          visit_date: format(visitDate, 'yyyy-MM-dd'),
          notes,
        }),
      });
      const data = await res.json();
      router.push(`/consult/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 p-8 sm:p-16 font-sans bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">New Consultation</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Enter your notes and we&apos;ll draft the record summary, next steps, and patient email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="patientName" className="text-sm font-medium">
            Patient name
          </label>
          <input
            id="patientName"
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Visit date</span>
          <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 w-fit">
            <DayPicker mode="single" selected={visitDate} onSelect={setVisitDate} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Consultation notes
          </label>
          <textarea
            id="notes"
            required
            rows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 font-mono text-sm"
            placeholder="Paste or type the raw consultation notes here…"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="self-start px-6 py-3 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Saving…' : 'Generate drafts'}
        </button>
      </form>
    </main>
  );
}
