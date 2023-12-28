import { Vector3 } from "three";
export const BASS_LOW_HZ = 20;
export const BASS_HIGH_HZ = 250;
export const TREBLE_LOW_HZ = 2000;
export const TREBLE_HIGH_HZ = 20000;
export const SPIN_SPEED = 2
export const CENTRAL_RADIUS = 50;
export const FFT_SIZE = 2048
export const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", ""];

var look = new Vector3(0,30,0)

export const PERSPECTIVES = [
    { icon: "👁️", cameraConfig: { position: [40,10,0], look} },
    { icon: "🕊️", cameraConfig: { position: [100,150,100], look}},
    { icon :"🔝", cameraConfig: { position: [0,150,0], look}}

]



export const CONTROLS = { 
    toggle_fullscreen: "f",
    toggle_view: "v",
}