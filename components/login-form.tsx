"use client";
import React, { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";


const CELL_SIZE = 4;
const ALIVE_COLOR = "#000000";
const DEAD_COLOR = "#FFFFFF";
const FPS = 10; // Frames per second, adjust this to control speed

class GameOfLife {
  private width: number;
  private height: number;
  private cells: boolean[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(false);
    this.randomize(0.3); // Initialize with 30% live cells
  }

  private getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  private liveNeighbors(x: number, y: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const neighborX = (x + i + this.width) % this.width;
        const neighborY = (y + j + this.height) % this.height;
        count += this.cells[this.getIndex(neighborX, neighborY)] ? 1 : 0;
      }
    }
    return count;
  }

  public tick(): void {
    const nextGen = new Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.getIndex(x, y);
        const alive = this.cells[idx];
        const neighbors = this.liveNeighbors(x, y);

        nextGen[idx] = alive ? (neighbors === 2 || neighbors === 3) : (neighbors === 3);
      }
    }
    this.cells = nextGen;
  }

  public randomize(ratio: number): void {
    this.cells = this.cells.map(() => Math.random() < ratio);
  }

  public injectRandomCells(ratio: number): void {
    this.cells = this.cells.map(cell => cell || Math.random() < ratio);
  }

  public getCells(): boolean[] {
    return this.cells;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
}

const GameOfLifeAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = Math.floor(canvas.width / CELL_SIZE);
    const height = Math.floor(canvas.height / CELL_SIZE);

    const game = new GameOfLife(width, height);

    let frameCount = 0;
    let lastFrameTime = 0;

    const renderLoop = (currentTime: number) => {
      // Limit the frame rate
      if (currentTime - lastFrameTime < 1000 / FPS) {
        requestAnimationFrame(renderLoop);
        return;
      }

      lastFrameTime = currentTime;
      frameCount++;

      game.tick();

      // Inject random cells every 20 seconds (at 10 FPS)
      if (frameCount % (FPS * 20) === 0) {
        game.injectRandomCells(0.03); // Inject 3% new live cells
      }

      // Clear and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cells = game.getCells();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          ctx.fillStyle = cells[idx] ? ALIVE_COLOR : DEAD_COLOR;
          ctx.fillRect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} />;
};


const LoginForm: React.FC = () => {
  const handleGoogleLogin = () => {
    signIn('google', {callbackUrl:'/'});
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-md">
        <div className="text-2xl font-bold text-center">Welcome</div>
        <div className="flex justify-center rounded-xl overflow-hidden">
          <GameOfLifeAnimation />
        </div>
        
        <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}

export default LoginForm;