export const isX01 = () => document.getElementById("ad-ext-game-variant")?.textContent === "X01";
export const isBullOff = () => document.getElementById("ad-ext-game-variant")?.textContent === "Bull-off";
export const isCricket = () => document.getElementById("ad-ext-game-variant")?.textContent?.split(" ")[0] === "Cricket";
export const isBermuda = () => document.getElementById("ad-ext-game-variant")?.textContent === "Bermuda";
export const isShanghai = () => document.getElementById("ad-ext-game-variant")?.textContent === "Shanghai";
export const isGotcha = () => document.getElementById("ad-ext-game-variant")?.textContent === "Gotcha";
export const isAroundTheClock = () => document.getElementById("ad-ext-game-variant")?.textContent === "ATC";
export const isRoundTheWorld = () => document.getElementById("ad-ext-game-variant")?.textContent === "Round the World";
export const isRandomCheckout = () => document.getElementById("ad-ext-game-variant")?.textContent === "Random Checkout";
export const isCountUp = () => document.getElementById("ad-ext-game-variant")?.textContent === "Count Up";
export const isSegmentTraining = () => document.getElementById("ad-ext-game-variant")?.textContent === "Segment Training";

export const isValidGameMode = () => isX01() || isCricket() || isBermuda() || isShanghai() || isGotcha() || isAroundTheClock() || isRoundTheWorld() || isRandomCheckout() || isCountUp() || isSegmentTraining();

export const soundEffect1 = new Audio();
export const soundEffect2 = new Audio();
export const soundEffect3 = new Audio();

export const soundEffectArray = [ soundEffect1, soundEffect2, soundEffect3 ];

export function isiOS() {
  return [
    "iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod" ].includes(navigator.platform) // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}
