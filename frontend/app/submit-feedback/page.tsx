// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import StudentNavbar from '@/components/StudentNavbar';

// interface Subject {
//   _id: string;
//   name: string;
//   code: string;
//   instructor: string;
//   branch: string;
//   questions: string[];
// }

// export default function SubmitFeedbackPage() {
//   const [subject, setSubject] = useState<Subject | null>(null);
//   const [answers, setAnswers] = useState<number[]>(Array(10).fill(0));
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [storedToken, setStoredToken] = useState<string | null>(null);
//   const [studentBranch, setStudentBranch] = useState<string | null>(null);
//   const [studentId, setStudentId] = useState<string | null>(null);

//   // Step 1: Get token and decode after mount
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       alert('No token found. Please log in again.');
//       window.location.href = '/login';
//       return;
//     }

//     try {
//       const decoded: any = JSON.parse(atob(token.split('.')[1]));
//       setStudentBranch(decoded.branch || 'MCA Regular');
//       setStudentId(decoded.id);
//       setStoredToken(token);
//     } catch (err) {
//       alert('Invalid or expired token. Please log in again.');
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }
//   }, []);

//   // Step 2: Get subjectId from URL after component mounts
//   useEffect(() => {
//     if (!storedToken) return;

//     const searchParams = new URLSearchParams(window.location.search);
//     const subjectId = searchParams.get('subjectId');

//     if (!subjectId) {
//       alert('No subject selected. Redirecting...');
//       window.location.href = '/subjects';
//       return;
//     }

//     fetchSubject(subjectId, storedToken);
//   }, [storedToken]);

//   // Step 3: Fetch subject by ID
//   const fetchSubject = async (subjectId: string, token: string) => {
//     try {
//       const res = await fetch(`http://localhost:5001/api/subjects/${subjectId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });

//       const contentType = res.headers.get('content-type');

//       if (!contentType?.includes('application/json')) {
//         throw new Error('Received HTML instead of JSON - likely not authenticated');
//       }

//       const data = await res.json();

//       if (!data.questions || data.questions.length < 10) {
//         alert('This subject has invalid feedback questions.');
//         window.location.href = '/subjects';
//         return;
//       }

//       setSubject(data);
//     } catch (err: any) {
//       console.error('Failed to load subject:', err.message);
//       alert(err.message || 'Failed to load subject');
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Step 4: Check if already submitted
//   useEffect(() => {
//     const checkIfAlreadySubmitted = async () => {
//       if (!studentId || !subject?._id) return;

//       try {
//         const res = await fetch(`http://localhost:5001/api/feedback/student/${studentId}?subject=${subject._id}`, {
//           headers: {
//             Authorization: `Bearer ${storedToken}`
//           }
//         });

//         const data = await res.json();
//         setSubmitted(data.length > 0);
//       } catch (err) {
//         console.error('Error checking submission status');
//       }
//     };

//     checkIfAlreadySubmitted();
//   }, [subject, studentId]);

//   const handleRatingChange = (index: number, value: number) => {
//     const updated = [...answers];
//     updated[index] = value;
//     setAnswers(updated);
//   };

//   const handleSubmit = async () => {
//     if (answers.some(a => a === 0)) {
//       alert('Please answer all questions');
//       return;
//     }

//     if (!storedToken || !subject) {
//       alert('Session expired. Please log in again.');
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//       return;
//     }

//     try {
//       const res = await fetch('http://localhost:5001/api/feedback', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${storedToken}`
//         },
//         body: JSON.stringify({
//           student: studentId,
//           subject: subject._id,
//           answers: answers.map((ans, i) => ({
//             question: subject.questions[i],
//             answer: ans
//           }))
//         })
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || 'Failed to submit feedback');
//       }

//       alert('✅ Feedback submitted successfully!');
//       window.location.href = '/my-feedback';
//     } catch (err: any) {
//       alert(err.message || 'Something went wrong. Try again.');
//     }
//   };

//   if (loading) return <p>Loading subject...</p>;
//   if (!subject) return <p>Subject not found</p>;

//   return (
//     <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-0">
//       <StudentNavbar />

//       <div className="container mx-auto max-w-3xl">
//         <h1 className="text-2xl font-bold mb-6">{subject.name}</h1>
//         <p className="mb-6 text-gray-700">Instructor: {subject.instructor}</p>

//         <div className="bg-white p-6 rounded shadow-md space-y-6">
//           <h2 className="font-medium text-lg">Rate the following:</h2>

