import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Environment, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Highly optimized 3D Candlestick Chart
 * Exact colors and proportions matched from the provided screenshot.
 * Ultra-smooth animation using direct ref manipulation.
 */

const COLORS = {
  bullish: '#9bc2b5', // Specific soft mint teal from screenshot
  bearish: '#1d2328', // Deep charcoal navy from screenshot
  wick: '#d1d5db',    // Very light grey for wicks
  grid: '#f1f5f9',    
  background: '#ffffff'
};

const SETTINGS = {
  spacing: 1.2,        // Wider spacing for professional look
  candleWidth: 0.5,     // Thicker bodies as seen in screenshot
  wickWidth: 0.015,     // Thin but visible wicks
  formationSpeed: 1.8,  // Seconds per candle
  volatility: 0.4,      // More movement range
  cameraLerp: 0.04,     // Buttery smooth tracking
  scaleMultiplier: 0.8  // Overall height scale for "bigger" candles
};

// --- Static Candle Component (Memoized) ---
const Candle = React.memo(({ data, x }: { data: any; x: number }) => {
  const isBullish = data.close >= data.open;
  const color = isBullish ? COLORS.bullish : COLORS.bearish;
  
  const bodyHeight = Math.max(0.1, Math.abs(data.close - data.open) * SETTINGS.scaleMultiplier);
  const bodyY = ((data.open + data.close) / 2 - 50) * SETTINGS.scaleMultiplier;
  const wickHeight = Math.abs(data.high - data.low) * SETTINGS.scaleMultiplier;
  const wickY = ((data.high + data.low) / 2 - 50) * SETTINGS.scaleMultiplier;

  return (
    <group position={[x, 0, 0]}>
      {/* Wick */}
      <mesh position={[0, wickY, 0]}>
        <cylinderGeometry args={[SETTINGS.wickWidth, SETTINGS.wickWidth, wickHeight, 8]} />
        <meshBasicMaterial color={COLORS.wick} transparent opacity={0.6} />
      </mesh>
      {/* Body */}
      <mesh position={[0, bodyY, 0]}>
        <boxGeometry args={[SETTINGS.candleWidth, bodyHeight, SETTINGS.candleWidth]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1}
        />
      </mesh>
    </group>
  );
});

// --- Active Forming Candle (60fps direct update) ---
function ActiveCandle({ x, openPrice, onUpdate }: { x: number, openPrice: number, onUpdate: (data: any) => void }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const wickRef = useRef<THREE.Mesh>(null);
  const currentData = useRef({ open: openPrice, close: openPrice, high: openPrice, low: openPrice });
  
  useFrame((state) => {
    // Smoother price fluctuation with slightly more range
    const noise = (Math.random() - 0.5) * SETTINGS.volatility;
    currentData.current.close = THREE.MathUtils.lerp(currentData.current.close, currentData.current.close + noise, 0.15);
    
    // Ensure high/low cover the movement
    currentData.current.high = Math.max(currentData.current.high, currentData.current.close, currentData.current.open + 0.1);
    currentData.current.low = Math.min(currentData.current.low, currentData.current.close, currentData.current.open - 0.1);

    const { open, close, high, low } = currentData.current;
    const isBullish = close >= open;
    
    if (bodyRef.current && wickRef.current) {
      const bodyHeight = Math.max(0.05, Math.abs(close - open) * SETTINGS.scaleMultiplier);
      const bodyY = ((open + close) / 2 - 50) * SETTINGS.scaleMultiplier;
      const wickHeight = Math.abs(high - low) * SETTINGS.scaleMultiplier;
      const wickY = ((high + low) / 2 - 50) * SETTINGS.scaleMultiplier;

      // Update geometry scaling and position directly
      bodyRef.current.scale.set(1, bodyHeight, 1);
      bodyRef.current.position.y = bodyY;
      (bodyRef.current.material as THREE.MeshStandardMaterial).color.set(isBullish ? COLORS.bullish : COLORS.bearish);

      wickRef.current.scale.set(1, wickHeight, 1);
      wickRef.current.position.y = wickY;
    }
    
    onUpdate(currentData.current);
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={wickRef}>
        <cylinderGeometry args={[SETTINGS.wickWidth, SETTINGS.wickWidth, 1, 8]} />
        <meshBasicMaterial color={COLORS.wick} transparent opacity={0.6} />
      </mesh>
      <mesh ref={bodyRef}>
        <boxGeometry args={[SETTINGS.candleWidth, 1, SETTINGS.candleWidth]} />
        <meshStandardMaterial color={COLORS.bullish} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ChartScene() {
  const [history, setHistory] = useState<any[]>([]);
  const [activeOpen, setActiveOpen] = useState(50);
  const lastActiveData = useRef({ open: 50, close: 50, high: 50, low: 50 });
  const containerRef = useRef<THREE.Group>(null);
  const lastFormationTime = useRef(0);

  useEffect(() => {
    let prev = 50;
    const initial = Array.from({ length: 35 }, (_, i) => {
      const open = prev;
      const close = open + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 8;
      const low = Math.min(open, close) - Math.random() * 8;
      prev = close;
      return { id: i, open, close, high, low };
    });
    setHistory(initial);
    setActiveOpen(prev);
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (containerRef.current) {
      // Adjusted targetX to center the view better
      const targetX = -(history.length) * SETTINGS.spacing + 8;
      containerRef.current.position.x = THREE.MathUtils.lerp(containerRef.current.position.x, targetX, SETTINGS.cameraLerp);
    }

    if (time - lastFormationTime.current > SETTINGS.formationSpeed) {
      lastFormationTime.current = time;
      setHistory(prev => {
        const next = [...prev, { ...lastActiveData.current, id: Date.now() }];
        if (next.length > 50) next.shift();
        setActiveOpen(lastActiveData.current.close);
        return next;
      });
    }
  });

  return (
    <group ref={containerRef}>
      {history.map((d, i) => (
        <Candle key={d.id} data={d} x={i * SETTINGS.spacing} />
      ))}
      <ActiveCandle 
        key={activeOpen} 
        x={history.length * SETTINGS.spacing} 
        openPrice={activeOpen}
        onUpdate={(data) => { lastActiveData.current = data; }}
      />
    </group>
  );
}

export default function App() {
  return (
    <div className="w-full h-screen bg-white">
      <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
        {/* Adjusted camera for "bigger" look */}
        <PerspectiveCamera makeDefault position={[0, 4, 35]} fov={18} />
        <color attach="background" args={[COLORS.background]} />
        
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        <pointLight position={[-20, 10, -10]} intensity={0.4} color={COLORS.bullish} />

        <ChartScene />

        {/* Clean Minimalist Floor with subtle reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -18, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <MeshReflectorMaterial
            blur={[300, 50]}
            resolution={1024}
            mixBlur={1}
            mixStrength={10}
            roughness={1}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#ffffff"
            metalness={0.05}
          />
        </mesh>

        {/* Subtle Background Grid */}
        <gridHelper args={[200, 80, '#f8fafc', '#f8fafc']} position={[0, -17.95, 0]} />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
