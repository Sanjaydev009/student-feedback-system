'use client';

import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register the plugin
ChartJS.register(ChartDataLabels);

interface FeedbackSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  feedbackCount: number;
  averageRating: number;
  section?: string;
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
  showQuestionWise?: boolean; // New prop to show question-wise data instead of category-wise
}

export default function FeedbackReportChart({ feedbackSummary, chartType = 'bar', showQuestionWise = false }: Props) {
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

    let labels: string[] = [];
    let data: number[] = [];
    let backgroundColors: string[] = [];
    let borderColors: string[] = [];

    const colorPalette = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green  
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(168, 85, 247, 0.8)',   // Violet
    ];

    const borderColorPalette = [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(99, 102, 241, 1)',
      'rgba(168, 85, 247, 1)',
    ];

    if (showQuestionWise) {
      // Show all questions from all categories with better organization
      let colorIndex = 0;
      const categoryColors: { [key: string]: string } = {
        'Teaching Quality': 'rgba(59, 130, 246, 0.8)',    // Blue
        'Course Content': 'rgba(16, 185, 129, 0.8)',      // Green
        'Communication': 'rgba(245, 158, 11, 0.8)',       // Yellow
        'Assessment': 'rgba(239, 68, 68, 0.8)',           // Red
        'Overall': 'rgba(139, 92, 246, 0.8)',             // Purple
        'Engagement': 'rgba(236, 72, 153, 0.8)',          // Pink
      };
      
      Object.entries(feedbackSummary.categories).forEach(([categoryName, categoryData]) => {
        const baseColor = categoryColors[categoryName] || colorPalette[colorIndex % colorPalette.length];
        const baseBorderColor = baseColor.replace('0.8', '1');
        
        categoryData.questions.forEach((question, qIndex) => {
          // Truncate long questions for better display
          const truncatedQuestion = question.question.length > 50 
            ? question.question.substring(0, 47) + '...' 
            : question.question;
          
          labels.push(`Q${labels.length + 1}: ${truncatedQuestion}`);
          data.push(question.average);
          backgroundColors.push(baseColor);
          borderColors.push(baseBorderColor);
        });
        colorIndex++;
      });
    } else {
      // Show category averages (original behavior)
      const categories = Object.keys(feedbackSummary.categories);
      const averages = categories.map(cat => feedbackSummary.categories[cat].average);
      
      labels = categories;
      data = averages;
      backgroundColors = colorPalette.slice(0, categories.length);
      borderColors = borderColorPalette.slice(0, categories.length);
    }

    if (chartType === 'pie') {
      setChartData({
        labels: labels,
        datasets: [
          {
            label: showQuestionWise ? 'Question Average Rating' : 'Category Average Rating',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2
          }
        ]
      });
    } else {
      setChartData({
        labels: labels,
        datasets: [
          {
            label: showQuestionWise ? 'Question Average Rating' : 'Category Average Rating',
            data: data,
            backgroundColor: showQuestionWise ? backgroundColors : colorPalette[0],
            borderColor: showQuestionWise ? borderColors : borderColorPalette[0],
            borderWidth: 1
          }
        ]
      });
    }
  }, [feedbackSummary, chartType, showQuestionWise]);

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
        text: `${feedbackSummary?.subjectName || 'Subject'} (${feedbackSummary?.subjectCode || ''})${feedbackSummary?.section ? ` - Section ${feedbackSummary.section}` : ''}\nInstructor: ${feedbackSummary?.instructor || ''} - ${showQuestionWise ? 'Question-wise Performance' : 'Category'} Ratings`,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: showQuestionWise ? {
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            let questionCount = 0;
            let categoryName = '';
            let actualQuestion = '';
            
            // Find which category and question this belongs to
            for (const [catName, catData] of Object.entries(feedbackSummary.categories)) {
              if (questionCount + catData.questions.length > dataIndex) {
                categoryName = catName;
                actualQuestion = catData.questions[dataIndex - questionCount].question;
                break;
              }
              questionCount += catData.questions.length;
            }
            
            return [`Category: ${categoryName}`, `Question: ${actualQuestion}`];
          },
          label: function(context: any) {
            return `Average Rating: ${context.parsed.y.toFixed(2)}/5.0`;
          }
        }
      } : undefined,
      datalabels: {
        color: chartType === 'pie' ? '#ffffff' : '#374151',
        font: {
          weight: 'bold' as const,
          size: showQuestionWise ? 11 : 14
        },
        formatter: function(value: number, context: any) {
          if (chartType === 'pie') {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value.toFixed(1)}\n(${percentage}%)`;
          } else {
            return value.toFixed(1);
          }
        },
        anchor: chartType === 'pie' ? 'center' as const : 'end' as const,
        align: chartType === 'pie' ? 'center' as const : 'top' as const
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5,
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Rating (1-5)',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: showQuestionWise ? 'Questions' : 'Categories',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        ticks: {
          maxRotation: showQuestionWise ? 45 : 30,
          minRotation: showQuestionWise ? 30 : 0,
          font: {
            size: showQuestionWise ? 9 : 12
          }
        },
        grid: {
          display: false
        }
      }
    } : undefined,
    layout: {
      padding: {
        top: 20,
        bottom: showQuestionWise ? 40 : 20,
        left: 10,
        right: 10
      }
    }
  };

  if (!feedbackSummary || !feedbackSummary.categories || Object.keys(feedbackSummary.categories).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No feedback data available for visualization</p>
      </div>
    );
  }

  return (
    <div className={showQuestionWise ? "h-full" : "h-64"}>
      {chartType === 'pie' ? (
        <Pie data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}