import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import OverlayView from './components/OverlayView';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LogIn, Shield, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Algo salió mal.</h1>
          <pre className="bg-white p-4 rounded border border-red-200 overflow-auto">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoginScreen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const MASTER_PASSWORD = "123456";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Error: Dominio no autorizado. He iniciado una re-sincronización del sistema. Por favor, acepta los términos en la ventana que apareció arriba.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Error: Ventana emergente bloqueada. Por favor, permite los pop-ups en tu navegador.");
      } else {
        setError(err.message || "Error al iniciar sesión");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans selection:bg-emerald-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl shadow-black/50">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Shield className="text-emerald-500" size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Overlay Studio</h1>
            <p className="text-zinc-400 text-sm">
              {!isUnlocked ? 'Introduce la clave de acceso' : 'Inicia sesión para gestionar tus overlays'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isUnlocked ? (
              <motion.form 
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Clave de acceso"
                    className={`w-full px-6 py-4 bg-white/5 border ${passwordError ? 'border-red-500' : 'border-white/10'} rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-center tracking-[0.5em] font-mono`}
                    autoFocus
                  />
                  {passwordError && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center mt-2"
                    >
                      Clave Incorrecta
                    </motion.p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-900 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                >
                  Verificar Clave
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="login-options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <LogIn size={18} />
                  )}
                  <span>{isLoggingIn ? 'Conectando...' : 'Entrar con Google'}</span>
                </button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center"
                  >
                    {error}
                    <button 
                      onClick={() => setShowDebug(!showDebug)} 
                      className="block w-full mt-2 text-[10px] underline opacity-50 hover:opacity-100"
                    >
                      {showDebug ? 'Ocultar info técnica' : 'Ver info técnica'}
                    </button>
                  </motion.div>
                )}

                {showDebug && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-black/40 rounded-xl font-mono text-[10px] text-zinc-500 break-all"
                  >
                    URL: {window.location.origin}<br />
                    AuthDomain: {auth.config.authDomain}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center px-2">
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Ready</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Real-time</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[10px] font-medium uppercase tracking-[0.2em]">
          Powered by Firebase & Gemini
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'user',
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      unsubscribe();
    };
  }, []);

  const params = new URLSearchParams(search);
  const isOverlay = path === '/overlay' || params.get('view') === 'overlay';

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If it's the overlay view, show it without login (for OBS)
  if (isOverlay) {
    return (
      <ErrorBoundary>
        <OverlayView />
      </ErrorBoundary>
    );
  }

  // If it's the control panel, require login
  if (!user) {
    return (
      <ErrorBoundary>
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ControlPanel />
    </ErrorBoundary>
  );
}

