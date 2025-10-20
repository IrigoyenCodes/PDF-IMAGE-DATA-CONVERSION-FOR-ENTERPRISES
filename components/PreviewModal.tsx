import React, { useState } from 'react';
import type { AnyProcessedDocument, WorkOrderDocument, SupplyRequestDocument, UninstallationDocument, InstallationDocument } from '../types';
import { ClipboardIcon } from './Icons';

type DocumentType = 'workOrder' | 'supplyRequest' | 'uninstallation' | 'installation';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnyProcessedDocument[];
  documentType: DocumentType;
  oneDriveUrls: { 
      workOrder: string; 
      supplyRequest: string;
      uninstallation: string;
      installation: string;
    };
  onUpdateData: (index: number, field: string, value: string) => void;
}

const EditableCell: React.FC<{ value: string; onChange: (newValue: string) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full bg-transparent focus:outline-none focus:bg-orange-100 focus:ring-2 focus:ring-udlap-orange rounded-sm px-2 py-1"
    />
  );
};

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, data, documentType, onUpdateData, oneDriveUrls }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
      let rows: string[];

      switch(documentType) {
        case 'workOrder':
            rows = data
              .filter((d): d is WorkOrderDocument => d.type === 'workOrder')
              .map(d => [d.orden, d.archivo, d.serie, d.fechaRegistro, d.categoria, d.descripcion, d.fechaCierre].join('\t'));
            break;
        case 'supplyRequest':
            rows = data
              .filter((d): d is SupplyRequestDocument => d.type === 'supplyRequest')
              .map(d => [d.orden, d.archivo, d.serie, d.fechaRegistro, d.contador, d.fechaEntrega].join('\t'));
            break;
        case 'uninstallation':
            rows = data
                .filter((d): d is UninstallationDocument => d.type === 'uninstallation')
                .map(d => [d.orden, d.archivo, d.serie, d.fecha, d.contadorBN, d.contadorColor, d.contadorEscaner, d.link, d.comentarios].join('\t'));
            break;
        case 'installation':
            rows = data
                .filter((d): d is InstallationDocument => d.type === 'installation')
                .map(d => [d.orden, d.archivo, d.serie, d.fecha, d.contadorBN, d.link, d.comentarios].join('\t'));
            break;
        default:
            return;
      }

      const tsvContent = rows.join('\n');

      navigator.clipboard.writeText(tsvContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
  };


  const renderHeaders = () => {
    const headerClasses = "p-2 text-left text-xs font-bold text-udlap-green uppercase tracking-wider border border-gray-300 bg-green-100 sticky top-0";
    if (documentType === 'workOrder') {
      return (
        <tr>
          <th className={headerClasses}>ORDEN</th>
          <th className={headerClasses}>ARCHIVOS</th>
          <th className={headerClasses}>SERIE</th>
          <th className={headerClasses}>FECHA REGISTRO</th>
          <th className={headerClasses}>CATEGORIA</th>
          <th className={headerClasses}>DESCRIPCION</th>
          <th className={headerClasses}>FECHA CIERRE</th>
        </tr>
      );
    }
    if (documentType === 'supplyRequest') {
        return (
          <tr>
            <th className={headerClasses}>ORDEN</th>
            <th className={headerClasses}>ARCHIVOS</th>
            <th className={headerClasses}>SERIE</th>
            <th className={headerClasses}>FECHA REGISTRO</th>
            <th className={headerClasses}>CONTADOR</th>
            <th className={headerClasses}>FECHA ENTREGA</th>
          </tr>
        );
    }
    if (documentType === 'uninstallation') {
        return (
          <tr>
            <th className={headerClasses}>FOLIO</th>
            <th className={headerClasses}>ARCHIVOS</th>
            <th className={headerClasses}>SERIE</th>
            <th className={headerClasses}>FECHA</th>
            <th className={headerClasses}>CONTADOR B/N</th>
            <th className={headerClasses}>CONTADOR COLOR</th>
            <th className={headerClasses}>CONTADOR ESCANER</th>
            <th className={headerClasses}>LINK</th>
            <th className={headerClasses}>COMENTARIOS</th>
          </tr>
        );
    }
    if (documentType === 'installation') {
        return (
          <tr>
            <th className={headerClasses}>FOLIO</th>
            <th className={headerClasses}>ARCHIVOS</th>
            <th className={headerClasses}>SERIE</th>
            <th className={headerClasses}>FECHA</th>
            <th className={headerClasses}>CONTADOR B/N</th>
            <th className={headerClasses}>LINK</th>
            <th className={headerClasses}>COMENTARIOS</th>
          </tr>
        );
    }
    return null;
  };

  const renderRow = (item: AnyProcessedDocument, index: number) => {
    const baseUrl = oneDriveUrls[item.type];
    const fileLink = baseUrl && baseUrl.trim() ? `${baseUrl.trim().endsWith('/') ? baseUrl.trim() : baseUrl.trim() + '/'}${item.archivo}` : null;
    
    const fileCellContent = fileLink ? (
        <a href={fileLink} target="_blank" rel="noopener noreferrer" className="text-udlap-orange hover:text-orange-700 hover:underline">
            {item.archivo}
        </a>
    ) : (
        item.archivo
    );
    const cellClasses = "p-0 border border-gray-300 text-sm text-gray-800 align-top";
    const nonEditableCellClasses = "p-2 border border-gray-300 text-sm text-gray-800 align-top max-w-xs truncate";

    if (item.type === 'workOrder') {
      return (
        <tr key={index} className="bg-white hover:bg-gray-50">
          <td className={cellClasses}><EditableCell value={item.orden} onChange={(val) => onUpdateData(index, 'orden', val)} /></td>
          <td className={nonEditableCellClasses} title={item.archivo}>{fileCellContent}</td>
          <td className={cellClasses}><EditableCell value={item.serie} onChange={(val) => onUpdateData(index, 'serie', val)} /></td>
          <td className={cellClasses}><EditableCell value={item.fechaRegistro} onChange={(val) => onUpdateData(index, 'fechaRegistro', val)} /></td>
          <td className={cellClasses}><EditableCell value={item.categoria} onChange={(val) => onUpdateData(index, 'categoria', val)} /></td>
          <td className={cellClasses}><EditableCell value={item.descripcion} onChange={(val) => onUpdateData(index, 'descripcion', val)} /></td>
          <td className={cellClasses}><EditableCell value={item.fechaCierre} onChange={(val) => onUpdateData(index, 'fechaCierre', val)} /></td>
        </tr>
      );
    }
    if (item.type === 'supplyRequest') {
       return (
         <tr key={index} className="bg-white hover:bg-gray-50">
           <td className={cellClasses}><EditableCell value={item.orden} onChange={(val) => onUpdateData(index, 'orden', val)} /></td>
           <td className={nonEditableCellClasses} title={item.archivo}>{fileCellContent}</td>
           <td className={cellClasses}><EditableCell value={item.serie} onChange={(val) => onUpdateData(index, 'serie', val)} /></td>
           <td className={cellClasses}><EditableCell value={item.fechaRegistro} onChange={(val) => onUpdateData(index, 'fechaRegistro', val)} /></td>
           <td className={cellClasses}><EditableCell value={item.contador} onChange={(val) => onUpdateData(index, 'contador', val)} /></td>
           <td className={cellClasses}><EditableCell value={item.fechaEntrega} onChange={(val) => onUpdateData(index, 'fechaEntrega', val)} /></td>
         </tr>
       );
    }
    if (item.type === 'uninstallation') {
        return (
          <tr key={index} className="bg-white hover:bg-gray-50">
            <td className={cellClasses}><EditableCell value={item.orden} onChange={(val) => onUpdateData(index, 'orden', val)} /></td>
            <td className={nonEditableCellClasses} title={item.archivo}>{fileCellContent}</td>
            <td className={cellClasses}><EditableCell value={item.serie} onChange={(val) => onUpdateData(index, 'serie', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.fecha} onChange={(val) => onUpdateData(index, 'fecha', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.contadorBN} onChange={(val) => onUpdateData(index, 'contadorBN', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.contadorColor} onChange={(val) => onUpdateData(index, 'contadorColor', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.contadorEscaner} onChange={(val) => onUpdateData(index, 'contadorEscaner', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.link} onChange={(val) => onUpdateData(index, 'link', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.comentarios} onChange={(val) => onUpdateData(index, 'comentarios', val)} /></td>
          </tr>
        );
    }
     if (item.type === 'installation') {
        return (
          <tr key={index} className="bg-white hover:bg-gray-50">
            <td className={cellClasses}><EditableCell value={item.orden} onChange={(val) => onUpdateData(index, 'orden', val)} /></td>
            <td className={nonEditableCellClasses} title={item.archivo}>{fileCellContent}</td>
            <td className={cellClasses}><EditableCell value={item.serie} onChange={(val) => onUpdateData(index, 'serie', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.fecha} onChange={(val) => onUpdateData(index, 'fecha', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.contadorBN} onChange={(val) => onUpdateData(index, 'contadorBN', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.link} onChange={(val) => onUpdateData(index, 'link', val)} /></td>
            <td className={cellClasses}><EditableCell value={item.comentarios} onChange={(val) => onUpdateData(index, 'comentarios', val)} /></td>
          </tr>
        );
    }
    return null;
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-udlap-green">Previsualizar y Editar Datos</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyToClipboard}
              className={`flex items-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${isCopied ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
            >
              <ClipboardIcon />
              {isCopied ? '¡Copiado!' : 'Copiar Tabla'}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <main className="overflow-auto p-6 bg-gray-50">
          <div className="overflow-auto border border-gray-300">
            <table className="min-w-full bg-white">
              <thead>
                {renderHeaders()}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map(renderRow)}
              </tbody>
            </table>
          </div>
        </main>
        <footer className="p-4 border-t bg-white rounded-b-lg flex justify-end">
             <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green"
            >
                Hecho
            </button>
        </footer>
      </div>
       <style>{`
        @keyframes fade-in-scale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PreviewModal;