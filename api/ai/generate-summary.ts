import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Solo usuarios con sesión válida en Supabase pueden usar este servicio (evita abuso de la clave de Gemini).
// Se llama desde la misma app, por lo que no se habilita CORS para otros dominios.
const isAuthorized = async (req: any): Promise<boolean> => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Sin Supabase solo se permite en desarrollo local
    return process.env.NODE_ENV !== 'production';
  }
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data?.user);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: 'Sesión no válida. Inicie sesión nuevamente.' });
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

  const buildFallbackResponse = (notes = '') => {
    const empCount = employeeSummaries?.length || 0;
    const topEmployees = (employeeSummaries || [])
      .slice(0, 3)
      .map((e: any) => `${e.name} (${e.totalHours} hrs)`)
      .join(', ');

    const auditSummary = `Durante el periodo ${monthYear || 'evaluado'}, se consolidaron un total de ${totalHours || 0} horas extras auditadas en planta entre ${empCount} colaborador(es). ` +
      (topEmployees ? `Los colaboradores con mayor actividad en turnos extendidos fueron: ${topEmployees}. ` : '') +
      `Todos los registros cuentan con visto bueno de ${managerName || 'Jefatura de Producción'} y cumplen los parámetros de control interno para su correspondiente inclusión en la liquidación de nómina.` +
      (notes ? ` ${notes}` : '');

    const subject = `[NÓMINA] Reporte Consolidado de Horas Extras - ${monthYear || 'Mes'} - ${companyName || 'Pintech Colombia S.A.S.'}`;

    const emailBodyText = `Apreciado(a) ${accountantName || 'Contador'},\n\n` +
      `Por medio de la presente, remito la relación consolidada y auditada de las horas extras laboradas en planta durante el periodo ${monthYear || 'correspondiente'} en ${companyName || 'Pintech Colombia S.A.S.'}.\n\n` +
      `Resumen Ejecutivo de Nómina:\n` +
      `• Total horas extras registradas: ${totalHours || 0} horas.\n` +
      `• Total colaboradores con recargos: ${empCount} colaborador(es).\n` +
      `• Verificación técnica: Autorizado por ${managerName || 'Lorena Vargas'}.\n\n` +
      `Agradecemos procesar las novedades correspondientes para la liquidación de nómina. Quedamos a su entera disposición para cualquier aclaración técnica.\n\n` +
      `Cordialmente,\n` +
      `${managerName || 'Lorena Vargas'}\n` +
      `${companyName || 'Pintech Colombia S.A.S.'}`;

    return {
      subject,
      emailBodyText,
      auditSummary,
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Si no está configurada la clave en Vercel, responder con el generador corporativo seguro
    return res.status(200).json(buildFallbackResponse());
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
Eres un asistente contable y administrativo experto en Recursos Humanos y nómina en Colombia y Latinoamérica.
Genera un correo profesional y detallado para enviar al contador de la empresa sobre las HORAS EXTRAS registradas del mes.

Datos del reporte:
- Empresa: ${companyName || 'Pintech Colombia S.A.S.'}
- Mes de reporte: ${monthYear || 'Mes actual'}
- Encargado de verificación: ${managerName || 'Lorena Vargas (Jefa de Producción)'}
- Destinatario (Contador): ${accountantName || 'Omar (Contador)'} (${accountantEmail || 'contabilidad@pintech.co'})
- Total de horas extras acumuladas en el mes: ${totalHours} hrs

Desglose por empleado:
${JSON.stringify(employeeSummaries, null, 2)}

Por favor genera una respuesta en JSON estrictamente estructurada con las siguientes claves:
1. "subject": Asunto claro y formal para el correo de Gmail (ej: "[NÓMINA] REPORTE DE HORAS EXTRAS - [Mes] - [Empresa]").
2. "emailBodyText": Texto en formato estructurado para el cuerpo del correo de Gmail, listo para copiar y pegar o enviar, con saludo formal, tabla o lista legible de empleados con sus horas (diurnas, nocturnas, festivas), desglose total, observaciones de auditoría y despedida cordial.
3. "auditSummary": Un resumen breve de 2 párrafos para la gerencia destacando observaciones importantes, alertas si algún empleado superó límites razonables y resumen de recargos.

Responde únicamente con un objeto JSON válido sin bloques markdown adicionales.
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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
      parsedData = buildFallbackResponse();
    }

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Error con Gemini AI, usando generador de respaldo:', error?.message || error);
    // En caso de cualquier error con la API externa (cuota, conexión), devolver respuesta elegante
    return res.status(200).json(buildFallbackResponse());
  }
}
