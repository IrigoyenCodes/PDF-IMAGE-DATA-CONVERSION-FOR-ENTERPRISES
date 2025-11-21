import React, { useState, useCallback, useMemo } from 'react';
import { fileToBase64 } from './utils/fileUtils';
import { 
    classifyDocument, 
    extractWorkOrderDataFromPdf, 
    extractSupplyDataFromPdf,
    extractUninstallationDataFromPdf,
    extractInstallationDataFromPdf
} from './services/geminiService';
import { exportToExcel } from './utils/excelUtils';
import type { AnyProcessedDocument, WorkOrderDocument, SupplyRequestDocument, UninstallationDocument, InstallationDocument } from './types';
import Loader from './components/Loader';
import { UploadIcon, PdfIcon, ExcelIcon, EyeIcon, ZipIcon, InfoIcon, RetryIcon, QuestionMarkIcon, ChevronDownIcon } from './components/Icons';
import PreviewModal from './components/PreviewModal';
import PdfThumbnail from './components/PdfThumbnail';
import HelpModal from './components/HelpModal';
import Dashboard from './components/Dashboard';

type DocumentType = 'workOrder' | 'supplyRequest' | 'uninstallation' | 'installation';

declare const JSZip: any;
declare const saveAs: any;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseSortableDate = (dateString: string): number => {
    if (!dateString) return Infinity;

    // Try parsing MM/DD/YY
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateString)) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // MM/DD/YY -> YYYY-MM-DD
            const isoDateString = `20${parts[2]}-${parts[0]}-${parts[1]}`;
            const date = new Date(isoDateString);
            if (!isNaN(date.getTime())) return date.getTime();
        }
    }

    // Try parsing DD-MM-YY
    if (/^\d{2}-\d{2}-\d{2}$/.test(dateString)) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // DD-MM-YY -> YYYY-MM-DD
            const isoDateString = `20${parts[2]}-${parts[1]}-${parts[0]}`;
            const date = new Date(isoDateString);
            if (!isNaN(date.getTime())) return date.getTime();
        }
    }

    return Infinity; // Return Infinity if no valid format is found
};


