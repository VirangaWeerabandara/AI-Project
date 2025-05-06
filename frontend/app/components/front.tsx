"use client";
import React, { useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      alert("No file selected. Please choose an image.");
      return;
    }

    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      alert("No file dropped. Please drop an image file.");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    } else {
      alert("Please drop a valid image file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("No file selected. Please choose an image.");
      return;
    }

    setUploadStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://0.0.0.0:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadStatus("Upload successful!");
      setResult(data.result || "Detection result unavailable.");
    } catch (err) {
      console.error("Error:", err);
      setUploadStatus("Upload failed.");
      setResult(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      alert("No file selected. Please choose an image.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to get prediction");
      }

      const data = await res.json();
      alert(`Prediction: ${data.result}`);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while predicting the image.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 8,
        boxShadow: "0 2px 8px #eee",
      }}
    >
      <h2>Deepfake Image Detection</h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed #aaa",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: 200, marginBottom: 8 }}
          />
        ) : (
          <span>Drag & drop an image here, or click to select.</span>
        )}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          id="fileInput"
          onChange={handleFileChange}
        />
        <label
          htmlFor="fileInput"
          style={{
            display: "block",
            marginTop: 12,
            cursor: "pointer",
            color: "#1976d2",
          }}
        >
          {previewUrl ? "Change Image" : "Choose Image"}
        </label>
      </div>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploadStatus === "Uploading..."}
        style={{
          width: "100%",
          padding: 12,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontWeight: 600,
          cursor: selectedFile ? "pointer" : "not-allowed",
          marginBottom: 12,
        }}
      >
        Upload & Verify
      </button>
      {uploadStatus && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            backgroundColor: uploadStatus.includes("failed")
              ? "#ffebee"
              : "#e8f5e9",
            borderRadius: 4,
            color: uploadStatus.includes("failed") ? "#c62828" : "#2e7d32",
            fontWeight: 500,
          }}
        >
          {uploadStatus}
        </div>
      )}

      {result && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#000000",
            borderRadius: 8,
            border: "1px solidrgb(0, 0, 0)",
            color: "#000000",
            fontWeight: 600,
            fontSize: "1.1rem",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
