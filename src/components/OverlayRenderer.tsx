import { motion } from 'motion/react';
import { Overlay } from '../types';
import { cn } from '../lib/utils';

interface OverlayRendererProps {
  overlay: Partial<Overlay>;
  isPreview?: boolean;
}

export default function OverlayRenderer({ overlay, isPreview = false }: OverlayRendererProps) {
  const getFontFamily = (family?: string) => {
    switch (family) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  if (!overlay) return null;

  return (
    <div 
      className={cn(
        "absolute",
        getFontFamily(overlay.fontFamily),
        overlay.layoutType === 'ticker' ? "w-full left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0" : "shadow-2xl shadow-black/50"
      )}
      style={{ 
        left: overlay.layoutType === 'ticker' ? '0' : `${overlay.positionX}%`, 
        top: overlay.layoutType === 'ticker' ? 'auto' : `${overlay.positionY}%`,
        bottom: overlay.layoutType === 'ticker' ? '0' : 'auto',
        transform: overlay.layoutType === 'ticker' 
          ? `rotate(${overlay.rotation || 0}deg)` 
          : `translate(-50%, -50%) rotate(${overlay.rotation || 0}deg)`
      }}
    >
      {(!overlay.layoutType || overlay.layoutType === 'standard') && (
        <div className="flex items-stretch">
          <div 
            className="w-3" 
            style={{ 
              backgroundColor: overlay.color,
              borderTopLeftRadius: `${overlay.borderRadius}px`,
              borderBottomLeftRadius: `${overlay.borderRadius}px`,
              height: overlay.height ? `${overlay.height}px` : 'auto'
            }} 
          />
          <div 
            className="p-8 pr-16 border border-white/10 backdrop-blur-2xl bg-cover bg-center bg-no-repeat glass-dark"
            style={{ 
              backgroundColor: overlay.bgColor + 'cc',
              backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
              borderTopRightRadius: `${overlay.borderRadius}px`,
              borderBottomRightRadius: `${overlay.borderRadius}px`,
              width: overlay.width ? `${overlay.width}px` : 'auto',
              height: overlay.height ? `${overlay.height}px` : 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h1 
              className="font-display font-bold tracking-tight leading-none mb-2 text-glow"
              style={{ 
                fontSize: `${overlay.fontSizeTitle || 36}px`,
                color: overlay.textColor,
                transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
                textAlign: overlay.textAlign || 'left'
              }}
            >
              {overlay.title || 'Título del Overlay'}
            </h1>
            <p 
              className="font-medium opacity-60 uppercase tracking-[0.2em]"
              style={{ 
                fontSize: `${overlay.fontSizeSubtitle || 20}px`,
                color: overlay.textColor,
                transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
                textAlign: overlay.textAlign || 'left'
              }}
            >
              {overlay.subtitle || 'Subtítulo o información adicional'}
            </p>
          </div>
          <div 
            className="absolute -bottom-1 left-0 right-0 h-1.5 origin-left rounded-full"
            style={{ backgroundColor: overlay.color }}
          />
        </div>
      )}

      {overlay.layoutType === 'live-title' && (
        <div 
          className="flex flex-col items-start gap-4 p-6 bg-cover bg-center bg-no-repeat"
          style={{ 
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : 'auto',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto',
            justifyContent: 'center',
            borderRadius: `${overlay.borderRadius}px`,
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
            backgroundColor: overlay.bgImage ? 'transparent' : (overlay.bgColor ? overlay.bgColor + '44' : 'transparent')
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="px-4 py-1 rounded-full flex items-center gap-2 animate-pulse"
              style={{ backgroundColor: overlay.color }}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">LIVE</span>
            </div>
            {overlay.subtitle && (
              <div className="h-[1px] w-12 bg-white/20" />
            )}
            <span 
              className="text-[10px] font-bold tracking-[0.3em] opacity-50 uppercase"
              style={{ 
                color: overlay.textColor,
                transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
                textAlign: overlay.textAlign || 'left',
                display: 'inline-block'
              }}
            >
              {overlay.subtitle}
            </span>
          </div>
          
          <div className="relative">
            <h1 
              className="font-display font-black tracking-tighter leading-[0.85] text-glow"
              style={{ 
                fontSize: `${overlay.fontSizeTitle || 72}px`,
                color: overlay.textColor,
                textTransform: overlay.styleVariant === 'uppercase' ? 'uppercase' : 'none',
                transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
                textAlign: overlay.textAlign || 'left'
              }}
            >
              {overlay.title || 'LIVE TITLE'}
            </h1>
            <div 
              className="absolute -bottom-4 left-0 w-24 h-2 rounded-full"
              style={{ backgroundColor: overlay.color }}
            />
          </div>
        </div>
      )}

      {overlay.layoutType === 'graft' && (
        <div 
          className={cn(
            "p-10 border border-white/10 backdrop-blur-3xl flex flex-col items-center text-center overflow-hidden relative transition-all duration-500 glass-dark bg-cover bg-center bg-no-repeat",
            overlay.styleVariant === 'outline' && "bg-transparent border-2",
            overlay.styleVariant === 'gradient' && "border-none"
          )}
          style={{ 
            backgroundColor: overlay.styleVariant === 'outline' ? 'transparent' : overlay.bgColor + 'dd',
            borderColor: overlay.color,
            borderRadius: `${overlay.borderRadius}px`,
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : '450px',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto',
            backgroundImage: overlay.styleVariant === 'gradient' 
              ? `linear-gradient(135deg, ${overlay.bgColor}, ${overlay.color}44)` 
              : (overlay.bgImage ? `url(${overlay.bgImage})` : 'none'),
            backgroundSize: 'cover',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {overlay.styleVariant !== 'gradient' && (
            <>
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: overlay.color }} />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: overlay.color }} />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: overlay.color }} />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: overlay.color }} />
            </>
          )}

          <h1 
            className={cn(
              "font-display font-black mb-4 transition-all text-glow",
              overlay.styleVariant === 'bold-caps' && "uppercase tracking-[0.3em]",
              overlay.styleVariant === 'italic-serif' && "italic font-serif normal-case tracking-normal",
              overlay.styleVariant === 'outline' && "text-transparent [-webkit-text-stroke:1px_white]"
            )}
            style={{ 
              fontSize: `${overlay.fontSizeTitle || 48}px`, 
              color: overlay.styleVariant === 'outline' ? 'transparent' : overlay.textColor,
              transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
              textAlign: overlay.textAlign || 'center'
            }}
          >
            {overlay.title || 'Título del Overlay'}
          </h1>
          <div className="h-[1px] w-full max-w-[60px] mb-6 bg-white/20" />
          <p 
            className={cn(
              "font-medium tracking-[0.2em] opacity-60 uppercase",
              overlay.styleVariant === 'italic-serif' && "font-serif italic normal-case tracking-normal text-base",
            )}
            style={{ 
              fontSize: `${overlay.fontSizeSubtitle || 16}px`,
              color: overlay.textColor,
              transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
              textAlign: overlay.textAlign || 'center'
            }}
          >
            {overlay.subtitle || 'Subtítulo o información adicional'}
          </p>
        </div>
      )}

      {overlay.layoutType === 'minimal' && (
        <div 
          className="flex flex-col p-4 bg-cover bg-center bg-no-repeat"
          style={{
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : 'auto',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto',
            justifyContent: 'center',
            borderRadius: `${overlay.borderRadius}px`,
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
            backgroundColor: overlay.bgImage ? 'transparent' : 'transparent'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 rounded-full" style={{ backgroundColor: overlay.color }} />
            <div>
              <h1 
                className="font-bold tracking-tight leading-tight"
                style={{ 
                  fontSize: `${overlay.fontSizeTitle || 24}px`, 
                  color: overlay.textColor,
                  transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
                  textAlign: overlay.textAlign || 'left'
                }}
              >
                {overlay.title || 'Título del Overlay'}
              </h1>
              <p 
                className="font-medium opacity-70"
                style={{ 
                  fontSize: `${overlay.fontSizeSubtitle || 14}px`, 
                  color: overlay.textColor,
                  transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
                  textAlign: overlay.textAlign || 'left'
                }}
              >
                {overlay.subtitle || 'Subtítulo o información adicional'}
              </p>
            </div>
          </div>
        </div>
      )}

      {overlay.layoutType === 'sports-scoreboard' && (
        <div 
          className="flex flex-col overflow-hidden shadow-2xl bg-cover bg-center bg-no-repeat"
          style={{ 
            borderRadius: `${overlay.borderRadius}px`,
            backgroundColor: overlay.bgColor + 'ee',
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
            color: overlay.textColor,
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : 'auto',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto'
          }}
        >
          <div 
            className="px-6 py-2 text-center font-bold tracking-widest uppercase text-sm"
            style={{ 
              backgroundColor: overlay.color,
              transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`
            }}
          >
            {overlay.title || 'SCOREBOARD'}
          </div>
          <div className="flex items-center justify-between px-8 py-6 bg-black/40 backdrop-blur-md">
            <div className="flex flex-col items-center gap-2 w-32">
              <span className="text-3xl font-black tracking-wider">{overlay.customData?.teamA || 'HOME'}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-6xl font-black" style={{ fontSize: `${overlay.fontSizeTitle}px` }}>{overlay.customData?.scoreA || 0}</span>
              <span className="text-2xl font-bold text-white/50">-</span>
              <span className="text-6xl font-black" style={{ fontSize: `${overlay.fontSizeTitle}px` }}>{overlay.customData?.scoreB || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-32">
              <span className="text-3xl font-black tracking-wider">{overlay.customData?.teamB || 'AWAY'}</span>
            </div>
          </div>
          <div 
            className="px-6 py-2 text-center font-medium text-white/70 bg-black/60 text-sm tracking-widest uppercase"
            style={{
              transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
              textAlign: overlay.textAlign || 'center'
            }}
          >
            {overlay.customData?.period || overlay.subtitle || '1ST QTR'}
          </div>
        </div>
      )}

      {overlay.layoutType === 'social-popup' && (
        <div 
          className="flex items-center gap-4 py-3 px-4 pr-8 shadow-2xl backdrop-blur-xl bg-cover bg-center bg-no-repeat"
          style={{ 
            borderRadius: `${overlay.borderRadius}px`,
            backgroundColor: overlay.bgColor + 'ee',
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
            color: overlay.textColor,
            borderLeft: `6px solid ${overlay.color}`,
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : 'auto',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto'
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: overlay.color }}
          >
            {overlay.customData?.platform === 'twitter' ? '𝕏' : 
             overlay.customData?.platform === 'instagram' ? 'IG' : 
             overlay.customData?.platform === 'youtube' ? 'YT' : 
             overlay.customData?.platform === 'twitch' ? 'TW' : 
             overlay.customData?.platform === 'tiktok' ? 'TK' : '@'}
          </div>
          <div className="flex flex-col justify-center">
            <span 
              className="font-bold tracking-wide" 
              style={{ 
                fontSize: `${overlay.fontSizeTitle}px`,
                transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
                textAlign: overlay.textAlign || 'left'
              }}
            >
              {overlay.customData?.handle || overlay.title || '@username'}
            </span>
            {(overlay.customData?.message || overlay.subtitle) && (
              <span 
                className="opacity-80" 
                style={{ 
                  fontSize: `${overlay.fontSizeSubtitle}px`,
                  transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
                  textAlign: overlay.textAlign || 'left'
                }}
              >
                {overlay.customData?.message || overlay.subtitle}
              </span>
            )}
          </div>
        </div>
      )}

      {overlay.layoutType === 'ticker' && (
        <div 
          className={cn(
            "w-full flex items-center px-12 py-6 border-t border-white/10 glass-dark shadow-[0_-20px_80px_rgba(0,0,0,0.8)] transition-all duration-500 bg-cover bg-center bg-no-repeat",
            overlay.styleVariant === 'breaking' && "bg-red-900/90 border-yellow-500/50",
            overlay.styleVariant === 'sports' && "bg-blue-900/90 border-white/20",
            overlay.styleVariant === 'news' && "bg-zinc-900/90 border-red-600/50",
            overlay.styleVariant === 'premium' && "bg-black/90 border-amber-500/50 shadow-[0_-10px_50px_rgba(245,158,11,0.2)]",
            overlay.styleVariant === 'minimalista' && "bg-zinc-950/20 backdrop-blur-3xl border-t border-white/5 shadow-none"
          )}
          style={{ 
            backgroundColor: overlay.styleVariant === 'default' ? overlay.bgColor + 'ee' : undefined,
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : undefined,
            borderColor: overlay.styleVariant === 'default' ? overlay.color + '88' : undefined,
            color: overlay.textColor,
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : 'auto',
            borderRadius: `${overlay.borderRadius}px`
          }}
        >
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full animate-blink",
                  overlay.styleVariant === 'breaking' && "bg-white",
                  overlay.styleVariant === 'premium' && "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]",
                  overlay.styleVariant === 'minimalista' && "bg-zinc-500"
                )} 
                style={{ backgroundColor: overlay.styleVariant === 'default' ? overlay.color : undefined }} 
              />
              <span 
                className={cn(
                  "font-display font-black uppercase tracking-[0.3em] text-[10px]",
                  overlay.styleVariant === 'premium' && "text-amber-500"
                )}
                style={{ color: (overlay.styleVariant === 'default') ? overlay.color : (overlay.styleVariant === 'premium' ? undefined : 'white') }}
              >
                {overlay.styleVariant === 'breaking' ? 'URGENTE' : 
                 overlay.styleVariant === 'sports' ? 'DEPORTES' : 
                 overlay.styleVariant === 'premium' ? 'PREMIUM' : 
                 overlay.styleVariant === 'minimalista' ? 'LIVE' : 'INFO'}
              </span>
            </div>
            <h1 className={cn(
              "font-display font-bold whitespace-nowrap uppercase italic tracking-tight text-glow",
              overlay.styleVariant === 'premium' && "tracking-widest"
            )} style={{ 
              fontSize: `${overlay.fontSizeTitle || 24}px`,
              transform: `translate(${overlay.titleX || 0}px, ${overlay.titleY || 0}px)`,
              textAlign: overlay.textAlign || 'left'
            }}>
              {overlay.title || 'TÍTULO DEL OVERLAY'}
            </h1>
            <div className="h-6 w-[1px] bg-white/10" />
            <p className="font-medium whitespace-nowrap opacity-50 uppercase tracking-[0.2em]" style={{ 
              fontSize: `${overlay.fontSizeSubtitle || 14}px`,
              transform: `translate(${overlay.subtitleX || 0}px, ${overlay.subtitleY || 0}px)`,
              textAlign: overlay.textAlign || 'left'
            }}>
              {overlay.subtitle || 'SUBTÍTULO O INFORMACIÓN'}
            </p>
          </div>
        </div>
      )}
      {overlay.layoutType === 'background-only' && (
        <div 
          className="bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{ 
            width: overlay.width && overlay.width > 0 ? `${overlay.width}px` : '1920px',
            height: overlay.height && overlay.height > 0 ? `${overlay.height}px` : '1080px',
            borderRadius: `${overlay.borderRadius || 0}px`,
            backgroundImage: overlay.bgImage ? `url(${overlay.bgImage})` : 'none',
            backgroundColor: overlay.bgColor || 'transparent',
            opacity: overlay.styleVariant === 'overlay' ? 0.5 : 1,
            boxShadow: overlay.styleVariant === 'glow' ? `0 0 50px ${overlay.color}44` : 'none',
            border: overlay.styleVariant === 'border' ? `4px solid ${overlay.color}` : 'none'
          }}
        />
      )}
    </div>
  );
}
