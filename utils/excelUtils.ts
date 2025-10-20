import type { WorkOrderDocument, SupplyRequestDocument, UninstallationDocument, InstallationDocument, AnyProcessedDocument } from '../types';

// Let TypeScript know that XLSX is available globally from the CDN
declare const XLSX: any;

const applyStylesAndHyperlinks = (worksheet: any, data: AnyProcessedDocument[], baseUrl: string) => {
    // Add hyperlinks if a base URL is provided
    if (baseUrl && baseUrl.trim()) {
        const trimmedBaseUrl = baseUrl.trim().endsWith('/') ? baseUrl.trim() : `${baseUrl.trim()}/`;
        data.forEach((doc, index) => {
            const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 1 }); // Column B for 'ARCHIVOS'
            if (worksheet[cellRef] && worksheet[cellRef].v) {
                worksheet[cellRef].l = { Target: `${trimmedBaseUrl}${doc.archivo}`, Tooltip: `Abrir ${doc.archivo} desde OneDrive` };
            }
        });
    }

    // Define base and header styles
    const cellStyle = {
        font: { name: 'Aptos Narrow', sz: 11 },
        alignment: { vertical: 'top', wrapText: true }
    };
    const headerStyle = JSON.parse(JSON.stringify(cellStyle)); // Deep copy
    headerStyle.font.bold = true;

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = (R === 0) ? headerStyle : cellStyle;
            }
        }
    }
};

interface ExportData {
    workOrders: WorkOrderDocument[];
    supplyRequests: SupplyRequestDocument[];
    uninstallations: UninstallationDocument[];
    installations: InstallationDocument[];
    oneDriveUrls: { 
        workOrder: string; 
        supplyRequest: string;
        uninstallation: string;
        installation: string;
    };
}

export const exportToExcel = ({ workOrders, supplyRequests, uninstallations, installations, oneDriveUrls }: ExportData): void => {
    const workbook = XLSX.utils.book_new();

    // Process Work Orders
    if (workOrders.length > 0) {
        const worksheetData = workOrders.map(doc => ({
            'ORDEN': doc.orden,
            'ARCHIVOS': doc.archivo,
            'SERIE': doc.serie,
            'FECHA REGISTRO': doc.fechaRegistro,
            'CATEGORIA': doc.categoria,
            'DESCRIPCION': doc.descripcion,
            'FECHA CIERRE': doc.fechaCierre,
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 15 }, // ORDEN
            { wch: 25 }, // ARCHIVOS
            { wch: 20 }, // SERIE
            { wch: 20 }, // FECHA REGISTRO
            { wch: 20 }, // CATEGORIA
            { wch: 50 }, // DESCRIPCION
            { wch: 20 }, // FECHA CIERRE
        ];
        applyStylesAndHyperlinks(worksheet, workOrders, oneDriveUrls.workOrder);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes de Trabajo');
    }

    // Process Supply Requests
    if (supplyRequests.length > 0) {
        const worksheetData = supplyRequests.map(doc => ({
            'ORDEN': doc.orden,
            'ARCHIVOS': doc.archivo,
            'SERIE': doc.serie,
            'FECHA REGISTRO': doc.fechaRegistro,
            'CONTADOR': doc.contador,
            'FECHA ENTREGA': doc.fechaEntrega,
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 15 },  // ORDEN
            { wch: 40 }, // ARCHIVOS
            { wch: 20 }, // SERIE
            { wch: 20 }, // FECHA REGISTRO
            { wch: 15 }, // CONTADOR
            { wch: 20 }, // FECHA ENTREGA
        ];
        applyStylesAndHyperlinks(worksheet, supplyRequests, oneDriveUrls.supplyRequest);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos de Suministro');
    }

    // Process Uninstallations
    if (uninstallations.length > 0) {
        const worksheetData = uninstallations.map(doc => ({
            'FOLIO': doc.orden,
            'ARCHIVOS': doc.archivo,
            'SERIE': doc.serie,
            'FECHA': doc.fecha,
            'CONTADOR B/N': doc.contadorBN,
            'CONTADOR COLOR': doc.contadorColor,
            'CONTADOR ESCANER': doc.contadorEscaner,
            'LINK': doc.link,
            'COMENTARIOS': doc.comentarios,
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 15 }, // FOLIO
            { wch: 25 }, // ARCHIVOS
            { wch: 20 }, // SERIE
            { wch: 20 }, // FECHA
            { wch: 15 }, // CONTADOR B/N
            { wch: 15 }, // CONTADOR COLOR
            { wch: 15 }, // CONTADOR ESCANER
            { wch: 30 }, // LINK
            { wch: 50 }, // COMENTARIOS
        ];
        applyStylesAndHyperlinks(worksheet, uninstallations, oneDriveUrls.uninstallation);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Desinstalaciones');
    }

    // Process Installations
    if (installations.length > 0) {
        const worksheetData = installations.map(doc => ({
            'FOLIO': doc.orden,
            'ARCHIVOS': doc.archivo,
            'SERIE': doc.serie,
            'FECHA': doc.fecha,
            'CONTADOR B/N': doc.contadorBN,
            'LINK': doc.link,
            'COMENTARIOS': doc.comentarios,
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 15 }, // FOLIO
            { wch: 25 }, // ARCHIVOS
            { wch: 20 }, // SERIE
            { wch: 20 }, // FECHA
            { wch: 15 }, // CONTADOR B/N
            { wch: 30 }, // LINK
            { wch: 50 }, // COMENTARIOS
        ];
        applyStylesAndHyperlinks(worksheet, installations, oneDriveUrls.installation);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Instalaciones');
    }

    // Write the final workbook
    XLSX.writeFile(workbook, `Documentos_Procesados.xlsx`);
};