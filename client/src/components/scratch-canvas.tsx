import { useRef, useEffect, useState, useCallback } from 'react';

interface ScratchCanvasProps {
  width: number;
  height: number;
  scratchRadius: number;
  onScratchComplete: () => void;
  symbols: string[];
  isRevealed: boolean;
}

export function ScratchCanvas({ 
  width, 
  height, 
  scratchRadius, 
  onScratchComplete, 
  symbols,
  isRevealed 
}: ScratchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Initialize canvas with scratch overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Create gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4B0082');
    gradient.addColorStop(0.5, '#6A0DAD');
    gradient.addColorStop(1, '#8A2BE2');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add scratch-off text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE', width / 2, height / 2 - 10);
    ctx.font = '12px Orbitron';
    ctx.fillText('to reveal symbols', width / 2, height / 2 + 10);
  }, [width, height]);

  // Calculate scratched percentage
  const calculateScratchedPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = pixels.length / 4;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    return (transparentPixels / totalPixels) * 100;
  }, [width, height]);

  // Scratch function
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, scratchRadius, 0, 2 * Math.PI);
    ctx.fill();

    const percentage = calculateScratchedPercentage();
    setScratchedPercentage(percentage);

    if (percentage >= 60 && !hasCompleted) {
      setHasCompleted(true);
      onScratchComplete();
    }
  }, [scratchRadius, calculateScratchedPercentage, onScratchComplete, hasCompleted]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isRevealed) return;
    setIsScratching(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [scratch, isRevealed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isScratching || isRevealed) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [isScratching, scratch, isRevealed]);

  const handleMouseUp = useCallback(() => {
    setIsScratching(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRevealed) return;
    e.preventDefault();
    setIsScratching(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (rect && touch) {
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  }, [scratch, isRevealed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isScratching || isRevealed) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (rect && touch) {
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  }, [isScratching, scratch, isRevealed]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(false);
  }, []);

  return (
    <div className="relative">
      {/* Background symbols */}
      <div 
        className="absolute inset-0 flex items-center justify-center space-x-4 bg-gradient-to-br from-dark-purple to-deep-space rounded-lg border-2 border-neon-gold"
        style={{ width, height }}
      >
        {symbols.map((symbol, index) => (
          <div 
            key={index}
            className="text-4xl font-bold animate-pulse"
            style={{
              color: symbol === symbols[0] && symbol === symbols[1] && symbol === symbols[2] 
                ? '#00FF88' // Success green for matching symbols
                : '#FFD700' // Gold for non-matching
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Scratch canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          width, 
          height,
          opacity: isRevealed ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* Progress indicator */}
      {scratchedPercentage > 0 && scratchedPercentage < 60 && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/50 rounded-full px-3 py-1 text-xs text-neon-cyan">
            Scratched: {Math.round(scratchedPercentage)}% (need 60%)
          </div>
        </div>
      )}
    </div>
  );
}