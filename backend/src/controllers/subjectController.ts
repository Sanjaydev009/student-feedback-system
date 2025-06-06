// src/controllers/subjectController.ts
import { Request, Response } from 'express';
import Subject from '../models/Subject';

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const { name, code, semester, department, instructor } = req.body;

  try {
    const subject = await Subject.create({
      name,
      code,
      semester,
      department,
      instructor,
    });

    res.status(201).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};