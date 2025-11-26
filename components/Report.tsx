
import React from "react";
import { AnalysisReport } from "../types";
import {
  Brain, Shield, Target, TrendingUp, Printer, ArrowLeft, Mail, Phone, AlertTriangle, CheckCircle
} from "lucide-react";
import { Button } from "./Button";

interface ReportProps {
  data: AnalysisReport;
  candidateName: string;
  candidateRole: string;
  email?: string;
  phone?: string;
  onBack: () => void;
}

const ScoreCard: React.FC<{ label: string; score: number; inverse?: boolean }> = ({
  label,
  score,
  inverse = false,
}) => {
  let colorClass = "text-yellow-600";
  let bgClass = "bg-yellow-50";

  const safeScore = isNaN(score) ? 0 : score;

  if (!inverse) {
    if (safeScore >= 80) { colorClass = "text-green-600"; bgClass = "bg-green-50"; }
    else if (safeScore < 50) { colorClass = "text-red-600"; bgClass = "bg-red-50"; }
  } else {
    if (safeScore <= 20) { colorClass = "text-green-600"; bgClass = "bg-green-50"; }
    else if (safeScore >= 70) { colorClass = "text-red-600"; bgClass = "bg-red-50"; }
  }

  return (
    <div className={`p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center ${bgClass} print:border-slate-300 print:break-inside-avoid`}>
      <span className={`text-4xl font-bold mb-1 ${colorClass}`}>{safeScore}</span>
      <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">{label}</span>
    </div>
  );
};

