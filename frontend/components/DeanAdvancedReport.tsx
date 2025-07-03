"use client";

import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
// Import Chart.js directly with register
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Feedback {
  _id: string;
  student: { _id: string; name: string; year: number };
  subject: { _id: string; name: string; term: number; faculty: { _id: string; name: string } };
  ratings: { [question: string]: number };
  submittedAt: string;
  comments?: string;
}

interface Props {
  feedbacks: Feedback[];
}

interface DataAggregation {
  [key: string]: number;
}

export default function DeanAdvancedReport({ feedbacks = [] }: Props) {
  // Aggregate data by year, term, subject, faculty
  const [yearData, setYearData] = useState<DataAggregation>({});
  const [termData, setTermData] = useState<DataAggregation>({});
  const [subjectData, setSubjectData] = useState<DataAggregation>({});
  const [facultyData, setFacultyData] = useState<DataAggregation>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('DeanAdvancedReport received feedbacks:', feedbacks);
      setError(null);
      
      const yearAgg: DataAggregation = {};
      const termAgg: DataAggregation = {};
      const subjectAgg: DataAggregation = {};
      const facultyAgg: DataAggregation = {};

      if (Array.isArray(feedbacks) && feedbacks.length > 0) {
        console.log(`Processing ${feedbacks.length} feedback records`);
        
        feedbacks.forEach((fb, index) => {
          try {
            // Enhanced validation for each feedback item
            if (!fb) {
              console.warn(`Skipping undefined feedback at index ${index}`);
              return;
            }
            
            // Check if student property exists and is an object
            if (!fb.student || typeof fb.student !== 'object') {
              console.warn(`Feedback at index ${index} has invalid student data:`, fb.student);
            }
            
            // Check if subject property exists and is an object
            if (!fb.subject || typeof fb.subject !== 'object') {
              console.warn(`Feedback at index ${index} has invalid subject data:`, fb.subject);
            }
            
            // Year aggregation with safer access
            const year = fb.student && typeof fb.student === 'object' && fb.student.year !== undefined 
              ? fb.student.year.toString() 
              : "Unknown";
            yearAgg[year] = (yearAgg[year] || 0) + 1;
            
            // Term aggregation with safer access
            const term = fb.subject && typeof fb.subject === 'object' && fb.subject.term !== undefined 
              ? fb.subject.term.toString() 
              : "Unknown";
            termAgg[term] = (termAgg[term] || 0) + 1;
            
            // Subject aggregation with safer access
            const subj = fb.subject && typeof fb.subject === 'object' && fb.subject.name 
              ? fb.subject.name 
              : "Unknown Subject";
            subjectAgg[subj] = (subjectAgg[subj] || 0) + 1;
            
            // Faculty aggregation with safer access
            const faculty = fb.subject && typeof fb.subject === 'object' && fb.subject.faculty && 
                          typeof fb.subject.faculty === 'object' && fb.subject.faculty.name 
                          ? fb.subject.faculty.name 
                          : "Unknown Instructor";
            facultyAgg[faculty] = (facultyAgg[faculty] || 0) + 1;
          } catch (itemError) {
            console.error("Error processing feedback item at index " + index + ":", itemError);
            console.error("Problematic feedback item:", JSON.stringify(fb, null, 2));
          }
        });
      } else {
        console.log('No feedbacks data or invalid format:', feedbacks);
        setError('No feedback data available');
      }
      
      // Ensure we have at least some data for charts
      if (Object.keys(yearAgg).length === 0) yearAgg["No Data"] = 0;
      if (Object.keys(termAgg).length === 0) termAgg["No Data"] = 0;
      if (Object.keys(subjectAgg).length === 0) subjectAgg["No Data"] = 0;
      if (Object.keys(facultyAgg).length === 0) facultyAgg["No Data"] = 0;
      
      setYearData(yearAgg);
      setTermData(termAgg);
      setSubjectData(subjectAgg);
      setFacultyData(facultyAgg);
    } catch (error) {
      console.error('Error in DeanAdvancedReport useEffect:', error);
      setError('Failed to process feedback data');
    }
  }, [feedbacks]);

  // Chart data helpers
  const toChartData = (data: DataAggregation, label: string) => ({
    labels: Object.keys(data),
    datasets: [
      {
        label,
        data: Object.values(data),
        backgroundColor: [
          "#2563eb",
          "#10b981",
          "#f59e42",
          "#ef4444",
          "#a21caf",
          "#eab308",
          "#14b8a6",
          "#6366f1",
          "#f43f5e",
        ],
      },
    ],
  });

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-600 font-medium">Error Loading Analytics</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-bold mb-2">Feedback by Year</h3>
        <Bar data={toChartData(yearData, "Responses by Year")} />
      </div>
      <div>
        <h3 className="font-bold mb-2">Feedback by Term</h3>
        <Bar data={toChartData(termData, "Responses by Term")} />
      </div>
      <div>
        <h3 className="font-bold mb-2">Feedback by Subject</h3>
        <Pie data={toChartData(subjectData, "Responses by Subject")} />
      </div>
      <div>
        <h3 className="font-bold mb-2">Feedback by Faculty</h3>
        <Pie data={toChartData(facultyData, "Responses by Faculty")} />
      </div>
    </div>
  );
}
