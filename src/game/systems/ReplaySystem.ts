import type { ReplayFrame, FailureLog, GimmickType } from '../../types';

export class ReplaySystem {
  private frames: ReplayFrame[] = [];
  private failures: FailureLog[] = [];
  private recording = false;
  private frameInterval = 1 / 30; // 30fps記録
  private lastFrameTime = 0;

  startRecording() {
    this.frames = [];
    this.failures = [];
    this.recording = true;
    this.lastFrameTime = 0;
  }

  stopRecording() {
    this.recording = false;
  }

  record(time: number, playerX: number, playerY: number) {
    if (!this.recording) return;
    if (time - this.lastFrameTime < this.frameInterval) return;
    this.frames.push({ time, playerX, playerY });
    this.lastFrameTime = time;
  }

  recordFailure(time: number, gimmickId: string, gimmickType: GimmickType, playerX: number, playerY: number) {
    this.failures.push({ time, gimmickId, gimmickType, playerX, playerY });
  }

  getFrames(): ReplayFrame[] {
    return this.frames;
  }

  getFailures(): FailureLog[] {
    return this.failures;
  }

  // 指定時間のフレームを補間して取得
  getFrameAt(time: number): { x: number; y: number } | null {
    if (this.frames.length === 0) return null;
    const idx = this.frames.findIndex(f => f.time >= time);
    if (idx === 0) return { x: this.frames[0].playerX, y: this.frames[0].playerY };
    if (idx === -1) {
      const last = this.frames[this.frames.length - 1];
      return { x: last.playerX, y: last.playerY };
    }
    const a = this.frames[idx - 1];
    const b = this.frames[idx];
    const t = (time - a.time) / (b.time - a.time);
    return {
      x: a.playerX + (b.playerX - a.playerX) * t,
      y: a.playerY + (b.playerY - a.playerY) * t,
    };
  }

  getTotalTime(): number {
    if (this.frames.length === 0) return 0;
    return this.frames[this.frames.length - 1].time;
  }
}
