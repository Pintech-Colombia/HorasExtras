import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY no configurada en las Variables de Entorno de Vercel.',
      });
    }

    const {
      monthYear,
      totalHours,
      employeeSummaries,
      companyName,
      accountantEmail,
      accountantName,
      managerName,
    } = req.body || {};

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
Eres un asistente contable y administrativo experto en Recursos Humanos y nómina en Colombia y Latinoamérica.
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
3. "auditSummary": Un resumen breve de 2 párrafos para la gerencia destacando observaciones importantes, alertas si algún empleado superó límites razonables (ej. más de 30h al mes o límites legales de jornada) y resumen de recargos.

Responde únicamente con un objeto JSON válido sin bloques markdown adicionales.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      parsedData = {
        subject: `Reporte de Horas Extras - ${monthYear || 'Nómina'}`,
        emailBodyText: responseText,
        auditSummary: 'Resumen generado con éxito.',
      };
    }

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Error en serverless /api/ai/generate-summary:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar con Gemini AI' });
  }
}
