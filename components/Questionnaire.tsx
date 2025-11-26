import React, { useState } from "react";
import { QUESTION_BLOCKS } from "../constants";
import { Answers } from "../types";
import { Button } from "./Button";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface QuestionnaireProps {
  onComplete: (answers: Answers) => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ onComplete }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const currentBlock = QUESTION_BLOCKS[currentBlockIndex];
  const isLastBlock = currentBlockIndex === QUESTION_BLOCKS.length - 1;

  const handleInputChange = (question: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isLastBlock) {
      onComplete(answers);
    } else {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex((prev) => prev - 1);
    }
  };

  // Calculate progress
  const totalBlocks = QUESTION_BLOCKS.length;
  const progress = ((currentBlockIndex + 1) / totalBlocks) * 100;

  // Check if current block is fully answered
  const isCurrentBlockComplete = currentBlock.questions.every(
    (q) => (answers[q] || "").trim().length > 0
  );

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
          <span>Sección {currentBlockIndex + 1} de {totalBlocks}</span>
          <span>{Math.round(progress)}% Completado</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-4 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {currentBlock.id}
            </span>
            <h2 className="text-2xl font-bold text-slate-800">{currentBlock.title}</h2>
        </div>
        <p className="text-slate-600">{currentBlock.description}</p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {currentBlock.questions.map((question, index) => (
          <div key={question} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
            <label className="block text-slate-700 font-semibold mb-3">
              <span className="text-blue-600 mr-2">{index + 1}.</span>
              {question}
            </label>
            <textarea
              className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] text-slate-700 resize-y"
              placeholder="Escribe tu respuesta detallada aquí..."
              value={answers[question] || ""}
              onChange={(e) => handleInputChange(question, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 mb-12">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentBlockIndex === 0}
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isCurrentBlockComplete}
          className={!isCurrentBlockComplete ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isLastBlock ? (
            <>
              Finalizar y Analizar <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              Siguiente Sección <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};