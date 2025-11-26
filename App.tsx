
import React, { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { Questionnaire } from './components/Questionnaire';
import { OperativeChat } from './components/OperativeChat';
import { Report } from './components/Report';
import { CoursePlayer } from './components/CoursePlayer';
import { Navbar } from './components/Navbar';
import { analyzeCandidate } from './services/geminiService';
import { storageService } from './services/storageService';
import { Answers, Candidate, Company, Assessment, Job, Course, CourseQuestion, CreditCode, ActivityData } from './types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Building2, CheckCircle2, Search, GraduationCap, MapPin, DollarSign, Briefcase, 
  Plus, Layout, Users, BookOpen, Settings, ToggleLeft, 
  ToggleRight, LogOut, Upload, PlayCircle, Trophy, AlertCircle, Trash2, Video, Lock, ShoppingCart, CreditCard, ShieldCheck, KeyRound, Pencil, X, AlertTriangle, Star, Filter, ScanEye, UserPlus, Mail, Factory, Sparkles, FileText, Phone, Clock, Shield, Menu
} from 'lucide-react';

const CHARLITRON_LOGO = "https://static.wixstatic.com/media/7fb206_893f39bbcc1d4a469839dce707985bf7~mv2.png/v1/fill/w_157,h_157,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/charlitron-logo.png";

