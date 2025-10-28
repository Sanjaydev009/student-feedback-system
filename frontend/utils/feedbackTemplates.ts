// Feedback Templates for Mid-term and End-term

export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'rating' | 'comment';
  category: string;
  required: boolean;
}

// Mid-term Feedback Questions (8 Rating + 2 Comments - Faculty Focused)
export const midtermQuestions: FeedbackQuestion[] = [
  // Teaching Quality (4 questions)
  {
    id: 'mt_teaching_clarity',
    text: 'How clearly does the faculty explain concepts?',
    type: 'rating',
    category: 'Teaching Quality',
    required: true
  },
  {
    id: 'mt_teaching_aids',
    text: 'How effectively does the faculty use teaching aids?',
    type: 'rating',
    category: 'Teaching Quality',
    required: true
  },
  {
    id: 'mt_learning_objectives',
    text: 'How well does the faculty clarify learning objectives?',
    type: 'rating',
    category: 'Teaching Quality',
    required: true
  },
  {
    id: 'mt_student_participation',
    text: 'How well does the faculty encourage student participation?',
    type: 'rating',
    category: 'Teaching Quality',
    required: true
  },
  
  // Faculty Engagement (2 questions)
  {
    id: 'mt_accessibility',
    text: 'How accessible is the faculty for doubts and guidance?',
    type: 'rating',
    category: 'Faculty Engagement',
    required: true
  },
  {
    id: 'mt_feedback_timely',
    text: 'How timely is the faculty in providing feedback?',
    type: 'rating',
    category: 'Faculty Engagement',
    required: true
  },
  
  // Course Delivery (2 questions)
  {
    id: 'mt_class_preparation',
    text: 'How well-prepared does the faculty come to classes?',
    type: 'rating',
    category: 'Course Delivery',
    required: true
  },
  {
    id: 'mt_overall_performance',
    text: 'How would you rate the overall performance of the faculty?',
    type: 'rating',
    category: 'Course Delivery',
    required: true
  },
  
  // Comments (2 questions)
  {
    id: 'mt_effective_methods',
    text: 'What teaching methods do you find most effective?',
    type: 'comment',
    category: 'Comments',
    required: false
  },
  {
    id: 'mt_improvements',
    text: 'What suggestions do you have for improvement?',
    type: 'comment',
    category: 'Comments',
    required: false
  }
];

