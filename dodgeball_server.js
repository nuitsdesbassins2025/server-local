import { io } from "socket.io-client";
import { createDevice, MessageEvent, TimeNow } from "@rnbo/js";
import { readFile } from "fs/promises";
import { AudioContext } from "node-web-audio-api";

let rnboDevice = null;

async function initRNBO() {
    const patchExport = JSON.parse(await readFile("./export/dodgeball.export.json", "utf-8"));
    const context = new AudioContext();

    rnboDevice = await createDevice({ context, patchExport });
    rnboDevice.node.connect(context.destination);

    console.log("✅ RNBO initialisé");
    return rnboDevice;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

// 🔈 Envoie le message [1] à "mur", "joueur" ou "bouclier" + position stéréo via "pan_*"
function triggerEvent(type, x) {
    if (!["mur", "joueur", "bouclier"].includes(type)) {
        console.warn("⚠️ Événement inconnu :", type);
        return;
    }

    const now = TimeNow;
    const panValue = (clamp(x, 0, 1) * 2) - 1; // map x ∈ [0,1] → pan ∈ [-1,1]

    // pan_mur, pan_joueur, pan_bouclier
    const panEvent = new MessageEvent(now, `pan_${type}`, [panValue]);

    // mur, joueur, bouclier
    const trigger = new MessageEvent(now, type, [1]);

    rnboDevice.scheduleEvent(panEvent);
    rnboDevice.scheduleEvent(trigger);
}

// 🔌 Connexion au serveur Python via Socket.IO
const socket = io("http://localhost:5000");

await initRNBO();

socket.on("connect", () => {
    console.log("🔌 Connecté au serveur Python");
});

// Réception de l'événement "mur"
socket.on("mur", (data) => {
    const x = parseFloat(data?.x ?? 0.5);
    triggerEvent("mur", x);
});

// Réception de l'événement "joueur"
socket.on("joueur", (data) => {
    const x = parseFloat(data?.x ?? 0.5);
    triggerEvent("joueur", x);
});

// Réception de l'événement "bouclier"
socket.on("bouclier", (data) => {
    const x = parseFloat(data?.x ?? 0.5);
    triggerEvent("bouclier", x);
});

socket.on("disconnect", () => {
    console.log("❌ Déconnecté");
});