type ViewState = 'HOME' | 'JOBS' | 'COURSES' | 'LOGIN' | 'COMPANY_DASHBOARD' | 'APPLY_JOB' | 'DO_TEST' | 'SUCCESS' | 'VIEW_REPORT' | 'TAKE_COURSE' | 'SUPER_ADMIN';
type DashboardTab = 'OVERVIEW' | 'VACANCIES' | 'CANDIDATES' | 'COURSES' | 'PROFILE' | 'STORE';

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewJobModal, setViewJobModal] = useState<Job | null>(null); // MODAL STATE
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  
  // Job Board Filter State
  const [jobSearch, setJobSearch] = useState("");
  const [jobLocationFilter, setJobLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("ALL");

  // Auth State
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newCompanyCode, setNewCompanyCode] = useState<string | null>(null);
  
  // Dashboard State
  const [assessments, setAssessments] = useState<(Assessment & { candidateName?: string, jobTitle?: string, candidatePhone?: string, candidateEmail?: string, candidateLocation?: {lat: number, lng: number} })[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [unlockModal, setUnlockModal] = useState<{show: boolean, asmId: string | null}>({ show: false, asmId: null });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // MOBILE MENU STATE

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'JOB' | 'COURSE' | 'COMPANY', id: string, name: string } | null>(null);

  // Privacy Modal State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Editing State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Admin State
  const [adminCodes, setAdminCodes] = useState<CreditCode[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); 
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  // Course Creation State
  const [quizQuestions, setQuizQuestions] = useState<CourseQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ q: '', o1: '', o2: '', o3: '', correct: 0 });
  const [videoSourceType, setVideoSourceType] = useState<'LINK' | 'FILE'>('LINK');

  // Location State
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [locLoading, setLocLoading] = useState(false);
  const [allCompanyLogos, setAllCompanyLogos] = useState<Record<string, string>>({}); 

  useEffect(() => {
    storageService.init(); 
    refreshData();
  }, []);

  useEffect(() => {
      if (logoClicks > 0 && logoClicks < 5) {
          const timer = setTimeout(() => setLogoClicks(0), 3000); 
          return () => clearTimeout(timer);
      }
      if (logoClicks >= 5) {
          setShowAdminLoginModal(true);
          setLogoClicks(0);
      }
  }, [logoClicks]);

  const refreshData = async () => {
    setIsLoading(true);
    const j = await storageService.getJobs();
    const c = await storageService.getCourses();
    setJobs(j.filter(job => job.active));
    setCourses(c);
    
    // Fetch all logos for job board
    const companies = await storageService.getCompanies();
    const logoMap: Record<string, string> = {};
    companies.forEach(c => { if(c.logo) logoMap[c.code] = c.logo; });
    setAllCompanyLogos(logoMap);

    if (currentCompany) {
        const freshCompany = await storageService.loginCompany(currentCompany.code);
        if (freshCompany) setCurrentCompany(freshCompany);
        const asms = await storageService.getAssessmentsByCompany(currentCompany.code);
        setAssessments(asms);
        const activity = await storageService.getWeeklyActivity(currentCompany.code);
        setActivityData(activity);
    }
    setIsLoading(false);
  };

  const loadAdminData = async () => {
      setIsLoading(true);
      const codes = await storageService.getCreditCodes();
      const comps = await storageService.getCompanies();
      const crs = await storageService.getAllCourses(); 
      setAdminCodes(codes);
      setAllCompanies(comps);
      setAllCourses(crs);
      setIsLoading(false);
  };

  const handleStartApplication = (job: Job) => {
    setSelectedJob(job);
    setLocation(undefined);
    setView('APPLY_JOB');
  };

  const handleGetLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocLoading(false);
            },
            (error) => {
                console.warn("GPS Error:", error);
                alert("No pudimos obtener tu ubicación. (Asegúrate de usar HTTPS o permitir el acceso)");
                setLocLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
        setLocLoading(false);
    }
  };

  const handleCandidateRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    
    if (selectedJob) {
        const candidate: Candidate = {
            id: email, 
            name,
            email,
            phone,
            role: selectedJob.title,
            companyCode: selectedJob.companyCode,
            type: selectedJob.type,
            location: location
        };
        setCurrentCandidate(candidate);
        setView('DO_TEST');
    }
  };

  const handleSubmitTest = async (answers: Answers) => {
    if (currentCandidate && selectedJob) {
        try {
            const asm = await storageService.saveAssessment(currentCandidate, answers, selectedJob.id);
            if (asm) {
                setView('SUCCESS'); 
                // Async analysis in background
                analyzeCandidate(currentCandidate, answers).then(report => {
                    storageService.updateAssessmentReport(asm.id, report);
                });
            } else {
                alert("Error al guardar la postulación. Intenta de nuevo.");
            }
        } catch (e) { 
            console.error("Submit Test Error:", e); 
            alert("Ocurrió un error inesperado al guardar.");
        }
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setDeleteTarget(null); // Clear ghost state
    try {
      const fd = new FormData(e.currentTarget);
      const code = (fd.get('code') as string).toUpperCase().trim();
      
      const comp = await storageService.loginCompany(code);
      
      if (comp) {
          setCurrentCompany(comp);
          const asms = await storageService.getAssessmentsByCompany(comp.code);
          setAssessments(asms);
          const activity = await storageService.getWeeklyActivity(comp.code);
          setActivityData(activity);
          
          setIsLoading(false);
          setView('COMPANY_DASHBOARD');
      } else {
          setIsLoading(false);
          alert("Código inválido.");
      }
    } catch (e) {
        console.error(e);
        setIsLoading(false);
        alert("Error de conexión.");
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      const fd = new FormData(e.currentTarget);
      const name = fd.get('name') as string;
      const email = fd.get('email') as string;
      const industry = fd.get('industry') as string;

      const res = await storageService.registerCompany(name, email, industry);
      
      if (res.success && res.code) {
          setNewCompanyCode(res.code);
          // IMPORTANT: Keep isRegistering true so the success message is shown
          // setIsRegistering(false); 
      } else {
          alert("Error al registrar: " + res.message);
      }
      setIsLoading(false);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setDeleteTarget(null); // Clear ghost state
      const fd = new FormData(e.currentTarget);
      const pass = fd.get('password') as string;
      if (pass === '2003') {
          loadAdminData();
          setShowAdminLoginModal(false);
          setView('SUPER_ADMIN');
      } else {
          alert("Acceso denegado.");
      }
  }

  const handleLogout = () => {
      setCurrentCompany(null); 
      setDeleteTarget(null); 
      setNewCompanyCode(null); // CLEAR THE CODE FROM LOGIN SCREEN
      setView('HOME');
  };

  // --- ADMIN ACTIONS ---
  const handleGenerateCode = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const amount = parseInt((new FormData(e.currentTarget).get('amount') as string));
      await storageService.generateCreditCode(amount);
      loadAdminData();
  };

  const handleVerifyCompany = async (code: string, email: string, name: string) => {
      setIsLoading(true);
      await storageService.verifyCompany(code);
      
      // OPEN EMAIL CLIENT WITH PRE-FILLED MESSAGE
      const subject = encodeURIComponent("Verificación Exitosa - Charlitron Comunidad");
      const body = encodeURIComponent(`Hola ${name},\n\nTu empresa ha sido verificada exitosamente en Charlitron Comunidad.\n\nAquí tienes tu CÓDIGO DE ACCESO OFICIAL:\n\n${code}\n\nPuedes ingresar ahora en la plataforma.\n\nAtentamente,\nEquipo Charlitron`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

      await loadAdminData();
      setIsLoading(false);
  };

  const handleAuditCompany = async (company: Company) => {
      setIsLoading(true);
      const analysis = await storageService.auditCompanyWithAI(company);
      if (analysis) {
        setAuditResult(analysis); // Open Modal
      }
      setIsLoading(false);
  };

  // --- DELETE CONFIRMATION HANDLER ---
  const executeDelete = async () => {
      if (!deleteTarget) return;
      setIsLoading(true);
      
      try {
          if (deleteTarget.type === 'JOB') {
              await storageService.deleteJob(deleteTarget.id);
          } else if (deleteTarget.type === 'COURSE') {
              await storageService.deleteCourse(deleteTarget.id);
          } else if (deleteTarget.type === 'COMPANY') {
              await storageService.deleteCompany(deleteTarget.id);
          }
          
          // IMPORTANT: Reload correct data based on view
          if (view === 'SUPER_ADMIN') {
              await loadAdminData();
          } else {
              await refreshData();
          }
      } catch (error: any) {
          console.error("Delete error", error);
          alert("Hubo un error al eliminar. " + (error.message || ""));
      } finally {
          setIsLoading(false);
          setDeleteTarget(null);
      }
  };

  // --- Company Dashboard Actions ---
  const handleSaveJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentCompany) return;
    
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    
    const jobData: Job = {
        id: editingJob ? editingJob.id : 'job_' + Date.now(),
        title: fd.get('title') as string,
        companyName: currentCompany.name,
        companyCode: currentCompany.code,
        location: fd.get('location') as string,
        salary: fd.get('salary') as string,
        type: fd.get('type') as 'ADMIN' | 'OPERATIVE',
        description: fd.get('description') as string,
        tags: [],
        active: true
    };

    try {
        if (editingJob) {
            await storageService.updateJob(jobData);
            setEditingJob(null);
            alert('Vacante actualizada');
        } else {
            await storageService.addJob(jobData);
            alert('Vacante creada exitosamente');
        }
        await refreshData();
    } catch (e: any) {
        alert(e.message);
    }
    
    setIsLoading(false);
    if (!editingJob) (e.target as HTMLFormElement).reset();
  };

  // NEW: MAGIC AI JOB DESCRIPTION HANDLER
  const handleGenerateJobDesc = async () => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (!form) return;
      const titleInput = form.elements.namedItem('title') as HTMLInputElement;
      const typeSelect = form.elements.namedItem('type') as HTMLSelectElement;
      const descInput = form.elements.namedItem('description') as HTMLTextAreaElement;

      if (!titleInput.value) {
          alert("Primero escribe el título de la vacante.");
          return;
      }

      setIsLoading(true);
      const text = await storageService.generateJobDescriptionWithAI(titleInput.value, typeSelect.value);
      
      if (descInput) {
          descInput.value = text;
      }
      setIsLoading(false);
  };

  const handleAddQuestion = () => {
      if (!newQuestion.q || !newQuestion.o1 || !newQuestion.o2) return;
      setQuizQuestions(prev => [...prev, {
          id: 'q_' + Date.now(),
          question: newQuestion.q,
          options: [newQuestion.o1, newQuestion.o2, newQuestion.o3].filter(o => o),
          correctOptionIndex: newQuestion.correct
      }]);
      setNewQuestion({ q: '', o1: '', o2: '', o3: '', correct: 0 });
  };

  const handleRemoveQuestion = (idx: number) => {
      setQuizQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentCompany) return;
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    
    let videoUrl = fd.get('videoUrl') as string;

    if (videoSourceType === 'FILE') {
        const file = (fd.get('videoFile') as File);
        if (file && file.size > 0) {
             const uploadedUrl = await storageService.uploadFile('courses', file);
             if (!uploadedUrl) {
                 setIsLoading(false);
                 return; 
             }
             videoUrl = uploadedUrl;
        }
    }

    const courseData: Course = {
        id: editingCourse ? editingCourse.id : 'crs_' + Date.now(),
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        provider: currentCompany.name,
        companyCode: currentCompany.code,
        duration: fd.get('duration') as string,
        points: parseInt(fd.get('points') as string),
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300', 
        category: fd.get('category') as string,
        videoUrl: videoUrl,
        quiz: quizQuestions.length > 0 ? quizQuestions : undefined
    };

    try {
        if (editingCourse) {
            await storageService.updateCourse(courseData);
            setEditingCourse(null);
            alert('Curso actualizado');
        } else {
            await storageService.addCourse(courseData);
            alert('Curso publicado exitosamente');
        }
        setQuizQuestions([]);
        await refreshData();
    } catch (e: any) {
        alert(e.message);
    }

    setIsLoading(false);
    if (!editingCourse) (e.target as HTMLFormElement).reset();
  };

  const handleEditCourse = (course: Course) => {
      setEditingCourse(course);
      if (course.quiz) setQuizQuestions(course.quiz);
      if (course.videoUrl?.includes('supabase')) setVideoSourceType('FILE');
      else setVideoSourceType('LINK');
      window.scrollTo({top:0, behavior:'smooth'});
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentCompany) return;
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    const updated = await storageService.updateCompanyProfile(currentCompany.code, {
        name: fd.get('name') as string,
        description: fd.get('description') as string,
        industry: fd.get('industry') as string
    });
    if (updated) setCurrentCompany(updated);
    setIsLoading(false);
    alert('Perfil actualizado');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && currentCompany) {
          setIsLoading(true);
          const url = await storageService.uploadFile('logos', file);
          if (url) {
              const updated = await storageService.updateCompanyProfile(currentCompany.code, { logo: url });
              if (updated) setCurrentCompany(updated);
          }
          setIsLoading(false);
      }
  };

  const confirmUnlock = async () => {
      if (unlockModal.asmId && currentCompany) {
          setIsLoading(true);
          const res = await storageService.unlockAssessment(currentCompany.code, unlockModal.asmId);
          setIsLoading(false);
          
          if (res.success) {
              // Optimistic UI update for credits
              setCurrentCompany(prev => prev ? ({ ...prev, credits: (res.newCredits ?? prev.credits) }) : null);
              setAssessments(prev => prev.map(a => a.id === unlockModal.asmId ? { ...a, isUnlocked: true } : a));
              setUnlockModal({ show: false, asmId: null });
          } else {
              alert(res.message);
          }
      }
  };

  const handleRedeemCode = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!currentCompany) return;
      
      setIsLoading(true);
      const code = (new FormData(e.currentTarget).get('code') as string).trim().toUpperCase();
      const res = await storageService.redeemCredits(currentCompany.code, code);
      
      if (res.success) {
          // Optimistic Update: Immediately reflect new credits and plan
          setCurrentCompany(prev => prev ? ({ 
              ...prev, 
              credits: (typeof res.newCredits === 'number' ? res.newCredits : prev.credits),
              plan: (res.newPlan ? res.newPlan : prev.plan)
          }) : null);
      }
      
      setIsLoading(false);
      alert(res.message);
      (e.target as HTMLFormElement).reset();
  };

  // --- VIEWS ---

  const renderSuperAdmin = () => (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                      <ShieldCheck className="text-yellow-400 w-8 h-8 md:w-10 md:h-10" />
                      Panel Super Admin (Dios)
                  </h1>
                  <Button variant="danger" onClick={() => { setView('HOME'); setDeleteTarget(null); }}>Salir</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* COLUMN 1: GENERATOR */}
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard /> Generador de Códigos</h2>
                      <form onSubmit={handleGenerateCode} className="flex gap-4 mb-6">
                          <input type="number" name="amount" placeholder="Cantidad de Créditos" className="flex-1 p-3 rounded bg-slate-700 border border-slate-600 text-white" required />
                          <Button type="submit">Generar</Button>
                      </form>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                          {adminCodes.map((c, i) => (
                              <div key={i} className={`p-3 rounded flex justify-between items-center ${c.isRedeemed ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                                  <span className="font-mono font-bold tracking-widest">{c.code}</span>
                                  <span className="text-xs">{c.amount} Cr. {c.isRedeemed ? '(USADO)' : '(LIBRE)'}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* COLUMN 2: COMPANIES */}
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Building2 /> Empresas ({allCompanies.length})</h2>
                      <div className="max-h-[600px] overflow-y-auto space-y-2">
                          {allCompanies.map(c => (
                              <div key={c.code} className="p-4 bg-slate-700 rounded flex flex-col gap-3 group hover:bg-slate-600 transition-colors">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <div className="font-bold text-sm flex items-center gap-2">
                                              {c.name} 
                                              {c.plan === 'PREMIUM' && <span className="text-yellow-400 text-xs">★ PREMIUM</span>}
                                              {c.isVerified ? <CheckCircle2 className="w-4 h-4 text-green-400"/> : <AlertTriangle className="w-4 h-4 text-orange-400"/>}
                                          </div>
                                          <div className="text-xs text-slate-400 font-mono mb-1">Code: {c.code} | Créditos: {c.credits}</div>
                                          
                                          <div className="flex flex-col gap-1 mt-2 pl-2 border-l-2 border-slate-500">
                                              <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                                                  <Mail className="w-3 h-3" /> {c.email}
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-slate-300">
                                                  <Factory className="w-3 h-3" /> {c.industry || 'N/A'}
                                              </div>
                                          </div>
                                      </div>
                                      <button onClick={() => setDeleteTarget({ type: 'COMPANY', id: c.code, name: c.name })} className="text-slate-500 hover:text-red-500 transition-colors" title="Borrar Empresa">
                                          <Trash2 className="w-5 h-5" />
                                      </button>
                                  </div>
                                  
                                  <div className="flex gap-2 mt-2">
                                      {!c.isVerified && (
                                          <button onClick={() => handleVerifyCompany(c.code, c.email, c.name)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all">
                                              Verificar ✅
                                          </button>
                                      )}
                                      <button onClick={() => handleAuditCompany(c)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 rounded flex items-center justify-center gap-1">
                                          <ScanEye className="w-3 h-3"/> Auditoría IA
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* COLUMN 3: GLOBAL COURSES */}
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen /> Gestión Global de Cursos</h2>
                      <div className="max-h-[600px] overflow-y-auto space-y-2">
                          {allCourses.length === 0 && <p className="text-slate-500 text-sm italic">No hay cursos en el sistema.</p>}
                          {allCourses.map(c => (
                              <div key={c.id} className="p-3 bg-slate-700 rounded flex justify-between items-center group hover:bg-slate-600 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <img src={c.image} className="w-8 h-8 rounded object-cover bg-slate-900" alt="Mini" />
                                      <div className="min-w-0">
                                          <div className="font-bold text-sm truncate">{c.title}</div>
                                          <div className="text-xs text-slate-400 truncate">By: {c.provider || 'Desconocido'}</div>
                                      </div>
                                  </div>
                                  <button onClick={() => setDeleteTarget({ type: 'COURSE', id: c.id, name: c.title })} className="text-slate-500 hover:text-red-500 transition-colors" title="Borrar Curso">
                                      <Trash2 className="w-5 h-5" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderLogin = () => (
    <div className="max-w-md mx-auto py-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            {isRegistering ? (
                <>
                    <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2"><UserPlus className="w-6 h-6 text-blue-600"/> Registro de Empresa</h2>
                    
                    {newCompanyCode ? (
                        <div className="mb-6 bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-green-800 mb-2">¡Solicitud Recibida!</h3>
                            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                Tu empresa ha sido registrada y está <strong>pendiente de verificación</strong>.
                            </p>
                            <p className="text-slate-500 text-xs border-t border-slate-200 pt-3">
                                Un administrador revisará tus datos. Cuando seas aprobado, recibirás tu <strong>Código de Acceso</strong> en tu correo electrónico.
                            </p>
                            <Button className="w-full mt-4" onClick={() => { setNewCompanyCode(null); setIsRegistering(false); }}>Entendido</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <input name="name" required className="w-full p-3 border rounded-lg" placeholder="Nombre de Empresa" />
                            <input name="industry" required className="w-full p-3 border rounded-lg" placeholder="Industria (ej. Seguridad)" />
                            <input name="email" type="email" required className="w-full p-3 border rounded-lg" placeholder="Correo de Contacto" />
                            <Button className="w-full" isLoading={isLoading}>Enviar Solicitud</Button>
                            <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-center text-sm text-slate-500 mt-4 hover:text-blue-600">Volver</button>
                        </form>
                    )}
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-6 text-center">Acceso Empresas</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input name="code" className="w-full p-3 border rounded-lg text-center uppercase tracking-widest font-bold" placeholder="CÓDIGO EMPRESA" />
                        <Button className="w-full" isLoading={isLoading}>Entrar</Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => setIsRegistering(true)} className="text-sm text-blue-600 hover:underline">¿No tienes cuenta? Regístrate</button>
                    </div>
                </>
            )}
        </div>
    </div>
  );

  const renderCompanyDashboard = () => {
      const companyJobs = jobs.filter(j => j.companyCode === currentCompany?.code);
      const companyCourses = courses.filter(c => c.companyCode === currentCompany?.code);
      
      // MOBILE MENU HANDLER
      const closeMobileMenu = () => setIsMobileMenuOpen(false);
      
      return (
          <div className="flex h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden">
              
              {/* MOBILE MENU OVERLAY */}
              {isMobileMenuOpen && (
                  <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={closeMobileMenu}></div>
              )}

              {/* SIDEBAR - Now responsive */}
              <div className={`
                  fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto
                  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                  {/* Close button for mobile */}
                  <button onClick={closeMobileMenu} className="absolute top-4 right-4 md:hidden text-slate-500">
                      <X className="w-6 h-6"/>
                  </button>

                  <div className="flex flex-col items-center mb-8 px-2 text-center mt-8 md:mt-0">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 overflow-hidden border-4 relative group cursor-pointer ${currentCompany?.plan === 'PREMIUM' ? 'border-yellow-400' : 'border-slate-100'}`}>
                          {currentCompany?.logo ? (
                              <img src={currentCompany.logo} className="w-full h-full object-cover" alt="Logo" />
                          ) : (
                              <Building2 className="w-8 h-8 text-slate-400" />
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label className="cursor-pointer text-white text-xs font-bold">
                                  Cambiar
                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                              </label>
                          </div>
                      </div>
                      <h3 className="font-bold text-sm truncate w-full flex items-center justify-center gap-1">
                          {currentCompany?.name}
                          {currentCompany?.plan === 'PREMIUM' && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      </h3>
                      
                      <div className="mt-1">
                          {currentCompany?.isVerified ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 justify-center w-fit mx-auto"><CheckCircle2 className="w-3 h-3"/> Verificada</span>
                          ) : (
                              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1 justify-center w-fit mx-auto"><AlertTriangle className="w-3 h-3"/> Revisión</span>
                          )}
                      </div>

                      <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {currentCompany?.credits} Créditos
                      </div>
                      <button onClick={() => { setDashboardTab('STORE'); closeMobileMenu(); }} className="text-xs text-blue-600 underline mt-1 hover:text-blue-800">Recargar</button>
                  </div>
                  
                  <nav className="space-y-1 flex-1 overflow-y-auto">
                      <button onClick={() => { setDashboardTab('OVERVIEW'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'OVERVIEW' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <Layout className="w-5 h-5" /> Resumen
                      </button>
                      <button onClick={() => { setDashboardTab('VACANCIES'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'VACANCIES' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <Briefcase className="w-5 h-5" /> Mis Vacantes
                      </button>
                      <button onClick={() => { setDashboardTab('CANDIDATES'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'CANDIDATES' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <Users className="w-5 h-5" /> Candidatos
                      </button>
                      <button onClick={() => { setDashboardTab('COURSES'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'COURSES' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <BookOpen className="w-5 h-5" /> LMS / Cursos
                      </button>
                      <button onClick={() => { setDashboardTab('STORE'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'STORE' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <ShoppingCart className="w-5 h-5" /> Tienda
                      </button>
                      <button onClick={() => { setDashboardTab('PROFILE'); closeMobileMenu(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${dashboardTab === 'PROFILE' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <Settings className="w-5 h-5" /> Perfil Empresa
                      </button>
                  </nav>

                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors mt-4">
                      <LogOut className="w-5 h-5" /> Cerrar Sesión
                  </button>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                  {/* MOBILE HEADER FOR MENU */}
                  <div className="md:hidden flex items-center justify-between mb-6 border-b pb-4">
                      <h2 className="font-bold text-lg text-slate-800">
                          {dashboardTab === 'OVERVIEW' && 'Resumen'}
                          {dashboardTab === 'VACANCIES' && 'Mis Vacantes'}
                          {dashboardTab === 'CANDIDATES' && 'Candidatos'}
                          {dashboardTab === 'COURSES' && 'Cursos'}
                          {dashboardTab === 'STORE' && 'Tienda'}
                          {dashboardTab === 'PROFILE' && 'Perfil'}
                      </h2>
                      <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white border rounded shadow-sm">
                          <Menu className="w-6 h-6 text-slate-700"/>
                      </button>
                  </div>

                  {/* Overview Tab */}
                  {dashboardTab === 'OVERVIEW' && (
                      <div className="max-w-5xl space-y-8">
                          <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                Bienvenido, {currentCompany?.name}
                                {currentCompany?.plan === 'PREMIUM' && <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold">PREMIUM</span>}
                            </h2>
                            {!currentCompany?.isVerified && (
                                <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-lg text-orange-800 flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold">Tu cuenta está en revisión.</p>
                                        <p className="text-sm">No podrás publicar vacantes ni cursos hasta que un administrador verifique tu empresa.</p>
                                    </div>
                                </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-500 text-sm">Créditos Disp.</div>
                                    <DollarSign className="w-5 h-5 text-yellow-500" />
                                  </div>
                                  <div className="text-3xl font-bold text-slate-800">{currentCompany?.credits}</div>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-500 text-sm">Candidatos</div>
                                    <Users className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div className="text-3xl font-bold text-slate-800">{assessments.length}</div>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-500 text-sm">Vacantes Activas</div>
                                    <Briefcase className="w-5 h-5 text-purple-500" />
                                  </div>
                                  <div className="text-3xl font-bold text-slate-800">{companyJobs.filter(j => j.active).length}</div>
                              </div>
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-slate-500 text-sm">Promedio Aptitud</div>
                                    <Trophy className="w-5 h-5 text-green-500" />
                                  </div>
                                  <div className="text-3xl font-bold text-slate-800">
                                      {Math.round(assessments.reduce((acc, curr) => acc + (curr.report?.scores.aptitude || 0), 0) / (assessments.length || 1))}%
                                  </div>
                              </div>
                          </div>
                          
                          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                              <h3 className="text-lg font-bold mb-6">Actividad de Postulaciones (Última Semana)</h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityData}>
                                        <defs>
                                            <linearGradient id="colorSplit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                        <RechartsTooltip />
                                        <Area type="monotone" dataKey="solicitudes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSplit)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  )}

                  {dashboardTab === 'VACANCIES' && (
                      <div className="max-w-4xl">
                          <div className="hidden md:flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-bold">Gestión de Vacantes</h2>
                          </div>
                          
                          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
                              {!currentCompany?.isVerified && (
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                                      <div className="text-center p-6 bg-white border border-orange-200 rounded-lg shadow-lg max-w-sm">
                                          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3"/>
                                          <h4 className="font-bold text-slate-800">Función Bloqueada</h4>
                                          <p className="text-sm text-slate-500">Debes ser una empresa verificada para publicar vacantes.</p>
                                      </div>
                                  </div>
                              )}
                              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                  {editingJob ? <Pencil className="w-5 h-5 text-blue-500"/> : <Plus className="w-5 h-5" />} 
                                  {editingJob ? 'Editar Vacante' : 'Crear Nueva Vacante'}
                              </h3>
                              <form onSubmit={handleSaveJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-1 flex gap-2 items-center">
                                      <input name="title" required defaultValue={editingJob?.title} key={editingJob?.id ? `title-${editingJob.id}` : 'title-new'} placeholder="Título del Puesto" className="p-2 border rounded flex-1 w-full" />
                                      <Button type="button" size="sm" variant="secondary" onClick={handleGenerateJobDesc} title="Autocompletar Descripción con IA" className="px-2 flex-shrink-0">
                                          <Sparkles className="w-4 h-4 text-purple-500" />
                                      </Button>
                                  </div>
                                  <select name="type" defaultValue={editingJob?.type} key={editingJob?.id ? `type-${editingJob.id}` : 'type-new'} className="p-2 border rounded w-full">
                                      <option value="OPERATIVE">Operativo (Test Chat/Voz)</option>
                                      <option value="ADMIN">Administrativo (Test Profundo)</option>
                                  </select>
                                  <input name="salary" required defaultValue={editingJob?.salary} key={editingJob?.id ? `salary-${editingJob.id}` : 'salary-new'} placeholder="Salario (ej. $8,000 MXN)" className="p-2 border rounded w-full" />
                                  <input name="location" required defaultValue={editingJob?.location} key={editingJob?.id ? `location-${editingJob.id}` : 'location-new'} placeholder="Ubicación / Zona" className="p-2 border rounded w-full" />
                                  <textarea name="description" required defaultValue={editingJob?.description} key={editingJob?.id ? `desc-${editingJob.id}` : 'desc-new'} placeholder="Descripción breve del puesto..." className="md:col-span-2 p-2 border rounded h-24 w-full"></textarea>
                                  
                                  <div className="md:col-span-2 flex flex-col md:flex-row gap-2">
                                      <Button type="submit" isLoading={isLoading} className="w-full">
                                          {editingJob ? 'Guardar Cambios' : 'Publicar Vacante'}
                                      </Button>
                                      {editingJob && (
                                          <Button type="button" variant="outline" onClick={() => setEditingJob(null)} className="w-full md:w-auto">Cancelar</Button>
                                      )}
                                  </div>
                              </form>
                          </div>

                          <div className="space-y-4">
                              {companyJobs.map(job => (
                                  <div key={job.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                                      <div className="flex items-center gap-4 w-full md:w-auto">
                                          {currentCompany?.logo ? (
                                              <img src={currentCompany.logo} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="Logo" />
                                          ) : <Building2 className="w-10 h-10 text-slate-300 flex-shrink-0" />}
                                          <div className="min-w-0">
                                              <h4 className="font-bold truncate">{job.title}</h4>
                                              <p className="text-sm text-slate-500 truncate">{job.location} • {job.salary}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${job.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                              {job.active ? 'Activa' : 'Pausada'}
                                          </span>
                                          <div className="flex gap-1">
                                              <button 
                                                onClick={async () => {
                                                    await storageService.updateJobStatus(job.id, !job.active);
                                                    refreshData();
                                                }}
                                                className="text-slate-400 hover:text-blue-600 p-2 border rounded hover:bg-blue-50"
                                                title="Pausar/Activar"
                                              >
                                                  {job.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                                              </button>
                                              <button 
                                                onClick={() => { setEditingJob(job); window.scrollTo({top:0, behavior:'smooth'}); }} 
                                                className="text-slate-400 hover:text-blue-600 p-2 border rounded hover:bg-blue-50"
                                                title="Editar"
                                              >
                                                  <Pencil className="w-5 h-5" />
                                              </button>
                                              <button 
                                                onClick={() => setDeleteTarget({ type: 'JOB', id: job.id, name: job.title })}
                                                className="text-slate-400 hover:text-red-600 p-2 border rounded hover:bg-red-50"
                                                title="Borrar"
                                              >
                                                  <Trash2 className="w-5 h-5" />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {dashboardTab === 'COURSES' && (
                      <div className="max-w-4xl">
                          <h2 className="text-2xl font-bold mb-6 hidden md:block">LMS - Gestión de Capacitación</h2>
                           <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
                              {!currentCompany?.isVerified && (
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                                      <div className="text-center p-6 bg-white border border-orange-200 rounded-lg shadow-lg max-w-sm">
                                          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3"/>
                                          <h4 className="font-bold text-slate-800">Función Bloqueada</h4>
                                          <p className="text-sm text-slate-500">Verificación requerida para publicar cursos.</p>
                                      </div>
                                  </div>
                              )}
                              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                  {editingCourse ? <Pencil className="w-5 h-5 text-blue-500"/> : <Plus className="w-5 h-5" />}
                                  {editingCourse ? 'Editar Curso' : 'Crear Curso con Examen'}
                              </h3>
                              <form onSubmit={handleSaveCourse} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="title" required defaultValue={editingCourse?.title} key={editingCourse?.id ? `title-${editingCourse.id}` : 'title-new'} placeholder="Título del Curso" className="p-2 border rounded w-full" />
                                    <input name="category" required defaultValue={editingCourse?.category} key={editingCourse?.id ? `cat-${editingCourse.id}` : 'cat-new'} placeholder="Categoría" className="p-2 border rounded w-full" />
                                    <input name="duration" required defaultValue={editingCourse?.duration} key={editingCourse?.id ? `dur-${editingCourse.id}` : 'dur-new'} placeholder="Duración" className="p-2 border rounded w-full" />
                                    <input name="points" type="number" required defaultValue={editingCourse?.points} key={editingCourse?.id ? `pts-${editingCourse.id}` : 'pts-new'} placeholder="Puntos" className="p-2 border rounded w-full" />
                                    
                                    <div className="md:col-span-2 space-y-2 p-4 border rounded bg-slate-50">
                                        <div className="flex flex-col sm:flex-row gap-4 mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={videoSourceType === 'LINK'} onChange={() => setVideoSourceType('LINK')} />
                                                Enlace YouTube
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={videoSourceType === 'FILE'} onChange={() => setVideoSourceType('FILE')} />
                                                Subir Video (MP4)
                                            </label>
                                        </div>
                                        {videoSourceType === 'LINK' ? (
                                            <input name="videoUrl" defaultValue={editingCourse?.videoUrl} required={videoSourceType === 'LINK'} placeholder="URL de YouTube (Embed)" className="w-full p-2 border rounded" />
                                        ) : (
                                            <input name="videoFile" type="file" accept="video/mp4,video/webm" className="w-full p-2 border rounded" />
                                        )}
                                        <p className="text-xs text-slate-500">Nota: Para videos subidos, máximo 10MB en esta versión.</p>
                                    </div>

                                    <textarea name="description" required defaultValue={editingCourse?.description} key={editingCourse?.id ? `desc-${editingCourse.id}` : 'desc-new'} placeholder="Descripción del curso..." className="md:col-span-2 p-2 border rounded h-20 w-full"></textarea>
                                  </div>

                                  {/* QUIZ CREATOR */}
                                  <div className="border rounded-xl p-4 bg-purple-50">
                                      <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                                          <BookOpen className="w-5 h-5"/> Constructor de Examen
                                      </h4>
                                      
                                      <div className="grid grid-cols-1 gap-3 mb-4">
                                          <input 
                                            value={newQuestion.q} onChange={e => setNewQuestion({...newQuestion, q: e.target.value})} 
                                            placeholder="Escribe la pregunta aquí..." className="p-2 border rounded w-full" 
                                          />
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                              <input value={newQuestion.o1} onChange={e => setNewQuestion({...newQuestion, o1: e.target.value})} placeholder="Opción 1" className="p-2 border rounded w-full" />
                                              <input value={newQuestion.o2} onChange={e => setNewQuestion({...newQuestion, o2: e.target.value})} placeholder="Opción 2" className="p-2 border rounded w-full" />
                                              <input value={newQuestion.o3} onChange={e => setNewQuestion({...newQuestion, o3: e.target.value})} placeholder="Opción 3" className="p-2 border rounded w-full" />
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                                              <span>Correcta:</span>
                                              <select 
                                                value={newQuestion.correct} onChange={e => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})} 
                                                className="p-1 border rounded"
                                              >
                                                  <option value={0}>Opción 1</option>
                                                  <option value={1}>Opción 2</option>
                                                  <option value={2}>Opción 3</option>
                                              </select>
                                          </div>
                                          <Button type="button" size="sm" variant="secondary" onClick={handleAddQuestion} disabled={!newQuestion.q || !newQuestion.o1} className="mt-2">
                                              <Plus className="w-4 h-4 mr-1"/> Agregar Pregunta
                                          </Button>
                                      </div>

                                      {quizQuestions.length > 0 && (
                                          <div className="space-y-2">
                                              <div className="text-xs font-bold text-slate-500 uppercase">Preguntas:</div>
                                              {quizQuestions.map((q, idx) => (
                                                  <div key={idx} className="bg-white p-2 rounded border border-purple-200 flex justify-between items-center text-sm">
                                                      <span className="truncate flex-1 font-medium">{idx+1}. {q.question}</span>
                                                      <button type="button" onClick={() => handleRemoveQuestion(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                          <X className="w-4 h-4" />
                                                      </button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button type="submit" isLoading={isLoading} className="flex-1 md:flex-none">
                                        {editingCourse ? 'Guardar' : 'Publicar'}
                                    </Button>
                                    {editingCourse && (
                                        <Button type="button" variant="outline" onClick={() => { setEditingCourse(null); setQuizQuestions([]); }} className="flex-1 md:flex-none">Cancelar</Button>
                                    )}
                                  </div>
                              </form>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-4">Tus Cursos</h3>
                          <div className="grid grid-cols-1 gap-4">
                              {companyCourses.map(course => (
                                  <div key={course.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                      <div className="flex items-center gap-4 w-full">
                                        <div className="w-16 h-16 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                                            <img src={course.image} className="w-full h-full object-cover" alt="Course" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate">{course.title}</h4>
                                            <p className="text-xs text-slate-500 truncate">{course.duration} • {course.points} pts • {course.quiz?.length || 0} Qs</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 w-full md:w-auto justify-end">
                                          <button 
                                            onClick={() => handleEditCourse(course)}
                                            className="text-slate-400 hover:text-blue-600 p-2 border rounded hover:bg-blue-50"
                                            title="Editar"
                                          >
                                              <Pencil className="w-5 h-5" />
                                          </button>
                                          <button 
                                            onClick={() => setDeleteTarget({ type: 'COURSE', id: course.id, name: course.title })}
                                            className="text-slate-400 hover:text-red-600 p-2 border rounded hover:bg-red-50"
                                            title="Borrar"
                                          >
                                              <Trash2 className="w-5 h-5" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {dashboardTab === 'CANDIDATES' && (
                      <div className="max-w-5xl">
                          <h2 className="text-2xl font-bold mb-6">Candidatos Postulados</h2>
                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                              {/* MOBILE TABLE WRAPPER */}
                              <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm min-w-[800px]">
                                      <thead className="bg-slate-50 font-bold text-slate-500">
                                          <tr>
                                              <th className="p-4">Candidato</th>
                                              <th className="p-4">Puesto</th>
                                              <th className="p-4">Ubicación</th>
                                              <th className="p-4">Teléfono</th>
                                              <th className="p-4">Aptitud</th>
                                              <th className="p-4">Integridad</th>
                                              <th className="p-4">Acción</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {assessments.map(asm => {
                                              const isUnlocked = asm.isUnlocked;
                                              const mapUrl = asm.candidateLocation ? `https://www.google.com/maps/search/?api=1&query=${asm.candidateLocation.lat},${asm.candidateLocation.lng}` : null;

                                              return (
                                                  <tr key={asm.id} className="hover:bg-slate-50">
                                                      <td className="p-4">
                                                          <div className="font-bold">{asm.candidateName}</div>
                                                          <div className="text-xs text-slate-400">
                                                              {isUnlocked ? asm.candidateEmail : '••••••@•••.com'}
                                                          </div>
                                                      </td>
                                                      <td className="p-4 text-slate-600">{asm.jobTitle}</td>
                                                      <td className="p-4">
                                                          {isUnlocked ? (
                                                              mapUrl ? (
                                                                <a href={mapUrl} target="_blank" className="text-blue-600 flex items-center gap-1 hover:underline">
                                                                    <MapPin className="w-3 h-3" /> Ver
                                                                </a>
                                                              ) : <span className="text-slate-400 text-xs">Sin GPS</span>
                                                          ) : (
                                                              <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3"/> Oculto</span>
                                                          )}
                                                      </td>
                                                      <td className="p-4">
                                                          {isUnlocked ? (
                                                              <div className="flex items-center gap-2">
                                                                  <span className="font-mono">{asm.candidatePhone}</span>
                                                                  <a href={`https://wa.me/${asm.candidatePhone?.replace(/\D/g,'')}`} target="_blank" className="text-green-500 hover:text-green-700" title="WhatsApp">
                                                                      <Phone className="w-4 h-4" />
                                                                  </a>
                                                              </div>
                                                          ) : (
                                                              <span className="text-slate-300">55-****-****</span>
                                                          )}
                                                      </td>
                                                      <td className="p-4">
                                                          {isUnlocked && asm.report ? (
                                                              <span className={`font-bold ${asm.report.scores.aptitude > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                  {asm.report.scores.aptitude}%
                                                              </span>
                                                          ) : <span className="text-slate-300">???</span>}
                                                      </td>
                                                      <td className="p-4">
                                                          {isUnlocked && asm.report ? (
                                                              <span className={`font-bold ${asm.report.scores.integrity > 70 ? 'text-green-600' : 'text-red-600'}`}>
                                                                  {asm.report.scores.integrity}%
                                                              </span>
                                                          ) : <span className="text-slate-300">???</span>}
                                                      </td>
                                                      <td className="p-4">
                                                          {isUnlocked ? (
                                                              <Button size="sm" variant="outline" disabled={!asm.report} onClick={() => {
                                                                  setSelectedReport({ data: asm.report, name: asm.candidateName, role: asm.jobTitle, email: asm.candidateEmail, phone: asm.candidatePhone });
                                                                  setView('VIEW_REPORT');
                                                              }}>Ver Reporte</Button>
                                                          ) : (
                                                              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white border-none" onClick={() => setUnlockModal({ show: true, asmId: asm.id })}>
                                                                  <Lock className="w-3 h-3 mr-1" /> Desbloquear
                                                              </Button>
                                                          )}
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
                  {/* ... (Other tabs same) ... */}
                  {dashboardTab === 'STORE' && (
                       <div className="max-w-4xl">
                           <h2 className="text-2xl font-bold mb-6">Tienda de Créditos</h2>
                           {/* Grid adjustment for mobile */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                               {/* Cards logic same, just responsive grid */}
                               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all text-center">
                                   <h3 className="text-lg font-bold text-slate-700">Paquete Básico</h3>
                                   <div className="text-3xl font-bold text-blue-600 my-4">10 <span className="text-sm text-slate-500 font-normal">créditos</span></div>
                                   <p className="text-sm text-slate-500 mb-4">$500 MXN ($50 c/u)</p>
                                   <Button variant="outline" className="w-full" onClick={() => window.open("https://api.whatsapp.com/send/?phone=%2B524444237092&text=Hola,%20quiero%20el%20Paquete%20Basico&type=phone_number&app_absent=0", "_blank")}>Contactar Ventas</Button>
                               </div>
                               {/* ... Pro & Corp cards ... */}
                               <div className="bg-white p-6 rounded-xl border-2 border-yellow-400 shadow-lg transform md:scale-105 relative text-center">
                                   <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">BECOME PREMIUM</div>
                                   <h3 className="text-lg font-bold text-slate-800">Paquete Pro</h3>
                                   <div className="text-3xl font-bold text-blue-600 my-4">50 <span className="text-sm text-slate-500 font-normal">créditos</span></div>
                                   <p className="text-sm text-slate-500 mb-4">$2,000 MXN ($40 c/u)</p>
                                   <Button className="w-full" onClick={() => window.open("https://api.whatsapp.com/send/?phone=%2B524444237092&text=Hola,%20quiero%20el%20Paquete%20Pro&type=phone_number&app_absent=0", "_blank")}>Contactar Ventas</Button>
                               </div>
                               <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm hover:border-blue-400 transition-all text-center">
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">BECOME PREMIUM</div>
                                   <h3 className="text-lg font-bold text-slate-700">Paquete Corp</h3>
                                   <div className="text-3xl font-bold text-blue-600 my-4">100 <span className="text-sm text-slate-500 font-normal">créditos</span></div>
                                   <p className="text-sm text-slate-500 mb-4">$3,500 MXN ($35 c/u)</p>
                                   <Button variant="outline" className="w-full" onClick={() => window.open("https://api.whatsapp.com/send/?phone=%2B524444237092&text=Hola,%20quiero%20el%20Paquete%20Corp&type=phone_number&app_absent=0", "_blank")}>Contactar Ventas</Button>
                               </div>
                           </div>
                            <div className="text-center text-sm text-slate-500 mb-8">
                                * Al comprar un paquete Pro o Corp, obtienes estatus <span className="font-bold text-yellow-600">PREMIUM</span> (Vacantes destacadas, logo grande).
                            </div>

                           <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Canjear Código</h3>
                               <p className="text-sm text-slate-500 mb-4">Si ya compraste un paquete, ingresa tu código aquí para recargar saldo.</p>
                               <form onSubmit={handleRedeemCode} className="flex flex-col md:flex-row gap-4">
                                   <input name="code" required placeholder="EJ: PAQUETE10" className="flex-1 p-3 border rounded-lg uppercase tracking-widest font-bold" />
                                   <Button type="submit" className="w-full md:w-auto">Canjear</Button>
                               </form>
                           </div>
                       </div>
                  )}
                  {dashboardTab === 'PROFILE' && (
                      <div className="max-w-2xl">
                          <h2 className="text-2xl font-bold mb-6">Perfil de Empresa</h2>
                          <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                              <form onSubmit={handleUpdateProfile} className="space-y-4">
                                  <div className="flex items-center gap-4 mb-4">
                                      <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
                                          {currentCompany?.logo ? (
                                              <img src={currentCompany.logo} className="w-full h-full object-cover" alt="Company Logo" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Building2 /></div>
                                          )}
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <label className="cursor-pointer">
                                                  <Upload className="text-white w-6 h-6" />
                                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                              </label>
                                          </div>
                                      </div>
                                      <div>
                                          <h3 className="font-bold">Logotipo</h3>
                                          <p className="text-xs text-slate-500">Haz clic en la imagen para cambiarlo.</p>
                                      </div>
                                  </div>
                                  
                                  <div>
                                      <label className="block text-sm font-medium mb-1">Nombre de la Empresa</label>
                                      <input name="name" defaultValue={currentCompany?.name} className="w-full p-2 border rounded" />
                                  </div>
                                  {/* ... Inputs same ... */}
                                  <div>
                                      <label className="block text-sm font-medium mb-1">Código de Acceso</label>
                                      <div className="flex gap-2">
                                        <input disabled value={currentCompany?.code} className="w-full p-2 border rounded bg-slate-50 font-mono font-bold tracking-widest" />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium mb-1">Industria / Sector</label>
                                      <input name="industry" defaultValue={currentCompany?.industry} placeholder="ej. Seguridad Privada" className="w-full p-2 border rounded" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium mb-1">Descripción Pública</label>
                                      <textarea name="description" defaultValue={currentCompany?.description} className="w-full p-2 border rounded h-32" placeholder="Describe tu empresa a los candidatos..."></textarea>
                                  </div>
                                  <Button type="submit" isLoading={isLoading} className="w-full">Guardar Cambios</Button>
                              </form>
                          </div>
                      </div>
                  )}

              </div>
          </div>
      );
  };

  // ... (Rest of the render functions: Home, Courses, Apply etc. - small padding adjustments included) ...
  const renderHome = () => (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                El Talento de tu Comunidad <br/><span className="text-blue-600">Conecta Aquí.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-8">
                La plataforma inteligente que conecta a empresas con candidatos reales, usando análisis de voz, ubicación y honestidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => setView('JOBS')} className="shadow-lg shadow-blue-200">
                    <Search className="w-5 h-5 mr-2" /> Buscar Empleo
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setView('COURSES')}>
                    <GraduationCap className="w-5 h-5 mr-2" /> Cursos Gratis
                </Button>
            </div>
        </div>
    </div>
  );

  // ... (Render Courses, Apply, etc. kept mostly same, ensuring p-4 padding for mobile) ...
  const renderCourses = () => (
    <div className="max-w-5xl mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-600" /> Cursos Comunitarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map(course => (
                <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => { setSelectedCourse(course); setView('TAKE_COURSE'); }}>
                    <div className="h-32 bg-slate-200 relative group">
                        <img src={course.image} className="w-full h-full object-cover" alt="Course" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="text-white w-12 h-12" />
                        </div>
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm">
                            +{course.points} pts
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="text-xs font-bold text-purple-600 mb-1 uppercase">{course.category}</div>
                        <h3 className="font-bold text-slate-800 mb-2">{course.title}</h3>
                        <p className="text-xs text-slate-500 mb-4">Por: {course.provider} • {course.duration}</p>
                        <Button variant="outline" size="sm" className="w-full">Ver Curso</Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // ... (Job Detail Modal kept same, ensuring responsive padding) ...

  // ... (Apply form kept same) ...
  const renderApply = () => (
     <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-2">Aplicar a {selectedJob?.title}</h2>
            <p className="text-slate-500 text-sm mb-6">Completa tus datos para iniciar la entrevista inteligente.</p>
            <form onSubmit={handleCandidateRegister} className="space-y-4">
                <input name="name" required className="w-full p-3 border rounded-lg" placeholder="Nombre Completo" />
                <input name="phone" required type="tel" className="w-full p-3 border rounded-lg" placeholder="Teléfono" />
                <input name="email" type="email" required className="w-full p-3 border rounded-lg" placeholder="Correo Electrónico" />

                <div className="pt-2">
                    <label className="block text-sm font-medium mb-2">Ubicación (Obligatorio para operativos)</label>
                    {location ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                            <CheckCircle2 className="w-5 h-5" /> Ubicación detectada
                        </div>
                    ) : (
                        <Button type="button" variant="secondary" onClick={handleGetLocation} isLoading={locLoading} className="w-full flex items-center justify-center gap-2">
                            <MapPin className="w-4 h-4" /> Usar mi GPS
                        </Button>
                    )}
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full py-3">Iniciar Entrevista</Button>
                    <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setView('JOBS')}>Cancelar</Button>
                </div>
            </form>
        </div>
     </div>
  );

  const renderJobs = () => {
    const filteredJobs = jobs.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
                          job.description.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.companyName.toLowerCase().includes(jobSearch.toLowerCase());
      const matchLoc = !jobLocationFilter || job.location.toLowerCase().includes(jobLocationFilter.toLowerCase());
      const matchType = jobTypeFilter === 'ALL' || job.type === jobTypeFilter;
      return matchSearch && matchLoc && matchType;
    });

    // Sort: Featured first, then Newest
    const sortedJobs = filteredJobs.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" /> Bolsa de Trabajo
          </h2>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
             <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar puesto o empresa..." 
                  className="pl-9 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                />
             </div>
             <select 
                className="p-2 border rounded-lg bg-white"
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
             >
                <option value="ALL">Todos los tipos</option>
                <option value="OPERATIVE">Operativo</option>
                <option value="ADMIN">Administrativo</option>
             </select>
             <input 
                placeholder="Ubicación..." 
                className="p-2 border rounded-lg"
                value={jobLocationFilter}
                onChange={(e) => setJobLocationFilter(e.target.value)}
             />
          </div>
        </div>

        <div className="space-y-4">
          {sortedJobs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
               <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <p className="text-xl">No se encontraron vacantes con esos filtros.</p>
               <button onClick={() => { setJobSearch(''); setJobLocationFilter(''); setJobTypeFilter('ALL'); }} className="text-blue-600 underline mt-2">Limpiar filtros</button>
            </div>
          ) : (
            sortedJobs.map(job => {
              // NEW BADGE LOGIC
              const isNew = job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) < (24 * 60 * 60 * 1000);

              return (
              <div key={job.id} className={`bg-white p-6 rounded-xl border transition-all hover:shadow-md ${job.isFeatured ? 'border-yellow-400 shadow-sm' : 'border-slate-200'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4 flex-1">
                     <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                        {allCompanyLogos[job.companyCode] ? (
                           <img src={allCompanyLogos[job.companyCode]} className="w-full h-full object-cover" alt={job.companyName} />
                        ) : (
                           <Building2 className="w-8 h-8 text-slate-400" />
                        )}
                     </div>
                     <div>
                        <div className="flex flex-wrap gap-2 mb-1">
                            {job.isFeatured && (
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Destacado</span>
                            )}
                            {isNew && (
                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">NUEVO</span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{job.title}</h3>
                        <div className="text-slate-500 text-sm mt-1 flex flex-wrap gap-x-4 gap-y-1">
                           <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/> {job.companyName}</span>
                           <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {job.location}</span>
                           <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> {job.salary}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <Button variant="outline" onClick={() => setViewJobModal(job)}>Ver Detalles</Button>
                      <Button onClick={() => handleStartApplication(job)}>Aplicar Ahora</Button>
                  </div>
                </div>
                <div className="mt-4 text-slate-600 text-sm line-clamp-2">
                   {job.description}
                </div>
                <div className="mt-4 flex gap-2 items-center">
                   <span className={`text-xs px-2 py-1 rounded border ${job.type === 'OPERATIVE' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                      {job.type === 'OPERATIVE' ? 'Operativo (Entrevista Chat)' : 'Administrativo (Test Profundo)'}
                   </span>
                   {/* Date if available */}
                   {job.createdAt && (
                       <span className="text-xs text-slate-400 px-2 py-1 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3"/> {new Date(job.createdAt).toLocaleDateString()}
                       </span>
                   )}
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
        {view !== 'SUPER_ADMIN' && (
            <Navbar 
            logo={CHARLITRON_LOGO} 
            view={view} 
            setView={setView} 
            currentCompany={currentCompany} 
            onLogoClick={() => setLogoClicks(prev => prev + 1)}
            />
        )}
        
        {view === 'HOME' && renderHome()}
        {/* Ensure renderJobs uses the grid/list logic already implemented which is responsive */}
        {view === 'JOBS' && (
            // Reuse renderJobs logic here directly to ensure context access if defined outside
            // For brevity in XML, using the function defined above
            renderJobs() 
        )}
        {view === 'COURSES' && renderCourses()}
        {view === 'LOGIN' && renderLogin()}
        {view === 'COMPANY_DASHBOARD' && renderCompanyDashboard()}
        {view === 'SUPER_ADMIN' && renderSuperAdmin()}
        {view === 'APPLY_JOB' && renderApply()}
        {view === 'DO_TEST' && (selectedJob?.type === 'OPERATIVE' ? 
            <div className="max-w-md mx-auto py-8 px-4"><OperativeChat candidateName={currentCandidate?.name || ''} roleName={selectedJob?.title || ''} onComplete={handleSubmitTest} /></div> 
            : <div className="py-8 px-4"><Questionnaire onComplete={handleSubmitTest} /></div>
        )}
        {view === 'SUCCESS' && (
             <div className="max-w-md mx-auto py-20 px-4 text-center">
                 <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600"><CheckCircle2 className="w-10 h-10" /></div>
                 <h2 className="text-2xl font-bold mb-4">¡Postulación Enviada!</h2>
                 <Button onClick={() => setView('HOME')}>Volver al Inicio</Button>
             </div>
        )}
        {view === 'VIEW_REPORT' && selectedReport && (
            <div className="p-4"><Report data={selectedReport.data} candidateName={selectedReport.name} candidateRole={selectedReport.role} email={selectedReport.email} phone={selectedReport.phone} onBack={() => setView('COMPANY_DASHBOARD')} /></div>
        )}
        {view === 'TAKE_COURSE' && selectedCourse && (
            <CoursePlayer course={selectedCourse} onBack={() => setView('COURSES')} />
        )}

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-8 mt-auto no-print">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Charlitron Talento IA. Todos los derechos reservados.</p>
                <div className="mt-2">
                    <button onClick={() => setShowPrivacyModal(true)} className="text-xs text-blue-600 hover:underline">
                        Aviso de Privacidad
                    </button>
                </div>
            </div>
        </footer>

        {/* Modals (Unlock, Audit, Privacy, Delete, Admin Login) - kept same structure */}
        {unlockModal.show && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm text-center w-full">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Desbloquear Candidato</h3>
                    <p className="text-slate-500 mb-6">
                        Ver este reporte completo y los datos de contacto te costará <span className="font-bold text-slate-900">1 Crédito</span>.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => setUnlockModal({ show: false, asmId: null })}>Cancelar</Button>
                        <Button onClick={confirmUnlock} isLoading={isLoading}>Confirmar y Ver</Button>
                    </div>
                </div>
            </div>
        )}

        {/* AI Audit Modal */}
        {auditResult && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-fade-in p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-purple-700 text-white p-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ScanEye className="w-6 h-6" /> Resultado Auditoría IA
                        </h3>
                        <button onClick={() => setAuditResult(null)} className="hover:bg-purple-600 p-1 rounded"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 overflow-y-auto bg-slate-50">
                        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {auditResult}
                        </div>
                    </div>
                    <div className="p-4 border-t bg-white flex justify-end">
                        <Button onClick={() => setAuditResult(null)}>Cerrar</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Shield className="w-5 h-5"/> Aviso de Privacidad</h2>
                        <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-8 overflow-y-auto text-slate-600 text-sm leading-relaxed space-y-4">
                        <p><strong>Charlitron Comunidad</strong>, en calidad de intermediario digital, informa a los usuarios (candidatos y empresas) que sus datos personales serán tratados únicamente con fines de vinculación laboral y capacitación, respetando la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
                        <p>Los datos recabados podrán incluir: nombre, domicilio, teléfono, ubicación, segmento laboral, intereses y documentos básicos, así como información relativa a participación en cursos, ferias o eventos. La información no será vendida, cedida ni transferida a terceros salvo por solicitud y autorización expresa del candidato para procesos de empleo directos con empresas registradas en la plataforma.</p>
                        <p>Charlitron Comunidad no actúa como empleador ni empresa de outsourcing, su función se limita a facilitar el encuentro digital entre oferta y demanda laboral, y a proveer recursos formativos.</p>
                        <p>El usuario puede en cualquier momento solicitar la rectificación o eliminación de sus datos del sistema vía formulario de contacto o correo electrónico a: <a href="mailto:ventas@charlitron.com" className="text-blue-600 hover:underline">ventas@charlitron.com</a>.</p>
                        <p>Para mayor información, consulta nuestro aviso completo de privacidad en <a href="#" className="text-blue-600 hover:underline">www.charlitron.com/privacidad</a></p>
                        
                        <div className="bg-slate-100 p-4 rounded border border-slate-200 mt-6">
                            <h4 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">Cláusula Legal Intermediario (No Outsourcing)</h4>
                            <p className="text-xs text-slate-500">
                                Charlitron Comunidad únicamente presta servicios de intermediación digital entre candidatos y empresas. No somos responsables de la contratación, pagos, obligaciones fiscales, seguridad social ni condiciones laborales ofrecidas por las empresas que utilizan la plataforma para publicar vacantes. La relación laboral que pudiera surgir, corresponde exclusivamente a la empresa contratante y el candidato seleccionado, deslindando a Charlitron Comunidad de cualquier responsabilidad legal, laboral o contractual entre ambas partes.
                            </p>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-white flex justify-end">
                        <Button onClick={() => setShowPrivacyModal(false)}>Entendido</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Global Delete Confirmation Modal */}
        {deleteTarget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in p-4">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 border-l-4 border-red-500">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertTriangle className="w-8 h-8" />
                        <h3 className="text-lg font-bold">Confirmar Eliminación</h3>
                    </div>
                    <p className="text-slate-600 mb-6">
                        Estás a punto de borrar permanentemente: <br/>
                        <span className="font-bold text-slate-900">{deleteTarget.name}</span>
                        <br/>
                        <span className="text-xs text-red-500 mt-2 block">Esta acción no se puede deshacer.</span>
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={executeDelete} isLoading={isLoading}>
                            <Trash2 className="w-4 h-4 mr-2" /> Sí, Borrar
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal Secreto de Admin */}
        {showAdminLoginModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl border border-yellow-500/50 w-full max-w-sm">
                    <div className="flex justify-center mb-6">
                        <KeyRound className="w-12 h-12 text-yellow-400 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-center mb-6">Acceso Restringido</h2>
                    <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                        <input 
                            name="password" 
                            type="password" 
                            autoFocus
                            placeholder="Contraseña Maestra" 
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-xl tracking-widest focus:border-yellow-500 focus:outline-none" 
                        />
                        <Button variant="primary" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold">Autenticar</Button>
                    </form>
                    <button onClick={() => setShowAdminLoginModal(false)} className="mt-4 text-xs text-slate-500 w-full text-center hover:text-white">Cancelar</button>
                </div>
            </div>
        )}

        {/* Job Details Modal */}
        {viewJobModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                        <div className="flex items-center gap-4">
                             <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                {allCompanyLogos[viewJobModal.companyCode] ? (
                                   <img src={allCompanyLogos[viewJobModal.companyCode]} className="w-full h-full object-cover" alt={viewJobModal.companyName} />
                                ) : (
                                   <Building2 className="w-8 h-8 text-slate-400" />
                                )}
                             </div>
                             <div>
                                 <h2 className="text-2xl font-bold text-slate-900">{viewJobModal.title}</h2>
                                 <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                                     <Building2 className="w-4 h-4"/> {viewJobModal.companyName}
                                 </div>
                             </div>
                        </div>
                        <button onClick={() => setViewJobModal(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 mb-8 text-sm">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                                <MapPin className="w-4 h-4"/> {viewJobModal.location}
                            </div>
                            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                                <DollarSign className="w-4 h-4"/> {viewJobModal.salary}
                            </div>
                            <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                                <Briefcase className="w-4 h-4"/> {viewJobModal.type === 'OPERATIVE' ? 'Operativo' : 'Administrativo'}
                            </div>
                             {viewJobModal.createdAt && (
                                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Publicado: {new Date(viewJobModal.createdAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {viewJobModal.description}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setViewJobModal(null)}>Cerrar</Button>
                        <Button onClick={() => { setViewJobModal(null); handleStartApplication(viewJobModal); }}>Aplicar Ahora</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default App;