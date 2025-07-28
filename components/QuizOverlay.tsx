// components/QuizOverlay.tsx
"use client";

import { useState, useEffect } from "react";

// Each option may be a simple string or an object with text/isCorrect
export type QuizOption = string | { text: string; isCorrect: boolean };
export interface QuizOptionFeedback { text: string; isCorrect: boolean }

export interface Quiz {
  question: string;
  options: QuizOption[];
  correctIndex: number;
  feedback: QuizOptionFeedback[];
}

interface QuizOverlayProps {
  quiz: Quiz;
  loading?: boolean;
  onSubmit: (selectedIndex: number) => void;
}

export default function QuizOverlay({ quiz, loading = false, onSubmit }: QuizOverlayProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // reset when quiz changes
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [quiz]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 text-white rounded-md shadow-lg flex items-center justify-center">
        <div className="animate-spin border-4 border-white border-t-transparent rounded-full w-8 h-8" />
        <span className="ml-4">Loading question...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-md shadow-lg space-y-4">
      <h3 className="text-xl font-semibold">{quiz.question}</h3>

      {!submitted ? (
        <div className="space-y-2">
          {quiz.options.map((opt, idx) => (
            <label key={idx} className="flex items-center">
              <input
                type="radio"
                name="quiz"
                value={idx}
                checked={selected === idx}
                onChange={() => setSelected(idx)}
                className="mr-2"
              />
              <span>
                {typeof opt === 'string' ? opt : opt.text}
              </span>
            </label>
          ))}
          <button
            onClick={() => setSubmitted(true)}
            disabled={selected === null}
            className="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={selected === quiz.correctIndex ? "text-green-400" : "text-red-400"}>
            {typeof quiz.feedback[selected!] === 'string'
              ? quiz.feedback[selected!] as unknown as string
              : (quiz.feedback[selected!] as QuizOptionFeedback).text}
          </p>
          <button
            onClick={() => onSubmit(selected!)}
            className="bg-white text-black px-4 py-2 rounded"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}