"use html";
"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!file) return;

  setUploading(true);
  setMessage("");

  try {
    // Step 1 - Request upload URL
    const uploadUrlRes = await fetch(
      "/api/storage/upload-url",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          ticketId: null,
        }),
      }
    );

    const uploadData = await uploadUrlRes.json();

    if (!uploadUrlRes.ok) {
      throw new Error(
        uploadData.error ??
        "Failed to obtain upload URL"
      );
    }

    // Step 2 - Upload directly to SeaweedFS
    const seaweedRes = await fetch(uploadData.uploadUrl, {
  method: "PUT",
  body: file,
});

if (!seaweedRes.ok) {
  const text = await seaweedRes.text();

  console.error("SeaweedFS response:", text);

  throw new Error(
    `SeaweedFS upload failed: ${seaweedRes.status}`
  );
}

    // Step 3 - Finalize upload
    const completeRes = await fetch(
      "/api/storage/complete-upload",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          uploadId:
            uploadData.uploadId,
        }),
      }
    );

    const completeData =
      await completeRes.json();

    if (!completeRes.ok) {
      throw new Error(
        completeData.error ??
        "Upload finalization failed"
      );
    }

    setMessage(
      `Upload complete. File ID: ${completeData.fileId}`
    );

    setFile(null);
  } catch (error) {
    console.error(error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Unexpected upload error"
    );
  } finally {
    setUploading(false);
  }
};

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Upload Assets to SeaweedFS</h2>
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          style={{ padding: "0.5rem", border: "1px dashed #ccc", borderRadius: "4px" }}
        />
        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: uploading ? "#ccc" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: file && !uploading ? "pointer" : "not-allowed",
          }}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>
      {message && <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#333" }}>{message}</p>}
    </div>
  );
}