// End-term Feedback Questions (Focus on Course Content and Overall Experience)
export const endtermQuestions: FeedbackQuestion[] = [
  // Course Content and Structure
  {
    id: 'et_course_objectives',
    text: 'How well were the course objectives clearly defined and communicated?',
    type: 'rating',
    category: 'Course Structure',
    required: true
  },
  {
    id: 'et_syllabus_coverage',
    text: 'How comprehensive was the syllabus coverage?',
    type: 'rating',
    category: 'Course Structure',
    required: true
  },
  {
    id: 'et_content_organization',
    text: 'How well was the course content organized and sequenced?',
    type: 'rating',
    category: 'Course Structure',
    required: true
  },
  {
    id: 'et_content_difficulty',
    text: 'Was the course content at an appropriate difficulty level?',
    type: 'rating',
    category: 'Course Structure',
    required: true
  },
  {
    id: 'et_content_relevance',
    text: 'How relevant is the course content to your academic/career goals?',
    type: 'rating',
    category: 'Course Structure',
    required: true
  },
  
  // Learning Outcomes and Skills
  {
    id: 'et_learning_outcomes',
    text: 'How well were the stated learning outcomes achieved?',
    type: 'rating',
    category: 'Learning Outcomes',
    required: true
  },
  {
    id: 'et_skill_development',
    text: 'How much did this course enhance your skills in the subject area?',
    type: 'rating',
    category: 'Learning Outcomes',
    required: true
  },
  {
    id: 'et_critical_thinking',
    text: 'How well did the course develop your critical thinking abilities?',
    type: 'rating',
    category: 'Learning Outcomes',
    required: true
  },
  {
    id: 'et_practical_knowledge',
    text: 'How effectively did the course provide practical, applicable knowledge?',
    type: 'rating',
    category: 'Learning Outcomes',
    required: true
  },
  
  // Course Materials and Resources
  {
    id: 'et_textbook_quality',
    text: 'How helpful were the prescribed textbooks and reading materials?',
    type: 'rating',
    category: 'Resources',
    required: true
  },
  {
    id: 'et_supplementary_materials',
    text: 'How useful were the supplementary materials (handouts, videos, etc.)?',
    type: 'rating',
    category: 'Resources',
    required: true
  },
  {
    id: 'et_lab_practical',
    text: 'How effective were the laboratory/practical sessions (if applicable)?',
    type: 'rating',
    category: 'Resources',
    required: true
  },
  {
    id: 'et_online_resources',
    text: 'How useful were the online resources and digital materials?',
    type: 'rating',
    category: 'Resources',
    required: true
  },
  
  // Assessment and Evaluation
  {
    id: 'et_assessment_fairness',
    text: 'How fair and appropriate were the assessment methods?',
    type: 'rating',
    category: 'Assessment',
    required: true
  },
  {
    id: 'et_assignment_relevance',
    text: 'How relevant were the assignments to the course objectives?',
    type: 'rating',
    category: 'Assessment',
    required: true
  },
  {
    id: 'et_exam_preparation',
    text: 'How well did the course prepare you for examinations?',
    type: 'rating',
    category: 'Assessment',
    required: true
  },
  {
    id: 'et_grading_transparency',
    text: 'How transparent and consistent was the grading process?',
    type: 'rating',
    category: 'Assessment',
    required: true
  },
  
  // Overall Course Experience
  {
    id: 'et_course_satisfaction',
    text: 'Overall, how satisfied are you with this course?',
    type: 'rating',
    category: 'Overall Experience',
    required: true
  },
  {
    id: 'et_recommend_course',
    text: 'How likely are you to recommend this course to other students?',
    type: 'rating',
    category: 'Overall Experience',
    required: true
  },
  {
    id: 'et_workload_appropriate',
    text: 'Was the course workload appropriate for the credit hours?',
    type: 'rating',
    category: 'Overall Experience',
    required: true
  },
  {
    id: 'et_expectations_met',
    text: 'How well did the course meet your initial expectations?',
    type: 'rating',
    category: 'Overall Experience',
    required: true
  },
  {
    id: 'et_future_learning',
    text: 'How well has this course prepared you for future courses in this area?',
    type: 'rating',
    category: 'Overall Experience',
    required: true
  },
  
  // Comment Questions
  {
    id: 'et_course_strengths',
    text: 'What were the strongest aspects of this course? What made it valuable to your learning?',
    type: 'comment',
    category: 'Comments',
    required: false
  },
  {
    id: 'et_course_improvements',
    text: 'What aspects of the course could be improved? Please provide specific suggestions.',
    type: 'comment',
    category: 'Comments',
    required: false
  },
  {
    id: 'et_additional_topics',
    text: 'Are there any topics you feel should be added to or removed from the course content?',
    type: 'comment',
    category: 'Comments',
    required: false
  },
  {
    id: 'et_overall_experience',
    text: 'Please share your overall experience with this course and any additional feedback.',
    type: 'comment',
    category: 'Comments',
    required: false
  }
];

// Rating scale labels
export const ratingScale = {
  1: 'Poor',
  2: 'Below Average', 
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
};

// Helper function to get questions by type
export const getQuestionsByType = (type: 'midterm' | 'endterm'): FeedbackQuestion[] => {
  return type === 'midterm' ? midtermQuestions : endtermQuestions;
};

// Helper function to get questions by category
export const getQuestionsByCategory = (questions: FeedbackQuestion[]) => {
  return questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, FeedbackQuestion[]>);
};