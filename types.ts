// --- Work Order Types ---

// Raw data from Gemini for a Work Order
export interface ExtractedWorkOrderData {
  orden: string;
  serie: string;
  fechaRegistro: string;
  categoria: string;
  descripcion: string;
  fechaCierre: string;
}

// Processed data for a Work Order, used in UI and export
export interface WorkOrderDocument {
  type: 'workOrder'; // Discriminator
  orden: string;
  archivo: string;
  serie: string;
  fechaRegistro: string;
  categoria: string;
  descripcion: string;
  fechaCierre: string;
  originalFileName: string; // Added to link back to the original File object
  error?: string; // Added to store specific error messages
}


// --- Supply Request Types ---

// Raw data from Gemini for a Supply Request (previously ExtractedData)
export interface ExtractedSupplyData {
  orden: string;
  serie: string;
  fechaRegistro: string;
  contadorBN: string;
  fechaEntrega: string;
}

// Processed data for a Supply Request (previously ProcessedDocument)
export interface SupplyRequestDocument {
  type: 'supplyRequest'; // Discriminator
  orden: string;
  archivo: string;
  serie: string;
  fechaRegistro: string;
  contador: string; // Mapped from ExtractedData.contadorBN
  fechaEntrega: string;
  originalFileName: string; // Added to link back to the original File object
  error?: string; // Added to store specific error messages
}

// --- Uninstallation Types ---

// Raw data from Gemini for an Uninstallation document
export interface ExtractedUninstallationData {
  folio: string;
  serie: string;
  fecha: string;
  contadorBN: string;
  contadorColor: string;
  contadorEscaner: string;
  comentarios: string;
}

// Processed data for an Uninstallation document
export interface UninstallationDocument {
  type: 'uninstallation';
  orden: string; // Mapped from folio
  archivo: string;
  serie: string;
  fecha: string;
  contadorBN: string;
  contadorColor: string;
  contadorEscaner: string;
  link: string;
  comentarios: string;
  originalFileName: string;
  error?: string;
}

// --- Installation Types ---

// Raw data from Gemini for an Installation document
export interface ExtractedInstallationData {
  folio: string;
  serie: string;
  fecha: string;
  contadorBN: string;
  comentarios: string;
}

// Processed data for an Installation document
export interface InstallationDocument {
  type: 'installation';
  orden: string; // Mapped from folio
  archivo: string;
  serie: string;
  fecha: string;
  contadorBN: string;
  link: string;
  comentarios: string;
  originalFileName: string;
  error?: string;
}


// Union type for holding any kind of processed document in state
export type AnyProcessedDocument = WorkOrderDocument | SupplyRequestDocument | UninstallationDocument | InstallationDocument;