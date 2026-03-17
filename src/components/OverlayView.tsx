import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Overlay } from '../types';
import OverlayRenderer from './OverlayRenderer';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function OverlayView() {
  const [activeOverlays, setActiveOverlays] = useState<Overlay[]>([]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Set body background to transparent for OBS
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const targetRatio = 1920 / 1080;
      const currentRatio = width / height;

      if (currentRatio > targetRatio) {
        // Window is wider than 16:9
        setScale(height / 1080);
      } else {
        // Window is narrower than 16:9
        setScale(width / 1920);
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'overlays'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOverlays = snapshot.docs.map(doc => ({ ...doc.data() } as Overlay));
      setActiveOverlays(allOverlays.filter(o => o.active));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'overlays');
    });

    return () => unsubscribe();
  }, []);

  const getAnimationVariants = (type: string) => {
    switch (type) {
      case 'slide-right':
        return { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 100, opacity: 0 } };
      case 'fade':
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
      case 'zoom':
        return { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 } };
      case 'slide-left':
      default:
        return { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } };
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent">
      <div 
        style={{ 
          width: '1920px', 
          height: '1080px', 
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          backgroundColor: 'transparent'
        }}
      >
        <AnimatePresence>
          {activeOverlays.map((overlay) => (
            <motion.div
              key={overlay.id}
              {...getAnimationVariants(overlay.animationType)}
              transition={{ type: 'spring', damping: 25, stiffness: 80 }}
              className="absolute inset-0 pointer-events-none"
            >
              <OverlayRenderer overlay={overlay} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
