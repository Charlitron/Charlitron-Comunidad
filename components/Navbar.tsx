import React from 'react';
import { Button } from './Button';
import { Company } from '../types';

interface NavbarProps {
  logo: string;
  view: string;
  setView: (view: any) => void;
  currentCompany: Company | null;
  onLogoClick?: () => void; // Prop para el Easter Egg
}

export const Navbar: React.FC<NavbarProps> = ({ logo, view, setView, currentCompany, onLogoClick }) => (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center gap-2 cursor-pointer select-none" 
                onClick={() => {
                    setView('HOME');
                    if (onLogoClick) onLogoClick();
                }}
            >
                <img src={logo} className="w-8 h-8 rounded-full shadow-sm" alt="Logo" />
                <span className="font-bold text-slate-800 tracking-tight hidden md:block">Charlitron <span className="text-blue-600">Comunidad</span></span>
            </div>
            <div className="flex gap-1 md:gap-4 text-sm font-medium">
                <button onClick={() => setView('JOBS')} className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${view === 'JOBS' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Vacantes</button>
                <button onClick={() => setView('COURSES')} className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${view === 'COURSES' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Cursos</button>
            </div>
            <div>
                {currentCompany ? (
                    <Button size="sm" onClick={() => setView('COMPANY_DASHBOARD')}>Ir a Panel</Button>
                ) : (
                    <Button size="sm" variant="outline" onClick={() => setView('LOGIN')}>Soy Empresa</Button>
                )}
            </div>
        </div>
    </nav>
);