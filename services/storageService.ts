
import { supabase } from "./supabaseClient";
import { Assessment, Candidate, Company, Job, Course, CreditCode, AnalysisReport, ActivityData } from "../types";
import { GoogleGenAI } from "@google/genai";

// Helper to map DB snake_case to App camelCase
const mapCompany = (row: any): Company => ({
  ...row,
  credits: row.credits || 0,
  plan: row.plan || 'FREE',
  isVerified: row.is_verified || false
});

const mapJob = (row: any): Job => ({
  id: row.id,
  title: row.title,
  companyCode: row.company_code,
  companyName: row.company_name,
  location: row.location,
  salary: row.salary,
  type: row.type,
  description: row.description,
  tags: row.tags || [],
  active: row.active,
  isFeatured: row.is_featured || false,
  createdAt: row.created_at // Added createdAt
});

const mapCourse = (row: any): Course => ({
  id: row.id,
  title: row.title,
  description: row.description,
  provider: row.provider,
  companyCode: row.company_code,
  duration: row.duration,
  points: row.points,
  image: row.image,
  category: row.category,
  videoUrl: row.video_url,
  quiz: row.quiz
});

const mapAssessment = (row: any): Assessment & { candidateName?: string, jobTitle?: string, candidatePhone?: string, candidateEmail?: string, candidateLocation?: { lat: number, lng: number } } => ({
  id: row.id,
  candidateId: row.candidate_id,
  companyCode: row.company_code,
  jobId: row.job_id,
  answers: row.answers,
  status: row.status,
  report: row.report,
  timestamp: row.timestamp,
  candidateType: row.candidate_type,
  isUnlocked: row.is_unlocked,
  candidateName: row.candidates?.name || 'Desconocido',
  candidatePhone: row.candidates?.phone || 'No registrado', // Fetch Phone
  candidateEmail: row.candidates?.email || 'No registrado', // Fetch Email
  candidateLocation: row.candidates?.location, // Fetch Location for Maps
  jobTitle: row.jobs?.title || 'General'
});

