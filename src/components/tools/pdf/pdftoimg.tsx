import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  Download, 
  RotateCw, 
  CheckSquare, 
  ArrowLeft,
  FileText,
  Home,
  Image as ImageIcon
} from "lucide-react";

interface PDFImage {
  name: string;
  data: string;
  selected: boolean;
}

const PdfToImages: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfImages, setPdfImages] = useState<PDFImage[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const showStatusMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const resetLoadingState = () => {
    setIsLoading(false);
    setProgress(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPDFFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      processPDFFile(file);
    } else {
      showStatusMessage('Please upload a valid PDF file', 'error');
    }
  };

  const processPDFFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showStatusMessage('Please upload a valid PDF file', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setPdfImages([]);
      setShowPreview(false);
      setFileName(file.name);

      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          
          const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
          setProgress(20);

          const images: PDFImage[] = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better quality
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not get canvas context');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
              canvasContext: context,
              canvas: canvas,
              viewport: viewport
            }).promise;
            
            const imageData = canvas.toDataURL('image/png', 1.0); // Use PNG for better quality
            const imageName = `${file.name.replace('.pdf', '')}_page_${i}.png`;
            
            images.push({
              name: imageName,
              data: imageData,
              selected: true
            });
            
            setProgress(20 + (i / pdf.numPages * 80));
          }

          setProgress(100);
          setTimeout(() => {
            setIsLoading(false);
            setPdfImages(images);
            setShowPreview(true);
            showStatusMessage(`Successfully converted ${images.length} pages to images!`, 'success');
          }, 500);

        } catch (error) {
          console.error('Error processing PDF:', error);
          showStatusMessage('Error processing PDF file. Please try another file.', 'error');
          resetLoadingState();
        }
      };

      reader.onerror = () => {
        showStatusMessage('Error reading file', 'error');
        resetLoadingState();
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error:', error);
      showStatusMessage('Error processing PDF file', 'error');
      resetLoadingState();
    }
  };

  const downloadImage = (image: PDFImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.data;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showStatusMessage(`Downloaded ${image.name}`, 'success');
    } catch (error) {
      console.error('Error downloading image:', error);
      showStatusMessage('Error downloading image', 'error');
    }
  };

  const downloadSelectedImages = async () => {
    if (pdfImages.length === 0) {
      showStatusMessage('No images to download', 'error');
      return;
    }

    const selectedImages = pdfImages.filter(img => img.selected);
    
    if (selectedImages.length === 0) {
      showStatusMessage('Please select at least one image to download', 'error');
      return;
    }

    if (selectedImages.length === 1) {
      downloadImage(selectedImages[0]);
      return;
    }

    try {
      setIsLoading(true);
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const folder = zip.folder('pdf_images');
      
      if (!folder) {
        throw new Error('Could not create zip folder');
      }

      selectedImages.forEach(image => {
        const base64Data = image.data.split(',')[1];
        folder.file(image.name, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'pdf_images.zip');
      showStatusMessage(`Downloaded ${selectedImages.length} images as zip`, 'success');
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating zip file:', error);
      showStatusMessage('Error creating zip file', 'error');
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const newSelectAll = !isSelectAll;
    setIsSelectAll(newSelectAll);
    setPdfImages(prev => prev.map(img => ({ ...img, selected: newSelectAll })));
  };

  const toggleImageSelection = (index: number) => {
    setPdfImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], selected: !newImages[index].selected };
      
      // Update select all state based on current selection
      const allSelected = newImages.every(img => img.selected);
      setIsSelectAll(allSelected);
      
      return newImages;
    });
  };

  const resetConverter = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPdfImages([]);
    setShowPreview(false);
    setStatusMessage(null);
    setIsSelectAll(false);
    setFileName('');
    resetLoadingState();
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const selectedCount = pdfImages.filter(img => img.selected).length;

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-gray-100"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToHome}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              darkMode 
                ? "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" 
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </button>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
          }`}>
            PDF to Images Tool
          </div>
        </div>

        {/* Main Card */}
        <div className={`rounded-3xl shadow-2xl overflow-hidden ${
          darkMode ? "bg-gray-800/80 backdrop-blur-sm" : "bg-white/80 backdrop-blur-sm"
        }`}>
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className={`p-3 rounded-2xl ${
                  darkMode ? "bg-gradient-to-br from-blue-600/20 to-teal-600/20" : "bg-gradient-to-br from-blue-100 to-teal-100"
                }`}>
                  <ImageIcon className={`h-8 w-8 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
              </div>
              <h1 className={`text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${
                darkMode ? "from-blue-400 to-teal-400" : "from-blue-600 to-teal-600"
              } bg-clip-text text-transparent`}>
                PDF to Images Converter
              </h1>
              <p className={`text-base md:text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Convert PDF pages to high-quality PNG images instantly in your browser
              </p>
            </div>

            {/* Upload Area */}
            <div className="mb-6 md:mb-8">
              <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Upload PDF File
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 group ${
                  darkMode 
                    ? "border-gray-600 hover:border-blue-400 hover:bg-blue-400/5" 
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-500/5"
                } ${fileName ? "border-green-400 bg-green-400/5" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center">
                  {fileName ? (
                    <>
                      <FileText className={`h-12 w-12 md:h-16 md:w-16 mb-4 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                      <h3 className="text-lg md:text-xl font-semibold mb-2">File Selected</h3>
                      <p className={`font-mono text-sm truncate max-w-full ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {fileName}
                      </p>
                      <p className={`text-sm mt-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                        Ready to convert!
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className={`h-12 w-12 md:h-16 md:w-16 mb-4 ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      } group-hover:scale-110 transition-transform`} />
                      <h3 className="text-lg md:text-xl font-semibold mb-2">Upload PDF File</h3>
                      <p className={`text-sm md:text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Click to browse or drag & drop your PDF here
                      </p>
                      <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Processing happens entirely in your browser - no server upload
                      </p>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="mt-6 w-full max-w-md mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Converting...</span>
                      <span className={darkMode ? "text-gray-300" : "text-gray-600"}>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 dark:from-blue-400 dark:to-teal-400 h-2 rounded-full relative overflow-hidden transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`mt-4 p-4 rounded-xl border-l-4 flex items-center gap-3 animate-fade-in ${
                  statusMessage.type === 'error' 
                    ? darkMode 
                      ? "bg-red-900/20 border-red-500 text-red-400" 
                      : "bg-red-50 border-red-500 text-red-700"
                    : darkMode 
                      ? "bg-green-900/20 border-green-500 text-green-400" 
                      : "bg-green-50 border-green-500 text-green-700"
                }`}>
                  {statusMessage.type === 'error' ? (
                    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <p className="text-sm">{statusMessage.text}</p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className={`rounded-xl shadow-lg p-6 mb-8 ${
                darkMode ? "bg-gray-700/50" : "bg-white"
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className={`text-2xl font-semibold ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}>
                    PDF Pages Preview ({pdfImages.length} pages)
                  </h2>
                  <div className="preview-actions flex flex-wrap gap-3 w-full sm:w-auto">
                    <button
                      onClick={toggleSelectAll}
                      className={`px-4 py-2 border-2 rounded-lg font-medium flex items-center transition-all duration-300 ${
                        darkMode 
                          ? "border-blue-400 text-blue-400 hover:bg-blue-400/10" 
                          : "border-blue-600 text-blue-600 hover:bg-blue-600/10"
                      }`}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      {isSelectAll ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={downloadSelectedImages}
                      disabled={isLoading || selectedCount === 0}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-500 dark:to-teal-500 text-white rounded-lg font-medium flex items-center hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Selected ({selectedCount})
                    </button>
                    <button
                      onClick={resetConverter}
                      className={`px-4 py-2 border-2 rounded-lg font-medium flex items-center transition-all duration-300 ${
                        darkMode 
                          ? "border-gray-400 text-gray-400 hover:bg-gray-400/10" 
                          : "border-gray-600 text-gray-600 hover:bg-gray-600/10"
                      }`}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {pdfImages.map((image, index) => (
                    <div
                      key={index}
                      className={`rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${
                        darkMode ? "bg-gray-600" : "bg-white"
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="absolute top-3 right-3 z-10 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          checked={image.selected}
                          onChange={() => toggleImageSelection(index)}
                        />
                        <img
                          src={image.data}
                          className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-600"
                          alt={`Page ${index + 1}`}
                          loading="lazy"
                        />
                      </div>
                      <div className={`p-4 border-t ${
                        darkMode ? "border-gray-500" : "border-gray-200"
                      }`}>
                        <h4 className={`font-semibold mb-1 ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}>
                          Page {index + 1}
                        </h4>
                        <button
                          onClick={() => downloadImage(image)}
                          className="w-full mt-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300"
                        >
                          <Download className="h-3 w-3 inline mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mt-8">
              <div className={`p-3 md:p-4 rounded-xl text-center transition-transform hover:scale-105 ${
                darkMode ? "bg-gray-700/30" : "bg-white/50"
              }`}>
                <div className={`p-2 rounded-lg inline-block mb-2 ${
                  darkMode ? "bg-blue-900/20" : "bg-blue-100"
                }`}>
                  <UploadCloud className={`h-5 w-5 md:h-6 md:w-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <h3 className="font-semibold mb-1 text-sm md:text-base">100% Frontend</h3>
                <p className={`text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No server upload
                </p>
              </div>

              <div className={`p-3 md:p-4 rounded-xl text-center transition-transform hover:scale-105 ${
                darkMode ? "bg-gray-700/30" : "bg-white/50"
              }`}>
                <div className={`p-2 rounded-lg inline-block mb-2 ${
                  darkMode ? "bg-green-900/20" : "bg-green-100"
                }`}>
                  <ImageIcon className={`h-5 w-5 md:h-6 md:w-6 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                </div>
                <h3 className="font-semibold mb-1 text-sm md:text-base">High Quality</h3>
                <p className={`text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Clear PNG output
                </p>
              </div>

              <div className={`p-3 md:p-4 rounded-xl text-center transition-transform hover:scale-105 ${
                darkMode ? "bg-gray-700/30" : "bg-white/50"
              }`}>
                <div className={`p-2 rounded-lg inline-block mb-2 ${
                  darkMode ? "bg-purple-900/20" : "bg-purple-100"
                }`}>
                  <Download className={`h-5 w-5 md:h-6 md:w-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                </div>
                <h3 className="font-semibold mb-1 text-sm md:text-base">Batch Download</h3>
                <p className={`text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Single or multiple
                </p>
              </div>

              <div className={`p-3 md:p-4 rounded-xl text-center transition-transform hover:scale-105 ${
                darkMode ? "bg-gray-700/30" : "bg-white/50"
              }`}>
                <div className={`p-2 rounded-lg inline-block mb-2 ${
                  darkMode ? "bg-orange-900/20" : "bg-orange-100"
                }`}>
                  <FileText className={`h-5 w-5 md:h-6 md:w-6 ${darkMode ? "text-orange-400" : "text-orange-600"}`} />
                </div>
                <h3 className="font-semibold mb-1 text-sm md:text-base">Secure</h3>
                <p className={`text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Files stay local
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToHome}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              darkMode 
                ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Home className="h-4 w-4" />
            Back to All Tools
          </button>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default PdfToImages;