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
      model: 'gemini-1.5-flash',
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