//           {subject.questions.slice(0, 10).map((q, index) => (
//             <div key={index} className="flex flex-col space-y-2">
//               <label className="font-medium">{q}</label>
//               <div className="flex items-center space-x-2">
//                 {[1, 2, 3, 4, 5].map(rating => (
//                   <button
//                     key={rating}
//                     type="button"
//                     onClick={() => handleRatingChange(index, rating)}
//                     disabled={submitted}
//                     className={`w-8 h-8 flex items-center justify-center rounded-full ${
//                       answers[index] >= rating ? 'bg-yellow-400' : 'bg-gray-200'
//                     } ${submitted ? 'cursor-not-allowed opacity-60' : ''}`}
//                   >
//                     ⭐
//                   </button>
//                 ))}
//               </div>
//             </div>
//           ))}

//           <button
//             disabled={submitted}
//             onClick={handleSubmit}
//             className={`mt-6 w-full py-3 rounded ${
//               submitted
//                 ? 'bg-gray-400 cursor-not-allowed'
//                 : 'bg-blue-600 hover:bg-blue-700 text-white'
//             }`}
//           >
//             {submitted ? 'Already Submitted' : 'Submit Feedback'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/StudentNavbar';

interface Subject {
  _id: string;
  name: string;
  code: string;
  instructor: string;
  branch: string;
  questions: string[];
}

export default function SubmitFeedbackPage() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get query params safely after component mounts
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [studentBranch, setStudentBranch] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Step 1: Load token and decode it
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      window.location.href = '/login';
      return;
    }

    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));

      if (decoded.role !== 'student') {
        alert('Only students can give feedback');
        window.location.href = '/';
        return;
      }

      setStoredToken(token);
      setStudentBranch(decoded.branch || 'MCA Regular');
      setStudentId(decoded.id);
    } catch (err: any) {
      alert('Invalid or expired token. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  // Step 2: Read subjectId from URL
  useEffect(() => {
    if (!storedToken) return;

    const searchParams = new URLSearchParams(window.location.search);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      alert('No subject selected. Redirecting...');
      window.location.href = '/subjects';
      return;
    }

    fetchSubject(subjectId, storedToken);
  }, [storedToken]);

  // Step 3: Fetch subject details
  const fetchSubject = async (subjectId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/subjects/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error('Received HTML instead of JSON - likely not authenticated');
      }

      const data = await res.json();

      if (!data.questions || data.questions.length < 10) {
        alert('This subject has invalid questions.');
        window.location.href = '/subjects';
        return;
      }

      setSubject(data);
    } catch (err: any) {
      console.error('Failed to load subject:', err.message);
      alert(err.message || 'Failed to load subject. Please try again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Check if already submitted
  useEffect(() => {
    const checkIfAlreadySubmitted = async () => {
      if (!studentId || !subject?._id) return;

      try {
        const res = await fetch(`http://localhost:5001/api/feedback/student/${studentId}?subject=${subject._id}`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        const data = await res.json();
        setSubmitted(data.length > 0);
      } catch (err) {
        console.error('Error checking feedback status');
      }
    };

    checkIfAlreadySubmitted();
  }, [subject, studentId]);

  const handleRatingChange = (index: number, value: number) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === 0)) {
      alert('Please answer all questions');
      return;
    }

    if (!storedToken || !subject) {
      alert('Session expired. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          student: studentId,
          subject: subject._id,
          answers: answers.map((ans, i) => ({
            question: subject.questions[i],
            answer: ans
          }))
        })
      });

      const contentType = res.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        alert('Authentication failed or session expired.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      alert('✅ Feedback submitted successfully!');
      window.location.href = '/my-feedback';
    } catch (err: any) {
      console.error('Submission error:', err.message);
      alert('Something went wrong. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  if (loading) return <p>Loading subject...</p>;
  if (!subject) return <p>Subject not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-0">
      {/* <StudentNavbar /> */}

      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{subject.name}</h1>
        <p className="mb-6 text-gray-700">Instructor: {subject.instructor}</p>

        <div className="bg-white p-6 rounded shadow-md space-y-6">
          <h2 className="font-medium text-lg">Rate the following:</h2>

          {/* Safe rendering of questions */}
          {Array.isArray(subject.questions) && subject.questions.length >= 10 ? (
            subject.questions.slice(0, 10).map((q, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <label className="font-medium">{q}</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(index, rating)}
                      disabled={submitted}
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        answers[index] >= rating ? 'bg-yellow-400' : 'bg-gray-200'
                      } ${submitted ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-red-500">⚠️ This subject doesn't have valid questions.</p>
          )}

          <button
            disabled={submitted}
            onClick={handleSubmit}
            className={`mt-6 w-full py-3 rounded ${
              submitted
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {submitted ? 'Already Submitted' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}