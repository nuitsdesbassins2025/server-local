import WebSocket from "ws";
import fs from "fs/promises";
import { createDevice } from "@rnbo/js";

// --- Initialisation RNBO ---

let context;
let device;

async function initRNBO() {
    const patchJSON = JSON.parse(await fs.readFile("./export/ndb25.json", "utf-8"));

    context = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    device = await createDevice({ context, patchExport: patchJSON });

    device.node.connect(context.destination);

    console.log("🎛️ RNBO initialisé avec succès.");
    return device;
}

// --- Fonction pour déclencher un son + pan ---

function triggerVoice(tag, pan = 0) {
    const now = context.currentTime;

    // Bang vers le déclencheur (ex: "mur", "sol", etc.)
    device.scheduleEvent({
        type: "message",
        tag,
        time: now,
        payload: [1]
    });

    // Contrôle de spatialisation
    device.scheduleEvent({
        type: "message",
        tag: "pan",
        time: now,
        payload: [pan]
    });

    console.log(`🎵 ${tag} déclenché (pan: ${pan.toFixed(2)})`);
}

// --- WebSocket Server ---
// à ajouter : parsing json pour data : tags, id_joueur, Position, etc.
const validTags = ["sol", "mur", "joueur", "bouclier"];

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("🔌 Client connecté");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());
            const type = data.event?.toLowerCase();
            const x = clamp(parseFloat(data.x), 0, 1);

            if (!validTags.includes(type)) {
                console.warn("❓ Type d’événement inconnu:", type);
                return;
            }

            const pan = (x * 2) - 1;
            triggerVoice(type, pan);
        } catch (e) {
            console.error("❌ Erreur traitement message :", e);
        }
    });

    ws.on("close", () => {
        console.log("❌ Client déconnecté");
    });
});

// --- Lancer RNBO et le serveur ---

await initRNBO();
console.log("🚀 WebSocket prêt sur ws://localhost:8080");
