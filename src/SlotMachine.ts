import { Assets, Container, Sprite, Graphics, Text, TextStyle } from "pixi.js";
import { Game } from "./core/Game";
import { Reel } from "./components/Reel";
import { GameConfig } from "./Config";

export class SlotMachine extends Game {
  private reelContainer: Container;
  private reels: Reel[] = [];
  private spinButton!: Sprite;
  private winText!: Text;
  private winField!: Sprite;
  private isSpinning: boolean = false;

  private debugForceWin: boolean = false;
  private debugText!: Text;

  constructor() {
    super(GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x000000);
    this.reelContainer = new Container();
  }

  protected async loadAssets(): Promise<void> {
    await Assets.load("/assets/fonts/PixelifySans-Bold.ttf");
    const assets = [
      ...GameConfig.SYMBOLS.map((s) => ({
        alias: s,
        src: `/assets/images/${s}.png`,
      })),
      { alias: "ReelFrame", src: "/assets/images/ReelFrame.png" },
      { alias: "ReelSeperator", src: "/assets/images/ReelSeperator.png" },
      { alias: "SpinButton", src: "/assets/images/SpinButton.png" },
      { alias: "WinField", src: "/assets/images/WinField.png" },
      { alias: "BetField", src: "/assets/images/BetField.png" },
    ];
    await Assets.load(assets);
  }