export const Report: React.FC<ReportProps> = ({ data, candidateName, candidateRole, email, phone, onBack }) => {
  const psychology = data?.psychology || {
    mbti: "N/A",
    bigFive: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
    enneagram: "N/A",
  };
  const bigFive = psychology.bigFive || { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
  const emotionalIntelligence = data?.emotionalIntelligence || { selfAwareness: 0, selfRegulation: 0, empathy: 0, motivation: 0, socialSkills: 0 };
  const scores = data?.scores || { aptitude: 0, integrity: 0, performancePotential: 0, culturalFit: 0, flightRisk: 0 };
  const coherence = data?.coherence || { score: 0, narrativeAnalysis: "No info", honestyScore: 0, honestyAnalysis: "", inconsistencies: [], locusOfControl: "External" };
  const leadership = data?.leadership || { primaryStyle: "N/A", secondaryStyle: "", strengths: [], weaknesses: [], developmentPlan: "" };
  const flags = data?.flags || { redFlags: [], greenFlags: [] };
  const recommendation = data?.recommendation || { decision: "VALIDATE", reason: "Análisis incompleto", nextSteps: [] };

  const bigFiveData = [
    { subject: "Apertura", A: bigFive.openness ?? 50 },
    { subject: "Conciencia", A: bigFive.conscientiousness ?? 50 },
    { subject: "Extraversión", A: bigFive.extraversion ?? 50 },
    { subject: "Amabilidad", A: bigFive.agreeableness ?? 50 },
    { subject: "Neuroticismo", A: bigFive.neuroticism ?? 50 },
  ];

  const eqData = [
    { name: 'Autoconc.', val: (emotionalIntelligence.selfAwareness ?? 5) * 10 },
    { name: 'Autorreg.', val: (emotionalIntelligence.selfRegulation ?? 5) * 10 },
    { name: 'Empatía', val: (emotionalIntelligence.empathy ?? 5) * 10 },
    { name: 'Social', val: (emotionalIntelligence.socialSkills ?? 5) * 10 },
  ];

  const decisionColor = 
    recommendation.decision === 'HIRE' ? 'bg-green-100 text-green-800 border-green-200' :
    recommendation.decision === 'REJECT' ? 'bg-red-100 text-red-800 border-red-200' :
    'bg-yellow-100 text-yellow-800 border-yellow-200';

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    // @ts-ignore
    if (typeof window.html2pdf !== 'undefined') {
       const opt = {
         margin: [10, 10],
         filename: `Reporte_${candidateName.replace(/\s+/g, '_')}.pdf`,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: { scale: 2, useCORS: true, logging: false },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
         pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
       };
       // @ts-ignore
       window.html2pdf().set(opt).from(element).save();
    } else {
        // Fallback if library fails
        window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center no-print">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Button>
        <Button onClick={handleDownloadPDF} variant="secondary">
          <Printer className="w-4 h-4" /> Descargar PDF
        </Button>
      </div>

      {/* Report Content ID for PDF */}
      <div id="report-content" className="bg-white p-8 rounded-none md:rounded-2xl shadow-none md:shadow-sm border-none md:border border-slate-200">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Reporte de Talento IA</h1>
              <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-700">{candidateName}</p>
                  <p className="text-slate-500 text-sm">{candidateRole}</p>
                  <div className="flex gap-6 text-sm text-slate-500 mt-2 p-2 bg-slate-50 rounded border border-slate-100 w-fit">
                      <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500"/> {email || "No registrado"}</span>
                      <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500"/> {phone || "No registrado"}</span>
                  </div>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-lg border-2 text-xl font-bold tracking-widest ${decisionColor}`}>
              {recommendation.decision}
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <ScoreCard label="Aptitud" score={scores.aptitude} />
            <ScoreCard label="Integridad" score={scores.integrity} />
            <ScoreCard label="Potencial" score={scores.performancePotential} />
            <ScoreCard label="Ajuste Cultural" score={scores.culturalFit} />
            <ScoreCard label="Riesgo de Fuga" score={scores.flightRisk} inverse />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Psychology */}
            <div className="space-y-6 break-inside-avoid">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" /> Perfil Psicológico
                </h3>
                
                <div className="flex items-center justify-around mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{psychology.mbti || "N/A"}</div>
                    <div className="text-xs text-slate-500 uppercase">MBTI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{psychology.enneagram || "N/A"}</div>
                    <div className="text-xs text-slate-500 uppercase">Eneagrama</div>
                  </div>
                </div>

                {/* Visual Bars for PDF compatibility */}
                <div className="space-y-3 text-sm">
                    {bigFiveData.map(d => (
                        <div key={d.subject} className="flex justify-between items-center">
                            <span className="text-slate-600 w-24">{d.subject}</span>
                            <div className="flex-1 mx-3 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full print:bg-purple-500" style={{width: `${d.A}%`, WebkitPrintColorAdjust: 'exact'}}></div>
                            </div>
                            <span className="font-bold text-slate-700 w-8 text-right">{d.A}%</span>
                        </div>
                    ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Inteligencia Emocional
                </h3>
                 <div className="space-y-3 text-sm">
                    {eqData.map(d => (
                        <div key={d.name} className="flex justify-between items-center">
                            <span className="text-slate-600 w-20">{d.name}</span>
                            <div className="flex-1 mx-3 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full print:bg-blue-500" style={{width: `${d.val}%`, WebkitPrintColorAdjust: 'exact'}}></div>
                            </div>
                            <span className="font-bold text-slate-700 w-8 text-right">{d.val/10}</span>
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="space-y-6 break-inside-avoid">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-600" /> Coherencia e Integridad
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-xs text-slate-500 uppercase">Coherencia</div>
                    <div className="text-xl font-bold text-slate-800">{coherence.score ?? 0}/100</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-xs text-slate-500 uppercase">Honestidad</div>
                    <div className="text-xl font-bold text-slate-800">{coherence.honestyScore ?? 0}/100</div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-4 italic bg-white p-3 rounded border border-slate-100">"{coherence.narrativeAnalysis || 'Análisis no disponible'}"</p>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Inconsistencias Detectadas</h4>
                  {coherence.inconsistencies && coherence.inconsistencies.length > 0 ? (
                     <ul className="list-disc list-inside text-sm text-red-600 space-y-1 bg-red-50 p-3 rounded border border-red-100">
                     {coherence.inconsistencies.map((inc, i) => (
                       <li key={i}>{inc}</li>
                     ))}
                   </ul>
                  ) : (
                    <p className="text-sm text-green-600 flex items-center gap-1 bg-green-50 p-3 rounded border border-green-100"><CheckCircle className="w-4 h-4"/> Ninguna.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-slate-600" /> Liderazgo
                </h3>
                <div className="flex gap-2 mb-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold print:bg-blue-600 print:text-white" style={{WebkitPrintColorAdjust: 'exact'}}>{leadership.primaryStyle || "No definido"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-green-700 mb-2 uppercase text-xs">Fortalezas</h4>
                        <ul className="space-y-1">
                            {leadership.strengths?.slice(0, 3).map((s, i) => <li key={i} className="text-slate-600">• {s}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-orange-700 mb-2 uppercase text-xs">Debilidades</h4>
                        <ul className="space-y-1">
                            {leadership.weaknesses?.slice(0, 3).map((s, i) => <li key={i} className="text-slate-600">• {s}</li>)}
                        </ul>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 break-inside-avoid">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                 <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Banderas Rojas
                </h3>
                <ul className="space-y-2">
                    {flags.redFlags && flags.redFlags.length > 0 ? flags.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                            <span className="mt-1 block min-w-[6px] w-[6px] h-[6px] rounded-full bg-red-500"></span>
                            {flag}
                        </li>
                    )) : <li className="text-red-700/50 italic">Ninguna detectada.</li>}
                </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                 <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Banderas Verdes
                </h3>
                <ul className="space-y-2">
                    {flags.greenFlags && flags.greenFlags.length > 0 ? flags.greenFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-green-700 text-sm">
                            <span className="mt-1 block min-w-[6px] w-[6px] h-[6px] rounded-full bg-green-500"></span>
                            {flag}
                        </li>
                    )) : <li className="text-green-700/50 italic">Ninguna detectada.</li>}
                </ul>
            </div>
          </div>

           {/* Recommendation */}
           <div className="bg-slate-800 text-white p-8 rounded-xl border border-slate-700 break-inside-avoid" style={{backgroundColor: '#1e293b', color: 'white', WebkitPrintColorAdjust: 'exact'}}>
              <h3 className="text-xl font-bold mb-4">Veredicto Final: {recommendation.decision}</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {recommendation.reason || "Sin razón especificada."}
              </p>
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600" style={{backgroundColor: '#334155', borderColor: '#475569'}}>
                 <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Pasos Recomendados</h4>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recommendation.nextSteps?.map((step, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-200">
                            • {step}
                        </li>
                    ))}
                 </ul>
              </div>
           </div>
      </div>
    </div>
  );
};
