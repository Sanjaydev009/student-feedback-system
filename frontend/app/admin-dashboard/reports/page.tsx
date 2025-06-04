'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Feedback {
  _id: string;
  student: string;
  subject: {
    _id: string;
    instructor: string;
  };
  answers: Array<{
    question: string;
    answer: number;
  }>;
}

export default function AdminReportsPage() {
  const [token] = useState<string | null>(localStorage.getItem('token'));
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [facultyRatings, setFacultyRatings] = useState<{ [key: string]: number }>({});

  // Fetch all feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/feedback', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        setFeedbacks(data);
        processFeedback(data);
      } catch (err) {
        alert('Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchFeedback();
  }, [token]);

  // Process feedback → get average rating per faculty
  const processFeedback = (data: Feedback[]) => {
    const ratingsMap: { [key: string]: { total: number; count: number } } = {};

    data.forEach(fb => {
      const instructor = fb.subject.instructor;

      if (!instructor) return;

      const totalAnswers = fb.answers.reduce((sum, ans) => sum + ans.answer, 0);
      const avgRating = totalAnswers / fb.answers.length;

      if (!ratingsMap[instructor]) {
        ratingsMap[instructor] = { total: avgRating, count: 1 };
      } else {
        ratingsMap[instructor].total += avgRating;
        ratingsMap[instructor].count += 1;
      }
    });

    // Calculate final averages
    const result: { [key: string]: number } = {};
    Object.keys(ratingsMap).forEach(instructor => {
      result[instructor] = Number((ratingsMap[instructor].total / ratingsMap[instructor].count).toFixed(2));
    });

    setFacultyRatings(result);
  };

  // Chart Data
  const chartData = {
    labels: Object.keys(facultyRatings),
    datasets: [
      {
        label: 'Average Rating',
        data: Object.values(facultyRatings),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Faculty Average Feedback Ratings'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (!token) return <p>Not authorized</p>;
  if (loading) return <p>Loading reports...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Feedback Reports</h1>

      {/* Chart */}
      <div className="bg-white shadow rounded p-6 mb-8">
        <Bar data={{
          labels: Object.keys(facultyRatings),
          datasets: [{
            label: 'Average Rating',
            data: Object.values(facultyRatings),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderRadius: 4,
            barPercentage: 0.5
          }]
        }}
        options={options}
        />
      </div>

      {/* Raw Table (optional) */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Instructor</th>
              <th className="py-3 px-4 text-left">Average Rating</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(facultyRatings).map(instructor => (
              <tr key={instructor} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{instructor}</td>
                <td className="py-3 px-4">{facultyRatings[instructor]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}