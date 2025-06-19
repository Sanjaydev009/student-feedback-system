// src/controllers/subjectController.ts
import { Request, Response } from 'express';
import Subject from '../models/Subject';
import User from '../models/User'; 

// controllers/subjectController.ts
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find(); // Returns all subjects
    res.json(subjects);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    code,
    instructor,
    department,
    semester,
    branch,
    questions
  } = req.body;

  if (!name || !code || !instructor || !department || !semester || !branch || !Array.isArray(questions) || questions.length < 10) {
    res.status(400).json({ message: 'All fields including 10 questions are required' });
    return;
  }

  try {
    const newSubject = await Subject.create({
      name,
      code,
      instructor,
      department,
      semester,
      branch,
      questions
    });

    res.status(201).json(newSubject);
  } catch (err: any) {
    console.error('Error adding subject:', err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id); // Ensure model is imported
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