const App: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [processedData, setProcessedData] = useState<AnyProcessedDocument[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStatus, setLoadingStatus] = useState<string>('');
    const [isZipping, setIsZipping] = useState<Record<DocumentType, boolean>>({ workOrder: false, supplyRequest: false, uninstallation: false, installation: false });
    const [retryingIndex, setRetryingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewModalState, setPreviewModalState] = useState<{ isOpen: boolean; documentType: DocumentType | null }>({ isOpen: false, documentType: null });
    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(true);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number; startTime: number | null }>({ current: 0, total: 0, startTime: null });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
        if (droppedFiles.length !== e.dataTransfer.files.length) {
            showToast("Solo se aceptan archivos PDF. Algunos archivos fueron ignorados.", 'error');
        } else {
            showToast(`${droppedFiles.length} archivo${droppedFiles.length === 1 ? '' : 's'} cargado${droppedFiles.length === 1 ? '' : 's'} exitosamente`, 'success');
        }
        setFiles(droppedFiles);
        setProcessedData([]);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const selectedFiles = Array.from(event.target.files).filter((file: File) => file.type === 'application/pdf');
            if (selectedFiles.length !== event.target.files.length) {
                showToast("Solo se aceptan archivos PDF. Algunos archivos fueron ignorados.", 'error');
            } else {
                showToast(`${selectedFiles.length} archivo${selectedFiles.length === 1 ? '' : 's'} cargado${selectedFiles.length === 1 ? '' : 's'} exitosamente`, 'success');
                setError(null);
            }
            setFiles(selectedFiles);
            setProcessedData([]);
        }
    };
    
    const handleDataUpdate = useCallback((index: number, field: string, value: string) => {
        setProcessedData(prevData => {
            const newData = [...prevData];
            const dataForModal = previewModalState.documentType ? processedData.filter(d => d.type === previewModalState.documentType) : [];
            const originalIndex = prevData.findIndex(item => item.originalFileName === dataForModal[index]?.originalFileName);
            if (originalIndex !== -1) {
                const itemToUpdate = { ...newData[originalIndex] };
                (itemToUpdate as any)[field] = value;
                newData[originalIndex] = itemToUpdate;
            }
            return newData;
        });
    }, [processedData, previewModalState.documentType]);

    const handleProcessFiles = useCallback(async () => {
        if (files.length === 0) {
            showToast("Por favor, selecciona archivos PDF para procesar.", 'error');
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setProcessedData([]);
        setProcessingProgress({ current: 0, total: files.length, startTime: Date.now() });
        
        const allData: AnyProcessedDocument[] = [];
    
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
            setLoadingStatus(`Procesando ${i + 1}/${files.length}: ${file.name}`);
            
            try {
                const base64String = await fileToBase64(file);
                const type = await classifyDocument(base64String);
    
                if (type === 'unknown') {
                    throw new Error("No se pudo reconocer el tipo de documento.");
                }
                
                setLoadingStatus(`Extrayendo datos de: ${file.name}`);
                
                switch(type) {
                    case 'workOrder': {
                        const extractedData = await extractWorkOrderDataFromPdf(base64String);
                        allData.push({
                            type: 'workOrder',
                            orden: extractedData.orden,
                            archivo: extractedData.orden ? `${extractedData.orden}.pdf` : file.name,
                            serie: extractedData.serie,
                            fechaRegistro: extractedData.fechaRegistro,
                            categoria: extractedData.categoria,
                            descripcion: extractedData.descripcion,
                            fechaCierre: extractedData.fechaCierre,
                            originalFileName: file.name,
                        });
                        break;
                    }
                    case 'supplyRequest': {
                        const extractedData = await extractSupplyDataFromPdf(base64String);
                        allData.push({
                            type: 'supplyRequest',
                            orden: extractedData.orden,
                            archivo: extractedData.orden ? `${extractedData.orden}.pdf` : file.name,
                            serie: extractedData.serie,
                            fechaRegistro: extractedData.fechaRegistro,
                            contador: extractedData.contadorBN,
                            fechaEntrega: extractedData.fechaEntrega,
                            originalFileName: file.name,
                        });
                        break;
                    }
                    case 'uninstallation': {
                        const extractedData = await extractUninstallationDataFromPdf(base64String);
                        const archivoNombre = extractedData.folio ? `${extractedData.folio}.pdf` : file.name;
                        allData.push({
                            type: 'uninstallation',
                            orden: extractedData.folio,
                            archivo: archivoNombre,
                            serie: extractedData.serie,
                            fecha: extractedData.fecha,
                            contadorBN: extractedData.contadorBN,
                            contadorColor: extractedData.contadorColor,
                            contadorEscaner: extractedData.contadorEscaner,
                            link: archivoNombre,
                            comentarios: extractedData.comentarios,
                            originalFileName: file.name,
                        });
                        break;
                    }
                    case 'installation': {
                        const extractedData = await extractInstallationDataFromPdf(base64String);
                        const archivoNombre = extractedData.folio ? `${extractedData.folio}.pdf` : file.name;
                        allData.push({
                            type: 'installation',
                            orden: extractedData.folio,
                            archivo: archivoNombre,
                            serie: extractedData.serie,
                            fecha: extractedData.fecha,
                            contadorBN: extractedData.contadorBN,
                            link: archivoNombre,
                            comentarios: extractedData.comentarios,
                            originalFileName: file.name,
                        });
                        break;
                    }
                }
            } catch (err) {
                 console.error(`Fallo al procesar ${file.name}:`, err);
                const errorMessage = (err as Error).message || 'Ocurrió un error desconocido.';
                allData.push({ type: 'workOrder', orden: 'Fallo de Procesamiento', archivo: file.name, serie: 'Error', fechaRegistro: '', categoria: 'Error', descripcion: 'Error', fechaCierre: '', originalFileName: file.name, error: errorMessage });
            }
            
            setProcessedData([...allData]); // Update UI after each file
            await delay(200); // Add a small delay between files to avoid rate limiting
        }
    
        const sortedData = [...allData].sort((a, b) => {
            const dateA = parseSortableDate('fechaRegistro' in a ? a.fechaRegistro : ('fecha' in a ? a.fecha : ''));
            const dateB = parseSortableDate('fechaRegistro' in b ? b.fechaRegistro : ('fecha' in b ? b.fecha : ''));
            return dateA - dateB;
        });
        
        setProcessedData(sortedData);
        setLoadingStatus('');
        setIsLoading(false);
        setProcessingProgress({ current: 0, total: 0, startTime: null });
        
        const successCount = allData.filter(d => d.orden !== 'Fallo de Procesamiento').length;
        const failCount = allData.length - successCount;
        showToast(`Procesamiento completado: ${successCount} exitoso${successCount === 1 ? '' : 's'}${failCount > 0 ? `, ${failCount} fallido${failCount === 1 ? '' : 's'}` : ''}`, failCount > 0 ? 'info' : 'success');
    }, [files]);

    const handleRetryFile = useCallback(async (index: number) => {
        setRetryingIndex(index);
        const docToRetry = processedData[index];
        const originalFile = files.find(f => f.name === docToRetry.originalFileName);

        if (!originalFile) {
            console.error("No se encontró el archivo original para reintentar.");
            setRetryingIndex(null);
            return;
        }

        try {
            const base64String = await fileToBase64(originalFile);
            const classifiedType = await classifyDocument(base64String);

            if (classifiedType === 'unknown') {
                 throw new Error("No se pudo reconocer el tipo de documento al reintentar.");
            }

            let newData: AnyProcessedDocument;

            switch (classifiedType) {
                case 'workOrder': {
                    const extractedData = await extractWorkOrderDataFromPdf(base64String);
                     newData = {
                        type: 'workOrder',
                        orden: extractedData.orden,
                        archivo: extractedData.orden ? `${extractedData.orden}.pdf` : originalFile.name,
                        serie: extractedData.serie,
                        fechaRegistro: extractedData.fechaRegistro,
                        categoria: extractedData.categoria,
                        descripcion: extractedData.descripcion,
                        fechaCierre: extractedData.fechaCierre,
                        originalFileName: originalFile.name,
                    };
                    break;
                }
                case 'supplyRequest': {
                     const extractedData = await extractSupplyDataFromPdf(base64String);
                     newData = {
                        type: 'supplyRequest',
                        orden: extractedData.orden,
                        archivo: extractedData.orden ? `${extractedData.orden}.pdf` : originalFile.name,
                        serie: extractedData.serie,
                        fechaRegistro: extractedData.fechaRegistro,
                        contador: extractedData.contadorBN,
                        fechaEntrega: extractedData.fechaEntrega,
                        originalFileName: originalFile.name,
                    };
                    break;
                }
                case 'uninstallation': {
                    const extractedData = await extractUninstallationDataFromPdf(base64String);
                    const archivoNombre = extractedData.folio ? `${extractedData.folio}.pdf` : originalFile.name;
                    newData = {
                        type: 'uninstallation',
                        orden: extractedData.folio,
                        archivo: archivoNombre,
                        serie: extractedData.serie,
                        fecha: extractedData.fecha,
                        contadorBN: extractedData.contadorBN,
                        contadorColor: extractedData.contadorColor,
                        contadorEscaner: extractedData.contadorEscaner,
                        link: archivoNombre,
                        comentarios: extractedData.comentarios,
                        originalFileName: originalFile.name,
                    };
                    break;
                }
                case 'installation': {
                    const extractedData = await extractInstallationDataFromPdf(base64String);
                    const archivoNombre = extractedData.folio ? `${extractedData.folio}.pdf` : originalFile.name;
                    newData = {
                        type: 'installation',
                        orden: extractedData.folio,
                        archivo: archivoNombre,
                        serie: extractedData.serie,
                        fecha: extractedData.fecha,
                        contadorBN: extractedData.contadorBN,
                        link: archivoNombre,
                        comentarios: extractedData.comentarios,
                        originalFileName: originalFile.name,
                    };
                    break;
                }
            }
            
            setProcessedData(prevData => {
                const updatedData = [...prevData];
                updatedData[index] = newData;
                return updatedData;
            });

        } catch (err) {
             const errorMessage = (err as Error).message || 'El intento de re-procesar falló.';
             setProcessedData(prevData => {
                const updatedData = [...prevData];
                const failedDoc = { ...updatedData[index] };
                failedDoc.error = errorMessage;
                updatedData[index] = failedDoc;
                return updatedData;
            });
        } finally {
            setRetryingIndex(null);
        }
    }, [processedData, files]);

    const handleExportAll = () => {
        const dataToExport = {
            workOrders: processedData.filter(d => d.type === 'workOrder' && d.orden !== 'Fallo de Procesamiento') as WorkOrderDocument[],
            supplyRequests: processedData.filter(d => d.type === 'supplyRequest' && d.orden !== 'Fallo de Procesamiento') as SupplyRequestDocument[],
            uninstallations: processedData.filter(d => d.type === 'uninstallation' && d.orden !== 'Fallo de Procesamiento') as UninstallationDocument[],
            installations: processedData.filter(d => d.type === 'installation' && d.orden !== 'Fallo de Procesamiento') as InstallationDocument[],
        }
        
        if (Object.values(dataToExport).some(arr => arr.length > 0)) {
            exportToExcel({ ...dataToExport });
        }
    };
    
    const handleDownloadZip = async (docType: DocumentType) => {
        const dataToZip = processedData.filter(d => d.type === docType && d.orden !== 'Fallo de Procesamiento');
        if (dataToZip.length === 0) return;
        
        setIsZipping(prev => ({ ...prev, [docType]: true }));
        try {
            const zip = new JSZip();
            for (const doc of dataToZip) {
                if (doc.orden !== 'Fallo de Procesamiento') {
                    const originalFile = files.find(f => f.name === doc.originalFileName);
                    if (originalFile) {
                        zip.file(doc.archivo, originalFile);
                    }
                }
            }
            
            let zipName = 'Documentos_Renombrados.zip';
            if (docType === 'workOrder') zipName = 'Ordenes_de_Trabajo_Renombradas.zip';
            if (docType === 'supplyRequest') zipName = 'Pedidos_de_Suministro_Renombrados.zip';
            if (docType === 'uninstallation') zipName = 'Desinstalaciones_Renombradas.zip';
            if (docType === 'installation') zipName = 'Instalaciones_Renombradas.zip';
            
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, zipName);
        } catch (err) {
            console.error("Fallo al crear el archivo ZIP:", err);
            setError("No se pudo generar el archivo ZIP. Por favor, intenta de nuevo.");
        } finally {
            setIsZipping(prev => ({ ...prev, [docType]: false }));
        }
    };

    const renderTable = (data: AnyProcessedDocument[], documentType: DocumentType) => {
        if (data.length === 0) return null;

        const hasFailures = data.some(d => d.orden === 'Fallo de Procesamiento');
        const headers = {
            workOrder: (
                <tr>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Vista Previa</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ORDEN</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ARCHIVOS</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">SERIE</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA REGISTRO</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CATEGORIA</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">DESCRIPCION</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA CIERRE</th>
                    {hasFailures && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Acciones</th>}
                </tr>
            ),
            supplyRequest: (
                 <tr>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Vista Previa</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ORDEN</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ARCHIVOS</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">SERIE</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA REGISTRO</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CONTADOR</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA ENTREGA</th>
                    {hasFailures && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Acciones</th>}
                </tr>
            ),
            uninstallation: (
                <tr>
                   <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Vista Previa</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FOLIO</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ARCHIVOS</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">SERIE</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CONTADOR B/N</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CONTADOR COLOR</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CONTADOR ESCANER</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">LINK</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">COMENTARIOS</th>
                   {hasFailures && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Acciones</th>}
               </tr>
           ),
           installation: (
                <tr>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Vista Previa</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FOLIO</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">ARCHIVOS</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">SERIE</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">FECHA</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">CONTADOR B/N</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">LINK</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">COMENTARIOS</th>
                    {hasFailures && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-udlap-green uppercase tracking-wider">Acciones</th>}
                </tr>
           )
        };

        const renderRow = (rowData: AnyProcessedDocument, globalIndex: number) => {
            const originalFile = files.find(f => f.name === rowData.originalFileName);
            const isFailed = rowData.orden === 'Fallo de Procesamiento';
            const isRetrying = retryingIndex === globalIndex;

            const fileCellContent = rowData.archivo;

            const rowClasses = isFailed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50';

            const commonCells = (
                <>
                    <td className="px-2 py-2 whitespace-nowrap">
                        {originalFile && (
                             <a href={URL.createObjectURL(originalFile)} target="_blank" rel="noopener noreferrer" title={`Previsualizar ${originalFile.name}`}>
                                <PdfThumbnail file={originalFile} />
                            </a>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isFailed ? (
                            <div className="flex items-center">
                                <span className="text-red-600">{rowData.orden}</span>
                                {rowData.error && (
                                    <div className="ml-2 group relative">
                                        <InfoIcon />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            {rowData.error}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : rowData.orden}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={rowData.archivo}>{fileCellContent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.serie}</td>
                </>
            );
            
            const actionsCell = (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isFailed && (
                        <button 
                            onClick={() => handleRetryFile(globalIndex)} 
                            disabled={isRetrying}
                            className="p-1.5 bg-udlap-orange text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-wait transition-colors"
                            title="Reintentar procesamiento"
                        >
                            {isRetrying ? <Loader /> : <RetryIcon />}
                        </button>
                    )}
                </td>
            );

            if (rowData.type === 'workOrder') {
                return (
                    <tr key={globalIndex} className={rowClasses}>
                        {commonCells}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fechaRegistro}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.categoria}</td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-sm" title={rowData.descripcion}>{rowData.descripcion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fechaCierre}</td>
                        {hasFailures && actionsCell}
                    </tr>
                );
            }
            if (rowData.type === 'supplyRequest') {
                return (
                     <tr key={globalIndex} className={rowClasses}>
                        {commonCells}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fechaRegistro}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.contador}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fechaEntrega}</td>
                        {hasFailures && actionsCell}
                    </tr>
                );
            }
            if (rowData.type === 'uninstallation') {
                return (
                     <tr key={globalIndex} className={rowClasses}>
                        {commonCells}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fecha}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.contadorBN}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.contadorColor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.contadorEscaner}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={rowData.link}>{rowData.link}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={rowData.comentarios}>{rowData.comentarios}</td>
                        {hasFailures && actionsCell}
                    </tr>
                );
            }
            if (rowData.type === 'installation') {
                return (
                     <tr key={globalIndex} className={rowClasses}>
                        {commonCells}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.fecha}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowData.contadorBN}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={rowData.link}>{rowData.link}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={rowData.comentarios}>{rowData.comentarios}</td>
                        {hasFailures && actionsCell}
                    </tr>
                );
            }
            return null;
        };

        return (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-50">
                        {headers[documentType]}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item, index) => renderRow(item, processedData.indexOf(item)))}
                    </tbody>
                </table>
            </div>
        );
    };

    const workOrders = processedData.filter(d => d.type === 'workOrder' && d.orden !== 'Fallo de Procesamiento');
    const supplyRequests = processedData.filter(d => d.type === 'supplyRequest' && d.orden !== 'Fallo de Procesamiento');
    const uninstallations = processedData.filter(d => d.type === 'uninstallation' && d.orden !== 'Fallo de Procesamiento');
    const installations = processedData.filter(d => d.type === 'installation' && d.orden !== 'Fallo de Procesamiento');
    const failedDocs = processedData.filter(d => d.orden === 'Fallo de Procesamiento');
    const dataForModal = previewModalState.documentType ? processedData.filter(d => d.type === previewModalState.documentType) : [];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto">
                <header className="text-center mb-10 relative">
                    <h1 className="text-4xl font-bold text-udlap-green">Extractor de Datos de Documentos</h1>
                    <p className="mt-2 text-lg text-gray-600">Sube tus archivos PDF y deja que la IA clasifique y extraiga la información clave automáticamente.</p>
                     <button
                        onClick={() => setIsHelpModalOpen(true)}
                        className="absolute top-0 right-0 flex items-center px-4 py-2 text-sm font-medium text-udlap-green bg-white border border-udlap-green rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green"
                    >
                        <QuestionMarkIcon />
                        Cómo Usar
                    </button>
                </header>

                <main className="bg-white rounded-xl shadow-lg p-8 space-y-8">
                    <section id="upload-section">
                         <h2 className="text-lg font-semibold text-udlap-green text-center mb-4">1. Sube tus Archivos</h2>
                        <label 
                            htmlFor="file-upload" 
                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                                isDragging 
                                    ? 'border-udlap-orange bg-orange-50 scale-105 shadow-lg' 
                                    : 'border-udlap-green bg-green-50 hover:bg-green-100'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className={`transition-transform duration-200 ${isDragging ? 'scale-125' : ''}`}>
                                    <UploadIcon />
                                </div>
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className={`font-semibold ${isDragging ? 'text-udlap-orange' : 'text-udlap-green'}`}>
                                        {isDragging ? 'Suelta los archivos aquí' : 'Haz clic para subir'}
                                    </span>
                                    {!isDragging && ' o arrastra y suelta'}
                                </p>
                                <p className="text-xs text-gray-500">Solo archivos PDF</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" multiple accept=".pdf" onChange={handleFileChange} />
                        </label>
                        
                        {files.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-udlap-green">Archivos seleccionados: {files.length}</h3>
                                <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-48 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <li key={index} className="flex items-center text-sm text-gray-600 bg-gray-100 p-2 rounded">
                                            <PdfIcon />
                                            <span className="ml-2 truncate" title={file.name}>{file.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                    
                    {error && <div className="text-red-600 bg-red-100 p-3 rounded-md my-4">{error}</div>}

                    <section id="controls" className="flex flex-col items-center">
                         <h2 className="text-lg font-semibold text-udlap-green text-center mb-4">3. Procesa los Archivos</h2>
                         <div className="w-full space-y-4 flex flex-col items-center">
                            <button
                                onClick={handleProcessFiles}
                                disabled={isLoading || files.length === 0}
                                className="flex items-center justify-center w-full sm:w-auto px-8 py-3 text-base font-medium text-white bg-udlap-green border border-transparent rounded-md shadow-sm hover:bg-green-900 disabled:bg-green-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader />
                                        <span className="ml-3 truncate max-w-sm">{loadingStatus || 'Inicializando...'}</span>
                                    </>
                                ) : `Procesar ${files.length} Documento${files.length === 1 ? '' : 's'}`}
                            </button>
                            
                            {isLoading && processingProgress.total > 0 && (
                                <div className="w-full max-w-2xl mx-auto space-y-2 animate-fade-in">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Progreso: {processingProgress.current} de {processingProgress.total}</span>
                                        <span>{Math.round((processingProgress.current / processingProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-udlap-green h-3 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    {processingProgress.startTime && processingProgress.current > 0 && (
                                        <div className="text-xs text-gray-500 text-center">
                                            Tiempo estimado restante: {(() => {
                                                const elapsed = Date.now() - processingProgress.startTime;
                                                const avgTimePerFile = elapsed / processingProgress.current;
                                                const remaining = avgTimePerFile * (processingProgress.total - processingProgress.current);
                                                const minutes = Math.floor(remaining / 60000);
                                                const seconds = Math.floor((remaining % 60000) / 1000);
                                                return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                    
                    {processedData.length > 0 && <hr/>}

                    {processedData.length > 0 && (
                        <section id="export-section" className="text-center py-6 my-4">
                            <h2 className="text-2xl font-semibold text-udlap-green mb-4">4. Exportar Resultados</h2>
                            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                                Exporta todos los documentos procesados a un único archivo de Excel. Cada tipo de documento se organizará en su propia hoja de cálculo dentro del archivo para mayor claridad.
                            </p>
                            <button
                                onClick={handleExportAll}
                                disabled={workOrders.length === 0 && supplyRequests.length === 0 && uninstallations.length === 0 && installations.length === 0}
                                className="flex items-center justify-center mx-auto w-full sm:w-auto px-8 py-3 text-base font-medium text-white bg-udlap-green border border-transparent rounded-md shadow-sm hover:bg-green-900 disabled:bg-green-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green transition-all"
                            >
                                <ExcelIcon />
                                <span className="ml-2">Exportar Todo a Excel</span>
                            </button>
                        </section>
                    )}
                    
                    {processedData.length > 0 && (
                        <section id="dashboard-section" className="bg-gray-100 rounded-lg p-4 sm:p-6 my-6 transition-all duration-300">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDashboardOpen(!isDashboardOpen)} role="button" aria-expanded={isDashboardOpen}>
                                <h2 className="text-2xl font-semibold text-udlap-green">Resumen del Procesamiento</h2>
                                <ChevronDownIcon className={`h-6 w-6 text-udlap-green transform transition-transform ${isDashboardOpen ? '' : '-rotate-90'}`} />
                            </div>
                             {isDashboardOpen && <Dashboard data={processedData} />}
                        </section>
                    )}

                    {processedData.length > 0 && (
                        <div className="space-y-12">
                            <section id="work-order-results">
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-udlap-green">Órdenes de Trabajo ({workOrders.length})</h2>
                                    {workOrders.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setPreviewModalState({isOpen: true, documentType: 'workOrder'})}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-orange rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-orange"
                                            >
                                                <EyeIcon />
                                                Previsualizar y Editar
                                            </button>
                                            <button
                                                onClick={() => handleDownloadZip('workOrder')}
                                                disabled={isZipping.workOrder}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green disabled:bg-green-300"
                                            >
                                                {isZipping.workOrder ? <Loader /> : <ZipIcon />}
                                                <span className={isZipping.workOrder ? 'ml-2' : ''}>
                                                    {isZipping.workOrder ? 'Comprimiendo...' : 'Renombrar y Descargar ZIP'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {workOrders.length > 0 ? (
                                    renderTable(workOrders, 'workOrder')
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                        <p className="text-gray-500">No se encontraron órdenes de trabajo en los archivos procesados.</p>
                                    </div>
                                )}
                            </section>

                            <section id="supply-request-results">
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-udlap-green">Pedidos de Suministros ({supplyRequests.length})</h2>
                                    {supplyRequests.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setPreviewModalState({isOpen: true, documentType: 'supplyRequest'})}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-orange rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-orange"
                                            >
                                                <EyeIcon />
                                                Previsualizar y Editar
                                            </button>
                                            <button
                                                onClick={() => handleDownloadZip('supplyRequest')}
                                                disabled={isZipping.supplyRequest}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green disabled:bg-green-300"
                                            >
                                                {isZipping.supplyRequest ? <Loader /> : <ZipIcon />}
                                                <span className={isZipping.supplyRequest ? 'ml-2' : ''}>
                                                    {isZipping.supplyRequest ? 'Comprimiendo...' : 'Renombrar y Descargar ZIP'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {supplyRequests.length > 0 ? (
                                    renderTable(supplyRequests, 'supplyRequest')
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                        <p className="text-gray-500">No se encontraron pedidos de suministros en los archivos procesados.</p>
                                    </div>
                                )}
                            </section>

                            <section id="uninstallation-results">
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-udlap-green">Desinstalaciones ({uninstallations.length})</h2>
                                    {uninstallations.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setPreviewModalState({isOpen: true, documentType: 'uninstallation'})}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-orange rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-orange"
                                            >
                                                <EyeIcon />
                                                Previsualizar y Editar
                                            </button>
                                            <button
                                                onClick={() => handleDownloadZip('uninstallation')}
                                                disabled={isZipping.uninstallation}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green disabled:bg-green-300"
                                            >
                                                {isZipping.uninstallation ? <Loader /> : <ZipIcon />}
                                                <span className={isZipping.uninstallation ? 'ml-2' : ''}>
                                                    {isZipping.uninstallation ? 'Comprimiendo...' : 'Renombrar y Descargar ZIP'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {uninstallations.length > 0 ? (
                                    renderTable(uninstallations, 'uninstallation')
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                        <p className="text-gray-500">No se encontraron desinstalaciones en los archivos procesados.</p>
                                    </div>
                                )}
                            </section>

                             <section id="installation-results">
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-udlap-green">Solicitudes de Instalación ({installations.length})</h2>
                                    {installations.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setPreviewModalState({isOpen: true, documentType: 'installation'})}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-orange rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-orange"
                                            >
                                                <EyeIcon />
                                                Previsualizar y Editar
                                            </button>
                                            <button
                                                onClick={() => handleDownloadZip('installation')}
                                                disabled={isZipping.installation}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green disabled:bg-green-300"
                                            >
                                                {isZipping.installation ? <Loader /> : <ZipIcon />}
                                                <span className={isZipping.installation ? 'ml-2' : ''}>
                                                    {isZipping.installation ? 'Comprimiendo...' : 'Renombrar y Descargar ZIP'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {installations.length > 0 ? (
                                    renderTable(installations, 'installation')
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                        <p className="text-gray-500">No se encontraron solicitudes de instalación en los archivos procesados.</p>
                                    </div>
                                )}
                            </section>

                            {failedDocs.length > 0 && (
                                <section id="failed-results">
                                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                        <h2 className="text-2xl font-semibold text-red-600">Documentos Fallidos o No Reconocidos ({failedDocs.length})</h2>
                                    </div>
                                    {renderTable(failedDocs, 'workOrder')}
                                </section>
                            )}
                        </div>
                    )}
                </main>

                <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

                <PreviewModal 
                    isOpen={previewModalState.isOpen} 
                    onClose={() => setPreviewModalState({ isOpen: false, documentType: null })} 
                    data={dataForModal} 
                    documentType={previewModalState.documentType!}
                    onUpdateData={handleDataUpdate}
                />

                {/* Toast Notification */}
                {toast && (
                    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                        <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md ${
                            toast.type === 'success' ? 'bg-green-600 text-white' :
                            toast.type === 'error' ? 'bg-red-600 text-white' :
                            'bg-blue-600 text-white'
                        }`}>
                            <div className="flex-shrink-0">
                                {toast.type === 'success' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {toast.type === 'error' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {toast.type === 'info' && (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <p className="font-medium">{toast.message}</p>
                            <button 
                                onClick={() => setToast(null)}
                                className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;