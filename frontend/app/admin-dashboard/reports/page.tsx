'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Bar, Line } from 'react-chartjs-2';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import FeedbackReportChart from '@/components/FeedbackReportChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, ChartDataLabels);

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string[]; // Array to support multiple branches (common subjects)
  year: number;
  term: number;
  section?: string; // Added section support
}

interface FeedbackSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  feedbackCount: number;
  averageRating: number;
  section?: string; // Added section support
  categories: {
    [key: string]: {
      average: number;
      questions: {
        question: string;
        average: number;
        responseCount?: number; // Added response count
      }[];
    };
  };
}

interface SectionStats {
  section: string;
  studentCount: number;
  feedbackCount: number;
  averageRating: number;
  subjects: number;
}

interface CumulativeSubjectData {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  instructor: string;
  averageRating: number;
  feedbackCount: number;
  section?: string;
  branch: string[];
  year: number;
  term: number;
}

interface QuestionAnalysisData {
  question: string;
  totalResponses: number;
  overallAverage: number;
  subjectBreakdown: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    instructor: string;
    responseCount: number;
    averageRating: number;
  }[];
  statistics: {
    variance: number;
    standardDeviation: number;
    consistency: 'High' | 'Medium' | 'Low';
  };
  performanceRange: {
    highest: number;
    lowest: number;
    range: number;
  };
  subjectCount: number;
}

