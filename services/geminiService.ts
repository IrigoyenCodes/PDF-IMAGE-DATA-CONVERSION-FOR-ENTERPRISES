import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedSupplyData, ExtractedWorkOrderData, ExtractedUninstallationData, ExtractedInstallationData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Document Classification ---
const classificationPrompt = `
Analyze the provided document and classify it. The document is one of four types: "Orden de Trabajo" (Work Order), "Pedido de Suministros" (Supply Request), "Desinstalación" (Uninstallation), or "Solicitud de Instalación" (Installation).

- If the document contains phrases like "DESCRIPCIÓN DEL SERVICIO", "Servicio Solicitado y/o Falla Reportada", or "CORRECTIVO", it is a 'workOrder'.
- If the document primarily lists supplies or has a prominent section for "Contador B/N:", it is a 'supplyRequest'.
- If the document header or title is "FORMATO DE DESINSTALACIÓN DE EQUIPO" or mentions "retiro de equipo", it is an 'uninstallation'.
- If the document header or title is "SOLICITUD DE INSTALACIÓN" or mentions "entrega de equipo", it is an 'installation'.

Respond with ONLY one of the following strings: "workOrder", "supplyRequest", "uninstallation", "installation", or "unknown".
`;

export const classifyDocument = async (base64Pdf: string): Promise<'workOrder' | 'supplyRequest' | 'uninstallation' | 'installation' | 'unknown'> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: classificationPrompt }] },
            config: {
                temperature: 0,
            },
        });
        const classification = response.text.trim();
        if (classification === 'workOrder' || classification === 'supplyRequest' || classification === 'uninstallation' || classification === 'installation') {
            return classification;
        }
        return 'unknown';
    } catch (error) {
        console.error("Error classifying document:", error);
        return 'unknown';
    }
};


// --- Schema and Prompt for Supply Requests ---
const supplyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    orden: {
      type: Type.STRING,
      description: "The work order number. Look for the label 'Número:'. It is often a folio number like 'FOL...'",
    },
    serie: {
      type: Type.STRING,
      description: "The equipment serial number. It is a standalone alphanumeric code located in the header area, often near the top right (e.g., '3353PA50032'). IMPORTANT: You MUST extract this header value. IGNORE any other value that might be written next to the label 'Número de serie del equipo:', as that one is secondary and often incorrect.",
    },
    fechaRegistro: {
      type: Type.STRING,
      description: "The opening date. Look for the label 'Abierto'. Format it as MM/DD/YY.",
    },
    contadorBN: {
      type: Type.STRING,
      description: "The Black and White counter reading. Look for the label 'Contador B/N:' in the 'SERVICIO' section.",
    },
    fechaEntrega: {
      type: Type.STRING,
      description: "The closing date. Look for the label 'Fecha y hora de término:'. Format it as MM/DD/YY.",
    },
  },
  required: ["orden", "serie", "fechaRegistro", "contadorBN", "fechaEntrega"],
};

const supplyPrompt = `
You are an expert data extraction system for "Orden de Trabajo" or "Pedido de Suministros" documents. The provided PDF document contains a scanned image. Please perform Optical Character Recognition (OCR) to read the text and extract the following information. If a field is not found, return an empty string "".

1.  **orden**: Find the main work order number (folio). It is located to the right of the label "Número:".
2.  **serie**: Find the equipment serial number. It is the standalone alphanumeric code located in the document's header area, usually at the top right. For example, '3353PA50032'. This header value is the correct one. **CRITICAL: IGNORE** any value found next to the text 'Número de serie del equipo:'. Extract only the serial number from the header.
3.  **fechaRegistro**: Find the opening date to the right of "Abierto:". Format as MM/DD/YY.
4.  **contadorBN**: Find the Black and White page count to the right of "Contador B/N:".
5.  **fechaEntrega**: Find the closing date to the right of "Fecha y hora de término:". Format as MM/DD/YY.

Return only the extracted data in the specified JSON format.`;

