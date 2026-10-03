// ARCHEION ONE - Public Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { Archive, Target, FileText, Shield, Brain, CheckSquare, Download, Building2, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-sm font-bold text-slate-800">ARCHEION ONE</span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Acceder
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 mb-6">
            <Zap className="w-3 h-3" />
            Ecosistema universal de IA y gestión documental
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Transforma necesidades en{' '}
            <span className="text-amber-500">misiones verificables</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-6 leading-relaxed">
            ARCHEION ONE convierte cualquier necesidad expresada en una misión estructurada, 
            ejecutable, documentada y verificable. Con trazabilidad completa, gestión de evidencias 
            y generación de resultados descargables.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              to="/login"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              Comenzar ahora
            </Link>
            <a
              href="#modulos"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Conocer módulos
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Target, title: 'Misiones estructuradas', desc: 'Cada necesidad se convierte en una misión con objetivo, alcance, criterios de aceptación y entregables definidos.' },
            { icon: FileText, title: 'Gestión documental', desc: 'Carga, versionado, almacenamiento seguro con hash SHA-256. Conserva originales sin modificar.' },
            { icon: CheckSquare, title: 'Plan de tareas', desc: 'Dependencias, responsables, estados controlados y criterios de aceptación verificables.' },
            { icon: Shield, title: 'Evidencias y trazabilidad', desc: 'Cada afirmación vinculada a su fuente. Hechos documentados, inferencias y contradicciones identificables.' },
            { icon: Brain, title: 'Asistencia por IA', desc: 'Pasarela común para modelos de IA. Preparada para Qwen y otros proveedores. Sin respuestas simuladas.' },
            { icon: Download, title: 'Exportaciones reales', desc: 'PDF, ZIP, CSV, JSON con contenido válido. Expedientes completos con manifiesto e integridad.' },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-200 hover:border-amber-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-8">Módulos especializados</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'ATIENDE', desc: 'Atención y recepción' },
            { name: 'ELHOMB', desc: 'Expedientes y exportación' },
            { name: 'ARCHEION', desc: 'Evidencias y trazabilidad' },
            { name: 'SAE', desc: 'Gobernanza y auditoría de IA' },
            { name: 'BGOS', desc: 'Gobierno empresarial' },
            { name: 'FIRECYCLE EXTREM', desc: 'Territorio y observación' },
            { name: 'RECIPRA', desc: 'Comercio y campañas' },
            { name: 'RECIPRA-MEDIA', desc: 'Audiovisual y derechos' },
            { name: 'Prisma Sonoro', desc: 'Procesamiento musical' },
          ].map(mod => (
            <div key={mod.name} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-800">{mod.name}</p>
              <p className="text-[10px] text-slate-500">{mod.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">
          Todos los módulos comparten usuarios, organizaciones, misiones, documentos y sistema de auditoría.
        </p>
      </section>

      {/* Architecture */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
          <h2 className="text-lg font-bold mb-4">Arquitectura</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-amber-400 font-medium text-xs mb-2">Stack tecnológico</p>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• React + TypeScript (modo estricto)</li>
                <li>• Tailwind CSS</li>
                <li>• IndexedDB (persistencia local)</li>
                <li>• Preparado para PostgreSQL + Prisma</li>
                <li>• jsPDF, JSZip para exportaciones</li>
              </ul>
            </div>
            <div>
              <p className="text-amber-400 font-medium text-xs mb-2">Infraestructura prevista</p>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• GitHub (repositorio: archeion-one)</li>
                <li>• Vercel (despliegue web)</li>
                <li>• PostgreSQL / Supabase</li>
                <li>• GitHub Actions (CI/CD)</li>
                <li>• Almacenamiento privado de objetos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">ARCHEION ONE · Plataforma SaaS modular</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Propietario: Prof. Manuel Gago Fernández · Organización tecnológica: SAE
          </p>
        </div>
      </footer>
    </div>
  );
}
