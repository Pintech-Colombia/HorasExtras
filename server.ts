import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Gemini route to generate automated email body & summary for accountant
  app.post('/api/ai/generate-summary', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY no configurada. Configúrala en los Secretos de la aplicación.'
        });
      }

      const { monthYear, totalHours, employeeSummaries, companyName, accountantEmail, accountantName, managerName } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
Eres un asistente contable y administrativo experto en Recursos Humanos y nómina en español.
Genera un correo profesional y detallado para enviar al contador de la empresa sobre las HORAS EXTRAS registradas del mes.

Datos del reporte:
- Empresa: ${companyName || 'Empresa'}
- Mes de reporte: ${monthYear || 'Mes actual'}
- Encargado de verificación: ${managerName || 'Encargado de Operaciones'}
- Destinatario (Contador): ${accountantName || 'Estimado Contador'} (${accountantEmail || 'correo@empresa.com'})
- Total de horas extras acumuladas en el mes: ${totalHours} hrs

Desglose por empleado:
${JSON.stringify(employeeSummaries, null, 2)}

Por favor genera una respuesta en JSON estrictamente estructurada con las siguientes claves:
1. "subject": Asunto claro y formal para el correo de Gmail (ej: "REPORTE DE HORAS EXTRAS - [Mes] - [Empresa]").
2. "emailBodyText": Texto en formato estructurado para el cuerpo del correo de Gmail, listo para copiar y pegar o enviar, con saludo formal, tabla o lista legible de empleados con sus horas (diurnas, nocturnas, festivas), desglose total, observaciones de auditoría y despedida cordial.
3. "auditSummary": Un resumen breve de 2 párrafos para la gerencia destacando observaciones importantes, alertas si algún empleado superó límites razonables (ej. más de 30h al mes) y resumen de recargos.

Responde únicamente con un objeto JSON válido sin bloques markdown alrededor si es posible, o asegúrate que se pueda parsear.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        parsedData = {
          subject: `Reporte de Horas Extras - ${monthYear || 'Nómina'}`,
          emailBodyText: responseText,
          auditSummary: "Resumen generado con éxito."
        };
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error in /api/ai/generate-summary:', error);
      return res.status(500).json({ error: error.message || 'Error al procesar con Gemini AI' });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
