import React, { useRef, useEffect } from 'react';

interface ShaderBackgroundProps {
    theme?: string;
    subjectColor1?: string;
    subjectColor2?: string;
}

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    // OPTIMIZED: Much simpler movement math
    vec2 pos = st;
    pos.x += sin(u_time * 0.05 + pos.y) * 0.1; // Reduced complexity
    pos.y += cos(u_time * 0.06 + pos.x) * 0.1;

    // Single distance field instead of two for performance
    float d1 = length(pos - vec2(0.5, 0.5));
    
    // Mix colors based on distance and time
    vec3 color = mix(u_color1, u_color2, sin(d1 * 3.0 - u_time * 0.4) * 0.5 + 0.5);
    
    // Soften the aura
    float alpha = smoothstep(0.8, 0.2, d1);
    
    gl_FragColor = vec4(color, alpha * 0.45); // Increased alpha for better color visibility
  }
`;

export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({
    subjectColor1 = '#60a5fa',
    subjectColor2 = '#e879f9'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: false, // DISABLE ANTIALIAS FOR PERFORMANCE
            depth: false, // DISABLE DEPTH BUFFER
            stencil: false,
            powerPreference: 'high-performance'
        });

        if (!gl) return;

        // Compile shaders
        const vert = gl.createShader(gl.VERTEX_SHADER);
        if (!vert) return;
        gl.shaderSource(vert, vertexShaderSource);
        gl.compileShader(vert);

        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        if (!frag) return;
        gl.shaderSource(frag, fragmentShaderSource);
        gl.compileShader(frag);

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Buffer setup
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Uniforms
        const uAuthorization = gl.getUniformLocation(program, "u_resolution");
        const uTime = gl.getUniformLocation(program, "u_time");
        const uColor1 = gl.getUniformLocation(program, "u_color1");
        const uColor2 = gl.getUniformLocation(program, "u_color2");

        const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        };

        const render = (time: number) => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            // PERFORMANCE: Reduce resolution by 50% internally
            // This is huge for low-end GPUs (4x less pixels to render)
            const dpr = window.devicePixelRatio || 1;
            const targetWidth = Math.floor(width * 0.5 * dpr);
            const targetHeight = Math.floor(height * 0.5 * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                gl.viewport(0, 0, targetWidth, targetHeight);
            }

            gl.uniform2f(uAuthorization, targetWidth, targetHeight);
            gl.uniform1f(uTime, time * 0.001);

            const c1 = hexToRgb(subjectColor1);
            const c2 = hexToRgb(subjectColor2);
            gl.uniform3f(uColor1, c1[0], c1[1], c1[2]);
            gl.uniform3f(uColor2, c2[0], c2[1], c2[2]);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(render);
        };

        const frameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId);
    }, [subjectColor1, subjectColor2]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700 ease-in-out opacity-60 dark:opacity-40 rendering-pixelated" // Reduced opacity for better balance
        />
    );
};
