import "./style.css";
import { SlotMachine } from "./SlotMachine";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = "";
const game = new SlotMachine();
game.init(document.body).catch(console.error);