  protected createScene(): void {
    const FRAME_SCALE = 0.65;
    const frame = Sprite.from("ReelFrame");
    frame.anchor.set(0.5);
    frame.scale.set(FRAME_SCALE);
    frame.x = this.width / 2;
    frame.y = this.height / 2;
    this.app.stage.addChild(frame);

    const totalReelWidth =
      GameConfig.REEL_COUNT * GameConfig.SYMBOL_SIZE +
      (GameConfig.REEL_COUNT - 1) * GameConfig.REEL_SPACING;
    const contentScale = 0.65;

    this.reelContainer.scale.set(contentScale);

    this.reelContainer.x = this.width / 2 - (totalReelWidth * contentScale) / 2;
    this.reelContainer.y =
      this.height / 2 -
      (GameConfig.VISIBLE_ROWS * GameConfig.SYMBOL_SIZE * contentScale) / 2;

    const mask = new Graphics();
    mask.rect(
      0,
      0,
      totalReelWidth,
      GameConfig.VISIBLE_ROWS * GameConfig.SYMBOL_SIZE
    );
    mask.fill(0xff0000);
    this.reelContainer.mask = mask;
    this.reelContainer.addChild(mask);

    this.app.stage.addChild(this.reelContainer);

    for (let i = 0; i < GameConfig.REEL_COUNT; i++) {
      const reel = new Reel(GameConfig.SYMBOL_SIZE, GameConfig.VISIBLE_ROWS, [
        ...GameConfig.SYMBOLS,
      ]);
      reel.x = i * (GameConfig.SYMBOL_SIZE + GameConfig.REEL_SPACING);
      this.reelContainer.addChild(reel);
      this.reels.push(reel);

      if (i < GameConfig.REEL_COUNT - 1) {
        const separator = Sprite.from("ReelSeperator");
        separator.anchor.set(0.5, 0);
        separator.x =
          reel.x + GameConfig.SYMBOL_SIZE + GameConfig.REEL_SPACING / 2;
        separator.height = GameConfig.VISIBLE_ROWS * GameConfig.SYMBOL_SIZE;

        this.reelContainer.addChild(separator);
      }
    }

    this.spinButton = Sprite.from("SpinButton");
    this.spinButton.anchor.set(0.5);
    this.spinButton.scale.set(0.6);
    this.spinButton.x = this.width / 2;
    this.spinButton.y = this.height - 60;
    this.spinButton.interactive = true;
    this.spinButton.cursor = "pointer";
    this.spinButton.on("pointerdown", () => this.handleSpin());
    this.app.stage.addChild(this.spinButton);

    this.winField = Sprite.from("WinField");
    this.winField.anchor.set(0.5);
    this.winField.x = this.width / 2;
    this.winField.y = 200; // Top
    this.winField.visible = false;
    this.app.stage.addChild(this.winField);

    const style = new TextStyle({
      fontSize: 36,
      fill: "#ffffff",
      stroke: { color: "#000000", width: 4, join: "round" },
    });

    this.winText = new Text({ text: "", style });
    this.winText.anchor.set(0.5);
    this.winText.x = this.width / 2;
    this.winText.y = 200;
    this.winText.visible = false;
    this.app.stage.addChild(this.winText);

    this.debugText = new Text({
      text: "FORCE WIN ACTIVE",
      style: {
        fontFamily: "Arial",
        fontSize: 14,
        fill: "red",
        fontWeight: "bold",
      },
    });
    this.debugText.x = 10;
    this.debugText.y = 10;
    this.debugText.visible = false;
    this.app.stage.addChild(this.debugText);

    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyW") {
        this.debugForceWin = !this.debugForceWin;
        console.log(`Force Win: ${this.debugForceWin}`);
        this.debugText.visible = this.debugForceWin;
      }
    });
  }

  private handleSpin(): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.spinButton.alpha = 0.5;

    this.reels.forEach((reel) => {
      reel.startSpin();
    });

    setTimeout(() => {
      this.stopReels();
    }, GameConfig.SPIN_DURATION);
  }

  private stopReels(): void {
    const resultGrid = this.generateOutcome();

    let currentIndex = 0;

    const triggerNextStop = () => {
      if (currentIndex < GameConfig.REEL_COUNT) {
        const reel = this.reels[currentIndex];
        const target = resultGrid[currentIndex];

        reel.onSpinComplete = () => {
          reel.onSpinComplete = undefined;
          currentIndex++;
          triggerNextStop();
        };

        reel.stopSpin(target);
      } else {
        this.isSpinning = false;
        this.spinButton.alpha = 1;
        this.checkWin(resultGrid);
      }
    };

    triggerNextStop();
  }

  private generateOutcome(): string[][] {
    const resultGrid: string[][] = [];

    if (this.debugForceWin) {
      const winSymbol = this.getRandomSymbol();

      for (let i = 0; i < GameConfig.REEL_COUNT; i++) {
        resultGrid.push([
          this.getRandomSymbol(),
          winSymbol,
          this.getRandomSymbol(),
        ]);
      }

      this.debugForceWin = false;
      if (this.debugText) this.debugText.visible = false;
    } else {
      for (let i = 0; i < GameConfig.REEL_COUNT; i++) {
        const col = [];
        for (let r = 0; r < GameConfig.VISIBLE_ROWS; r++) {
          col.push(this.getRandomSymbol());
        }
        resultGrid.push(col);
      }
    }
    console.log("resultGrid", resultGrid);
    return resultGrid;
  }

  private getRandomSymbol(): string {
    return GameConfig.SYMBOLS[
      Math.floor(Math.random() * GameConfig.SYMBOLS.length)
    ];
  }

  private checkWin(grid: string[][]): void {
    const middleRowSymbols = grid.map((col) => col[1]);

    const matchSymbol = middleRowSymbols.find((s) => s !== "Wild") || "Wild";
    const isWin = middleRowSymbols.every(
      (s) => s === matchSymbol || s === "Wild"
    );

    if (isWin) {
      this.showWinMessage(matchSymbol);
    } else {
      this.clearWinMessage();
    }
  }

  private showWinMessage(symbol: string): void {
    if (this.winText) {
      this.winText.text = `WIN! ${symbol}`;
      this.winText.visible = true;
      this.winField.visible = true;
    } else {
      alert(`WIN! ${symbol}`);
    }
  }

  private clearWinMessage(): void {
    if (this.winText) {
      this.winText.visible = false;
      this.winField.visible = false;
    }
  }

  protected update(ticker: { deltaTime: number }): void {
    this.reels.forEach((r) => r.update(ticker.deltaTime));
  }
}
