import { Container, Graphics } from "pixi.js";
import { Symbol } from "./Symbol";
import { GameConfig } from "../Config";

export class Reel extends Container {
  private symbols: Symbol[] = [];
  private symbolSize: number;
  private visibleRows: number;
  public isSpinning: boolean = false;
  public isStopping: boolean = false;
  private spinSpeed: number = GameConfig.SPIN_SPEED;
  private availableSymbols: string[];

  constructor(
    symbolSize: number,
    visibleRows: number,
    availableSymbols: string[]
  ) {
    super();
    this.symbolSize = symbolSize;
    this.visibleRows = visibleRows;
    this.availableSymbols = availableSymbols;

    const mask = new Graphics();
    mask.rect(0, 0, symbolSize, visibleRows * symbolSize);
    mask.fill(0xffffff);
    this.mask = mask;
    this.addChild(mask);

    this.generateInitialSymbols();
  }

  private generateInitialSymbols(): void {
    for (let i = 0; i < this.visibleRows + 2; i++) {
      const symbolId = this.getRandomSymbolId();
      const symbol = new Symbol(symbolId, this.symbolSize);
      symbol.y = (i - 1) * this.symbolSize;
      this.addChild(symbol);
      this.symbols.push(symbol);
    }
  }

  private getRandomSymbolId(): string {
    return this.availableSymbols[
      Math.floor(Math.random() * this.availableSymbols.length)
    ];
  }

  private targetQueue: string[] = [];
  private finalSymbol: Symbol | null = null;
  private currentSpeed: number = 0;

  public startSpin(): void {
    this.isSpinning = true;
    this.isStopping = false;
    this.targetQueue = [];
    this.finalSymbol = null;
    this.currentSpeed = this.spinSpeed;
  }

  public stopSpin(result: string[]): void {
    if (result.length !== this.visibleRows) {
      console.log("Target result length mismatch");
    }

    this.isStopping = true;
    this.targetQueue = [...result].reverse();
  }

  public update(time: number): void {
    if (!this.isSpinning) return;

    if (this.isStopping) {
      this.currentSpeed *= GameConfig.DECAY_RATE;
      if (this.currentSpeed < GameConfig.MIN_SPEED)
        this.currentSpeed = GameConfig.MIN_SPEED;
    }

    const moveAmount = this.currentSpeed * time;

    for (const symbol of this.symbols) {
      symbol.y += moveAmount;
    }

    const viewHeight = this.visibleRows * this.symbolSize;
    const wrapThreshold = viewHeight + this.symbolSize;

    this.symbols.forEach((symbol) => {
      if (symbol.y >= wrapThreshold) {
        const totalHeight = this.symbols.length * this.symbolSize;
        symbol.y -= totalHeight;

        if (this.targetQueue.length > 0) {
          const nextId = this.targetQueue.shift()!;
          symbol.updateSymbol(nextId);

          if (this.targetQueue.length === 0) {
            this.finalSymbol = symbol;
          }
        } else {
          if (!this.finalSymbol) {
            symbol.updateSymbol(this.getRandomSymbolId());
          }
        }
      }
    });

    if (this.finalSymbol && this.finalSymbol.y >= 0) {
      this.finalizeSpin();
    }
  }

  private finalizeSpin(): void {
    // Snap to grid
    const error = this.finalSymbol!.y;
    this.symbols.forEach((s) => (s.y -= error));

    this.isSpinning = false;
    this.currentSpeed = 0;
    this.finalSymbol = null;

    if (this.onSpinComplete) {
      this.onSpinComplete();
    }
  }

  public onSpinComplete?: () => void;
}
