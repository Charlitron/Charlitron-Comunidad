import React, { useState } from 'react';
import { Course } from '../types';
import { Button } from './Button';
import { Briefcase, Video, Trophy } from 'lucide-react';

interface CoursePlayerProps {
  course: Course;
  onBack: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onBack }) => {
  const [step, setStep] = useState<'VIDEO' | 'QUIZ' | 'DONE'>('VIDEO');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  const handleAnswer = (optionIdx: number) => {
      if (!course.quiz) return;
      
      const isCorrect = course.quiz[currentQ].correctOptionIndex === optionIdx;
      if (isCorrect) setScore(s => s + 1);
      
      if (currentQ < course.quiz.length - 1) {
          setCurrentQ(q => q + 1);
      } else {
          setStep('DONE');
      }
  };

  return (
      <div className="max-w-4xl mx-auto py-8 px-4">
          <Button variant="outline" onClick={onBack} className="mb-4">
              <Briefcase className="w-4 h-4 mr-2" /> Volver al Catálogo
          </Button>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              {step === 'VIDEO' && (
                  <div className="aspect-video bg-black flex items-center justify-center relative">
                      {course.videoUrl ? (
                          <iframe 
                            src={course.videoUrl} 
                            className="w-full h-full" 
                            title={course.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>
                      ) : (
                          <div className="text-white text-center">
                              <Video className="w-16 h-16 mx-auto opacity-50 mb-2"/>
                              <p>Video no disponible</p>
                          </div>
                      )}
                  </div>
              )}

              <div className="p-8">
                  <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
                  <p className="text-slate-500 mb-6">{course.description}</p>

                  {step === 'VIDEO' && (
                      <div className="flex justify-end">
                          <Button onClick={() => setStep(course.quiz && course.quiz.length > 0 ? 'QUIZ' : 'DONE')}>
                              {course.quiz && course.quiz.length > 0 ? 'Tomar Examen' : 'Completar Curso'}
                          </Button>
                      </div>
                  )}

                  {step === 'QUIZ' && course.quiz && (
                      <div className="max-w-lg mx-auto">
                          <div className="mb-4 flex justify-between text-sm text-slate-500">
                              <span>Pregunta {currentQ + 1} de {course.quiz.length}</span>
                              <span>Progreso: {Math.round(((currentQ)/course.quiz.length)*100)}%</span>
                          </div>
                          <h3 className="text-xl font-bold mb-6">{course.quiz[currentQ].question}</h3>
                          <div className="space-y-3">
                              {course.quiz[currentQ].options.map((opt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-medium"
                                  >
                                      {opt}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  {step === 'DONE' && (
                      <div className="text-center py-10">
                          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Trophy className="w-12 h-12 text-yellow-600" />
                          </div>
                          <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Curso Completado!</h2>
                          <p className="text-slate-500 mb-6">Has ganado <span className="font-bold text-purple-600">+{course.points} Puntos</span> y una insignia verificada.</p>
                          {course.quiz && course.quiz.length > 0 && (
                              <div className="mb-8 p-4 bg-slate-50 inline-block rounded-lg">
                                  <div className="text-sm text-slate-500">Resultado del Examen</div>
                                  <div className="text-2xl font-bold">{score} / {course.quiz.length} Correctas</div>
                              </div>
                          )}
                          <div>
                            <Button onClick={onBack}>Volver a Cursos</Button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};