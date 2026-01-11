import { Application } from 'pixi.js';

export abstract class Game {
    protected app: Application;
    protected readonly width: number;
    protected readonly height: number;
    protected readonly backgroundColor: number;

    constructor(width: number, height: number, backgroundColor: number = 0x1099bb) {
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
        this.app = new Application();
    }

    public async init(element: HTMLElement): Promise<void> {
        await this.app.init({
            width: this.width,
            height: this.height,
            backgroundColor: this.backgroundColor,
        });

        element.appendChild(this.app.canvas);

        await this.loadAssets();

        this.createScene();

        this.app.ticker.add(this.update.bind(this));
    }

    protected abstract loadAssets(): Promise<void>;
    protected abstract createScene(): void;
    protected abstract update(ticker: { deltaTime: number }): void;

    protected onResize(): void { }
}
