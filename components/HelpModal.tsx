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
            <p className="text-center text-gray-700 mb-6">Transforma tus documentos en datos útiles en 4 sencillos pasos:</p>
            
            <div className={stepStyle}>
                <span className={emojiStyle}>📥</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>1. Carga de Archivos</h3>
                    <p className="text-gray-700 mb-2">
                        <strong>Qué necesitas:</strong>
                    </p>
                    <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-600">
                        <li>Archivos PDF de órdenes de trabajo, pedidos, instalaciones o desinstalaciones</li>
                        <li>Tamaño máximo: 10MB por archivo</li>
                        <li>Recomendado: 10-20 archivos por lote</li>
                    </ul>
                </div>
            </div>

            <div className={stepStyle}>
                <span className={emojiStyle}>⚡</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>2. Procesamiento Inteligente</h3>
                    <p className="text-gray-700 mb-2">
                        <strong>Lo que hace la IA:</strong>
                    </p>
                    <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-600">
                        <li>Identifica el tipo de documento automáticamente</li>
                        <li>Extrae números de orden, fechas, series y más</li>
                        <li>Procesa aproximadamente 2-5 segundos por página</li>
                    </ul>
                </div>
            </div>

            <div className={stepStyle}>
                <span className={emojiStyle}>✅</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>3. Revisión y Edición</h3>
                    <p className="text-gray-600 mb-2">
                        Verifica que todo esté correcto antes de exportar:
                    </p>
                    <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-600">
                        <li>Revisa números de orden y fechas</li>
                        <li>Edita cualquier campo con un clic</li>
                        <li>Vista previa del PDF original</li>
                    </ul>
                </div>
            </div>
            
            <div className={stepStyle}>
                <span className={emojiStyle}>📤</span>
                <div className={textContainerStyle}>
                    <h3 className={titleStyle}>4. Exporta tus Resultados</h3>
                    <div className="space-y-2 text-gray-600">
                        <p className="font-medium">Elige cómo quieres guardar tus datos:</p>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium">📊 Excel Completo</p>
                            <p className="text-sm text-gray-500">Todos los datos organizados y listos para análisis</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium">📂 Archivos Renombrados</p>
                            <p className="text-sm text-gray-500">Descarga un ZIP con tus PDFs organizados</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-udlap-green mb-2">💡 Consejos para mejores resultados:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Asegúrate de que los PDFs sean legibles</li>
                    <li>Para muchos archivos, procesa en lotes pequeños</li>
                    <li>Usa nombres descriptivos para los archivos</li>
                </ul>
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