import { useRef, useEffect, useCallback } from 'react';
import type { StageData, GimmickEvent, GimmickType } from '../../types';

const CANVAS_SIZE = 560;

interface Props {
  stageData: StageData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDrop: (type: GimmickType, x: number, y: number) => void;
}

export function ArenaCanvas({ stageData, selectedId, onSelect, onMove, onDrop }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number } | null>(null);
  const scaleRef = useRef(1);

  const toGame = useCallback((canvasX: number, canvasY: number) => {
    const scale = scaleRef.current;
    return { x: canvasX / scale, y: canvasY / scale };
  }, []);

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: aw, height: ah } = stageData.arena;
    const scale = CANVAS_SIZE / Math.max(aw, ah);
    scaleRef.current = scale;

    canvas.width = aw * scale;
    canvas.height = ah * scale;

    // 背景
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // グリッド
    ctx.strokeStyle = '#2a4a6a';
    ctx.lineWidth = 0.5;
    const step = 80 * scale;
    for (let x = step; x < canvas.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = step; y < canvas.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 枠線
    ctx.strokeStyle = '#4488cc';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

    // AI メンバー
    for (const ai of stageData.aiMembers) {
      const sx = ai.defaultPosition.x * scale;
      const sy = ai.defaultPosition.y * scale;
      const r = 8 * scale;
      ctx.fillStyle = `#${ai.color.toString(16).padStart(6, '0')}99`;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `${8 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ai.label, sx, sy);
    }

    // ギミック
    for (const ev of stageData.timeline) {
      const isSelected = ev.id === selectedId;
      drawGimmick(ctx, ev, scale, isSelected);
    }
  }, [stageData, selectedId]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const hitTest = (cx: number, cy: number): string | null => {
    const { x: gx, y: gy } = toGame(cx, cy);
    for (const ev of [...stageData.timeline].reverse()) {
      if (isHit(ev, gx, gy)) return ev.id;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getCanvasPos(e);
    const hit = hitTest(cx, cy);
    onSelect(hit);
    if (hit) dragRef.current = { id: hit, startX: cx, startY: cy };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const { cx, cy } = getCanvasPos(e);
    const { x, y } = toGame(cx, cy);
    onMove(dragRef.current.id, Math.round(x), Math.round(y));
  };

  const onMouseUp = () => { dragRef.current = null; };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => e.preventDefault();

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('gimmickType') as GimmickType;
    if (!type) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { x, y } = toGame(cx, cy);
    onDrop(type, Math.round(x), Math.round(y));
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ cursor: 'crosshair', display: 'block' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
}

// ───── 描画ユーティリティ ─────

function drawGimmick(
  ctx: CanvasRenderingContext2D,
  ev: GimmickEvent,
  scale: number,
  selected: boolean
) {
  const alpha = selected ? 0.9 : 0.65;
  ctx.save();

  if (selected) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8 * scale;
  }

  switch (ev.type) {
    case 'aoe_circle': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      const r = (ev.radius ?? 100) * scale;
      ctx.fillStyle = `rgba(255,68,0,${alpha * 0.35})`;
      ctx.strokeStyle = `rgba(255,100,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawLabel(ctx, ev.label ?? ev.type, cx, cy - r - 4 * scale, scale);
      break;
    }
    case 'aoe_line': {
      const ox = (ev.x ?? 0) * scale, oy = (ev.y ?? 0) * scale;
      const angle = ev.angle ?? 0;
      const w = (ev.width ?? 80) * scale, len = (ev.length ?? 400) * scale;
      ctx.fillStyle = `rgba(255,100,0,${alpha * 0.35})`;
      ctx.strokeStyle = `rgba(255,150,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.rect(0, -w / 2, len, w);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      drawLabel(ctx, ev.label ?? ev.type, ox + Math.cos(angle) * len / 2, oy + Math.sin(angle) * len / 2 - 10 * scale, scale);
      break;
    }
    case 'aoe_fan': {
      const ox = (ev.x ?? 0) * scale, oy = (ev.y ?? 0) * scale;
      const angle = ev.angle ?? 0, half = (ev.fanAngle ?? Math.PI / 3) / 2;
      const len = (ev.length ?? 300) * scale;
      ctx.fillStyle = `rgba(255,100,0,${alpha * 0.35})`;
      ctx.strokeStyle = `rgba(255,150,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, len, angle - half, angle + half);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      drawLabel(ctx, ev.label ?? ev.type, ox + Math.cos(angle) * len * 0.6, oy + Math.sin(angle) * len * 0.6 - 10 * scale, scale);
      break;
    }
    case 'aoe_donut': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      const inner = (ev.innerRadius ?? 120) * scale, outer = (ev.outerRadius ?? 300) * scale;
      ctx.strokeStyle = `rgba(255,150,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.fillStyle = `rgba(255,100,0,${alpha * 0.3})`;
      ctx.beginPath(); ctx.arc(cx, cy, outer, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#16213e';
      ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(0,255,150,${alpha * 0.5})`;
      ctx.stroke();
      drawLabel(ctx, ev.label ?? ev.type, cx, cy - inner - 6 * scale, scale);
      break;
    }
    case 'stack': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      const r = (ev.stackRadius ?? 60) * scale;
      ctx.fillStyle = `rgba(255,220,0,${alpha * 0.3})`;
      ctx.strokeStyle = `rgba(255,220,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, `⚡ ${ev.label ?? '頭割り'}`, cx, cy, scale);
      break;
    }
    case 'spread': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      const r = (ev.spreadRadius ?? 60) * scale;
      ctx.strokeStyle = `rgba(200,255,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, `💥 ${ev.label ?? '散開'}`, cx, cy, scale);
      break;
    }
    case 'knockback':
    case 'pull': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      ctx.fillStyle = `rgba(160,68,255,${alpha * 0.4})`;
      ctx.strokeStyle = `rgba(180,100,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const arrows = 8;
      for (let i = 0; i < arrows; i++) {
        const a = (i / arrows) * Math.PI * 2;
        const r1 = 22 * scale, r2 = 36 * scale;
        const isPull = ev.type === 'pull';
        ctx.strokeStyle = `rgba(200,120,255,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (isPull ? r2 : r1), cy + Math.sin(a) * (isPull ? r2 : r1));
        ctx.lineTo(cx + Math.cos(a) * (isPull ? r1 : r2), cy + Math.sin(a) * (isPull ? r1 : r2));
        ctx.stroke();
      }
      drawLabel(ctx, ev.label ?? ev.type, cx, cy - 40 * scale, scale);
      break;
    }
    case 'tower': {
      const cx = (ev.x ?? 320) * scale, cy = (ev.y ?? 320) * scale;
      const r = (ev.radius ?? 55) * scale;
      ctx.fillStyle = `rgba(0,255,170,${alpha * 0.25})`;
      ctx.strokeStyle = `rgba(0,255,170,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r + 6 * scale); ctx.lineTo(cx, cy + r - 6 * scale);
      ctx.moveTo(cx - r + 6 * scale, cy); ctx.lineTo(cx + r - 6 * scale, cy);
      ctx.stroke();
      drawLabel(ctx, `🗼 ${ev.label ?? '塔'}`, cx, cy, scale);
      break;
    }
  }

  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number) {
  ctx.font = `${Math.max(9, 10 * scale)}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function isHit(ev: GimmickEvent, gx: number, gy: number): boolean {
  const cx = ev.x ?? 320, cy = ev.y ?? 320;
  switch (ev.type) {
    case 'aoe_circle':
    case 'stack':
    case 'spread': {
      const r = ev.radius ?? ev.stackRadius ?? ev.spreadRadius ?? 60;
      return (gx - cx) ** 2 + (gy - cy) ** 2 < r ** 2;
    }
    case 'aoe_donut': {
      const d = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2);
      return d < (ev.outerRadius ?? 300);
    }
    case 'aoe_line': {
      const angle = ev.angle ?? 0, w = (ev.width ?? 80) / 2, len = ev.length ?? 400;
      const dx = gx - cx, dy = gy - cy;
      const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
      const ry = dx * Math.sin(-angle) + dy * Math.cos(-angle);
      return rx >= 0 && rx <= len && Math.abs(ry) <= w;
    }
    case 'aoe_fan': {
      const dx = gx - cx, dy = gy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > (ev.length ?? 300)) return false;
      let a = Math.atan2(dy, dx) - (ev.angle ?? 0);
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return Math.abs(a) <= (ev.fanAngle ?? Math.PI / 3) / 2;
    }
    case 'knockback':
    case 'pull':
    case 'tower':
      return (gx - cx) ** 2 + (gy - cy) ** 2 < (50) ** 2;
    default:
      return false;
  }
}