export const extractSupplyDataFromPdf = async (base64Pdf: string): Promise<ExtractedSupplyData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: supplyPrompt }] },
        config: { responseMimeType: 'application/json', responseSchema: supplyResponseSchema },
    });
    const parsedData = JSON.parse(response.text.trim());
    return {
        orden: parsedData.orden || '',
        serie: parsedData.serie || '',
        fechaRegistro: parsedData.fechaRegistro || '',
        contadorBN: parsedData.contadorBN || '',
        fechaEntrega: parsedData.fechaEntrega || '',
    };
};

// --- Schema and Prompt for Work Orders ---
const workOrderResponseSchema = {
  type: Type.OBJECT,
  properties: {
    orden: {
      type: Type.STRING,
      description: "The work order number. Look for the label 'Número:'. It is often a folio number like 'FOL...'",
    },
    serie: {
      type: Type.STRING,
      description: "The equipment serial number. It is a standalone alphanumeric code located in the header area, often near the top right (e.g., '3353PA50032'). IMPORTANT: You MUST extract this header value. IGNORE any other value that might be written next to the label 'Número de serie del equipo:', as that one is secondary and often incorrect.",
    },
    fechaRegistro: {
      type: Type.STRING,
      description: "The opening date. Look for the label 'Abierto'. Format it as DD-MM-YY.",
    },
    categoria: {
        type: Type.STRING,
        description: "The service category. Look for a label like 'Categoría de Servicio' or 'Tipo de Servicio'. Example: 'CORRECTIVO'. If not found, leave empty.",
    },
    descripcion: {
        type: Type.STRING,
        description: "The full text from the section labeled 'DESCRIPCIÓN DEL SERVICIO' or 'Servicio Solicitado y/o Falla Reportada'.",
    },
    fechaCierre: {
      type: Type.STRING,
      description: "The closing date. Look for the label 'Fecha y hora de término:'. Format it as DD-MM-YY.",
    },
  },
  required: ["orden", "serie", "fechaRegistro", "categoria", "descripcion", "fechaCierre"],
};

const workOrderPrompt = `
You are an expert data extraction system for "Orden de Trabajo" documents. The provided PDF document contains a scanned image. Please perform Optical Character Recognition (OCR) to read the text and extract the following information. If a field is not found, return an empty string "".

1.  **orden**: Find the main work order number (folio) to the right of the label "Número:".
2.  **serie**: Find the equipment serial number. It is the standalone alphanumeric code located in the document's header area, usually at the top right. For example, '3353PA50032'. This header value is the correct one. **CRITICAL: IGNORE** any value found next to the text 'Número de serie del equipo:'. Extract only the serial number from the header.
3.  **fechaRegistro**: Find the opening date to the right of "Abierto:". Format as DD-MM-YY.
4.  **categoria**: Find the service category. Look for a label like 'Categoría de Servicio' or 'Tipo de Servicio'.
5.  **descripcion**: Find the text under the section labeled "DESCRIPCIÓN DEL SERVICIO" or "Servicio Solicitado y/o Falla Reportada". Extract the full description of the work performed.
6.  **fechaCierre**: Find the closing date to the right of "Fecha y hora de término:". Format as DD-MM-YY.

Return only the extracted data in the specified JSON format.`;


export const extractWorkOrderDataFromPdf = async (base64Pdf: string): Promise<ExtractedWorkOrderData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: workOrderPrompt }] },
        config: { responseMimeType: 'application/json', responseSchema: workOrderResponseSchema },
    });
    const parsedData = JSON.parse(response.text.trim());
    return {
        orden: parsedData.orden || '',
        serie: parsedData.serie || '',
        fechaRegistro: parsedData.fechaRegistro || '',
        categoria: parsedData.categoria || '',
        descripcion: parsedData.descripcion || '',
        fechaCierre: parsedData.fechaCierre || '',
    };
};

