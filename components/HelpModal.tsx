import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const stepStyle = "flex items-start space-x-4 p-4 bg-green-50 rounded-lg";
  const emojiStyle = "text-3xl";
  const textContainerStyle = "flex flex-col";
  const titleStyle = "font-bold text-lg text-udlap-green";
  const descriptionStyle = "text-gray-600";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-udlap-green">¿Cómo funciona? 🤔</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="overflow-auto p-6 space-y-6">
            <p className="text-center text-gray-700">¡Es muy fácil! Sigue estos sencillos pasos para convertir tus documentos en datos útiles.</p>
            
            <div className={stepStyle}>
                <span className={emojiStyle}>📄</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>Paso 1: Sube tus archivos PDF</h3>
                    <p className={descriptionStyle}>
                        Haz clic en el gran recuadro punteado o simplemente arrastra y suelta todos los documentos PDF que quieras procesar. ¡Puedes subir muchos a la vez!
                    </p>
                </div>
            </div>

            <div className={stepStyle}>
                <span className={emojiStyle}>🔗</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>Paso 2: Enlaza tus archivos (¡si quieres!)</h3>
                    <p className={descriptionStyle}>
                        Si guardas tus PDFs en OneDrive o SharePoint, pega aquí el enlace a la carpeta. Así, podrás abrir el archivo original con un solo clic desde la tabla de resultados o el Excel. ¡Es opcional!
                    </p>
                </div>
            </div>

            <div className={stepStyle}>
                <span className={emojiStyle}>⚙️</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>Paso 3: ¡A procesar!</h3>
                    <p className={descriptionStyle}>
                        Presiona el botón "Procesar Documentos". Nuestra inteligencia artificial leerá cada documento, entenderá si es una orden de trabajo o un pedido, y sacará la información más importante.
                    </p>
                </div>
            </div>
            
            <div className={stepStyle}>
                <span className={emojiStyle}>📊</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>Paso 4: Revisa y descarga</h3>
                    <p className={descriptionStyle}>
                        Verás toda la información organizada en tablas. Puedes corregir cualquier dato, exportar todo a un archivo de Excel, o descargar tus PDFs renombrados en un archivo ZIP.
                    </p>
                </div>
            </div>

        </main>
        <footer className="p-4 border-t bg-white rounded-b-lg flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-udlap-green rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-udlap-green"
            >
                ¡Entendido!
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

export default HelpModal;