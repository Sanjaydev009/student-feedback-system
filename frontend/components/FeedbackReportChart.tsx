'use client';

import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';

interface FeedbackSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  feedbackCount: number;
  averageRating: number;
  categories: {
    [key: string]: {
      average: number;
      questions: {
        question: string;
        average: number;
      }[];
    };
  };
}

interface Props {
  feedbackSummary: FeedbackSummary;
  chartType?: 'bar' | 'pie';
}

export default function FeedbackReportChart({ feedbackSummary, chartType = 'bar' }: Props) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[] | string;
      borderColor?: string[] | string;
      borderWidth?: number;
    }>;
  }>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!feedbackSummary || !feedbackSummary.categories) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const categories = Object.keys(feedbackSummary.categories);
    const averages = categories.map(cat => feedbackSummary.categories[cat].average);

    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green  
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(236, 72, 153, 1)',
    ];

    if (chartType === 'pie') {
      setChartData({
        labels: categories,
        datasets: [
          {
            label: 'Average Rating',
            data: averages,
            backgroundColor: colors.slice(0, categories.length),
            borderColor: borderColors.slice(0, categories.length),
            borderWidth: 2
          }
        ]
      });
    } else {
      setChartData({
        labels: categories,
        datasets: [
          {
            label: 'Average Rating',
            data: averages,
            backgroundColor: colors[0],
            borderColor: borderColors[0],
            borderWidth: 1
          }
        ]
      });
    }
  }, [feedbackSummary, chartType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'bottom' as const
      },
      title: {
        display: true,
        text: `${feedbackSummary?.subjectName || 'Subject'} - Category Ratings`,
        font: {
          size: 16
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5
        },
        title: {
          display: true,
          text: 'Rating (1-5)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Categories'
        }
      }
    } : undefined
  };

  if (!feedbackSummary || !feedbackSummary.categories || Object.keys(feedbackSummary.categories).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No feedback data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      {chartType === 'pie' ? (
        <Pie data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}