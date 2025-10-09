import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  Download, 
  RotateCw, 
  ArrowLeft,
  FileText,
  Home,
  Merge,
  GripVertical,
  X,
  // ObjectGroup
} from "lucide-react";

interface MergePdfProps {
  darkMode: boolean;
}

const MergePdf: React.FC<MergePdfProps> = ({ darkMode }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  interface PdfFile {
    id: number;
    name: string;
    file: File;
    size: string;
  }

  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  interface StatusMessage {
    text: string;
    type: 'error' | 'info' | 'success';
  }
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [mergedPdfBlob, setMergedPdfBlob] = useState<Blob | null>(null);

  const showStatusMessage = (text: string, type: 'error' | 'info' | 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files as FileList);
    files.forEach(file => processPDFFile(file));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files: File[] = Array.from(e.dataTransfer.files as FileList).filter((file: File) => 
      file.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      files.forEach((file: File) => processPDFFile(file));
    } else {
      showStatusMessage('Please upload valid PDF files', 'error');
    }
  };

  const processPDFFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showStatusMessage('Please upload valid PDF files', 'error');
      return;
    }

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showStatusMessage('File size too large. Please upload PDFs smaller than 50MB.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create file object with preview data
      const newPdfFile = {
        id: Date.now() + Math.random(),
        name: file.name,
        file: file,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      };

      setPdfFiles(prev => [...prev, newPdfFile]);
      
      if (!showEditor) {
        setShowEditor(true);
      }
      
      showStatusMessage(`Added ${file.name}`, 'info');

    } catch (error) {
      console.error('Error processing PDF:', error);
      showStatusMessage('Error processing PDF file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removePdfFile = (pdfId: number) => {
    const newPdfFiles = pdfFiles.filter(pdf => pdf.id !== pdfId);
    setPdfFiles(newPdfFiles);

    if (newPdfFiles.length === 0) {
      setShowEditor(false);
      setShowDownload(false);
    }
  };

  const movePdfFile = (fromIndex: number, toIndex: number) => {
    const newPdfFiles = [...pdfFiles];
    const [movedItem] = newPdfFiles.splice(fromIndex, 1);
    newPdfFiles.splice(toIndex, 0, movedItem);
    setPdfFiles(newPdfFiles);
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      showStatusMessage('Please upload at least 2 PDF files to merge', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      showStatusMessage('Uploading and merging PDFs...', 'info');

      // Create FormData
      const formData = new FormData();
      pdfFiles.forEach(pdfFile => {
        formData.append('files', pdfFile.file);
      });

      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Send merge request to backend
      const response = await fetch('/merge', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Merge failed');
      }

      // Get the merged PDF blob
      const pdfBlob = await response.blob();
      setMergedPdfBlob(pdfBlob);
      setShowDownload(true);
      
      showStatusMessage(`Successfully merged ${pdfFiles.length} PDFs!`, 'success');

      setTimeout(() => setProgress(0), 1000);

    } catch (error) {
      console.error('Error merging PDFs:', error);
      showStatusMessage(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Error merging PDFs. Please try again.',
        'error'
      );
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedPdfBlob) return;

    try {
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading merged PDF:', error);
      showStatusMessage('Error downloading merged PDF', 'error');
    }
  };

  const resetTool = () => {
    setPdfFiles([]);
    setShowEditor(false);
    setShowDownload(false);
    setMergedPdfBlob(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showStatusMessage('Upload PDF files to merge', 'info');
  };

  const handleBackToHome = () => navigate("/");

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-blue-50 via-white to-gray-100"
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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
          </button>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
          }`}>
            Merge PDF Tool
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
                  <Merge className={`h-8 w-8 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
              </div>
              <h1 className={`text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${
                darkMode ? "from-blue-400 to-teal-400" : "from-blue-600 to-teal-600"
              } bg-clip-text text-transparent`}>
                Merge PDF Files
              </h1>
              <p className={`text-base md:text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Combine multiple PDF documents into one file. Drag and drop to reorder.
              </p>
            </div>

            {/* Upload Area */}
            <div className="mb-8">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${
                  darkMode 
                    ? "border-gray-600 hover:border-blue-400 hover:bg-blue-400/5" 
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-500/5"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className={`h-16 w-16 mb-4 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  } group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-semibold mb-2">Upload PDF Files</h3>
                  <p className={`text-base mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Click to browse or drag & drop your PDFs here
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Max file size: 50MB • Select multiple files
                  </p>
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="mt-6 w-full max-w-md mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        {progress < 90 ? "Uploading PDFs..." : "Merging..."}
                      </span>
                      <span className={darkMode ? "text-gray-300" : "text-gray-600"}>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`mt-4 p-4 rounded-xl border-l-4 ${
                  statusMessage.type === 'error' 
                    ? darkMode 
                      ? "bg-red-900/20 border-red-500 text-red-400" 
                      : "bg-red-50 border-red-500 text-red-700"
                    : statusMessage.type === 'info'
                    ? darkMode
                      ? "bg-blue-900/20 border-blue-500 text-blue-400"
                      : "bg-blue-50 border-blue-500 text-blue-700"
                    : darkMode 
                      ? "bg-green-900/20 border-green-500 text-green-400" 
                      : "bg-green-50 border-green-500 text-green-700"
                }`}>
                  <div className="flex items-center gap-3">
                    {statusMessage.type === 'error' ? (
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    ) : statusMessage.type === 'info' ? (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">i</span>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <p className="text-sm">{statusMessage.text}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add PDF Button */}
            {pdfFiles.length > 0 && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-6 py-3 border-2 rounded-full font-medium flex items-center transition-all duration-300 ${
                    darkMode 
                      ? "border-blue-400 text-blue-400 hover:bg-blue-400/10" 
                      : "border-blue-600 text-blue-600 hover:bg-blue-600/10"
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Add More PDFs
                </button>
              </div>
            )}

            {/* Editor Section */}
            {showEditor && (
              <div className={`rounded-xl shadow-lg p-6 mb-8 ${
                darkMode ? "bg-gray-700/50" : "bg-white"
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-semibold ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}>
                    Merge Editor
                  </h2>
                  <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {pdfFiles.length} file{pdfFiles.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Drag and drop to reorder your PDFs before merging:
                </p>

                <div className="space-y-3">
                  {pdfFiles.map((pdfFile, index) => (
                    <div
                      key={pdfFile.id}
                      className={`p-4 rounded-lg border transition-colors cursor-move ${
                        darkMode 
                          ? "bg-gray-600 border-gray-500 hover:border-blue-400" 
                          : "bg-gray-50 border-gray-200 hover:border-blue-500"
                      }`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add(darkMode ? 'bg-blue-400/10' : 'bg-blue-500/10');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove(darkMode ? 'bg-blue-400/10' : 'bg-blue-500/10');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove(darkMode ? 'bg-blue-400/10' : 'bg-blue-500/10');
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        movePdfFile(fromIndex, index);
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex-grow">
                          <div className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            {pdfFile.name}
                          </div>
                          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {pdfFile.size}
                          </div>
                        </div>
                        <button
                          onClick={() => removePdfFile(pdfFile.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            darkMode 
                              ? "text-red-400 hover:bg-red-400/10" 
                              : "text-red-500 hover:bg-red-500/10"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {pdfFiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button
                  onClick={mergePDFs}
                  disabled={isLoading || pdfFiles.length < 2}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-medium flex items-center hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Merge className="h-5 w-5 mr-2" />
                  {pdfFiles.length < 2 ? 'Need 2+ PDFs' : 'Merge PDFs'}
                </button>
                <button
                  onClick={resetTool}
                  className={`px-8 py-3 border-2 rounded-full font-medium flex items-center transition-all duration-300 ${
                    darkMode 
                      ? "border-gray-400 text-gray-400 hover:bg-gray-400/10" 
                      : "border-gray-600 text-gray-600 hover:bg-gray-600/10"
                  }`}
                >
                  <RotateCw className="h-5 w-5 mr-2" />
                  Reset
                </button>
              </div>
            )}

            {/* Download Section */}
            {showDownload && (
              <div className="text-center">
                <div className={`p-4 mb-6 rounded-xl border-l-4 ${
                  darkMode 
                    ? "bg-green-900/20 border-green-500 text-green-400" 
                    : "bg-green-50 border-green-500 text-green-700"
                }`}>
                  Your merged PDF is ready!
                </div>
                <button
                  onClick={downloadMergedPdf}
                  className="px-8 py-3 bg-green-600 text-white rounded-full font-medium flex items-center mx-auto hover:shadow-lg transition-all duration-300 hover:bg-green-700"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Merged PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
    </div>
  );
};

export default MergePdf;