// --- Schema and Prompt for Uninstallations ---
const uninstallationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        folio: { type: Type.STRING, description: "The unique document number, often labeled 'Folio:' or 'No. de Solicitud'." },
        serie: { type: Type.STRING, description: "The equipment serial number, often labeled 'SERIE:'." },
        fecha: { type: Type.STRING, description: "The date of the uninstallation, labeled 'FECHA:'. Format as DD-MM-YY." },
        contadorBN: { type: Type.STRING, description: "The Black and White counter reading, labeled 'CONTADOR B/N:'." },
        contadorColor: { type: Type.STRING, description: "The Color counter reading, labeled 'CONTADOR COLOR:'." },
        contadorEscaner: { type: Type.STRING, description: "The Scanner counter reading, labeled 'CONTADOR ESCANER:'." },
        comentarios: { type: Type.STRING, description: "The full text from the section labeled 'Descripción del servicio'." },
    },
    required: ["folio", "serie", "fecha", "contadorBN", "contadorColor", "contadorEscaner", "comentarios"],
};

const uninstallationPrompt = `
You are an expert data extraction system for "Formato de Desinstalación de Equipo" documents. The provided PDF contains a scanned image. Perform OCR and extract the following information. If a field is not found, return an empty string "".

1.  **folio**: Find the main folio or request number.
2.  **serie**: Find the equipment serial number.
3.  **fecha**: Find the uninstallation date. Format as DD-MM-YY.
4.  **contadorBN**: Find the Black and White counter reading.
5.  **contadorColor**: Find the Color counter reading.
6.  **contadorEscaner**: Find the Scanner counter reading.
7.  **comentarios**: Find the text under the section labeled "Descripción del servicio". Extract the full description of the work performed.

Return only the extracted data in the specified JSON format.`;

export const extractUninstallationDataFromPdf = async (base64Pdf: string): Promise<ExtractedUninstallationData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: uninstallationPrompt }] },
        config: { responseMimeType: 'application/json', responseSchema: uninstallationResponseSchema },
    });
    const parsedData = JSON.parse(response.text.trim());
    return {
        folio: parsedData.folio || '',
        serie: parsedData.serie || '',
        fecha: parsedData.fecha || '',
        contadorBN: parsedData.contadorBN || '',
        contadorColor: parsedData.contadorColor || '',
        contadorEscaner: parsedData.contadorEscaner || '',
        comentarios: parsedData.comentarios || '',
    };
};

// --- Schema and Prompt for Installations ---
const installationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        folio: { type: Type.STRING, description: "The unique document number, often labeled 'Folio:' or 'No. de Solicitud'." },
        serie: { type: Type.STRING, description: "The equipment serial number, labeled 'SERIE:'." },
        fecha: { type: Type.STRING, description: "The date of the installation, labeled 'FECHA:'. Format as DD-MM-YY." },
        contadorBN: { type: Type.STRING, description: "The initial Black and White counter reading, labeled 'CONTADOR B/N:'." },
        comentarios: { type: Type.STRING, description: "The full text from the section labeled 'Descripción del servicio'." },
    },
    required: ["folio", "serie", "fecha", "contadorBN", "comentarios"],
};

const installationPrompt = `
You are an expert data extraction system for "Solicitud de Instalación" documents. The provided PDF contains a scanned image. Perform OCR and extract the following information. If a field is not found, return an empty string "".

1.  **folio**: Find the main folio or request number.
2.  **serie**: Find the equipment serial number.
3.  **fecha**: Find the installation date. Format as DD-MM-YY.
4.  **contadorBN**: Find the initial Black and White counter reading.
5.  **comentarios**: Find the text under the section labeled "Descripción del servicio". Extract the full description of the work performed.

Return only the extracted data in the specified JSON format.`;

export const extractInstallationDataFromPdf = async (base64Pdf: string): Promise<ExtractedInstallationData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: installationPrompt }] },
        config: { responseMimeType: 'application/json', responseSchema: installationResponseSchema },
    });
    const parsedData = JSON.parse(response.text.trim());
    return {
        folio: parsedData.folio || '',
        serie: parsedData.serie || '',
        fecha: parsedData.fecha || '',
        contadorBN: parsedData.contadorBN || '',
        comentarios: parsedData.comentarios || '',
    };
};