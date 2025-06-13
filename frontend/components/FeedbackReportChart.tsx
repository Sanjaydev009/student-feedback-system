'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';

interface Feedback {
  _id: string;
  student: string;
  subject: string;
  answers: Array<{ answer: number }>;
}

interface Props {
  feedbacks: Feedback[];
  users: any[];
}

export default function FeedbackReportChart({ feedbacks, users }: Props) {
  const [report, setReport] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const subjectMap: { [key: string]: Set<string> } = {};
    const totalStudentsBySubject: { [key: string]: number } = {};

    // Count total students per subject
    users.forEach(user => {
      const subject = user.subject || 'Unknown'; // Replace with real subject logic
      totalStudentsBySubject[subject] = (totalStudentsBySubject[subject] || 0) + 1;
    });

    // Count students who gave feedback
    feedbacks.forEach(fb => {
      const subject = fb.subject || 'Unknown';
      if (!subjectMap[subject]) subjectMap[subject] = new Set();
      subjectMap[subject].add(fb.student);
    });

    const labels = Object.keys(subjectMap);
    const feedbackCount = labels.map(label => subjectMap[label].size);

    setReport({
      labels,
      datasets: [
        {
          label: 'Students Who Gave Feedback',
          data: feedbackCount,
          backgroundColor: 'rgba(59, 130, 246, 0.6)'
        }
      ]
    });
  }, [feedbacks, users]);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Section-Wise Feedback Submission'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <Bar data={report} options={options} />
  );
}