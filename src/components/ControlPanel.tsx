import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, Trash2, Edit2, Play, Square, Monitor, X, Activity, Shield, Zap, Layers, Layout, Palette, HelpCircle, ChevronRight, ChevronLeft, Globe, Cpu, ExternalLink, Clock, Menu, Copy, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Overlay } from '../types';
import { cn } from '../lib/utils';
import OverlayRenderer from './OverlayRenderer';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

const DEFAULT_OVERLAY: Partial<Overlay> = {
  name: '',
  title: '',
  subtitle: '',
  color: '#10b981',
  shortcut: '',
  fontSizeTitle: 36,
  fontSizeSubtitle: 20,
  bgColor: '#18181b',
  textColor: '#ffffff',
  positionX: 5,
  positionY: 85,
  animationType: 'slide-left',
  layoutType: 'standard',
  styleVariant: 'default',
  fontFamily: 'sans',
  borderRadius: 16,
  width: 800,
  height: 120,
  rotation: 0,
  bgImage: '',
  active: false,
  titleX: 0,
  titleY: 0,
  subtitleX: 0,
  subtitleY: 0,
  textAlign: 'left',
  autoDeactivateDuration: 0
};

export default function ControlPanel() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [editingOverlay, setEditingOverlay] = useState<Overlay | any>(null);
  const [bgImageBase64, setBgImageBase64] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewScale, setPreviewScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'settings'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpu: 12,
    ram: 45,
    uptime: '02:14:35',
    fps: 60
  });

  // Templates for the Library
  const TEMPLATES = [
    { id: 't1', title: 'BREAKING NEWS', subtitle: 'COBERTURA ESPECIAL EN VIVO', layoutType: 'ticker', styleVariant: 'breaking', color: '#facc15', bgColor: '#7f1d1d', fontSizeTitle: 24, fontSizeSubtitle: 14, width: 1920, height: 60, positionX: 0, positionY: 94, autoDeactivateDuration: 0 },
    { id: 't2', title: 'PREMIUM EVENT', subtitle: 'EXCLUSIVE BROADCAST', layoutType: 'ticker', styleVariant: 'premium', color: '#f59e0b', bgColor: '#09090b', fontSizeTitle: 22, fontSizeSubtitle: 12, width: 1920, height: 50, positionX: 0, positionY: 95, autoDeactivateDuration: 0 },
    { id: 't3', title: 'MINIMALIST LIVE', subtitle: 'STREAMING NOW', layoutType: 'ticker', styleVariant: 'minimalista', color: '#ffffff', bgColor: '#000000', fontSizeTitle: 18, fontSizeSubtitle: 12, width: 1920, height: 40, positionX: 0, positionY: 96, autoDeactivateDuration: 0 },
    { id: 't4', title: 'MODERN GRAFT', subtitle: 'DYNAMIC CONTENT', layoutType: 'graft', styleVariant: 'gradient', color: '#10b981', bgColor: '#09090b', fontSizeTitle: 48, fontSizeSubtitle: 18, width: 700, height: 180, positionX: 5, positionY: 80, autoDeactivateDuration: 0 },
    { id: 't5', title: 'ELEGANT SERIF', subtitle: 'A Story of Excellence', layoutType: 'graft', styleVariant: 'italic-serif', color: '#ffffff', bgColor: '#18181b', fontSizeTitle: 56, fontSizeSubtitle: 24, width: 800, height: 200, positionX: 5, positionY: 75, autoDeactivateDuration: 0 },
    { id: 't8', title: 'BIG ANNOUNCEMENT', subtitle: 'SPECIAL BROADCAST', layoutType: 'live-title', styleVariant: 'uppercase', color: '#ef4444', bgColor: 'transparent', fontSizeTitle: 120, fontSizeSubtitle: 16, positionX: 10, positionY: 50, width: 1500, height: 400, autoDeactivateDuration: 0 },
    { id: 't6', title: 'SPORTS SCOREBOARD', subtitle: 'Q1', layoutType: 'sports-scoreboard', styleVariant: 'default', color: '#3b82f6', bgColor: '#18181b', fontSizeTitle: 24, fontSizeSubtitle: 16, width: 450, height: 80, positionX: 5, positionY: 5, customData: { teamA: 'HOME', teamB: 'AWAY', scoreA: 0, scoreB: 0, period: '1ST QTR' }, autoDeactivateDuration: 0 },
    { id: 't7', title: 'SOCIAL POPUP', subtitle: '@username', layoutType: 'social-popup', styleVariant: 'twitter', color: '#1da1f2', bgColor: '#ffffff', textColor: '#0f1419', fontSizeTitle: 20, fontSizeSubtitle: 16, width: 400, height: 100, positionX: 5, positionY: 85, customData: { platform: 'twitter', handle: '@streamer', message: 'Follow me for more updates!' }, autoDeactivateDuration: 0 },
    { id: 't9', title: 'FONDO FULL HD', subtitle: '', layoutType: 'background-only', styleVariant: 'default', color: '#10b981', bgColor: '#000000', width: 1920, height: 1080, positionX: 50, positionY: 50, autoDeactivateDuration: 0 },
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 15) + 5,
        ram: Math.floor(Math.random() * 10) + 40,
        fps: Math.floor(Math.random() * 5) + 58
      }));
    }, 3000);

    return () => {
      unsubscribeAuth();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setOverlays([]);
      return;
    }

    const q = query(
      collection(db, 'overlays'), 
      where('uid', '==', user.uid),
      orderBy('name')
    );
    
    const unsubscribeOverlays = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as Overlay));
      setOverlays(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'overlays');
    });

    return () => unsubscribeOverlays();
  }, [user]);

  useEffect(() => {
    if (!previewRef.current || !isModalOpen) return;
    
    const updateScale = () => {
      if (previewRef.current) {
        const width = previewRef.current.offsetWidth;
        const height = previewRef.current.offsetHeight;
        const targetRatio = 1920 / 1080;
        const currentRatio = width / height;

        if (currentRatio > targetRatio) {
          setPreviewScale(height / 1080);
        } else {
          setPreviewScale(width / 1920);
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(previewRef.current);
    
    // Initial call
    setTimeout(updateScale, 100);

    return () => resizeObserver.disconnect();
  }, [isModalOpen, previewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const key = e.key.toUpperCase();
      const overlayToToggle = overlays.find(o => o.shortcut?.toUpperCase() === key);
      
      if (overlayToToggle) {
        handleToggle(overlayToToggle.id, overlayToToggle.active);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlays]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const active = !currentActive;
      const overlayRef = doc(db, 'overlays', id);
      
      if (active) {
        // Handle overlaps and timers on the client
        const newOverlay = overlays.find(o => o.id === id);
        if (newOverlay) {
          // Deactivate overlapping
          for (const existing of overlays) {
            if (existing.active && existing.id !== id && checkOverlap(newOverlay, existing)) {
              await updateDoc(doc(db, 'overlays', existing.id), { active: false });
            }
          }

          // Set timer
          if (newOverlay.autoDeactivateDuration && newOverlay.autoDeactivateDuration > 0) {
            setTimeout(async () => {
              await updateDoc(doc(db, 'overlays', id), { active: false });
            }, newOverlay.autoDeactivateDuration * 1000);
          }
        }
      }

      await updateDoc(overlayRef, { active });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `overlays/${id}`);
    }
  };

  // Helper to check if two overlays overlap (moved from server)
  function checkOverlap(o1: any, o2: any) {
    const getRect = (o: any) => {
      const w = o.width || 800;
      const h = o.height || 120;
      if (o.layoutType === 'ticker') return { x: 0, y: 1080 - h, w: 1920, h: h };
      const cx = (1920 * (o.positionX || 0)) / 100;
      const cy = (1080 * (o.positionY || 0)) / 100;
      return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    };
    const r1 = getRect(o1);
    const r2 = getRect(o2);
    return !(r2.x >= r1.x + r1.w || r2.x + r2.w <= r1.x || r2.y >= r1.y + r1.h || r2.y + r2.h <= r1.y);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOverlay) return;
    
    const id = editingOverlay.id || crypto.randomUUID();
    const overlayData = {
      ...editingOverlay,
      id,
      uid: user?.uid,
      bgImage: bgImageBase64 || editingOverlay.bgImage || ''
    };

    try {
      await setDoc(doc(db, 'overlays', id), overlayData);
      setIsModalOpen(false);
      setEditingOverlay(null);
      setBgImageBase64('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `overlays/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'overlays', id));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `overlays/${id}`);
    }
  };

  const handleCopy = async (overlay: Overlay) => {
    const id = crypto.randomUUID();
    const newOverlay = {
      ...overlay,
      id,
      uid: user?.uid,
      name: `${overlay.name} (Copia)`,
      active: false
    };

    try {
      await setDoc(doc(db, 'overlays', id), newOverlay);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `overlays/${id}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingOverlay) return;
    const { name, value, type } = e.target;
    
    const val = type === 'number' ? Number(value) : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditingOverlay({
        ...editingOverlay,
        [parent]: {
          ...(editingOverlay[parent as keyof typeof editingOverlay] as any || {}),
          [child]: val
        }
      });
      return;
    }

    const updates: any = {
      [name]: val
    };

    // Reset styleVariant if layoutType changes to avoid invalid combinations
    if (name === 'layoutType') {
      updates.styleVariant = 'default';
    }

    setEditingOverlay({
      ...editingOverlay,
      ...updates
    });
  };

  const handleCustomDataChange = (key: string, value: any) => {
    if (!editingOverlay) return;
    setEditingOverlay({
      ...editingOverlay,
      customData: {
        ...(editingOverlay.customData || {}),
        [key]: value
      }
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return { width: '360px', height: '640px', maxWidth: '100%' };
      case 'tablet': return { width: '768px', height: '1024px', maxWidth: '100%' };
      default: return { width: '100%', height: '100%', aspectRatio: '16/9' };
    }
  };

  return (
    <div className="flex h-screen bg-zinc-100 text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className="border-r border-black/5 bg-white flex-col relative z-20 hidden md:flex"
      >
        <div className="p-6">
          <div className={cn("flex items-center gap-3 mb-8", isSidebarCollapsed ? "justify-center" : "")}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
              <Zap size={18} className="text-zinc-900" />
            </div>
            {!isSidebarCollapsed && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-display font-bold tracking-tight whitespace-nowrap"
              >
                TITLER PRO
              </motion.h1>
            )}
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', icon: Layout, label: 'Mis Overlays' },
              { id: 'library', icon: Layers, label: 'Plantillas' },
              { id: 'settings', icon: Settings, label: 'Ajustes' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-black/5 text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-600 hover:bg-black/[0.02]",
                  isSidebarCollapsed ? "justify-center px-0" : ""
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon size={18} className="shrink-0" />
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          {!isSidebarCollapsed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10"
            >
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", !!user ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                <span className="text-xs font-medium">{!!user ? 'Sistema Online' : 'Conectando...'}</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div className={cn("w-3 h-3 rounded-full", !!user ? "bg-emerald-500 animate-pulse" : "bg-red-500")} title={!!user ? 'Online' : 'Offline'} />
            </div>
          )}
          
          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-600 text-sm transition-colors",
            isSidebarCollapsed ? "justify-center px-0" : ""
          )}>
            <HelpCircle size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span>Soporte</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-black/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 shadow-sm transition-all z-30"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-black/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-black/5 rounded-xl md:hidden text-zinc-500"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-display font-bold tracking-tight capitalize">{activeTab}</h2>
            <div className="h-4 w-[1px] bg-black/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span>LIVE MONITOR</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={12} />
                <span>{systemStats.fps} FPS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 mr-2 md:mr-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-zinc-900">{user.displayName}</span>
                  <span className="text-[10px] text-zinc-500">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-black/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-900">
                    <User size={16} />
                  </div>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
            <button 
              onClick={() => window.open(`/?view=overlay&uid=${user?.uid}`, '_blank')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest transition-all border border-black/5"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">OBS View</span>
            </button>
            <button 
              onClick={() => {
                setEditingOverlay(DEFAULT_OVERLAY);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-900 text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nuevo Overlay</span>
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-48",
          showMobileMenu ? "block" : "hidden md:block"
        )}>
          {showMobileMenu && (
            <div className="md:hidden mb-8 space-y-2">
              {[
                { id: 'dashboard', icon: Layout, label: 'Mis Overlays' },
                { id: 'library', icon: Layers, label: 'Plantillas' },
                { id: 'settings', icon: Settings, label: 'Ajustes' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === item.id 
                      ? "bg-emerald-500 text-zinc-900 shadow-lg shadow-emerald-500/20" 
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Activos', value: overlays.filter(o => o.active).length, icon: Play, color: 'text-emerald-500' },
                  { label: 'Librería', value: overlays.length, icon: Layers, color: 'text-blue-500' },
                  { label: 'CPU', value: `${systemStats.cpu}%`, icon: Cpu, color: 'text-amber-500' },
                  { label: 'Uptime', value: systemStats.uptime, icon: Clock, color: 'text-purple-500' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-zinc-100/40 border border-black/5 glass">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                      <stat.icon size={14} className={stat.color} />
                    </div>
                    <div className="text-xl font-display font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold">Overlays Recientes</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-zinc-100 border border-black/5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
                    <Globe size={18} />
                  </button>
                  <button className="p-2 bg-zinc-100 border border-black/5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
                    <Cpu size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {overlays.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-black/5 rounded-2xl">
                      <Layers size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">No hay overlays configurados</p>
                      <p className="text-sm">Crea tu primer overlay para comenzar</p>
                    </div>
                  ) : (
                    overlays.map((overlay, index) => (
                      <motion.div
                        key={overlay.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.05 }
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "group relative bg-white border rounded-2xl p-6 transition-all duration-300 glass-dark",
                          overlay.active 
                            ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
                            : "border-black/5 hover:border-black/10"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500"
                            style={{ backgroundColor: overlay.color }}
                          >
                            <Zap size={24} className="text-zinc-900/90" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button 
                              onClick={() => handleCopy(overlay)}
                              className="p-2 bg-zinc-100 border border-black/5 rounded-xl text-zinc-500 hover:text-emerald-600 transition-colors"
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                              onClick={() => { setEditingOverlay(overlay); setIsModalOpen(true); }}
                              className="p-2 bg-zinc-100 border border-black/5 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(overlay.id)}
                              className="p-2 bg-zinc-100 border border-black/5 rounded-xl text-zinc-500 hover:text-red-400 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {overlay.layoutType || 'standard'}
                            </span>
                            {overlay.active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {overlay.autoDeactivateDuration > 0 && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 border border-black/5 text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                                <Clock size={8} />
                                {overlay.autoDeactivateDuration}s
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-zinc-900 mb-1">{overlay.name || 'Sin Nombre'}</h3>
                          <p className="text-sm text-zinc-500 line-clamp-1">{overlay.title}</p>
                        </div>

                        {/* Quick Controls */}
                        {overlay.layoutType === 'sports-scoreboard' && (
                          <div className="mb-6 p-3 bg-black/5 rounded-xl border border-black/5">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{overlay.customData?.teamA || 'HOME'}</span>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{overlay.customData?.teamB || 'AWAY'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={async () => {
                                    const newScore = Math.max(0, (overlay.customData?.scoreA || 0) - 1);
                                    const updatedData = { ...overlay.customData, scoreA: newScore };
                                    try {
                                      await updateDoc(doc(db, 'overlays', overlay.id), { customData: updatedData });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                    }
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-700 flex items-center justify-center text-zinc-900"
                                >-</button>
                                <span className="font-mono font-bold w-6 text-center">{overlay.customData?.scoreA || 0}</span>
                                <button 
                                  onClick={async () => {
                                    const newScore = (overlay.customData?.scoreA || 0) + 1;
                                    const updatedData = { ...overlay.customData, scoreA: newScore };
                                    try {
                                      await updateDoc(doc(db, 'overlays', overlay.id), { customData: updatedData });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                    }
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-700 flex items-center justify-center text-zinc-900"
                                >+</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={async () => {
                                    const newScore = Math.max(0, (overlay.customData?.scoreB || 0) - 1);
                                    const updatedData = { ...overlay.customData, scoreB: newScore };
                                    try {
                                      await updateDoc(doc(db, 'overlays', overlay.id), { customData: updatedData });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                    }
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-700 flex items-center justify-center text-zinc-900"
                                >-</button>
                                <span className="font-mono font-bold w-6 text-center">{overlay.customData?.scoreB || 0}</span>
                                <button 
                                  onClick={async () => {
                                    const newScore = (overlay.customData?.scoreB || 0) + 1;
                                    const updatedData = { ...overlay.customData, scoreB: newScore };
                                    try {
                                      await updateDoc(doc(db, 'overlays', overlay.id), { customData: updatedData });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                    }
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-700 flex items-center justify-center text-zinc-900"
                                >+</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {overlay.layoutType === 'social-popup' && (
                          <div className="mb-6 p-3 bg-black/40 rounded-xl border border-black/5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Handle / Usuario</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={overlay.customData?.handle || ''} 
                                onChange={(e) => {
                                  // We update local state optimistically, but emit on blur or enter to avoid spamming
                                  const updatedOverlay = { ...overlay, customData: { ...overlay.customData, handle: e.target.value } };
                                  setOverlays(prev => prev.map(o => o.id === overlay.id ? updatedOverlay : o));
                                }}
                                onBlur={async () => {
                                  try {
                                    await updateDoc(doc(db, 'overlays', overlay.id), { customData: overlay.customData });
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                  }
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    try {
                                      await updateDoc(doc(db, 'overlays', overlay.id), { customData: overlay.customData });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `overlays/${overlay.id}`);
                                    }
                                  }
                                }}
                                className="w-full bg-zinc-100 border border-black/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleToggle(overlay.id, overlay.active)}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden",
                            overlay.active
                              ? "bg-emerald-500 text-zinc-900 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-white/10"
                          )}
                        >
                          {overlay.autoDeactivateDuration > 0 && (
                            <div className="absolute top-2 right-2">
                              <div 
                                className="w-1.5 h-1.5 rounded-full animate-pulse shadow-lg"
                                style={{ 
                                  backgroundColor: overlay.color,
                                  boxShadow: `0 0 8px ${overlay.color}`
                                }} 
                              />
                            </div>
                          )}
                          {overlay.active ? (
                            <>
                              <Square size={14} fill="currentColor" />
                              Detener
                            </>
                          ) : (
                            <>
                              <Play size={14} fill="currentColor" />
                              Activar
                            </>
                          )}
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-10">
                <h3 className="text-3xl font-display font-bold mb-2">Librería de Plantillas</h3>
                <p className="text-zinc-500">Diseños profesionales listos para usar en tus transmisiones.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEMPLATES.map((template) => (
                  <div 
                    key={template.id}
                    className="group relative rounded-2xl border border-black/5 bg-zinc-100/40 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden glass-dark"
                  >
                    <div className="aspect-video bg-black/10 flex items-center justify-center p-6 relative overflow-hidden">
                      <div 
                        className="w-full h-10 rounded-lg border border-black/10 flex items-center px-4 gap-3 shadow-2xl"
                        style={{ backgroundColor: template.bgColor, borderColor: template.color + '44' }}
                      >
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: template.color }} />
                        <div className="h-2 w-24 rounded-full bg-black/20" />
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-900 shadow-xl">
                          <Plus size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold text-zinc-900 mb-1">{template.title}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">{template.layoutType} • {template.styleVariant}</p>
                      <button 
                        onClick={() => {
                          const newOverlay = {
                            ...DEFAULT_OVERLAY,
                            name: template.title,
                            title: template.title,
                            subtitle: template.subtitle,
                            layoutType: template.layoutType as any,
                            styleVariant: template.styleVariant as any,
                            color: template.color,
                            bgColor: template.bgColor,
                            textColor: template.textColor || '#ffffff',
                            fontSizeTitle: template.fontSizeTitle,
                            fontSizeSubtitle: template.fontSizeSubtitle,
                            width: (template as any).width || DEFAULT_OVERLAY.width,
                            height: (template as any).height || DEFAULT_OVERLAY.height,
                            positionX: (template as any).positionX !== undefined ? (template as any).positionX : DEFAULT_OVERLAY.positionX,
                            positionY: (template as any).positionY !== undefined ? (template as any).positionY : DEFAULT_OVERLAY.positionY,
                            customData: template.customData || {},
                          };
                          setEditingOverlay(newOverlay);
                          setIsModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-black/5 hover:bg-emerald-600 hover:text-zinc-900 text-zinc-500 text-[10px] font-bold transition-all uppercase tracking-[0.2em] border border-black/5"
                      >
                        Usar Plantilla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Globe size={24} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Conexión en Tiempo Real</h3>
                      <p className="text-sm text-zinc-500">Estado del servidor Socket.IO</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                      <span className="text-sm text-zinc-500">Status</span>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", !!user ? "bg-emerald-500" : "bg-red-500")} />
                        <span className={cn("text-sm font-bold", !!user ? "text-emerald-500" : "text-red-500")}>
                          {!!user ? 'CONECTADO' : 'DESCONECTADO'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                      <span className="text-sm text-zinc-500">Latencia</span>
                      <span className="text-sm font-mono text-emerald-500">12ms</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Activity size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Salud del Sistema</h3>
                      <p className="text-sm text-zinc-500">Rendimiento del motor de renderizado</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                      <span className="text-sm text-zinc-500">Uso de CPU</span>
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${systemStats.cpu}%` }} />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">{systemStats.cpu}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                      <span className="text-sm text-zinc-500">Memoria RAM</span>
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${systemStats.ram}%` }} />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">{systemStats.ram}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-2xl">
                <h3 className="text-lg font-bold mb-6">Preferencias Avanzadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Auto-Save', desc: 'Guardado automático cada 30s', active: true },
                    { label: 'Cloud Sync', desc: 'Sincronizar overlays en la nube', active: false },
                    { label: 'Hardware Acceleration', desc: 'Usar GPU para el renderizado', active: true },
                    { label: 'Debug Mode', desc: 'Mostrar logs detallados', active: false },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.04] transition-colors cursor-pointer group">
                      <div>
                        <p className="text-sm font-bold group-hover:text-emerald-500 transition-colors">{pref.label}</p>
                        <p className="text-xs text-zinc-500">{pref.desc}</p>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        pref.active ? "bg-emerald-600" : "bg-zinc-200"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          pref.active ? "right-1" : "left-1"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controller Band */}
        <div className={cn(
          "bg-zinc-900 border-t border-white/10 flex flex-col md:flex-row items-center px-4 md:px-8 gap-4 md:gap-8 overflow-x-auto custom-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20 relative transition-all duration-500",
          "h-full md:h-40 flex-1 md:flex-none",
          showMobileMenu ? "hidden md:flex" : "flex"
        )}>
          {/* Hardware Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start w-full md:w-auto md:min-w-[140px] md:border-r border-white/10 md:pr-8 md:mr-2 z-10 py-4 md:py-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Deck</span>
            </div>
            <button 
              onClick={() => overlays.forEach(o => o.active && handleToggle(o.id, true))}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/20 md:w-full md:mt-3"
            >
              Master Off
            </button>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-4 md:gap-6 py-4 z-10 w-full overflow-y-auto md:overflow-y-visible max-h-[70vh] md:max-h-none">
            {overlays.map((overlay) => (
              <button
                key={overlay.id}
                onClick={() => handleToggle(overlay.id, overlay.active)}
                className={cn(
                  "relative w-28 h-28 md:w-24 md:h-24 rounded-[20px] transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden flex-shrink-0",
                  "bg-zinc-950 border-4",
                  overlay.active ? "scale-95" : "border-zinc-800 hover:border-zinc-700 hover:scale-105"
                )}
                style={{ 
                  borderColor: overlay.active ? overlay.color : '#27272a',
                  boxShadow: overlay.active ? `0 0 30px ${overlay.color}44, inset 0 0 15px ${overlay.color}22` : 'inset 0 0 15px rgba(0,0,0,0.5)',
                }}
              >
                {overlay.autoDeactivateDuration > 0 && (
                  <div className="absolute top-2 right-2 z-20">
                    <div 
                      className="w-1.5 h-1.5 rounded-full animate-pulse shadow-lg"
                      style={{ 
                        backgroundColor: overlay.color,
                        boxShadow: `0 0 8px ${overlay.color}`
                      }} 
                    />
                  </div>
                )}
                {/* Screen Effect */}
                <div className="absolute inset-1 rounded-[16px] bg-zinc-900/40 pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                </div>

                <div className="relative flex flex-col items-center justify-between h-full py-4 w-full px-2 z-10">
                  {overlay.shortcut && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[7px] font-black text-zinc-400 uppercase">
                      {overlay.shortcut}
                    </div>
                  )}
                  <div className={cn("transition-all duration-500", overlay.active ? "opacity-100 scale-110" : "opacity-30 grayscale")}>
                    <Zap size={24} style={{ color: overlay.active ? overlay.color : '#71717a' }} />
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest truncate block w-full text-center", overlay.active ? "text-white" : "text-zinc-600")}>
                      {overlay.name || 'Overlay'}
                    </span>
                    <div className={cn("h-0.5 w-6 mx-auto rounded-full transition-all duration-300", overlay.active ? "opacity-100" : "opacity-0")} style={{ backgroundColor: overlay.color }} />
                  </div>
                </div>
                
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              </button>
            ))}

            <button
              onClick={() => {
                setEditingOverlay(DEFAULT_OVERLAY);
                setIsModalOpen(true);
              }}
              className="w-28 h-28 md:w-24 md:h-24 rounded-[20px] border-4 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-500 hover:border-zinc-700 transition-all group flex-shrink-0"
            >
              <Plus size={24} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest">Nuevo</span>
            </button>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-black/10 rounded-[2rem] w-full max-w-6xl shadow-[0_0_100px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="h-16 border-b border-black/5 flex items-center justify-between px-8 bg-zinc-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Edit2 size={18} />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">
                    {editingOverlay?.id ? 'Configurar Overlay' : 'Crear Nueva Plantilla'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Preview (Sticky) */}
                <div className="w-full lg:w-[45%] border-r border-black/5 bg-black/5 p-8 overflow-y-auto custom-scrollbar">
                  <div className="sticky top-0 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Preview</h3>
                      <div className="flex gap-1 bg-zinc-100/50 p-1 rounded-xl border border-black/5">
                        {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPreviewMode(mode)}
                            className={cn(
                              "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                              previewMode === mode ? "bg-emerald-600 text-zinc-900 shadow-lg" : "text-zinc-500 hover:text-zinc-600"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div 
                      className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-500 border border-black/20" 
                    >
                      <div 
                        ref={previewRef}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {/* Simulated OBS Scene */}
                        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/stream/1280/720')] bg-cover bg-center opacity-20 grayscale-[0.5]" />
                        
                        {/* Virtual 1920x1080 Canvas scaled to fit */}
                        <div 
                          style={{ 
                            width: '1920px', 
                            height: '1080px', 
                            position: 'relative',
                            transform: `scale(${previewScale})`,
                            transformOrigin: 'center center',
                            flexShrink: 0,
                            pointerEvents: 'none'
                          }}
                        >
                          {editingOverlay && (
                            <>
                              <OverlayRenderer overlay={editingOverlay} isPreview={true} />
                              {/* Anchor Point Indicator */}
                              <div 
                                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg z-50"
                                style={{ 
                                  left: `${editingOverlay.positionX}%`, 
                                  top: `${editingOverlay.positionY}%`,
                                  transform: 'translate(-50%, -50%)'
                                }}
                              />
                            </>
                          )}
                          
                          {/* Safety Guides (Inside the scaled canvas) */}
                          <div className="absolute inset-0 border-[40px] border-white/5 pointer-events-none" />
                          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                      <HelpCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-200/60 leading-relaxed">
                        La vista previa es una representación aproximada. Para resultados finales, visualiza el overlay directamente en OBS.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Controls (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white relative">
                  <form onSubmit={handleSave} className="space-y-10 flex flex-col min-h-full">
                    <div className="flex-1 space-y-10">
                      {/* Section: Content */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Información Base</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre del Overlay</label>
                          <input 
                            name="name"
                            value={editingOverlay?.name || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            placeholder="Ej: Título del Stream"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Título Principal</label>
                            <input 
                              name="title"
                              value={editingOverlay?.title || ''}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Atajo de Teclado (Tecla)</label>
                            <input 
                              name="shortcut"
                              value={editingOverlay?.shortcut || ''}
                              onChange={(e) => {
                                const val = e.target.value.slice(-1).toUpperCase();
                                setEditingOverlay({ ...editingOverlay, shortcut: val });
                              }}
                              placeholder="Ej: A, 1, F"
                              className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono font-bold text-center text-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Subtítulo / Descripción</label>
                            <input 
                              name="subtitle"
                              value={editingOverlay?.subtitle || ''}
                              onChange={handleInputChange}
                              className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <Clock size={10} />
                              Auto Desactivación (Segundos)
                            </label>
                            <input 
                              type="number"
                              name="autoDeactivateDuration"
                              value={editingOverlay?.autoDeactivateDuration || 0}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono font-bold text-emerald-500"
                              placeholder="0 = Desactivado"
                            />
                            <p className="text-[9px] text-zinc-400 italic ml-1">El zócalo se apagará automáticamente después de este tiempo. 0 para manual.</p>
                          </div>
                        </div>
                    </section>

                    {/* Section: Custom Data (Conditional) */}
                    {(editingOverlay?.layoutType === 'sports-scoreboard' || editingOverlay?.layoutType === 'social-popup') && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Contenido Específico</h3>
                        </div>
                        
                        {editingOverlay?.layoutType === 'sports-scoreboard' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Equipo Local</label>
                              <input 
                                value={editingOverlay.customData?.teamA || ''}
                                onChange={(e) => handleCustomDataChange('teamA', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Puntuación Local</label>
                              <input 
                                type="number"
                                value={editingOverlay.customData?.scoreA || 0}
                                onChange={(e) => handleCustomDataChange('scoreA', Number(e.target.value))}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Periodo</label>
                              <input 
                                value={editingOverlay.customData?.period || ''}
                                onChange={(e) => handleCustomDataChange('period', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Equipo Visitante</label>
                              <input 
                                value={editingOverlay.customData?.teamB || ''}
                                onChange={(e) => handleCustomDataChange('teamB', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Puntuación Visitante</label>
                              <input 
                                type="number"
                                value={editingOverlay.customData?.scoreB || 0}
                                onChange={(e) => handleCustomDataChange('scoreB', Number(e.target.value))}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                          </div>
                        )}

                        {editingOverlay?.layoutType === 'social-popup' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Plataforma</label>
                              <select 
                                value={editingOverlay.customData?.platform || 'twitter'}
                                onChange={(e) => handleCustomDataChange('platform', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-zinc-900 appearance-none"
                              >
                                <option value="twitter">Twitter / X</option>
                                <option value="instagram">Instagram</option>
                                <option value="youtube">YouTube</option>
                                <option value="twitch">Twitch</option>
                                <option value="tiktok">TikTok</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Usuario / Handle</label>
                              <input 
                                value={editingOverlay.customData?.handle || ''}
                                onChange={(e) => handleCustomDataChange('handle', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Mensaje (Opcional)</label>
                              <input 
                                value={editingOverlay.customData?.message || ''}
                                onChange={(e) => handleCustomDataChange('message', e.target.value)}
                                className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                              />
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Section: Layout & Style */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Diseño y Estilo</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Tipo de Estructura</label>
                          <select 
                            name="layoutType" 
                            value={editingOverlay?.layoutType || 'standard'} 
                            onChange={handleInputChange}
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                          >
                            <option value="standard">Estándar (Lateral)</option>
                            <option value="graft">Graft (Flotante)</option>
                            <option value="ticker">Ticker (Cinta)</option>
                            <option value="sports-scoreboard">Marcador Deportivo</option>
                            <option value="social-popup">Popup Social</option>
                            <option value="live-title">Live Title (Impacto)</option>
                            <option value="background-only">Fondo / Background</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Variante Visual</label>
                          <select 
                            name="styleVariant" 
                            value={editingOverlay?.styleVariant || 'default'} 
                            onChange={handleInputChange}
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                          >
                            <option value="default">Clásico</option>
                            {editingOverlay?.layoutType === 'graft' && (
                              <>
                                <option value="bold-caps">Impacto (Caps)</option>
                                <option value="italic-serif">Elegante (Serif)</option>
                                <option value="outline">Minimal (Outline)</option>
                                <option value="gradient">Moderno (Gradient)</option>
                              </>
                            )}
                            {editingOverlay?.layoutType === 'ticker' && (
                              <>
                                <option value="news">Noticias</option>
                                <option value="sports">Deportes</option>
                                <option value="breaking">Breaking News</option>
                                <option value="premium">Premium Gold</option>
                                <option value="minimalista">Ultra Minimal</option>
                              </>
                            )}
                            {editingOverlay?.layoutType === 'live-title' && (
                              <>
                                <option value="default">Normal</option>
                                <option value="uppercase">Todo Mayúsculas</option>
                              </>
                            )}
                            {editingOverlay?.layoutType === 'background-only' && (
                              <>
                                <option value="default">Normal</option>
                                <option value="overlay">Overlay (50% Opacidad)</option>
                                <option value="glow">Glow (Brillo)</option>
                                <option value="border">Con Borde</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Acento</label>
                          <div className="relative group">
                            <input type="color" name="color" value={editingOverlay?.color || '#10b981'} onChange={handleInputChange} className="w-full h-12 bg-zinc-100/50 border border-black/5 rounded-xl p-1 cursor-pointer" />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Zap size={14} className="text-zinc-900" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Fondo</label>
                          <input type="color" name="bgColor" value={editingOverlay?.bgColor || '#18181b'} onChange={handleInputChange} className="w-full h-12 bg-zinc-100/50 border border-black/5 rounded-xl p-1 cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Texto</label>
                          <input type="color" name="textColor" value={editingOverlay?.textColor || '#ffffff'} onChange={handleInputChange} className="w-full h-12 bg-zinc-100/50 border border-black/5 rounded-xl p-1 cursor-pointer" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Animación</label>
                          <select 
                            name="animationType" 
                            value={editingOverlay?.animationType || 'slide-left'} 
                            onChange={handleInputChange}
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                          >
                            <option value="slide-left">Deslizar Izquierda</option>
                            <option value="slide-right">Deslizar Derecha</option>
                            <option value="fade">Desvanecer</option>
                            <option value="zoom">Zoom</option>
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Imagen de Fondo</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              name="bgImage" 
                              value={bgImageBase64 || editingOverlay?.bgImage || ''} 
                              onChange={handleInputChange} 
                              placeholder="https://ejemplo.com/imagen.jpg"
                              className="flex-1 bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            />
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <button type="button" className="h-full px-4 bg-zinc-100 border border-black/5 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2">
                                <Layers size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Subir</span>
                              </button>
                            </div>
                            {(bgImageBase64 || editingOverlay?.bgImage) && (
                              <button 
                                type="button" 
                                onClick={() => { setBgImageBase64(''); setEditingOverlay({ ...editingOverlay, bgImage: '' }); }}
                                className="h-full px-4 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Section: Typography */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-4 bg-purple-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tipografía</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Familia de Fuente</label>
                          <select 
                            name="fontFamily" 
                            value={editingOverlay?.fontFamily || 'sans'} 
                            onChange={handleInputChange}
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium appearance-none"
                          >
                            <option value="sans">Sans Serif (Moderno)</option>
                            <option value="serif">Serif (Elegante)</option>
                            <option value="mono">Monospace (Técnico)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Tamaño Título (px)</label>
                          <input 
                            type="number" 
                            name="fontSizeTitle" 
                            value={editingOverlay?.fontSizeTitle || 36} 
                            onChange={handleInputChange} 
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Tamaño Subtítulo (px)</label>
                          <input 
                            type="number" 
                            name="fontSizeSubtitle" 
                            value={editingOverlay?.fontSizeSubtitle || 20} 
                            onChange={handleInputChange} 
                            className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm" 
                          />
                        </div>
                      </div>
                    </section>

                    {/* Section: Text Positioning */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-4 bg-pink-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Ajuste de Texto</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Posición Título (Offset)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">Horizontal (X)</label>
                              <input type="number" name="titleX" value={editingOverlay?.titleX || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">Vertical (Y)</label>
                              <input type="number" name="titleY" value={editingOverlay?.titleY || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono text-sm" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Posición Subtítulo (Offset)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">Horizontal (X)</label>
                              <input type="number" name="subtitleX" value={editingOverlay?.subtitleX || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">Vertical (Y)</label>
                              <input type="number" name="subtitleY" value={editingOverlay?.subtitleY || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Alineación del Texto</label>
                        <div className="flex gap-2">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setEditingOverlay({ ...editingOverlay, textAlign: align as any })}
                              className={cn(
                                "flex-1 py-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                                editingOverlay?.textAlign === align 
                                  ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20" 
                                  : "bg-zinc-100/50 border-black/5 text-zinc-500 hover:bg-zinc-100"
                              )}
                            >
                              {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Section: Geometry */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Geometría y Posición</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Posición X (%)</label>
                          <input type="number" name="positionX" value={editingOverlay?.positionX || 5} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Posición Y (%)</label>
                          <input type="number" name="positionY" value={editingOverlay?.positionY || 85} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Ancho (px)</label>
                          <input type="number" name="width" value={editingOverlay?.width || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm" placeholder="Auto" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Alto (px)</label>
                          <input type="number" name="height" value={editingOverlay?.height || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm" placeholder="Auto" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Borde (px)</label>
                          <input type="number" name="borderRadius" value={editingOverlay?.borderRadius || 0} onChange={handleInputChange} className="w-full bg-zinc-100/50 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Rotación (°)</label>
                          <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{editingOverlay?.rotation || 0}°</span>
                        </div>
                        <input 
                          type="range" 
                          name="rotation" 
                          min="-180" 
                          max="180" 
                          value={editingOverlay?.rotation || 0} 
                          onChange={handleInputChange} 
                          className="w-full accent-amber-500" 
                        />
                      </div>
                    </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 bg-white pt-4 pb-8 border-t border-black/5 mt-auto z-20 -mx-8 px-8">
                      <div className="flex gap-4">
                        <button 
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 px-6 py-4 bg-zinc-100 hover:bg-zinc-200 border border-black/5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest text-zinc-500"
                        >
                          Descartar
                        </button>
                        <button 
                          type="submit"
                          className="flex-[2] px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-900 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20"
                        >
                          Guardar Configuración
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-100 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 text-center mb-2">¿Eliminar Overlay?</h3>
              <p className="text-zinc-500 text-center mb-6 text-sm">
                Esta acción no se puede deshacer. El overlay se eliminará permanentemente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-medium text-sm"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
