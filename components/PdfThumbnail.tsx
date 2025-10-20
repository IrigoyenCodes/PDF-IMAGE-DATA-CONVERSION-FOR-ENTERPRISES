import React, { useEffect, useRef, useState } from 'react';

// Let TypeScript know that pdfjsLib is available on the window
declare const pdfjsLib: any;

interface PdfThumbnailProps {
  file: File;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !canvasRef.current || typeof pdfjsLib === 'undefined') {
        return;
    }

    const renderPdf = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            if (this.result) {
                const typedarray = new Uint8Array(this.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const page = await pdf.getPage(1); // Get the first page

                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: 0.2 }); // Use a small scale for thumbnail
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const context = canvas.getContext('2d');
                if (!context) return;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;
            }
        };
        fileReader.readAsArrayBuffer(file);
      } catch (err) {
        console.error('Error rendering PDF thumbnail:', err);
        setError('Preview failed');
      }
    };

    renderPdf();

  }, [file]);
  
  if (error) {
    return (
        <div className="w-12 h-16 flex items-center justify-center bg-gray-200 text-red-500 text-xs text-center border border-gray-300 rounded-sm p-1">
            {error}
        </div>
    )
  }

  return <canvas ref={canvasRef} className="w-12 h-16 border border-gray-300 rounded-sm bg-white" />;
};

export default PdfThumbnail;
