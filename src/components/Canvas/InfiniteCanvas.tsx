// components/Canvas/InfiniteCanvas.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
import { Home, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'shape' | 'text';
  x: number;
  y: number;
  // Add more properties as needed for your elements
}

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [elements] = useState<CanvasElement[]>([]);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  
  // Base grid size that will be adjusted with zoom level
  const baseGridSize = 20;
  
  // Calculate effective grid size based on zoom
  const effectiveGridSize = baseGridSize * (scale >= 1 ? 1 : scale >= 0.5 ? 2 : 4);
  
  // Calculate visibility of different grid levels
  const showMainGrid = scale >= 0.5;
  const showSecondaryGrid = scale >= 2;
  
  // Handle zoom to a specific level
  const handleZoom = useCallback((newScale: number) => {
    setScale(Math.min(Math.max(0.1, newScale), 5));
  }, []);
  
  // Reset the view to center
  const resetView = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  }, []);
  
  // Handle panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button or pan tool with left click
      if (e.button === 1 || (tool === 'pan' && e.button === 0)) {
        e.preventDefault();
        setIsDragging(true);
        setStartDragPosition({ x: e.clientX, y: e.clientY });
        canvas.style.cursor = 'grabbing';
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startDragPosition.x;
      const dy = e.clientY - startDragPosition.y;
      
      setOffset(prevOffset => ({
        x: prevOffset.x - dx,
        y: prevOffset.y - dy
      }));
      
      setStartDragPosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && (e.button === 1 || (tool === 'pan' && e.button === 0))) {
        setIsDragging(false);
        canvas.style.cursor = tool === 'pan' ? 'grab' : 'default';
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // Calculate zoom centered on mouse position
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Current position in canvas coordinates
        const pointXBeforeZoom = (mouseX - offset.x) / scale;
        const pointYBeforeZoom = (mouseY - offset.y) / scale;
        
        // Apply new scale
        const newScale = Math.min(Math.max(0.1, scale * scaleFactor), 5);
        setScale(newScale);
        
        // Calculate new offset to keep point under mouse
        const newOffsetX = mouseX - pointXBeforeZoom * newScale;
        const newOffsetY = mouseY - pointYBeforeZoom * newScale;
        
        setOffset({
          x: newOffsetX,
          y: newOffsetY
        });
      }
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Clean up event listeners
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, startDragPosition, tool, scale]);
  
  // Update cursor based on selected tool
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = tool === 'pan' ? 'grab' : 'default';
    }
  }, [tool]);
  
  // Calculate canvas center point
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
  
  // Calculate grid background position based on offset and scale
  const gridXOffset = ((offset.x % (effectiveGridSize)) / scale);
  const gridYOffset = ((offset.y % (effectiveGridSize)) / scale);
  
  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative">
      {/* Main canvas area */}
      <div 
        ref={canvasRef}
        className="w-full h-full relative"
        style={{
          touchAction: 'none', // Prevent default touch actions for better control
        }}
      >
        {/* Primary grid layer */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: showMainGrid ? `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            ` : 'none',
            backgroundSize: `${effectiveGridSize}px ${effectiveGridSize}px`,
            backgroundPosition: `${gridXOffset}px ${gridYOffset}px`,
            opacity: 0.6,
          }}
        />
        
        {/* Secondary grid layer (visible at higher zoom levels) */}
        {showSecondaryGrid && (
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
              `,
              backgroundSize: `${effectiveGridSize * 5}px ${effectiveGridSize * 5}px`,
              backgroundPosition: `${gridXOffset}px ${gridYOffset}px`,
              opacity: 0.8,
            }}
          />
        )}
        
        {/* Content layer for canvas elements */}
        <div 
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Origin point indicator */}
          <div className="absolute" style={{ left: centerX - offset.x, top: centerY - offset.y }}>
            <div className="w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Render your custom elements here */}
          {elements.map(element => (
            <div
              key={element.id}
              className="absolute bg-white border border-gray-300 rounded-md p-2"
              style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
              }}
            >
              {/* Render different element types */}
              {element.type === 'text' ? (
                <div>Text Element</div>
              ) : (
                <div className="w-16 h-16 bg-gray-100"></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-md shadow-md flex items-center space-x-2 z-10">
        <Button
          variant={tool === 'select' ? "default" : "outline"}
          size="sm"
          onClick={() => setTool('select')}
          title="Select Tool"
        >
          Select
        </Button>
        
        <Button
          variant={tool === 'pan' ? "default" : "outline"}
          size="sm"
          onClick={() => setTool('pan')}
          title="Pan Tool"
        >
          <Move className="h-4 w-4" />
        </Button>
        
        <div className="h-8 border-l border-gray-300 mx-2" />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(scale * 0.8)}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium w-16 text-center">
          {Math.round(scale * 100)}%
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(scale * 1.2)}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="h-8 border-l border-gray-300 mx-2" />
        
        <Button
          variant="outline"
          size="sm"
          onClick={resetView}
          title="Reset View"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-md shadow-md text-sm text-gray-600">
        {/* <div>Middle-click + drag or use Pan tool to move around</div>
        <div>Ctrl + scroll to zoom in/out</div> */}
      </div>
    </div>
  );
}

// pages/index.tsx
