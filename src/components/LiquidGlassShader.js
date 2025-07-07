import { useEffect, useRef } from 'react';

export const useLiquidGlass = (options = {}) => {
  const containerRef = useRef(null);
  const shaderInstanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Utility functions
    function smoothStep(a, b, t) {
      t = Math.max(0, Math.min(1, (t - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    function length(x, y) {
      return Math.sqrt(x * x + y * y);
    }

    function roundedRectSDF(x, y, width, height, radius) {
      const qx = Math.abs(x) - width + radius;
      const qy = Math.abs(y) - height + radius;
      return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius;
    }

    function texture(x, y) {
      return { type: 't', x, y };
    }

    function generateId() {
      return 'liquid-glass-' + Math.random().toString(36).substr(2, 9);
    }

    class Shader {
      constructor(opts = {}) {
        this.width = opts.width || 400;
        this.height = opts.height || 300;
        this.fragment = opts.fragment || ((uv) => texture(uv.x, uv.y));
        this.canvasDPI = window.devicePixelRatio || 1;
        this.id = generateId();
        this.container = opts.container;
        
        this.mouse = { x: 0, y: 0 };
        this.mouseUsed = false;
        
        this.createElement();
        this.setupEventListeners();
        this.updateShader();
      }

      createElement() {
        // Apply liquid glass styles to existing container
        if (this.container) {
          this.container.style.backdropFilter = `url(#${this.id}_filter) blur(0.5px) contrast(1.3) brightness(1.1) saturate(1.2)`;
          this.container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          this.container.style.boxShadow = `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `;
        }

        // Create SVG filter
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        this.svg.setAttribute('width', '0');
        this.svg.setAttribute('height', '0');
        this.svg.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: -1;
        `;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', `${this.id}_filter`);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('colorInterpolationFilters', 'sRGB');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', this.width.toString());
        filter.setAttribute('height', this.height.toString());

        this.feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage');
        this.feImage.setAttribute('id', `${this.id}_map`);
        this.feImage.setAttribute('width', this.width.toString());
        this.feImage.setAttribute('height', this.height.toString());

        this.feDisplacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
        this.feDisplacementMap.setAttribute('in', 'SourceGraphic');
        this.feDisplacementMap.setAttribute('in2', `${this.id}_map`);
        this.feDisplacementMap.setAttribute('xChannelSelector', 'R');
        this.feDisplacementMap.setAttribute('yChannelSelector', 'G');

        filter.appendChild(this.feImage);
        filter.appendChild(this.feDisplacementMap);
        defs.appendChild(filter);
        this.svg.appendChild(defs);

        // Create canvas for displacement map
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.canvasDPI;
        this.canvas.height = this.height * this.canvasDPI;
        this.canvas.style.display = 'none';
        this.context = this.canvas.getContext('2d');

        // Append to document
        document.body.appendChild(this.svg);
        document.body.appendChild(this.canvas);
      }

      setupEventListeners() {
        if (!this.container) return;

        const handleMouseMove = (e) => {
          const rect = this.container.getBoundingClientRect();
          this.mouse.x = (e.clientX - rect.left) / rect.width;
          this.mouse.y = (e.clientY - rect.top) / rect.height;
          
          if (this.mouseUsed) {
            this.updateShader();
          }
        };

        this.container.addEventListener('mousemove', handleMouseMove);
        
        // Store cleanup function
        this.cleanup = () => {
          this.container.removeEventListener('mousemove', handleMouseMove);
        };
      }

      updateShader() {
        const mouseProxy = new Proxy(this.mouse, {
          get: (target, prop) => {
            this.mouseUsed = true;
            return target[prop];
          }
        });

        this.mouseUsed = false;

        const w = this.width * this.canvasDPI;
        const h = this.height * this.canvasDPI;
        const data = new Uint8ClampedArray(w * h * 4);

        let maxScale = 0;
        const rawValues = [];

        for (let i = 0; i < data.length; i += 4) {
          const x = (i / 4) % w;
          const y = Math.floor(i / 4 / w);
          const pos = this.fragment(
            { x: x / w, y: y / h },
            mouseProxy
          );
          const dx = pos.x * w - x;
          const dy = pos.y * h - y;
          maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
          rawValues.push(dx, dy);
        }

        maxScale *= 0.3; // Reduce intensity for subtlety

        let index = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = rawValues[index++] / maxScale + 0.5;
          const g = rawValues[index++] / maxScale + 0.5;
          data[i] = r * 255;
          data[i + 1] = g * 255;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }

        this.context.putImageData(new ImageData(data, w, h), 0, 0);
        this.feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.canvas.toDataURL());
        this.feDisplacementMap.setAttribute('scale', (maxScale / this.canvasDPI * 2).toString());
      }

      destroy() {
        if (this.cleanup) this.cleanup();
        if (this.svg) this.svg.remove();
        if (this.canvas) this.canvas.remove();
      }
    }

    // Create shader instance
    const rect = containerRef.current.getBoundingClientRect();
    const shader = new Shader({
      width: rect.width || options.width || 400,
      height: rect.height || options.height || 300,
      container: containerRef.current,
      fragment: options.fragment || ((uv, mouse) => {
        const ix = uv.x - 0.5;
        const iy = uv.y - 0.5;
        
        // Subtle wave effect
        const wave = Math.sin(uv.x * 10 + Date.now() * 0.001) * 0.01;
        const mouseInfluence = mouse ? 
          smoothStep(0.2, 0, length(ix - (mouse.x - 0.5), iy - (mouse.y - 0.5))) * 0.02 : 0;
        
        return texture(
          uv.x + wave + mouseInfluence,
          uv.y + wave * 0.5 + mouseInfluence * 0.5
        );
      })
    });

    shaderInstanceRef.current = shader;

    return () => {
      if (shaderInstanceRef.current) {
        shaderInstanceRef.current.destroy();
      }
    };
  }, [options.width, options.height]);

  return containerRef;
};