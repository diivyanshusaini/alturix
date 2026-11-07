import { useCallback, useEffect, useRef, useState } from 'react';

const INTRO_STORAGE_KEY = 'alturix_intro_seen_v3';

type IntroScene = 'init' | 'darkness' | 'rope' | 'activating' | 'revealing' | 'complete';

interface RopeNode {
  x: number;
  y: number;
  ox: number;
  oy: number;
  pinned?: boolean;
}

/**
 * ALTURIX — 5-Scene "PULL THE LIGHT" Cinematic Intro Experience
 * Scene 1: Technical Initialization (real asset/API/font loading)
 * Scene 2: Darkness ("SOME IDEAS NEED LIGHT." -> "PULL TO ENTER.")
 * Scene 3: Hanging Rope (Verlet physics rope, mouse & touch drag, labeled "PULL THE LIGHT")
 * Scene 4: Light Activation (Switch click, warm light spreading through dark space, revealing ALTURIX logo)
 * Scene 5: Homepage Reveal (Smooth warm illumination transition into the existing homepage)
 */
export default function IntroExperience() {
  const [scene, setScene] = useState<IntroScene>(() => {
    if (typeof window === 'undefined') return 'complete';
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('skipintro') === '1' ||
      params.get('skipIntro') === '1' ||
      params.get('nopreload') === '1'
    )
      return 'complete';
    if (params.get('intro') === '1') return 'init';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'complete';
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === '1' ? 'complete' : 'init';
  });

  // Scene 1 real loading telemetry
  const [initStep, setInitStep] = useState(0); // 0: System, 1: Visual Env, 2: Next Frame, 3: Ready
  const [loadedTasks, setLoadedTasks] = useState<string[]>([]);
  const [darknessSub, setDarknessSub] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<IntroScene>(scene);
  sceneRef.current = scene;

  // Complete Intro & Unlock Homepage
  const finishIntro = useCallback(() => {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    document.body.style.overflow = '';
    setScene('complete');
  }, []);

  // Trigger Scene 4 (Light Activation) -> Scene 5 (Homepage Reveal)
  const triggerLightActivation = useCallback(() => {
    if (
      sceneRef.current === 'activating' ||
      sceneRef.current === 'revealing' ||
      sceneRef.current === 'complete'
    ) {
      return;
    }
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    setPullProgress(1);
    setScene('activating');

    // Scene 4: Warm light spreads & illuminates the ALTURIX logo (1350ms), then Scene 5 reveals homepage
    setTimeout(() => {
      setScene('revealing');
      setTimeout(() => {
        document.body.style.overflow = '';
        setScene('complete');
      }, 850);
    }, 1350);
  }, []);

  // Allow user to replay intro anytime via navbar/footer button
  useEffect(() => {
    const onReplay = () => {
      sessionStorage.removeItem(INTRO_STORAGE_KEY);
      setPullProgress(0);
      setInitStep(0);
      setLoadedTasks([]);
      setDarknessSub(false);
      setScene('init');
    };
    window.addEventListener('alturix:replay-intro', onReplay);
    return () => window.removeEventListener('alturix:replay-intro', onReplay);
  }, []);

  // Lock body scroll while intro is active & support keyboard shortcuts
  useEffect(() => {
    if (scene === 'complete') {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      } else if (
        (e.key === 'Enter' || e.key === ' ') &&
        (sceneRef.current === 'rope' || sceneRef.current === 'darkness')
      ) {
        e.preventDefault();
        triggerLightActivation();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [scene, finishIntro, triggerLightActivation]);

  // SCENE 1 -> SCENE 2 -> SCENE 3: Real Resource Initialization
  useEffect(() => {
    if (scene !== 'init') return;
    let cancelled = false;

    const preloadImg = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    async function runRealInit() {
      const t0 = performance.now();

      // Step 1: INITIALIZING CREATIVE SYSTEM (Fonts & Core Engine)
      setInitStep(0);
      if (document.fonts?.ready) {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]);
      }
      if (cancelled) return;
      setLoadedTasks((p) => [...p, 'TYPOGRAPHY & RENDER ENGINE ONLINE']);

      // Ensure minimum readable beat (~550ms)
      const e1 = performance.now() - t0;
      if (e1 < 550) await new Promise((r) => setTimeout(r, 550 - e1));
      if (cancelled) return;

      // Step 2: LOADING VISUAL ENVIRONMENT (Fetch live CMS settings & project collection index)
      setInitStep(1);
      await Promise.allSettled([
        fetch('/api/public/settings', { credentials: 'include' }),
        fetch('/api/public/projects', { credentials: 'include' }),
      ]);
      if (cancelled) return;
      setLoadedTasks((p) => [...p, 'VISUAL ARCHIVE & COLLECTIONS MOUNTED']);

      const e2 = performance.now() - t0;
      if (e2 < 1150) await new Promise((r) => setTimeout(r, 1150 - e2));
      if (cancelled) return;

      // Step 3: PREPARING THE NEXT FRAME (Preload brand logo, rope texture & hero portrait)
      setInitStep(2);
      await Promise.allSettled([
        preloadImg('/alturix-logo-light.png'),
        preloadImg('/alturix-logo.png'),
        preloadImg('/divyanshu-cutout.png'),
        preloadImg('/stickers/rope-braid.png'),
      ]);
      if (cancelled) return;
      setLoadedTasks((p) => [...p, 'FRAME BUFFER & LIGHT RIG ARMED']);

      const e3 = performance.now() - t0;
      if (e3 < 1750) await new Promise((r) => setTimeout(r, 1750 - e3));
      if (cancelled) return;

      setInitStep(3);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;

      // Transition to SCENE 2 — DARKNESS
      setScene('darkness');
    }

    runRealInit();
    return () => {
      cancelled = true;
    };
  }, [scene]);

  // SCENE 2 (Darkness) -> SCENE 3 (Hanging Rope drops in)
  useEffect(() => {
    if (scene !== 'darkness') return;
    const t1 = setTimeout(() => setDarknessSub(true), 650);
    const t2 = setTimeout(() => setScene('rope'), 1450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scene]);

  // Physical Verlet Rope Simulation + Ambient Light Canvas (Scenes 2, 3, 4)
  useEffect(() => {
    if (scene === 'complete') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const N = 16;
    const nodes: RopeNode[] = [];
    const getAnchorX = () => w * 0.5;
    const getRestLen = () => Math.max(11, Math.min(18, (h * 0.34) / N));

    let ropeDropFactor = scene === 'rope' || scene === 'activating' || scene === 'revealing' ? 1 : 0.05;

    const initRope = () => {
      nodes.length = 0;
      const ax = getAnchorX();
      const seg = getRestLen();
      for (let i = 0; i < N; i++) {
        const y = i * seg * ropeDropFactor;
        nodes.push({
          x: ax + Math.sin(i * 0.4) * 3.5,
          y,
          ox: ax,
          oy: y,
          pinned: i === 0,
        });
      }
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initRope();
    };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: 34 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.9 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.12 - Math.random() * 0.25,
      a: 0.15 + Math.random() * 0.45,
    }));

    let dragging = false;
    let dragStartY = 0;
    let pointerX = getAnchorX();
    let pointerY = 200;
    let hoverHandle = false;
    let lightBloom = 0;
    let time = 0;
    const PULL_THRESHOLD = 62;

    // Load Reference 03 actual braided rope texture
    const ropeImg = new Image();
    let ropeImgReady = false;
    ropeImg.onload = () => {
      ropeImgReady = true;
    };
    ropeImg.src = '/stickers/rope-braid.png';

    const getHandle = () => nodes[nodes.length - 1];

    const onDown = (cx: number, cy: number) => {
      if (sceneRef.current !== 'rope' && sceneRef.current !== 'darkness') return;
      const hd = getHandle();
      const ax = getAnchorX();
      const distHandle = Math.hypot(cx - hd.x, cy - hd.y);
      const nearCenterRope = Math.abs(cx - ax) < 135 && cy > 10 && cy < hd.y + 150;
      if (distHandle < 115 || nearCenterRope) {
        dragging = true;
        dragStartY = cy;
        pointerX = cx;
        pointerY = Math.max(cy, hd.y);
      }
    };

    const onMove = (cx: number, cy: number) => {
      const hd = getHandle();
      const ax = getAnchorX();
      hoverHandle =
        Math.hypot(cx - hd.x, cy - hd.y) < 95 ||
        (Math.abs(cx - ax) < 90 && cy > 20 && cy < hd.y + 125);

      if (!dragging) return;
      pointerX = cx;
      pointerY = cy;
      const baseRestY = getRestLen() * (N - 1);
      const dy = Math.max(0, cy - dragStartY, pointerY - baseRestY);
      const prog = Math.min(1, dy / PULL_THRESHOLD);
      setPullProgress(prog);
      if (prog >= 1) {
        dragging = false;
        hd.oy = hd.y - 26;
        triggerLightActivation();
      }
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      const hd = getHandle();
      const baseRestY = getRestLen() * (N - 1);
      const dy = Math.max(0, pointerY - dragStartY, hd.y - baseRestY);
      if (dy >= PULL_THRESHOLD * 0.65) {
        triggerLightActivation();
      } else {
        setPullProgress(0);
      }
    };

    const mDown = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const mMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const mUp = () => onUp();

    const tStart = (e: TouchEvent) => {
      if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
    };
    const tMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const tEnd = () => onUp();

    canvas.addEventListener('mousedown', mDown);
    window.addEventListener('mousemove', mMove, { passive: true });
    window.addEventListener('mouseup', mUp);
    canvas.addEventListener('touchstart', tStart, { passive: true });
    window.addEventListener('touchmove', tMove, { passive: true });
    window.addEventListener('touchend', tEnd);

    let raf = 0;
    const step = () => {
      time += 0.016;
      const curScene = sceneRef.current;
      ctx.clearRect(0, 0, w, h);

      // Ambient Volumetric Light Cone in top center
      const ax = getAnchorX();
      if (curScene === 'activating' || curScene === 'revealing') {
        lightBloom = Math.min(1, lightBloom + 0.032);
      }
      const pullRatio =
        curScene === 'activating' || curScene === 'revealing'
          ? 1
          : Math.min(
              1,
              Math.max(0, (getHandle().y - getRestLen() * (N - 1)) / PULL_THRESHOLD)
            );

      const coneRadius =
        curScene === 'init'
          ? w * 0.25
          : w * (0.28 + pullRatio * 0.35 + lightBloom * 1.15);
      const coneAlpha =
        curScene === 'init'
          ? 0.06
          : 0.08 + pullRatio * 0.28 + lightBloom * 0.62;

      const ambGrad = ctx.createRadialGradient(ax, 0, 6, ax, h * 0.35, coneRadius);
      ambGrad.addColorStop(0, `rgba(255, 246, 185, ${Math.min(0.95, coneAlpha * 1.3)})`);
      ambGrad.addColorStop(0.35, `rgba(242, 211, 79, ${coneAlpha})`);
      ambGrad.addColorStop(0.7, `rgba(242, 211, 79, ${coneAlpha * 0.25})`);
      ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, w, h);

      // Floating atmospheric dust motes
      for (const m of motes) {
        m.x += m.vx + Math.sin(time + m.y * 0.01) * 0.1;
        m.y += m.vy;
        if (m.y < -10) m.y = h + 10;
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 211, 79, ${m.a * (0.5 + pullRatio * 0.5 + lightBloom * 0.5)})`;
        ctx.fill();
      }

      // Draw & Simulate Physical Hanging Rope in Scene 3 & 4
      if (curScene === 'rope' || curScene === 'activating' || curScene === 'revealing') {
        ropeDropFactor += (1 - ropeDropFactor) * 0.12;
        const seg = getRestLen() * ropeDropFactor;

        for (let i = 0; i < N; i++) {
          const n = nodes[i];
          if (n.pinned) {
            n.x = ax;
            n.y = 54;
            continue;
          }
          const vx = (n.x - n.ox) * 0.92;
          const vy = (n.y - n.oy) * 0.92;
          n.ox = n.x;
          n.oy = n.y;
          const breeze = dragging ? 0 : Math.sin(time * 2.1 + i * 0.25) * 0.07;
          n.x += vx + breeze;
          n.y += vy + 0.58;
        }

        if (dragging) {
          const hd = getHandle();
          const maxPullY = getRestLen() * (N - 1) + 54 + PULL_THRESHOLD * 1.45;
          const clampedX = ax + Math.max(-100, Math.min(100, pointerX - ax));
          const clampedY = Math.max(90, Math.min(maxPullY, pointerY));
          hd.x += (clampedX - hd.x) * 0.55;
          hd.y += (clampedY - hd.y) * 0.55;
        }

        for (let iter = 0; iter < 14; iter++) {
          nodes[0].x = ax;
          nodes[0].y = 54;
          for (let i = 0; i < N - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const diff = (dist - seg) / dist;
            if (a.pinned) {
              b.x -= dx * diff;
              b.y -= dy * diff;
            } else {
              a.x += dx * diff * 0.5;
              a.y += dy * diff * 0.5;
              b.x -= dx * diff * 0.5;
              b.y -= dy * diff * 0.5;
            }
          }
        }

        const hd = getHandle();

        // Top Ceiling Lamp / Switch Socket
        ctx.save();
        ctx.fillStyle = '#1E1E1C';
        ctx.strokeStyle = '#F2D34F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(ax - 22, 48, 44, 14, 6);
        ctx.fill();
        ctx.stroke();

        // Filament Bulb Glow when pulled/activated
        if (pullRatio > 0.1 || lightBloom > 0) {
          const bulbR = 24 + pullRatio * 28 + lightBloom * 90;
          const bGrad = ctx.createRadialGradient(ax, 66, 2, ax, 66, bulbR);
          bGrad.addColorStop(0, '#FFFFFF');
          bGrad.addColorStop(0.35, '#FFF2A6');
          bGrad.addColorStop(0.7, 'rgba(242, 211, 79, 0.45)');
          bGrad.addColorStop(1, 'rgba(242, 211, 79, 0)');
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(ax, 66, bulbR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Rope Drop Shadow
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(nodes[0].x + 6, nodes[0].y + 6);
        for (let i = 1; i < N - 1; i++) {
          const xc = (nodes[i].x + nodes[i + 1].x) * 0.5 + 6;
          const yc = (nodes[i].y + nodes[i + 1].y) * 0.5 + 6;
          ctx.quadraticCurveTo(nodes[i].x + 6, nodes[i].y + 6, xc, yc);
        }
        ctx.lineTo(hd.x + 6, hd.y + 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Braided Rope Cord (Textured with Reference 03 `/stickers/rope-braid.png` along Verlet segments)
        ctx.save();
        if (ropeImgReady && ropeImg.width > 0 && ropeImg.height > 0) {
          const sliceH = ropeImg.height / (N - 1);
          for (let i = 0; i < N - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            const mx = (a.x + b.x) * 0.5;
            const my = (a.y + b.y) * 0.5;
            const segLen = Math.hypot(b.x - a.x, b.y - a.y) + 2.5;
            const segAng = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(segAng);
            ctx.drawImage(
              ropeImg,
              0,
              i * sliceH,
              ropeImg.width,
              sliceH,
              -7.5,
              -segLen * 0.5,
              15,
              segLen
            );
            ctx.restore();
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(nodes[0].x, nodes[0].y);
          for (let i = 1; i < N - 1; i++) {
            const xc = (nodes[i].x + nodes[i + 1].x) * 0.5;
            const yc = (nodes[i].y + nodes[i + 1].y) * 0.5;
            ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
          }
          ctx.lineTo(hd.x, hd.y);
          const ropeGrad = ctx.createLinearGradient(ax - 4, 54, hd.x + 4, hd.y);
          ropeGrad.addColorStop(0, '#A89460');
          ropeGrad.addColorStop(0.5, '#E5C86B');
          ropeGrad.addColorStop(1, '#F2D34F');
          ctx.strokeStyle = ropeGrad;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(23, 23, 23, 0.5)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.restore();

        // Tactile Pull Handle
        const prevNode = nodes[N - 2];
        const angle = Math.atan2(hd.y - prevNode.y, hd.x - prevNode.x) - Math.PI / 2;

        ctx.save();
        ctx.translate(hd.x, hd.y);
        ctx.rotate(angle * 0.45);

        const glowR = 46 + pullRatio * 36;
        const glow = ctx.createRadialGradient(0, 18, 4, 0, 18, glowR);
        glow.addColorStop(0, `rgba(242, 211, 79, ${0.42 + pullRatio * 0.45})`);
        glow.addColorStop(1, 'rgba(242, 211, 79, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 18, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#171717';
        ctx.strokeStyle = '#F2D34F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-10, -4, 20, 12, 4);
        ctx.fill();
        ctx.stroke();

        const gripGrad = ctx.createLinearGradient(-14, 6, 14, 40);
        gripGrad.addColorStop(0, '#FFF5B8');
        gripGrad.addColorStop(0.5, '#F2D34F');
        gripGrad.addColorStop(1, '#B8951C');
        ctx.fillStyle = gripGrad;
        ctx.beginPath();
        ctx.roundRect(-13, 6, 26, 36, 13);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#171717';
        ctx.stroke();

        ctx.strokeStyle = 'rgba(23,23,23,0.45)';
        ctx.lineWidth = 1.3;
        for (const ly of [16, 22, 28]) {
          ctx.beginPath();
          ctx.moveTo(-6, ly);
          ctx.lineTo(6, ly);
          ctx.stroke();
        }
        ctx.restore();

        // "PULL THE LIGHT" Pill + Arrow right below the rope handle
        if (curScene === 'rope') {
          ctx.save();
          ctx.font = '700 11px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#F2D34F';
          const pillY = hd.y + 62 + Math.sin(time * 3) * 3;
          ctx.fillText(
            dragging ? `PULLING LIGHT · ${Math.round(pullRatio * 100)}%` : '↓ PULL THE LIGHT ↓',
            hd.x,
            pillY
          );
          ctx.restore();
        }
      }

      canvas.style.cursor =
        curScene === 'rope' && (hoverHandle || dragging)
          ? dragging
            ? 'grabbing'
            : 'grab'
          : 'default';

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', mDown);
      window.removeEventListener('mousemove', mMove);
      window.removeEventListener('mouseup', mUp);
      canvas.removeEventListener('touchstart', tStart);
      window.removeEventListener('touchmove', tMove);
      window.removeEventListener('touchend', tEnd);
    };
  }, [scene, triggerLightActivation]);

  if (scene === 'complete') return null;

  const initPercent = initStep === 0 ? 28 : initStep === 1 ? 64 : initStep === 2 ? 92 : 100;

  return (
    <div
      className={`fixed inset-0 z-[90] overflow-hidden select-none transition-all duration-[850ms] ${
        scene === 'revealing'
          ? 'pointer-events-none bg-ivory text-ink opacity-0'
          : 'bg-[#070706] text-ivory opacity-100'
      }`}
    >
      {/* Subtle Technical Grid Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(245,242,233,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,242,233,0.22) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Interactive Verlet Rope & Volumetric Light Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 block h-full w-full" />

      {/* SCENE 4 & 5 — Expanding Warm Light Source Illuminating the Environment */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-12 z-20 h-[190vmax] w-[190vmax] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[1300ms] ease-[cubic-bezier(.22,1,.36,1)] ${
          scene === 'revealing'
            ? 'scale-150 opacity-100'
            : scene === 'activating'
            ? 'scale-75 opacity-95'
            : 'scale-0 opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle, #F5F2E9 0%, #FFF4B8 38%, #F2D34F 72%, rgba(242,211,79,0) 100%)',
        }}
      />

      {/* Top System Bar + Skip Intro */}
      <div className="pointer-events-none relative z-30 flex items-center justify-between border-b border-ivory/10 bg-[#070706]/85 px-5 py-3.5 backdrop-blur-sm md:px-10">
        <div className="flex items-center gap-3">
          <img src="/alturix-logo-light.png" alt="ALTURIX" className="h-4 w-auto md:h-5" />
          <span className="label hidden tracking-[0.22em] text-ivory/55 sm:inline">
            // CREATIVE SYSTEM v2.6
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={finishIntro}
            className="label rounded-full border border-ivory/30 bg-ivory/5 px-4 py-1.5 text-ivory transition hover:border-sun hover:bg-sun hover:text-ink"
          >
            Skip Intro →
          </button>
        </div>
      </div>

      {/* =====================================================================
          SCENE 1 — TECHNICAL INITIALIZATION (REAL LOADING TELEMETRY)
         ===================================================================== */}
      {scene === 'init' && (
        <div className="pointer-events-none relative z-20 mx-auto flex h-[calc(100vh-110px)] max-w-3xl flex-col items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-ivory/15 bg-[#0D0D0B]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-md md:p-10">
            <div className="flex items-center justify-between border-b border-ivory/10 pb-4">
              <span className="label flex items-center gap-2 text-sun">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-sun" />
                SYS // BOOT SEQUENCE
              </span>
              <span className="label tabular-nums text-ivory/55">ALTURIX STUDIO OS</span>
            </div>

            <div className="mt-8 space-y-4">
              {[
                ['01', 'INITIALIZING CREATIVE SYSTEM'],
                ['02', 'LOADING VISUAL ENVIRONMENT'],
                ['03', 'PREPARING THE NEXT FRAME'],
              ].map(([code, text], idx) => {
                const done = initStep > idx;
                const active = initStep === idx;
                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${
                      active
                        ? 'border-sun bg-sun/10 text-ivory'
                        : done
                        ? 'border-ivory/20 bg-ivory/[0.03] text-ivory/85'
                        : 'border-ivory/5 bg-transparent text-ivory/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="label text-sun">{code}</span>
                      <span className="font-grotesk text-xs font-bold tracking-[0.18em] sm:text-sm">
                        {text}
                      </span>
                    </div>
                    <span className="label text-[10px]">
                      {done ? '✓ ONLINE' : active ? 'SYNCING…' : 'STANDBY'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Real Resource Progress Bar */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="label text-[10px] text-ivory/60">
                  {loadedTasks[loadedTasks.length - 1] || 'MOUNTING TYPOGRAPHY & ASSETS…'}
                </span>
                <span className="label tabular-nums text-sun">{initPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory/10">
                <div
                  className="h-full bg-sun transition-all duration-300 ease-out"
                  style={{ width: `${initPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCENE 2 & SCENE 3 — DARKNESS & THE HANGING ROPE ("PULL THE LIGHT")
         ===================================================================== */}
      {(scene === 'darkness' || scene === 'rope') && (
        <div className="pointer-events-none relative z-20 mx-auto flex h-[calc(100vh-110px)] max-w-4xl flex-col items-center justify-end px-4 pb-10 text-center sm:px-6 md:pb-16">
          <p className="label text-sun tracking-[0.16em] sm:tracking-[0.28em]">
            {scene === 'rope' ? 'INTERACTIVE LIGHT SWITCH // DRAG ROPE DOWNWARD' : 'ENVIRONMENT READY'}
          </p>

          <h1 className="display mt-3 text-2xl leading-[1.05] text-ivory sm:text-5xl md:text-6xl">
            SOME IDEAS NEED{' '}
            <span className="mt-1 inline-block bg-sun px-3 py-1 text-ink shadow-[5px_5px_0_rgba(242,211,79,0.3)] sm:mt-0">
              LIGHT.
            </span>
          </h1>

          <p
            className={`mt-4 font-grotesk text-sm font-bold uppercase tracking-[0.28em] text-ivory/80 transition-opacity duration-500 md:text-base ${
              darknessSub || scene === 'rope' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            PULL TO ENTER.
          </p>

          {/* Progress meter + Direct Pull The Light button */}
          <div className="pointer-events-auto mt-6 flex flex-col items-center gap-3">
            <div className="h-1.5 w-44 overflow-hidden rounded-full border border-ivory/20 bg-ivory/10">
              <div
                className="h-full bg-sun transition-all duration-75"
                style={{ width: `${Math.max(10, Math.round(pullProgress * 100))}%` }}
              />
            </div>

            <button
              type="button"
              onClick={triggerLightActivation}
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-[0.2em] text-ink shadow-[4px_4px_0_rgba(245,242,233,0.25)] transition hover:scale-105 hover:bg-ivory"
            >
              ⚡ Pull The Light
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCENE 4 — LIGHT ACTIVATION & ALTURIX LOGO REVEAL
         ===================================================================== */}
      {(scene === 'activating' || scene === 'revealing') && (
        <div className="pointer-events-none relative z-30 mx-auto flex h-[calc(100vh-110px)] max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="animate-fade flex flex-col items-center rounded-3xl border-2 border-ink bg-ivory/95 px-8 py-10 text-ink shadow-[12px_12px_0_#171717] md:px-14 md:py-12">
            <span className="label rounded-full border border-ink bg-sun px-3.5 py-1 text-ink">
              ⚡ LIGHT ACTIVATED // ENTERING STUDIO
            </span>
            <img
              src="/alturix-logo.png"
              alt="ALTURIX"
              className="mt-6 h-12 w-auto sm:h-16 md:h-20"
            />
            <p className="mt-4 font-grotesk text-lg font-bold uppercase tracking-[0.25em] text-ink/80 md:text-xl">
              A Creative Universe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
