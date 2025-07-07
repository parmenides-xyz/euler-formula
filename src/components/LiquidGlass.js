import React, { useEffect, useRef } from 'react';

const LiquidGlass = ({ width = 300, height = 200, className = "" }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !svgRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Mouse tracking
    let mouse = { x: 0, y: 0 };
    let mouseUsed = false;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
      mouseUsed = true;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Shader-like functions
    const smoothStep = (a, b, t) => {
      t = Math.max(0, Math.min(1, (t - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const length = (x, y) => Math.sqrt(x * x + y * y);

    const roundedRectSDF = (x, y, width, height, radius) => {
      const qx = Math.abs(x) - width + radius;
      const qy = Math.abs(y) - height + radius;
      return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius;
    };

    const fragment = (uv, mouse) => {
      const ix = uv.x - 0.5;
      const iy = uv.y - 0.5;
      
      // Add mouse interaction
      const mouseInfluence = mouseUsed ? 
        smoothStep(0.3, 0, length(ix - (mouse.x - 0.5), iy - (mouse.y - 0.5))) : 0;
      
      const distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
      const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15) + mouseInfluence * 0.1;
      const scaled = smoothStep(0, 1, displacement);
      
      return {
        x: ix * scaled + 0.5,
        y: iy * scaled + 0.5
      };
    };

    const updateShader = () => {
      const data = new Uint8ClampedArray(width * height * 4);
      let maxScale = 0;
      const rawValues = [];

      // Generate displacement map
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        const pos = fragment({ x: x / width, y: y / height }, mouse);
        const dx = pos.x * width - x;
        const dy = pos.y * height - y;
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }

      maxScale *= 0.5;

      // Apply displacement values
      let index = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = rawValues[index++] / maxScale + 0.5;
        const g = rawValues[index++] / maxScale + 0.5;
        data[i] = r * 255;
        data[i + 1] = g * 255;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      ctx.putImageData(new ImageData(data, width, height), 0, 0);
      
      // Update SVG filter
      const feImage = svg.querySelector('feImage');
      const feDisplacementMap = svg.querySelector('feDisplacementMap');
      
      if (feImage && feDisplacementMap) {
        feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL());
        feDisplacementMap.setAttribute('scale', (maxScale / 1).toString());
      }
    };

    // Animation loop
    const animate = () => {
      updateShader();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  const filterId = `liquid-glass-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="0"
        height="0"
        className="absolute"
      >
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width={width}
            height={height}
          >
            <feImage
              id={`${filterId}_map`}
              width={width}
              height={height}
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2={`${filterId}_map`}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      
      <div
        ref={containerRef}
        className="overflow-hidden rounded-[150px] shadow-lg cursor-pointer"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backdropFilter: `url(#${filterId}) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)`,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 -10px 25px inset rgba(0, 0, 0, 0.15)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default LiquidGlass;