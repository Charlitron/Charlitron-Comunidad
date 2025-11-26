
import React, { useState, useEffect, useRef } from "react";
import { OPERATIVE_QUESTIONS } from "../constants";
import { Answers } from "../types";
import { Button } from "./Button";
import { Send, User, Bot, Mic, Square, Play } from "lucide-react";
import { storageService } from "../services/storageService";

interface OperativeChatProps {
  candidateName: string;
  roleName: string;
  onComplete: (answers: Answers) => void;
}

export const OperativeChat: React.FC<OperativeChatProps> = ({ candidateName, roleName, onComplete }) => {
  const [messages, setMessages] = useState<{ text: string; sender: 'bot' | 'user'; type?: 'text' | 'audio' }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage(`¡Hola ${candidateName}! Soy Charlitron. Para el puesto de ${roleName}, puedes escribir o enviar notas de voz.`);
      }, 500);
      setTimeout(() => {
        askQuestion(0);
      }, 1500);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { text, sender: 'bot', type: 'text' }]);
  };

  const addUserMessage = (text: string, type: 'text' | 'audio' = 'text') => {
    setMessages(prev => [...prev, { text, sender: 'user', type }]);
  };

  const askQuestion = (index: number) => {
    if (index < OPERATIVE_QUESTIONS.length) {
      let q = OPERATIVE_QUESTIONS[index].replace("{role}", roleName);
      addBotMessage(q);
    } else {
      setTimeout(() => {
        addBotMessage("¡Perfecto! Estamos analizando tus respuestas (texto y voz)...");
        setTimeout(() => onComplete(answers), 2000);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    saveResponse(inputValue, 'text');
    setInputValue("");
  };

  const saveResponse = (content: string, type: 'text' | 'audio') => {
    const currentQ = OPERATIVE_QUESTIONS[currentStep].replace("{role}", roleName);
    addUserMessage(content, type);
    setAnswers(prev => ({ ...prev, [currentQ]: content }));

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setTimeout(() => askQuestion(nextStep), 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setIsUploading(true);
        const url = await storageService.uploadFile('audios', file);
        setIsUploading(false);

        if (url) {
           saveResponse(url, 'audio');
        } else {
           alert("Error al subir audio. Intenta escribir.");
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="max-w-md mx-auto h-[600px] flex flex-col bg-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-300">
      <div className="bg-[#075E54] p-4 text-white flex items-center gap-3 shadow-md">
        <div className="bg-white/20 p-2 rounded-full"><Bot className="w-6 h-6" /></div>
        <div>
            <h3 className="font-bold">Entrevista Charlitron</h3>
            <p className="text-xs text-green-100">En línea • Audio Habilitado</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none'
            }`}>
              {msg.type === 'audio' ? (
                  <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-slate-500"/>
                      <audio controls src={msg.text} className="h-8 w-48" />
                  </div>
              ) : msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-3 flex gap-2 items-center">
        <input 
            type="text" 
            className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-[#075E54] outline-none"
            placeholder={isRecording ? "Grabando..." : "Escribe o graba..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isRecording || isUploading}
        />
        
        {isRecording ? (
            <button onClick={stopRecording} className="bg-red-500 text-white p-3 rounded-full animate-pulse shadow-lg">
                <Square className="w-5 h-5 fill-current" />
            </button>
        ) : (
            <button onClick={startRecording} disabled={isUploading} className="bg-slate-200 text-slate-600 p-3 rounded-full hover:bg-slate-300 transition-colors">
                {isUploading ? <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"/> : <Mic className="w-5 h-5" />}
            </button>
        )}

        <button 
            onClick={handleSend}
            disabled={isRecording || isUploading}
            className="bg-[#075E54] text-white p-3 rounded-full hover:bg-[#128C7E] transition-colors disabled:opacity-50"
        >
            <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