export const storageService = {
  init: async () => {
    console.log("Supabase Service Initialized");
  },

  // --- STORAGE / FILE UPLOAD ---
  uploadFile: async (bucket: 'logos' | 'courses' | 'audios', file: File): Promise<string | null> => {
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, { upsert: true });

          if (uploadError) {
              console.error('Error uploading file:', JSON.stringify(uploadError));
              return null;
          }

          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          return data.publicUrl;
      } catch (error) {
          console.error('Upload exception:', error);
          return null;
      }
  },

  // --- Dashboard Analytics ---
  getWeeklyActivity: async (companyCode: string): Promise<ActivityData[]> => {
      const { data, error } = await supabase
        .from('assessments')
        .select('timestamp')
        .eq('company_code', companyCode)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error || !data) return [];

      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const today = new Date();
      const result: ActivityData[] = [];
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dayName = days[d.getDay()];
          result.push({ name: dayName, solicitudes: 0 });
      }

      data.forEach(item => {
          const date = new Date(item.timestamp);
          const dayName = days[date.getDay()];
          const index = result.findIndex(r => r.name === dayName);
          if (index !== -1) result[index].solicitudes++;
      });

      return result;
  },

  // --- Jobs ---
  getJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) { console.error(error); return []; }
    return data.map(mapJob);
  },
  
  addJob: async (job: Job) => {
    // SECURITY CHECK: Must be verified
    const { data: comp } = await supabase.from('companies').select('plan, is_verified').eq('code', job.companyCode).single();
    
    if (!comp) throw new Error("Empresa no encontrada");
    if (!comp.is_verified) throw new Error("Tu empresa debe ser VERIFICADA por un administrador antes de publicar vacantes.");

    const isFeatured = comp.plan === 'PREMIUM';

    const dbJob = {
      id: job.id,
      title: job.title,
      company_code: job.companyCode,
      company_name: job.companyName,
      location: job.location,
      salary: job.salary,
      type: job.type,
      description: job.description,
      tags: job.tags,
      active: job.active,
      is_featured: isFeatured
    };
    const { error } = await supabase.from('jobs').insert(dbJob);
    if (error) {
        console.error("Error creating job:", JSON.stringify(error));
        throw error;
    }
  },

  updateJob: async (job: Job) => {
      const dbJob = {
          title: job.title,
          location: job.location,
          salary: job.salary,
          type: job.type,
          description: job.description,
          active: job.active
      };
      await supabase.from('jobs').update(dbJob).eq('id', job.id);
  },

  deleteJob: async (id: string) => {
      // First delete related assessments to avoid FK error
      const { error: asmError } = await supabase.from('assessments').delete().eq('job_id', id);
      if (asmError && asmError.code !== 'PGRST116') { // Ignore not found error
          console.error("Error deleting assessments:", JSON.stringify(asmError));
      }
      
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error && error.code !== 'PGRST116') {
          console.error("Error deleting job:", JSON.stringify(error));
          throw error;
      }
  },

  updateJobStatus: async (id: string, active: boolean) => {
    await supabase.from('jobs').update({ active }).eq('id', id);
  },

  // NEW: AI GENERATOR
  generateJobDescriptionWithAI: async (title: string, type: string): Promise<string> => {
      const key = process.env.API_KEY;
      if (!key) return "ERROR: No se detectó la API KEY de Gemini. Verifica tus secrets.";

      try {
          const ai = new GoogleGenAI({ apiKey: key });
          const prompt = `
            Actúa como un experto en Recursos Humanos.
            Redacta una descripción de vacante atractiva, profesional y clara para el puesto: "${title}".
            Tipo de puesto: ${type === 'OPERATIVE' ? 'Operativo (Enfoque en estabilidad y beneficios)' : 'Administrativo (Enfoque en retos y crecimiento)'}.
            
            Estructura:
            - Breve introducción gancho.
            - 3 Responsabilidades clave.
            - 3 Requisitos indispensables.
            - Beneficios.
            
            Tono: Mexicano profesional, amable. Máximo 150 palabras. Formato texto plano.
          `;
          
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
          });
          
          return response.text || "No se pudo generar la descripción.";
      } catch (e: any) {
          console.error("GenAI Error:", e);
          return `Error técnico IA: ${e.message}`;
      }
  },

  // --- Courses ---
  getCourses: async (): Promise<Course[]> => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) { console.error(error); return []; }
    return data.map(mapCourse);
  },

  getAllCourses: async (): Promise<Course[]> => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) return [];
    return data.map(mapCourse);
  },

  addCourse: async (course: Course) => {
    // SECURITY CHECK: Must be verified
    if (course.companyCode) {
        const { data: comp } = await supabase.from('companies').select('is_verified').eq('code', course.companyCode).single();
        if (comp && !comp.is_verified) throw new Error("Empresa no verificada. No puedes publicar cursos.");
    }

    const dbCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        provider: course.provider,
        company_code: course.companyCode,
        duration: course.duration,
        points: course.points,
        image: course.image,
        category: course.category,
        video_url: course.videoUrl,
        quiz: course.quiz
    };
    const { error } = await supabase.from('courses').insert(dbCourse);
    if (error) {
        console.error("Error creating course:", JSON.stringify(error));
        throw error;
    }
  },

  updateCourse: async (course: Course) => {
    const dbCourse = {
        title: course.title,
        description: course.description,
        duration: course.duration,
        points: course.points,
        category: course.category,
        video_url: course.videoUrl,
        quiz: course.quiz
    };
    await supabase.from('courses').update(dbCourse).eq('id', course.id);
  },

  deleteCourse: async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
        console.error("Delete Course Error:", JSON.stringify(error));
        if (error.code !== 'PGRST116') throw new Error(error.message);
    }
  },

  // --- Company ---
  getCompanies: async (): Promise<Company[]> => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) return [];
    return data.map(mapCompany);
  },

  registerCompany: async (name: string, email: string, industry: string): Promise<{ success: boolean, code?: string, message?: string }> => {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MEX');
    const random = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${random}`;

    const { error } = await supabase.from('companies').insert({
        code,
        name,
        email,
        industry,
        plan: 'FREE',
        credits: 3, 
        is_verified: false
    });

    if (error) {
        console.error("Registration error:", JSON.stringify(error));
        return { success: false, message: error.message };
    }

    // --- EMAIL TRIGGER PLACEHOLDER ---
    // This logs to console. In production, you would call a Supabase Edge Function here.
    console.log(`[EMAIL SIMULATION] To: ${email}, Subject: Registro Recibido, Body: Tu empresa ${name} está en revisión. Código futuro: ${code}`);

    return { success: true, code };
  },

  loginCompany: async (code: string): Promise<Company | null> => {
    const { data, error } = await supabase.from('companies').select('*').eq('code', code).single();
    if (error || !data) return null;
    return mapCompany(data);
  },

  updateCompanyProfile: async (code: string, updates: Partial<Company>): Promise<Company | null> => {
    const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('code', code)
        .select()
        .single();
    
    if (error) { console.error(error); return null; }
    return mapCompany(data);
  },

  // --- ADMIN FUNCTIONS ---
  validateAdmin: (email: string, pass: string): boolean => {
    return email === 'nadrian18@gmail.com' && pass === '2003';
  },

  generateCreditCode: async (amount: number): Promise<CreditCode | null> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const { data, error } = await supabase.from('credit_codes').insert({
        code,
        amount,
        is_redeemed: false
    }).select().single();

    if (error) return null;
    return {
        code: data.code,
        amount: data.amount,
        isRedeemed: data.is_redeemed,
        createdAt: data.created_at
    };
  },

  getCreditCodes: async (): Promise<CreditCode[]> => {
    const { data, error } = await supabase.from('credit_codes').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({
        code: r.code,
        amount: r.amount,
        isRedeemed: r.is_redeemed,
        redeemedBy: r.redeemed_by,
        createdAt: r.created_at
    }));
  },

  verifyCompany: async (code: string) => {
      await supabase.from('companies').update({ is_verified: true }).eq('code', code);
      // The actual email sending happens in App.tsx via mailto: link to keep frontend secure
  },

  auditCompanyWithAI: async (company: Company): Promise<string> => {
      const key = process.env.API_KEY;
      if (!key) return "ERROR: API_KEY no configurada en Secrets.";
      
      const prompt = `
        Eres un auditor de seguridad corporativa. Analiza esta empresa y dime si parece legítima o sospechosa (SCAM).
        
        Datos:
        Nombre: ${company.name}
        Industria: ${company.industry || 'No especificada'}
        Descripción: ${company.description || 'Sin descripción'}
        Email: ${company.email}
        
        Responde SOLO con un párrafo corto en español.
      `;

      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "No se pudo analizar.";
      } catch (e: any) {
          console.error("AI Audit Error", e);
          return `Error IA: ${e.message}`;
      }
  },

  deleteCompany: async (code: string) => {
    try {
        await supabase.from('assessments').delete().eq('company_code', code);
        await supabase.from('jobs').delete().eq('company_code', code);
        await supabase.from('courses').delete().eq('company_code', code);
        const { error } = await supabase.from('companies').delete().eq('code', code);
        if (error) throw error;
    } catch (e) {
        console.error("Delete Company Error:", e);
        throw e;
    }
  },

  // --- Business Logic ---
  redeemCredits: async (companyCode: string, promoCode: string): Promise<{ success: boolean, message: string, newCredits?: number, newPlan?: 'FREE' | 'PREMIUM' }> => {
    const { data: codeData, error } = await supabase
        .from('credit_codes')
        .select('*')
        .eq('code', promoCode)
        .single();
    
    let amount = 0;
    let isDbCode = false;

    if (codeData && !error) {
        if (codeData.is_redeemed) return { success: false, message: "Código ya usado" };
        amount = codeData.amount;
        isDbCode = true;
    } else {
        if (promoCode === 'START') amount = 3;
    }

    if (amount === 0) return { success: false, message: "Código inválido" };

    const { data: comp } = await supabase.from('companies').select('credits, plan').eq('code', companyCode).single();
    if (!comp) return { success: false, message: "Error de empresa" };
    
    const currentCredits = comp.credits || 0;
    const currentPlan = comp.plan || 'FREE';

    const newTotal = currentCredits + amount;
    
    let newPlan = currentPlan;
    if (amount >= 50 || currentPlan === 'PREMIUM') {
        newPlan = 'PREMIUM';
    }

    await supabase.from('companies').update({ credits: newTotal, plan: newPlan }).eq('code', companyCode);
    
    // Update existing jobs if premium upgrade happened
    if (newPlan === 'PREMIUM' && currentPlan !== 'PREMIUM') {
        await supabase.from('jobs').update({ is_featured: true }).eq('company_code', companyCode);
    }

    if (isDbCode) {
        await supabase.from('credit_codes').update({ 
            is_redeemed: true, 
            redeemed_by: companyCode 
        }).eq('code', promoCode);
    }

    return { 
        success: true, 
        message: `¡Canjeado! +${amount} créditos.`, 
        newCredits: newTotal, 
        newPlan: newPlan as 'FREE' | 'PREMIUM' 
    };
  },

  unlockAssessment: async (companyCode: string, assessmentId: string): Promise<{ success: boolean, message: string, newCredits?: number }> => {
    const { data: comp } = await supabase.from('companies').select('credits').eq('code', companyCode).single();
    
    if (!comp || (comp.credits || 0) < 1) return { success: false, message: "Saldo insuficiente" };

    const { data: asm } = await supabase.from('assessments').select('is_unlocked').eq('id', assessmentId).single();
    if (asm?.is_unlocked) return { success: true, message: "Ya desbloqueado", newCredits: comp.credits };

    const newCredits = (comp.credits || 0) - 1;
    
    await supabase.from('companies').update({ credits: newCredits }).eq('code', companyCode);
    await supabase.from('assessments').update({ is_unlocked: true }).eq('id', assessmentId);

    return { success: true, message: "Desbloqueado", newCredits };
  },

  saveAssessment: async (candidate: Candidate, answers: Record<string, string>, jobId?: string): Promise<Assessment | null> => {
    const dbCandidate = {
        id: candidate.email, 
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        role: candidate.role,
        company_code: candidate.companyCode,
        type: candidate.type,
        location: candidate.location
    };
    
    const { error: candError } = await supabase.from('candidates').upsert(dbCandidate);
    if (candError) {
        console.error("Error saving candidate:", JSON.stringify(candError));
        return null;
    }

    const id = Date.now().toString();
    const dbAssessment = {
        id,
        candidate_id: candidate.email,
        company_code: candidate.companyCode,
        job_id: jobId,
        answers,
        status: 'PENDING',
        candidate_type: candidate.type,
        is_unlocked: false
    };

    const { error } = await supabase.from('assessments').insert(dbAssessment);
    if (error) {
        console.error("Error saving assessment:", JSON.stringify(error));
        return null;
    }

    return { ...dbAssessment, timestamp: new Date().toISOString() } as any;
  },

  getAssessmentsByCompany: async (companyCode: string) => {
    const { data, error } = await supabase
        .from('assessments')
        .select(`
            *,
            candidates (name, phone, email, location),
            jobs (title)
        `)
        .eq('company_code', companyCode)
        .order('timestamp', { ascending: false });

    if (error) { console.error(error); return []; }
    return data.map(mapAssessment);
  },

  updateAssessmentReport: async (id: string, report: AnalysisReport) => {
    await supabase.from('assessments').update({
        report,
        status: 'COMPLETED'
    }).eq('id', id);
  }
};
