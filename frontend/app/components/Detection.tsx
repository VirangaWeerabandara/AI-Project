import Image from 'next/image'
import React, { useState } from 'react'

const Detection = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target?.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult(null)
      setError(null)
    } else {
      setFile(null)
      setPreview(null)
      setResult(null)
      setError("No file selected")
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Network response was not ok');
      }

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setError("Error uploading file: " + error.message)
    } finally {
      setLoading(false)
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Deepfake Image Detection</h1>

      <div className="flex-1 w-full mb-4">
        <div
          className={`h-96 w-full relative p-4 border-2 ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-dashed border-gray-300"
          } rounded-lg text-center cursor-pointer hover:border-blue-400 transition-all duration-300`}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const droppedFile = e.dataTransfer?.files[0];
            if (droppedFile) {
              setFile(droppedFile);
              setPreview(URL.createObjectURL(droppedFile));
              setResult(null);
              setError(null);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {!preview ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-600 font-medium">
                Drag and drop an image here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PNG, JPG, JPEG
              </p>
            </div>
          ) : (
            <div className="relative h-full">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
                priority
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`px-4 py-2 rounded-md font-medium ${
            !file || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } transition`}
        >
          {loading ? "Processing..." : "Detect Deepfake"}
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 rounded-md font-medium hover:bg-gray-300 transition"
        >
          Reset
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Result Display */}
      {/* Result Display */}
      {result && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-2 text-black">Result</h2>
          <div className="flex flex-col gap-2 text-black">
            {" "}
            {/* Added text-black here */}
            <div className="flex items-center">
              <span className="font-medium mr-2">Classification:</span>
              <span
                className={`px-3 py-1 rounded-full ${
                  result.result === "Real"
                    ? "bg-green-100 text-black"
                    : "bg-red-100 text-black"
                }`}
              >
                {result.result}
              </span>
            </div>
            {result.confidence !== undefined && (
              <div>
                <span className="font-medium mr-2">Confidence:</span>
                <span>{result.confidence}%</span>
              </div>
            )}
            {result.processing_time_ms !== undefined && (
              <div>
                <span className="font-medium mr-2">Processing Time:</span>
                <span>{result.processing_time_ms} ms</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Detection
