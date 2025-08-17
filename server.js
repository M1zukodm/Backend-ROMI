const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const admin = require("firebase-admin");

require("dotenv").config();

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  throw new Error("Faltan variables de entorno de Firebase");
}

// Configuración segura para Firebase
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
  console.log("🔥 Firebase inicializado correctamente");
} catch (error) {
  console.error("❌ Error al iniciar Firebase:", error.message);
  process.exit(1);
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Comprobar entorno
console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

// --- Datos de síntomas ---
let data = {
  symptoms: [
    {
      id: 1,
      name: "Dolor de cabeza",
      categories: ["Neurológico"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Descansar", "Tomar agua"], alert: false },
        { painLevel: [4, 7], recommendations: ["Paracetamol", "Evitar luces brillantes"], alert: false },
        { painLevel: [8, 10], recommendations: ["Urgencias médicas inmediatas"], alert: true },
      ],
    },
    {
      id: 2,
      name: "Fiebre",
      categories: ["General"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Líquidos abundantes", "Reposo"], alert: false },
        { painLevel: [4, 7], recommendations: ["Baño tibio", "Antipirético"], alert: true },
        { painLevel: [8, 10], recommendations: ["Urgencias médicas"], alert: true },
      ],
    },
    {
      id: 3,
      name: "Dolor abdominal",
      categories: ["Digestivo"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Descansar", "Evitar comidas pesadas"], alert: false },
        { painLevel: [4, 7], recommendations: ["Consultar médico si persiste"], alert: true },
        { painLevel: [8, 10], recommendations: ["Urgencias, posible apendicitis"], alert: true },
      ],
    },
    {
      id: 4,
      name: "Tos",
      categories: ["Respiratorio"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Miel con limón", "Líquidos tibios"], alert: false },
        { painLevel: [4, 7], recommendations: ["Jarabe para la tos"], alert: false },
        { painLevel: [8, 10], recommendations: ["Consulta médica inmediata"], alert: true },
      ],
    },
    {
      id: 5,
      name: "Dolor de espalda",
      categories: ["Músculo-esquelético"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Estiramientos suaves", "Reposo"], alert: false },
        { painLevel: [4, 7], recommendations: ["Antiinflamatorio suave"], alert: false },
        { painLevel: [8, 10], recommendations: ["Consulta médica"], alert: true },
      ],
    },
    {
      id: 6,
      name: "Mareos",
      categories: ["Neurológico"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Sentarse", "Tomar agua"], alert: false },
        { painLevel: [4, 7], recommendations: ["Consultar médico si repite"], alert: true },
        { painLevel: [8, 10], recommendations: ["Urgencias (posible vértigo)"], alert: true },
      ],
    },
    {
      id: 7,
      name: "Dificultad para respirar",
      categories: ["Respiratorio"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Evitar esfuerzo físico"], alert: true },
        { painLevel: [4, 7], recommendations: ["Uso de inhalador (si aplica)"], alert: true },
        { painLevel: [8, 10], recommendations: ["Urgencias inmediatas"], alert: true },
      ],
    },
    {
      id: 8,
      name: "Dolor de garganta",
      categories: ["Respiratorio"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Gárgaras con agua tibia", "Miel"], alert: false },
        { painLevel: [4, 7], recommendations: ["Pastillas para la garganta"], alert: false },
        { painLevel: [8, 10], recommendations: ["Consulta médica (posible infección)"], alert: true },
      ],
    },
    {
      id: 9,
      name: "Náuseas",
      categories: ["Digestivo"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Beber agua en sorbos", "Reposo"], alert: false },
        { painLevel: [4, 7], recommendations: ["Infusión de jengibre"], alert: false },
        { painLevel: [8, 10], recommendations: ["Urgencias (posible intoxicación)"], alert: true },
      ],
    },
    {
      id: 10,
      name: "Insomnio",
      categories: ["Neurológico"],
      solutions: [
        { painLevel: [1, 3], recommendations: ["Rutina de sueño regular"], alert: false },
        { painLevel: [4, 7], recommendations: ["Té relajante", "Evitar pantallas"], alert: false },
        { painLevel: [8, 10], recommendations: ["Consulta médica (posible ansiedad)"], alert: true },
      ],
    },
  ],
};

// --- Configuración de Swagger ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API ROMI Express",
      version: "1.0.0",
      description:
        "API para gestionar síntomas y registrar pacientes con recomendaciones médicas.",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://backend-romi.vercel.app"
            : "http://localhost:3000",
      },
    ],
  },
  apis: [path.join(__dirname, "./server.js")],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// JSON con la documentación
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocs);
});

// UI de Swagger usando CDN
app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>API Docs - ROMI Express</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// --- Rutas ---
/**
 * @swagger
 * /sintomas:
 *   get:
 *     summary: Obtener todos los síntomas
 */
app.get("/sintomas", (req, res) => {
  res.json(data.symptoms);
});

app.get("/sintomas/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const symptom = data.symptoms.find((s) => s.id === id);
  if (!symptom) return res.status(404).json({ error: "Síntoma no encontrado" });
  res.json(symptom);
});

app.get("/sintomas/buscar", (req, res) => {
  const nameQuery = req.query.nombre;
  if (!nameQuery)
    return res.status(400).json({ error: "Debes enviar un parámetro 'nombre'" });

  const results = data.symptoms.filter((s) =>
    s.name.toLowerCase().includes(nameQuery.toLowerCase())
  );
  if (results.length === 0)
    return res
      .status(404)
      .json({ error: "No se encontraron síntomas con ese nombre" });

  res.json(results);
});

app.get("/pacientes", async (req, res) => {
  try {
    const snapshot = await db.collection("pacientes").get();
    const pacientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: "Error al leer pacientes" });
  }
});

app.post("/pacientes", async (req, res) => {
  const { nombre, sintomaId, nivelDolor } = req.body;

  const symptom = data.symptoms.find((s) => s.id === sintomaId);
  if (!symptom) return res.status(404).json({ error: "Síntoma no encontrado" });

  const solution = symptom.solutions.find(
    (sol) => nivelDolor >= sol.painLevel[0] && nivelDolor <= sol.painLevel[1]
  );
  if (!solution) return res.status(400).json({ error: "Nivel de dolor no válido" });

  try {
    const docRef = await db.collection("pacientes").add({
      nombre,
      sintomaId,
      nivelDolor,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      sintomaNombre: symptom.name,
    });

    res.json({
      id: docRef.id,
      nombre,
      sintoma: symptom.name,
      recomendaciones: solution.recommendations,
      alerta: solution.alert,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar paciente" });
  }
});

// --- Ruta raíz ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Migrar síntomas a Firebase
app.get("/migrar-sintomas", async (req, res) => {
  try {
    const batch = db.batch();
    const snapshot = await db.collection("sintomas").get();

    if (snapshot.empty) {
      data.symptoms.forEach((symptom) => {
        const ref = db.collection("sintomas").doc(symptom.id.toString());
        batch.set(ref, symptom);
      });
      await batch.commit();
      return res.send("✅ Síntomas migrados a Firebase (primera vez)");
    }
    res.send("ℹ️ Firebase ya tenía síntomas. No se migró nada.");
  } catch (error) {
    res.status(500).send("❌ Error: " + error.message);
  }
});

// --- Iniciar servidor (local) ---
const PORT = 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
  );
}

module.exports = app; // necesario para Vercel
