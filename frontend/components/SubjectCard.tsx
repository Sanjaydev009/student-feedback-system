'use client';

import Link from 'next/link';

interface Props {
  subject: {
    _id: string;
    name: string;
    code: string;
    instructor: string;
  };
  submitted: boolean;
}

export default function SubjectCard({ subject, submitted }: Props) {
  return (
    <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
      <h2 className="text-xl font-semibold">{subject.name}</h2>
      <p className="text-sm text-gray-600 mt-1">Code: {subject.code}</p>
      <p className="text-sm text-gray-600 mt-1">Instructor: {subject.instructor}</p>

      {!submitted ? (
        <Link
          href={`/submit-feedback?subjectId=${subject._id}`}
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Give Feedback
        </Link>
      ) : (
        <p className="mt-4 text-green-600 font-medium">✅ Feedback Submitted</p>
      )}
    </div>
  );
}