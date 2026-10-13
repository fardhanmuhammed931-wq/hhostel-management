import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
      <GlassCard className="max-w-md w-full text-center p-8 sm:p-10 shadow-glass">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-6 shadow-glass">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono">404</span>
        <h2 className="text-xl font-bold text-white mt-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mt-2 mb-8 leading-relaxed">
          The requested hostel management portal module or page could not be located.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
