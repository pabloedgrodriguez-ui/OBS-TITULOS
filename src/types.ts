export interface Overlay {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  color: string;
  active: boolean;
  // New properties
  fontSizeTitle: number;
  fontSizeSubtitle: number;
  bgColor: string;
  textColor: string;
  positionX: number;
  positionY: number;
  animationType: 'slide-left' | 'slide-right' | 'fade' | 'zoom';
  layoutType: 'standard' | 'graft' | 'minimal' | 'ticker' | 'sports-scoreboard' | 'social-popup' | 'live-title';
  styleVariant: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: number;
  width: number;
  height: number;
  rotation: number;
  bgImage: string;
  shortcut?: string;
  customData?: Record<string, any>;
  // Text positioning
  titleX?: number;
  titleY?: number;
  subtitleX?: number;
  subtitleY?: number;
  textAlign?: 'left' | 'center' | 'right';
}