export default function ReportsPage() {
  const { showError, showSuccess, showInfo, showWarning } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]); // For comparison
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all'); // Added section filter
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>('all'); // Added feedback type filter
  const [viewMode, setViewMode] = useState<'single' | 'comparison' | 'questions' | 'cumulative' | 'questionAnalysis'>('cumulative'); // Added questionAnalysis view as new option
  const [comparisonSubjects, setComparisonSubjects] = useState<string[]>([]); // Added for subject comparison
  const [facultyRatings, setFacultyRatings] = useState<{ [key: string]: number }>({});
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]); // Added section stats
  const [cumulativeData, setCumulativeData] = useState<CumulativeSubjectData[]>([]); // Added cumulative data
  const [questionAnalysisData, setQuestionAnalysisData] = useState<QuestionAnalysisData[]>([]); // Added question analysis data
  const [subjectComparisonData, setSubjectComparisonData] = useState<any[]>([]); // Added comparison data
  const [overallSummary, setOverallSummary] = useState<{
    totalFeedback: number,
    averageRating: number,
    subjectsWithFeedback: number
  }>({
    totalFeedback: 0,
    averageRating: 0,
    subjectsWithFeedback: 0
  });

  // Refs for chart downloading
  const pieChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const comparisonChartRef = useRef<any>(null);
  const questionComparisonChartRef = useRef<any>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic filter options - will be populated from actual data
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTerms, setAvailableTerms] = useState<number[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  // Fallback filter options
  const years = availableYears.length > 0 ? availableYears : [1, 2, 3, 4];
  const terms = availableTerms.length > 0 ? availableTerms : [1, 2, 3, 4];
  const branches = availableBranches.length > 0 ? availableBranches : [
    'CSE',
    'AIML',
    'MCA Regular', 
    'MCA DS'
  ];
  const sections = availableSections.length > 0 ? availableSections : ['A', 'B', 'C', 'D'];
  
  // Feedback type options
  const feedbackTypes = [
    { value: 'all', label: 'All Feedback' },
    { value: 'midterm', label: 'Mid Term Feedback' },
    { value: 'endterm', label: 'End Term Feedback' }
  ];

  // Color palette for subjects
  const subjectColors = [
    'rgba(255, 99, 132, 0.8)',   // Red
    'rgba(54, 162, 235, 0.8)',   // Blue
    'rgba(255, 205, 86, 0.8)',   // Yellow
    'rgba(75, 192, 192, 0.8)',   // Teal
    'rgba(153, 102, 255, 0.8)',  // Purple
    'rgba(255, 159, 64, 0.8)',   // Orange
    'rgba(199, 199, 199, 0.8)',  // Grey
    'rgba(83, 102, 255, 0.8)',   // Indigo
    'rgba(255, 99, 255, 0.8)',   // Pink
    'rgba(54, 235, 162, 0.8)',   // Green
    'rgba(235, 54, 162, 0.8)',   // Magenta
    'rgba(162, 235, 54, 0.8)',   // Lime
  ];

  const subjectBorderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 205, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(255, 99, 255, 1)',
    'rgba(54, 235, 162, 1)',
    'rgba(235, 54, 162, 1)',
    'rgba(162, 235, 54, 1)',
  ];

  // Initial load - fetch filter options
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSubjects(),
      fetchOverallStats(),
      fetchSectionStats(),
      fetchCumulativeData(),
      fetchQuestionAnalysisData()
    ]).finally(() => setLoading(false));
  }, [yearFilter, termFilter, branchFilter, sectionFilter, feedbackTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update comparison data when subjects are selected
  useEffect(() => {
    if (viewMode === 'comparison' && comparisonSubjects.length >= 2) {
      generateComparisonData().then(data => {
        if (data) {
          setSubjectComparisonData(data);
        }
      });
    } else {
      setSubjectComparisonData([]);
    }
  }, [comparisonSubjects, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubjects = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const response = await api.get(`/api/subjects?${params.toString()}`);
      setSubjects(response.data);
      
      // Reset selected subjects if they're not in the filtered results
      const filteredSubjectIds = response.data.map((s: Subject) => s._id);
      if (selectedSubject && !filteredSubjectIds.includes(selectedSubject)) {
        setSelectedSubject('');
        setFeedbackSummary(null);
      }
      setSelectedSubjects(prev => prev.filter(id => filteredSubjectIds.includes(id)));
      
      console.log(`📚 Loaded ${response.data.length} subjects with filters:`, {
        year: yearFilter, term: termFilter, branch: branchFilter, section: sectionFilter, feedbackType: feedbackTypeFilter
      });
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      showError('Failed to load subjects. Please try again.');
    }
  };

  const fetchSectionStats = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const response = await api.get(`/api/feedback/section-stats?${params.toString()}`);
      setSectionStats(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch section stats:', err);
      setSectionStats([]);
    }
  };
  
  const fetchOverallStats = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const response = await api.get(`/api/feedback/stats?${params.toString()}`);
      
      // Calculate faculty ratings
      if (response.data && response.data.facultyRatings) {
        setFacultyRatings(response.data.facultyRatings);
      }
      
      // Set overall summary
      if (response.data) {
        console.log('📊 Stats response data:', response.data);
        setOverallSummary({
          totalFeedback: response.data.totalFeedbacks || 0, // Changed from totalFeedback to totalFeedbacks
          averageRating: response.data.averageRating || 0,
          subjectsWithFeedback: response.data.subjectsWithFeedback || 0
        });
        console.log('📊 Updated overall summary:', {
          totalFeedback: response.data.totalFeedbacks || 0, // Changed from totalFeedback to totalFeedbacks
          averageRating: response.data.averageRating || 0,
          subjectsWithFeedback: response.data.subjectsWithFeedback || 0
        });
      } else {
        console.warn('📊 No data received from stats endpoint');
      }
    } catch (err: any) {
      console.error('Failed to fetch overall stats:', err);
    }
  };

  const fetchCumulativeData = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const response = await api.get(`/api/feedback/cumulative?${params.toString()}`);
      setCumulativeData(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch cumulative data:', err);
      setCumulativeData([]);
    }
  };

  const fetchQuestionAnalysisData = async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (termFilter !== 'all') params.append('term', termFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (sectionFilter !== 'all') params.append('section', sectionFilter);
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const response = await api.get(`/api/feedback/cumulative-questions?${params.toString()}`);
      setQuestionAnalysisData(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch question analysis data:', err);
      setQuestionAnalysisData([]);
    }
  };

  // Fetch dynamic filter options from actual data
  const fetchFilterOptions = async () => {
    try {
      // Get all subjects to extract filter options
      const subjectsResponse = await api.get('/api/subjects');
      const allSubjects: Subject[] = subjectsResponse.data;
      
      // Get all users to extract sections
      const usersResponse = await api.get('/api/auth/users');
      const allUsers: any[] = usersResponse.data;
      
      // Extract unique years, terms, branches, and sections
      const uniqueYears = [...new Set(allSubjects.map((s: Subject) => s.year).filter((year): year is number => typeof year === 'number'))].sort((a, b) => a - b);
      const uniqueTerms = [...new Set(allSubjects.map((s: Subject) => s.term).filter((term): term is number => typeof term === 'number'))].sort((a, b) => a - b);
      const uniqueBranches = [...new Set(allSubjects.flatMap((s: Subject) => s.branch).filter((branch): branch is string => typeof branch === 'string'))].sort();
      const uniqueSections = [...new Set(allUsers.filter((u: any) => u.section && typeof u.section === 'string').map((u: any) => u.section as string))].sort();
      
      setAvailableYears(uniqueYears);
      setAvailableTerms(uniqueTerms);
      setAvailableBranches(uniqueBranches);
      setAvailableSections(uniqueSections);
      
      console.log('🔧 Filter options loaded:', {
        years: uniqueYears,
        terms: uniqueTerms,
        branches: uniqueBranches,
        sections: uniqueSections
      });
    } catch (err: any) {
      console.error('Failed to fetch filter options:', err);
      // Keep using fallback options
    }
  };

  const fetchFeedbackSummary = async (subjectId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (feedbackTypeFilter !== 'all') params.append('feedbackType', feedbackTypeFilter);
      
      const url = `/api/feedback/summary/${subjectId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      setFeedbackSummary(response.data);
      
      if (response.data && response.data.feedbackCount > 0) {
        showSuccess(`Loaded feedback data for ${response.data.subjectName} (${response.data.feedbackCount} responses)`);
      } else {
        showInfo(`No feedback data available for ${response.data?.subjectName || 'this subject'}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch feedback summary:', err);
      showError('Failed to load feedback data. Please try again.');
      setFeedbackSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    if (subjectId) {
      fetchFeedbackSummary(subjectId);
    } else {
      setFeedbackSummary(null);
    }
  };

  // Filter subjects based on branch, year, and term - now handled by backend
  const filteredSubjects = subjects; // Backend already filters based on year, term, branch

  // Download functions
  const downloadChartAsPNG = async (chartRef: RefObject<any>, filename: string) => {
    try {
      if (chartRef.current && html2canvas) {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  const downloadReportAsPDF = async () => {
    try {
      if (reportContainerRef.current && jsPDF && html2canvas) {
        const element = reportContainerRef.current;
        const canvas = await html2canvas(element, {
          height: element.scrollHeight,
          width: element.scrollWidth,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`feedback-report-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleExportCSV = () => {
    if (!feedbackSummary) {
      showWarning('Please select a subject with feedback data to export');
      return;
    }

    try {
      // Create CSV content
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Subject,Code,Instructor,Total Feedback,Average Rating\n';
      csvContent += `${feedbackSummary.subjectName},${feedbackSummary.subjectCode},${feedbackSummary.instructor},${feedbackSummary.feedbackCount},${feedbackSummary.averageRating.toFixed(2)}\n\n`;
      
      csvContent += 'Category,Question,Average Rating\n';
      Object.entries(feedbackSummary.categories).forEach(([category, data]) => {
        data.questions.forEach(q => {
          csvContent += `${category},"${q.question}",${q.average.toFixed(2)}\n`;
        });
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `feedback_report_${feedbackSummary.subjectCode}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess(`Feedback report for ${feedbackSummary.subjectName} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export CSV. Please try again.');
    }
  };

  // Prepare chart data if feedback summary is available
  const pieChartData = feedbackSummary ? {
    labels: Object.keys(feedbackSummary.categories),
    datasets: [
      {
        data: Object.values(feedbackSummary.categories).map(cat => cat.average),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const getDetailedBarChartData = () => {
    if (!feedbackSummary) return null;
    
    // Get all questions from all categories
    let labels: string[] = [];
    let data: number[] = [];
    
    Object.entries(feedbackSummary.categories).forEach(([category, catData]) => {
      catData.questions.forEach(q => {
        // Truncate long question text
        const questionLabel = q.question.length > 30 ? q.question.substring(0, 30) + '...' : q.question;
        labels.push(questionLabel);
        data.push(q.average);
      });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Average Rating',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: selectedSubject ? `${subjects.find(s => s._id === selectedSubject)?.name} (${subjects.find(s => s._id === selectedSubject)?.code})${subjects.find(s => s._id === selectedSubject)?.section ? ` - Section ${subjects.find(s => s._id === selectedSubject)?.section}` : ''} - ${subjects.find(s => s._id === selectedSubject)?.instructor}` : 'Subject Performance',
        font: {
          size: 14,
          weight: 'bold' as const,
        }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#374151',
        font: {
          weight: 'bold' as const,
          size: 12
        },
        formatter: function(value: number) {
          return value.toFixed(1);
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        }
      },
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45
        }
      }
    }
  };

  // Cumulative chart data functions
  const getCumulativeBarChartData = () => {
    if (!cumulativeData.length) return null;
    
    // Sort by rating for better visualization
    const sortedData = [...cumulativeData].sort((a, b) => b.averageRating - a.averageRating);
    
    return {
      labels: sortedData.map(item => {
        const sectionInfo = item.section ? ` - Section ${item.section}` : '';
        return `${item.subjectName} (${item.subjectCode})${sectionInfo}\nInstructor: ${item.instructor}`;
      }),
      datasets: [
        {
          label: 'Average Rating',
          data: sortedData.map(item => item.averageRating),
          backgroundColor: sortedData.map((_, index) => {
            const colors = [
              'rgba(34, 197, 94, 0.8)',   // Green for highest
              'rgba(59, 130, 246, 0.8)',  // Blue
              'rgba(168, 85, 247, 0.8)',  // Purple  
              'rgba(245, 158, 11, 0.8)',  // Orange
              'rgba(239, 68, 68, 0.8)',   // Red for lowest
            ];
            return colors[Math.min(index, colors.length - 1)] || 'rgba(107, 114, 128, 0.8)';
          }),
          borderColor: sortedData.map((_, index) => {
            const colors = [
              'rgba(34, 197, 94, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
            ];
            return colors[Math.min(index, colors.length - 1)] || 'rgba(107, 114, 128, 1)';
          }),
          borderWidth: 2,
        }
      ]
    };
  };

  const getCumulativePieChartData = () => {
    if (!cumulativeData.length) return null;
    
    // Group subjects by rating ranges
    const ratingRanges = {
      'Excellent (4.5-5.0)': cumulativeData.filter(s => s.averageRating >= 4.5).length,
      'Good (3.5-4.4)': cumulativeData.filter(s => s.averageRating >= 3.5 && s.averageRating < 4.5).length,
      'Average (2.5-3.4)': cumulativeData.filter(s => s.averageRating >= 2.5 && s.averageRating < 3.5).length,
      'Below Average (1.5-2.4)': cumulativeData.filter(s => s.averageRating >= 1.5 && s.averageRating < 2.5).length,
      'Poor (0-1.4)': cumulativeData.filter(s => s.averageRating < 1.5).length,
    };
    
    // Filter out zero values
    const filteredRanges = Object.entries(ratingRanges).filter(([_, count]) => count > 0);
    
    return {
      labels: filteredRanges.map(([label]) => label),
      datasets: [
        {
          data: filteredRanges.map(([_, count]) => count),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // Green for excellent
            'rgba(59, 130, 246, 0.8)',  // Blue for good
            'rgba(245, 158, 11, 0.8)',  // Orange for average
            'rgba(239, 68, 68, 0.8)',   // Red for below average
            'rgba(127, 29, 29, 0.8)',   // Dark red for poor
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(127, 29, 29, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const cumulativeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Subject Performance Overview${sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}${feedbackTypeFilter !== 'all' ? ` (${feedbackTypes.find(type => type.value === feedbackTypeFilter)?.label})` : ''}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const subject = [...cumulativeData].sort((a, b) => b.averageRating - a.averageRating)[dataIndex];
            return subject ? `${subject.subjectName} (${subject.subjectCode})` : '';
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const subject = [...cumulativeData].sort((a, b) => b.averageRating - a.averageRating)[dataIndex];
            if (subject) {
              return [
                `Rating: ${subject.averageRating.toFixed(2)}/5.0`,
                `Instructor: ${subject.instructor}`,
                `Responses: ${subject.feedbackCount}`,
                `Section: ${subject.section || 'General'}`
              ];
            }
            return context.formattedValue;
          }
        }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#374151',
        font: {
          weight: 'bold' as const,
          size: 12
        },
        formatter: function(value: number) {
          return value.toFixed(1);
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 9
          },
          callback: function(value: any, index: number) {
            const subject = [...cumulativeData].sort((a, b) => b.averageRating - a.averageRating)[index];
            if (subject) {
              return [`${subject.subjectName}`, `(${subject.subjectCode})`, `${subject.instructor}`];
            }
            return value;
          }
        }
      }
    }
  };

  // Generate question comparison chart data with different colors for each subject
  const getQuestionComparisonChartData = () => {
    if (!questionAnalysisData.length) return null;

    // Get all unique subjects across all questions with instructor info
    const allSubjects = new Set<string>();
    const subjectInstructorMap = new Map<string, string>();
    
    questionAnalysisData.forEach(question => {
      question.subjectBreakdown.forEach(subject => {
        const subjectKey = `${subject.subjectName} (${subject.subjectCode})`;
        allSubjects.add(subjectKey);
        subjectInstructorMap.set(subjectKey, subject.instructor);
      });
    });

    const uniqueSubjects = Array.from(allSubjects);
    
    // Prepare labels (questions)
    const labels = questionAnalysisData.map(q => 
      q.question.length > 30 ? q.question.substring(0, 30) + '...' : q.question
    );

    // Create datasets for each subject with instructor names
    const datasets = uniqueSubjects.map((subjectLabel, index) => {
      const instructor = subjectInstructorMap.get(subjectLabel) || '';
      const data = questionAnalysisData.map(question => {
        const subjectData = question.subjectBreakdown.find(s => 
          `${s.subjectName} (${s.subjectCode})` === subjectLabel
        );
        return subjectData ? subjectData.averageRating : null;
      });

      return {
        label: `${subjectLabel} - ${instructor}`,
        data,
        backgroundColor: subjectColors[index % subjectColors.length],
        borderColor: subjectBorderColors[index % subjectBorderColors.length],
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      };
    });

    return {
      labels,
      datasets
    };
  };

  const questionComparisonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      title: {
        display: true,
        text: `Subject-wise Question Performance Comparison${sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}${feedbackTypeFilter !== 'all' ? ` (${feedbackTypes.find(type => type.value === feedbackTypeFilter)?.label})` : ''}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const questionIndex = context[0].dataIndex;
            return questionAnalysisData[questionIndex]?.question || 'Question';
          },
          label: function(context: any) {
            const value = context.parsed.y;
            if (value === null) return `${context.dataset.label}: No data`;
            return `${context.dataset.label}: ${value.toFixed(2)}/5.0`;
          },
          afterBody: function(context: any) {
            const questionIndex = context[0].dataIndex;
            const question = questionAnalysisData[questionIndex];
            if (question) {
              return [
                `Overall Average: ${question.overallAverage}/5.0`,
                `Total Responses: ${question.totalResponses}`,
                `Consistency: ${question.statistics.consistency}`
              ];
            }
            return [];
          }
        }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#374151',
        font: {
          weight: 'bold' as const,
          size: 10
        },
        formatter: function(value: number) {
          return value ? value.toFixed(1) : '';
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 30,
          font: {
            size: 9
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  // Generate comparison data for selected subjects
  const generateComparisonData = async () => {
    if (comparisonSubjects.length < 2) return null;

    try {
      setLoading(true);
      const comparisonData = await Promise.all(
        comparisonSubjects.map(async (subjectId) => {
          const response = await api.get(`/api/feedback/summary/${subjectId}`);
          return {
            subjectId,
            ...response.data
          };
        })
      );
      return comparisonData;
    } catch (error) {
      console.error('Error generating comparison data:', error);
      showError('Failed to load comparison data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate side-by-side comparison chart
  const getSubjectComparisonChartData = (comparisonData: any[]) => {
    if (!comparisonData || comparisonData.length < 2) return null;

    // Get all unique categories across all subjects
    const allCategories = new Set<string>();
    comparisonData.forEach(subject => {
      if (subject.categories) {
        Object.keys(subject.categories).forEach(category => {
          allCategories.add(category);
        });
      }
    });

    const categories = Array.from(allCategories);
    
    // Create datasets for each subject with instructor names
    const datasets = comparisonData.map((subject, index) => {
      const data = categories.map(category => {
        return subject.categories?.[category]?.average || 0;
      });

      return {
        label: `${subject.subjectName} (${subject.subjectCode}) - ${subject.instructor}`,
        data,
        backgroundColor: subjectColors[index % subjectColors.length],
        borderColor: subjectBorderColors[index % subjectBorderColors.length],
        borderWidth: 2,
        borderRadius: 4,
      };
    });

    return {
      labels: categories,
      datasets
    };
  };

  const comparisonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      title: {
        display: true,
        text: `Subject Performance Comparison by Category${sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'} (with Instructors)`,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return `Category: ${context[0].label}`;
          },
          label: function(context: any) {
            const dataset = context.dataset;
            const value = context.parsed.y;
            return `${dataset.label}: ${value.toFixed(2)}/5.0`;
          }
        }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#374151',
        font: {
          weight: 'bold' as const,
          size: 10
        },
        formatter: function(value: number) {
          return value.toFixed(1);
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (out of 5)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Categories'
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" ref={reportContainerRef}>
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Advanced Feedback Analytics</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">
                  Comprehensive insights with real-time filtering and professional reporting
                </p>
              </div>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-800">Live Data</span>
                </div>
              </div>
              <div className="flex space-x-2">
            <button
              onClick={() => downloadReportAsPDF()}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Feedback Collected</p>
              <p className="text-2xl font-semibold text-gray-800">{overallSummary.totalFeedback}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">{overallSummary.averageRating.toFixed(2)}</p>
                <p className="text-gray-500 text-sm ml-2">/ 5.00</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Subjects With Feedback</p>
              <p className="text-2xl font-semibold text-gray-800">{overallSummary.subjectsWithFeedback}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Ratings */}
      {Object.keys(facultyRatings).length > 0 && (
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Faculty Performance Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(facultyRatings).map(([instructor, rating], index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">{instructor}</p>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        rating >= 4 ? 'bg-green-100 text-green-800' : 
                        rating >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rating.toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        rating >= 4 ? 'bg-green-600' : 
                        rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{width: `${(rating / 5) * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Year
            </label>
            <select
              id="year"
              name="year"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Term
            </label>
            <select
              id="term"
              name="term"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
            >
              <option value="all">All Terms</option>
              {terms.map(term => (
                <option key={term} value={term}>Term {term}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Branch
            </label>
            <select
              id="branch"
              name="branch"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Section
            </label>
            <select
              id="section"
              name="section"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Feedback Type
            </label>
            <select
              id="feedbackType"
              name="feedbackType"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={feedbackTypeFilter}
              onChange={(e) => setFeedbackTypeFilter(e.target.value)}
            >
              {feedbackTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject for Detailed Report
            </label>
            <select
              id="subject"
              name="subject"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              value={selectedSubject}
              onChange={handleSubjectChange}
            >
              <option value="">Select a subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code}) - {subject.instructor}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Filter Actions and Active Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(yearFilter !== 'all' || termFilter !== 'all' || branchFilter !== 'all' || sectionFilter !== 'all' || feedbackTypeFilter !== 'all') && (
              <>
                <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                {yearFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Year {yearFilter}
                    <button
                      onClick={() => setYearFilter('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {termFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Term {termFilter}
                    <button
                      onClick={() => setTermFilter('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {branchFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {branchFilter}
                    <button
                      onClick={() => setBranchFilter('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {sectionFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Section {sectionFilter}
                    <button
                      onClick={() => setSectionFilter('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {feedbackTypeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {feedbackTypes.find(type => type.value === feedbackTypeFilter)?.label}
                    <button
                      onClick={() => setFeedbackTypeFilter('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                    >
                      ×
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
          
          {(yearFilter !== 'all' || termFilter !== 'all' || branchFilter !== 'all' || sectionFilter !== 'all' || feedbackTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setYearFilter('all');
                setTermFilter('all');
                setBranchFilter('all');
                setSectionFilter('all');
                setFeedbackTypeFilter('all');
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          )}
          
          {loading && (
            <div className="flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating reports...
            </div>
          )}
        </div>
      </div>

      {/* Data Summary */}
      {!loading && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Current Data Set:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700">
                  <span className="bg-white px-2 py-1 rounded-md border border-blue-200">
                    {subjects.length} subjects
                  </span>
                  <span className="bg-white px-2 py-1 rounded-md border border-blue-200">
                    {overallSummary.totalFeedback} feedback responses
                  </span>
                  <span className="bg-white px-2 py-1 rounded-md border border-blue-200">
                    {sectionStats.length} sections with data
                  </span>
                  {viewMode === 'questionAnalysis' && (
                    <span className="bg-white px-2 py-1 rounded-md border border-blue-200">
                      {questionAnalysisData.length} unique questions
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-blue-600 bg-white px-2 py-1 rounded-md border border-blue-200">
                Auto-refreshed on filter change
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced View Mode Selector */}
      <div className="mb-8">
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <label className="text-base font-semibold text-gray-800">Analysis View:</label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewMode('cumulative')}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'cumulative'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Cumulative Overview
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'single'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Single Subject
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'comparison'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a4 4 0 01-4 4z" />
                  </svg>
                  Subject Comparison
                </button>
                <button
                  onClick={() => setViewMode('questionAnalysis')}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'questionAnalysis'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Question Analysis
                </button>
                <button
                  onClick={() => setViewMode('questions')}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'questions'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Question Details
                </button>
              </div>
            </div>
            
            {viewMode === 'comparison' && (
              <div className="mt-4 w-full">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800">Subject Selection for Comparison</h4>
                      <p className="text-xs text-blue-600">Select 2-6 subjects to compare their performance</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-700">
                        {comparisonSubjects.length} selected
                      </span>
                      {comparisonSubjects.length > 0 && (
                        <button
                          onClick={() => setComparisonSubjects([])}
                          className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Select Options */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-blue-700 mb-1 block">Quick Select:</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setComparisonSubjects(filteredSubjects.slice(0, 3).map(s => s._id))}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Top 3 Subjects
                      </button>
                      <button
                        onClick={() => {
                          const randomSubjects = [...filteredSubjects].sort(() => 0.5 - Math.random()).slice(0, 4);
                          setComparisonSubjects(randomSubjects.map(s => s._id));
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Random 4
                      </button>
                      <button
                        onClick={() => setComparisonSubjects(filteredSubjects.map(s => s._id))}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        All Subjects
                      </button>
                    </div>
                  </div>

                  {/* Subject Grid Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {filteredSubjects.map((subject) => {
                      const isSelected = comparisonSubjects.includes(subject._id);
                      return (
                        <div
                          key={subject._id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-100 shadow-md transform scale-105'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setComparisonSubjects(comparisonSubjects.filter(id => id !== subject._id));
                            } else {
                              if (comparisonSubjects.length < 6) {
                                setComparisonSubjects([...comparisonSubjects, subject._id]);
                              }
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className={`text-sm font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>
                                {subject.name}
                              </h5>
                              <p className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                {subject.code}
                              </p>
                              <p className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                                {subject.instructor}
                              </p>
                              {subject.branch && Array.isArray(subject.branch) && (
                                <p className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                                  {subject.branch.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="absolute top-1 left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {comparisonSubjects.indexOf(subject._id) + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selection Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-blue-600">
                      {comparisonSubjects.length === 0 && "Select subjects to enable comparison"}
                      {comparisonSubjects.length === 1 && "Select at least one more subject"}
                      {comparisonSubjects.length >= 2 && comparisonSubjects.length <= 6 && "✓ Ready for comparison"}
                      {comparisonSubjects.length > 6 && "⚠️ Maximum 6 subjects allowed"}
                    </div>
                    {comparisonSubjects.length >= 2 && (
                      <button
                        onClick={() => {
                          // Trigger comparison analysis
                          showInfo(`Comparing ${comparisonSubjects.length} selected subjects`);
                        }}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-medium"
                      >
                        Start Comparison
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Statistics */}
      {sectionStats && sectionStats.length > 0 && (
        <div className="mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Section-wise Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionStats.map((sectionData, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Section {sectionData.section || 'Unknown'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Responses:</span>
                      <span className="font-medium text-gray-900">{sectionData.feedbackCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Rating:</span>
                      <span className="font-medium text-blue-600">
                        {sectionData.averageRating ? sectionData.averageRating.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subjects:</span>
                      <span className="font-medium text-gray-900">{sectionData.subjects || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subject Comparison View */}
      {viewMode === 'comparison' && (
        <div className="space-y-8">
          {/* Comparison Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Subject Comparison Analysis</h2>
                <p className="text-green-100">Compare performance metrics across multiple subjects side-by-side</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{comparisonSubjects.length}</div>
                <div className="text-sm text-green-100">Subjects Selected</div>
              </div>
            </div>
          </div>

          {comparisonSubjects.length < 2 ? (
            /* Getting Started Message */
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a4 4 0 01-4 4z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Compare Subjects?</h3>
                <p className="text-gray-600 mb-4">
                  Select at least 2 subjects from the selection panel above to start comparing their performance metrics.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-blue-800 mb-2">What you can compare:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Overall ratings and feedback counts</li>
                    <li>• Category-wise performance breakdown</li>
                    <li>• Question-by-question analysis</li>
                    <li>• Statistical performance metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : subjectComparisonData.length === 0 ? (
            /* Loading State */
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading comparison data...</p>
            </div>
          ) : (
            /* Comparison Results */
            <div className="space-y-8">
              {/* Quick Stats Comparison */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Comparison Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjectComparisonData.map((subject: any, index: number) => (
                    <div key={subject.subjectId} className="relative bg-gray-50 rounded-lg p-4 border-l-4" 
                         style={{ borderLeftColor: subjectColors[index % subjectColors.length] }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{subject.subjectName}</h4>
                          <p className="text-sm text-gray-600">{subject.subjectCode}</p>
                          <p className="text-xs text-gray-500">{subject.instructor}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: subjectColors[index % subjectColors.length] }}>
                            {subject.averageRating ? subject.averageRating.toFixed(1) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">{subject.feedbackCount || 0} responses</div>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            backgroundColor: subjectColors[index % subjectColors.length],
                            width: `${((subject.averageRating || 0) / 5) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Comparison Chart</h3>
                    <p className="text-sm text-gray-600">Side-by-side comparison of category ratings</p>
                  </div>
                  <button
                    onClick={() => downloadChartAsPNG(comparisonChartRef, 'subject-comparison-chart')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
                <div ref={comparisonChartRef} className="h-96">
                  {getSubjectComparisonChartData(subjectComparisonData) ? (
                    <Bar 
                      data={getSubjectComparisonChartData(subjectComparisonData)!} 
                      options={comparisonChartOptions}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No comparison data available
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Comparison Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Performance Metrics</h3>
                  <p className="text-sm text-gray-600">Complete breakdown of ratings and statistics</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Feedback</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjectComparisonData.map((subject: any, index: number) => (
                        <tr key={subject.subjectId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-3" 
                                style={{ backgroundColor: subjectColors[index % subjectColors.length] }}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subject.subjectName}</div>
                                <div className="text-sm text-gray-500">{subject.subjectCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {subject.averageRating ? subject.averageRating.toFixed(2) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">out of 5.0</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.feedbackCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject.instructor}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {subject.categories ? Object.keys(subject.categories).length : 0} categories
                            </div>
                            {subject.categories && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Object.keys(subject.categories).slice(0, 2).join(', ')}
                                {Object.keys(subject.categories).length > 2 && '...'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  backgroundColor: subjectColors[index % subjectColors.length],
                                  width: `${((subject.averageRating || 0) / 5) * 100}%` 
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category-wise Comparison */}
              {subjectComparisonData.some((subject: any) => subject.categories) && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Performance Breakdown</h3>
                  <div className="space-y-6">
                    {/* Get all unique categories */}
                    {(() => {
                      const allCategories = new Set<string>();
                      subjectComparisonData.forEach((subject: any) => {
                        if (subject.categories) {
                          Object.keys(subject.categories).forEach(category => allCategories.add(category));
                        }
                      });
                      
                      return Array.from(allCategories).map(category => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 mb-3">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjectComparisonData.map((subject: any, index: number) => {
                              const categoryData = subject.categories?.[category];
                              return (
                                <div key={subject.subjectId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: subjectColors[index % subjectColors.length] }}
                                    />
                                    <span className="text-sm text-gray-700">{subject.subjectCode}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {categoryData ? categoryData.average.toFixed(2) : 'N/A'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Question Analysis View */}
      {viewMode === 'questionAnalysis' && (
        <div className="space-y-8">
          {/* Question Analysis Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Question-wise Performance Analysis</h2>
                <p className="text-purple-100">Comprehensive analysis of individual questions across all subjects</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{questionAnalysisData.length}</div>
                <div className="text-sm text-purple-100">Unique Questions</div>
              </div>
            </div>
          </div>

          {/* Question Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Consistency Questions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {questionAnalysisData.filter(q => q.statistics.consistency === 'High').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Medium Consistency</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {questionAnalysisData.filter(q => q.statistics.consistency === 'Medium').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Consistency</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {questionAnalysisData.filter(q => q.statistics.consistency === 'Low').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {questionAnalysisData.length > 0 ? 
                      (questionAnalysisData.reduce((sum, q) => sum + q.overallAverage, 0) / questionAnalysisData.length).toFixed(2) : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Question Analysis Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Question Performance Overview</h3>
                <p className="text-sm text-gray-600">Overall average ratings for each question across all subjects</p>
              </div>
              <button
                onClick={() => downloadChartAsPNG(barChartRef, 'question-analysis-chart')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
            <div ref={barChartRef} className="h-96">
              {questionAnalysisData.length > 0 ? (
                <Bar 
                  data={{
                    labels: questionAnalysisData.map(q => 
                      q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question
                    ),
                    datasets: [
                      {
                        label: 'Overall Average Rating',
                        data: questionAnalysisData.map(q => q.overallAverage),
                        backgroundColor: questionAnalysisData.map(q => {
                          if (q.statistics.consistency === 'High') return 'rgba(34, 197, 94, 0.8)';
                          if (q.statistics.consistency === 'Medium') return 'rgba(245, 158, 11, 0.8)';
                          return 'rgba(239, 68, 68, 0.8)';
                        }),
                        borderColor: questionAnalysisData.map(q => {
                          if (q.statistics.consistency === 'High') return 'rgba(34, 197, 94, 1)';
                          if (q.statistics.consistency === 'Medium') return 'rgba(245, 158, 11, 1)';
                          return 'rgba(239, 68, 68, 1)';
                        }),
                        borderWidth: 2,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Question Performance Analysis',
                        font: {
                          size: 16,
                          weight: 'bold' as const,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const dataIndex = context.dataIndex;
                            const question = questionAnalysisData[dataIndex];
                            return [
                              `Average Rating: ${question.overallAverage}/5.0`,
                              `Total Responses: ${question.totalResponses}`,
                              `Subjects: ${question.subjectCount}`,
                              `Consistency: ${question.statistics.consistency}`,
                              `Range: ${question.performanceRange.range} (${question.performanceRange.lowest} - ${question.performanceRange.highest})`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                          display: true,
                          text: 'Average Rating (out of 5)'
                        }
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: {
                            size: 10
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No question analysis data available
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Subject Comparison Chart for Questions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subject-wise Question Comparison</h3>
                <p className="text-sm text-gray-600">Compare how different subjects perform on each question - each subject has a unique color</p>
              </div>
              <button
                onClick={() => downloadChartAsPNG(questionComparisonChartRef, 'subject-question-comparison')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
            
            {/* Color-coded subject legend */}
            {questionAnalysisData.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Subject Color Legend:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(() => {
                    const allSubjects = new Set<string>();
                    questionAnalysisData.forEach(question => {
                      question.subjectBreakdown.forEach(subject => {
                        allSubjects.add(`${subject.instructor} (${subject.subjectCode})`);
                      });
                    });
                    return Array.from(allSubjects).map((subjectLabel, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border-2" 
                          style={{
                            backgroundColor: subjectColors[index % subjectColors.length],
                            borderColor: subjectBorderColors[index % subjectBorderColors.length]
                          }}
                        />
                        <span className="text-xs text-gray-700">{subjectLabel}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
            
            <div ref={questionComparisonChartRef} className="h-[500px]">
              {getQuestionComparisonChartData() ? (
                <Bar 
                  data={getQuestionComparisonChartData()!} 
                  options={questionComparisonChartOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No comparison data available
                </div>
              )}
            </div>
          </div>

          {/* Question Performance Insights */}
          {questionAnalysisData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Best Performing Questions */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-green-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Top Performing Questions
                  </h4>
                  <div className="space-y-2">
                    {questionAnalysisData
                      .sort((a, b) => b.overallAverage - a.overallAverage)
                      .slice(0, 3)
                      .map((question, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium text-green-800">
                              {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                            </p>
                            <p className="text-xs text-green-600">
                              {question.subjectCount} subjects • {question.totalResponses} responses
                            </p>
                          </div>
                          <span className="text-lg font-bold text-green-700">{question.overallAverage}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Questions Needing Attention */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Questions Needing Attention
                  </h4>
                  <div className="space-y-2">
                    {questionAnalysisData
                      .sort((a, b) => a.overallAverage - b.overallAverage)
                      .slice(0, 3)
                      .map((question, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium text-red-800">
                              {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                            </p>
                            <p className="text-xs text-red-600">
                              {question.subjectCount} subjects • {question.totalResponses} responses
                            </p>
                          </div>
                          <span className="text-lg font-bold text-red-700">{question.overallAverage}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Most Consistent Questions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Most Consistent Questions
                  </h4>
                  <div className="space-y-2">
                    {questionAnalysisData
                      .filter(q => q.statistics.consistency === 'High')
                      .sort((a, b) => b.overallAverage - a.overallAverage)
                      .slice(0, 3)
                      .map((question, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium text-blue-800">
                              {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                            </p>
                            <p className="text-xs text-blue-600">
                              SD: {question.statistics.standardDeviation} • Range: {question.performanceRange.range}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-blue-700">{question.overallAverage}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Most Variable Questions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-yellow-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Most Variable Questions
                  </h4>
                  <div className="space-y-2">
                    {questionAnalysisData
                      .filter(q => q.statistics.consistency === 'Low')
                      .sort((a, b) => b.performanceRange.range - a.performanceRange.range)
                      .slice(0, 3)
                      .map((question, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium text-yellow-800">
                              {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                            </p>
                            <p className="text-xs text-yellow-600">
                              Range: {question.performanceRange.lowest} - {question.performanceRange.highest}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-yellow-700">{question.overallAverage}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Question Analysis Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Question Analysis</h3>
              <p className="text-sm text-gray-600">Complete breakdown of each question's performance across subjects</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consistency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questionAnalysisData.map((question, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {question.question.length > 60 ? question.question.substring(0, 60) + '...' : question.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{question.overallAverage}</div>
                          <div className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            question.overallAverage >= 4.0
                              ? 'bg-green-100 text-green-800'
                              : question.overallAverage >= 3.0
                              ? 'bg-blue-100 text-blue-800'
                              : question.overallAverage >= 2.0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {question.overallAverage >= 4.0
                              ? 'Excellent'
                              : question.overallAverage >= 3.0
                              ? 'Good'
                              : question.overallAverage >= 2.0
                              ? 'Average'
                              : 'Poor'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.totalResponses}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.subjectCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          question.statistics.consistency === 'High'
                            ? 'bg-green-100 text-green-800'
                            : question.statistics.consistency === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.statistics.consistency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.performanceRange.lowest} - {question.performanceRange.highest}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              question.overallAverage >= 4.0
                                ? 'bg-green-500'
                                : question.overallAverage >= 3.0
                                ? 'bg-blue-500'
                                : question.overallAverage >= 2.0
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(question.overallAverage / 5) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Breakdown for Each Question */}
          {questionAnalysisData.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Subject-wise Breakdown by Question</h3>
              {questionAnalysisData.slice(0, 5).map((question, questionIndex) => (
                <div key={questionIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-md font-semibold text-gray-800">
                      Q{questionIndex + 1}: {question.question}
                    </h4>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <span>Overall Average: <strong>{question.overallAverage}</strong></span>
                      <span>Total Responses: <strong>{question.totalResponses}</strong></span>
                      <span>Consistency: 
                        <span className={`ml-1 font-medium ${
                          question.statistics.consistency === 'High' ? 'text-green-600' :
                          question.statistics.consistency === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {question.statistics.consistency}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {question.subjectBreakdown.map((subject, subjectIndex) => (
                        <div key={subjectIndex} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">{subject.subjectName}</h5>
                              <p className="text-sm text-gray-600">{subject.subjectCode}</p>
                              <p className="text-xs text-gray-500">{subject.instructor}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                subject.averageRating >= 4.0 ? 'text-green-600' :
                                subject.averageRating >= 3.0 ? 'text-blue-600' :
                                subject.averageRating >= 2.0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {subject.averageRating}
                              </div>
                              <div className="text-xs text-gray-500">{subject.responseCount} responses</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                subject.averageRating >= 4.0 ? 'bg-green-500' :
                                subject.averageRating >= 3.0 ? 'bg-blue-500' :
                                subject.averageRating >= 2.0 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(subject.averageRating / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {questionAnalysisData.length > 5 && (
                <div className="text-center py-4">
                  <p className="text-gray-600">Showing top 5 questions. Total {questionAnalysisData.length} questions available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cumulative Subject Reports View */}
      {viewMode === 'cumulative' && (
        <div className="space-y-8">
          {/* Cumulative Overview Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Subject Performance Overview{sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}</h2>
                <p className="text-blue-100">Comprehensive analysis of all subjects with ratings like Python 3.5, Fundamentals 4.0, etc.{sectionFilter !== 'all' ? ` (Section ${sectionFilter} only)` : ''}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{cumulativeData.length}</div>
                <div className="text-sm text-blue-100">Total Subjects</div>
              </div>
            </div>
          </div>

          {/* Performance Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Excellent (4.5+)</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {cumulativeData.filter(s => s.averageRating >= 4.5).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Good (3.5-4.4)</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {cumulativeData.filter(s => s.averageRating >= 3.5 && s.averageRating < 4.5).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average (2.5-3.4)</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {cumulativeData.filter(s => s.averageRating >= 2.5 && s.averageRating < 3.5).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Needs Improvement</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {cumulativeData.filter(s => s.averageRating < 2.5).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subject Ratings Comparison{sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}</h3>
                  <p className="text-sm text-gray-600">All subjects ranked by average rating{sectionFilter !== 'all' ? ` (Section ${sectionFilter})` : ' (All sections)'}</p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(barChartRef, 'cumulative-subject-ratings')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              </div>
              <div ref={barChartRef} className="h-96">
                {getCumulativeBarChartData() ? (
                  <Bar data={getCumulativeBarChartData()!} options={cumulativeChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance Distribution{sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}</h3>
                  <p className="text-sm text-gray-600">Subjects grouped by rating ranges{sectionFilter !== 'all' ? ` (Section ${sectionFilter})` : ' (All sections)'}</p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(pieChartRef, 'performance-distribution')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              </div>
              <div ref={pieChartRef} className="h-96">
                {getCumulativePieChartData() ? (
                  <Pie data={getCumulativePieChartData()!} options={{ 
                    maintainAspectRatio: false, 
                    plugins: { 
                      legend: { 
                        position: 'bottom' 
                      },
                      title: {
                        display: true,
                        text: `Performance Distribution${sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'} - All Subjects & Instructors`,
                        font: {
                          size: 14,
                          weight: 'bold' as const,
                        }
                      },
                      datalabels: {
                        color: '#ffffff',
                        font: {
                          weight: 'bold' as const,
                          size: 14
                        },
                        formatter: function(value: number, context: any) {
                          const dataset = context.chart.data.datasets[0];
                          const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return value > 0 ? `${value}\n(${percentage}%)` : '';
                        }
                      }
                    } 
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Subject List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Subject Performance{sectionFilter !== 'all' ? ` - Section ${sectionFilter}` : ' - All Sections'}</h3>
              <p className="text-sm text-gray-600">Complete list of subjects with ratings and feedback counts{sectionFilter !== 'all' ? ` (Section ${sectionFilter})` : ' (All sections)'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...cumulativeData].sort((a, b) => b.averageRating - a.averageRating).map((subject) => (
                    <tr key={subject.subjectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subject.subjectName}</div>
                          {subject.section && (
                            <div className="text-sm text-gray-500">Section {subject.section}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subjectCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.instructor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{subject.averageRating.toFixed(2)}</div>
                          <div className="ml-2">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subject.averageRating >= 4.5
                                ? 'bg-green-100 text-green-800'
                                : subject.averageRating >= 3.5
                                ? 'bg-blue-100 text-blue-800'
                                : subject.averageRating >= 2.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subject.averageRating >= 4.5
                                ? 'Excellent'
                                : subject.averageRating >= 3.5
                                ? 'Good'
                                : subject.averageRating >= 2.5
                                ? 'Average'
                                : 'Needs Improvement'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.feedbackCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              subject.averageRating >= 4.5
                                ? 'bg-green-500'
                                : subject.averageRating >= 3.5
                                ? 'bg-blue-500'
                                : subject.averageRating >= 2.5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(subject.averageRating / 5) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Other Views - Single Subject Analysis */}
      {viewMode !== 'cumulative' && viewMode !== 'questionAnalysis' && (
      <>
      {/* Feedback Data */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading feedback data...</p>
        </div>
      ) : !selectedSubject ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.184 1.327 3.42 3.42 0 01.63 2.248 3.42 3.42 0 01-.956 2.054 3.42 3.42 0 01-.62 3.135 3.42 3.42 0 01-2.054.956 3.42 3.42 0 01-2.184 1.327 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-2.184-1.327 3.42 3.42 0 01-2.054-.956 3.42 3.42 0 01-.62-3.135 3.42 3.42 0 01-.956-2.054 3.42 3.42 0 01.63-2.248 3.42 3.42 0 012.184-1.327z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Select a Subject</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a subject from the dropdown above to view detailed feedback reports.
          </p>
        </div>
      ) : feedbackSummary && feedbackSummary.feedbackCount === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Feedback Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No feedback has been submitted for this subject yet.
          </p>
        </div>
      ) : feedbackSummary && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {feedbackSummary.subjectName} ({feedbackSummary.subjectCode}){feedbackSummary.section ? ` - Section ${feedbackSummary.section}` : ''}
                </h2>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="text-lg font-medium text-gray-800">{feedbackSummary.instructor}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="text-lg font-medium text-gray-800">{feedbackSummary.section || 'General'}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Total Feedback</p>
                  <p className="text-lg font-medium text-gray-800">{feedbackSummary.feedbackCount}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">Overall Average Rating</p>
                  <div className="flex justify-center items-center">
                    <p className="text-lg font-medium text-gray-800">{feedbackSummary.averageRating.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm ml-1">/ 5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Question-wise Chart - Bar */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Question-wise Performance Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">Individual ratings for each feedback question</p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(barChartRef, 'question-wise-ratings')}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PNG
                </button>
              </div>
              
              {/* Category Color Legend */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Category Color Guide:</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  {Object.entries(feedbackSummary.categories).map(([category], index) => {
                    const colors = [
                      { bg: 'bg-blue-500', name: 'Teaching Quality' },
                      { bg: 'bg-green-500', name: 'Course Content' },
                      { bg: 'bg-yellow-500', name: 'Communication' },
                      { bg: 'bg-red-500', name: 'Assessment' },
                      { bg: 'bg-purple-500', name: 'Overall' },
                      { bg: 'bg-pink-500', name: 'Engagement' },
                    ];
                    const colorClass = colors.find(c => c.name === category)?.bg || `bg-gray-500`;
                    return (
                      <div key={category} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
                        <span className="text-gray-700">{category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div ref={barChartRef} className="h-[500px]">
                <FeedbackReportChart 
                  feedbackSummary={feedbackSummary} 
                  chartType="bar" 
                  showQuestionWise={true} 
                />
              </div>
            </div>
            
            {/* Category Summary Chart - Pie */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Category Summary - Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Overall performance by category</p>
                </div>
                <button
                  onClick={() => downloadChartAsPNG(pieChartRef, 'category-summary-pie')}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PNG
                </button>
              </div>
              <div ref={pieChartRef} className="h-80">
                <FeedbackReportChart 
                  feedbackSummary={feedbackSummary} 
                  chartType="pie" 
                  showQuestionWise={false} 
                />
              </div>
            </div>
          </div>

          {/* Detailed Feedback by Category */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Detailed Feedback by Category</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {Object.entries(feedbackSummary.categories).map(([category, data], index) => (
                <div key={index} className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{category}</h3>
                  <p className="text-gray-500 mb-4">Average: {data.average.toFixed(2)} / 5</p>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Question</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Average Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {data.questions.map((q, qIndex) => (
                          <tr key={qIndex}>
                            <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{q.question}</td>
                            <td className="px-3 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(q.average / 5) * 100}%`}}></div>
                                </div>
                                <span className="ml-3 text-gray-700">{q.average.toFixed(2)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
      )}
      </div>
    </div>
  );
}