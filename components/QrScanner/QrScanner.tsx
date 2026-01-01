"use client";

import { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner() {
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);
  const [result, setResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    return () => {
      if (qrRef.current) {
        qrRef.current.stop?.().catch(() => {});
      }
    };
  }, []);

  // 📷 Quét bằng camera
  const startCameraScan = async () => {
    setResult("");
    setIsScanning(true);

    const qrCode = new Html5Qrcode("qr-reader");
    qrRef.current = qrCode;

    await qrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        setResult(decodedText);
        qrCode.stop();
        setIsScanning(false);
      }
    );
  };

  // 🖼️ Quét từ ảnh upload
  const scanFromImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const qrCode = new Html5Qrcode("qr-reader");

    try {
      const decodedText = await qrCode.scanFile(file, true);
      setResult(decodedText);
    } catch (err) {
      alert("Không quét được QR từ ảnh này");
    }
  };

  return (
    <div style={styles.box}>
      <h3>🎟️ Quét mã vé</h3>

      <button
        onClick={startCameraScan}
        disabled={isScanning}
        style={styles.btn}
      >
        📷 Quét bằng camera
      </button>

      <button
        onClick={() => fileInputRef.current.click()}
        style={{ ...styles.btn, background: "#16a34a" }}
      >
        🖼️ Quét từ ảnh QR
      </button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        hidden
        onChange={scanFromImage}
      />

      <div id="qr-reader" style={{ marginTop: 16 }} />

      {result && (
        <div style={styles.result}>
          🎫 Mã vé: <b>{result}</b>
        </div>
      )}
    </div>
  );
}

const styles = {
  box: {
    maxWidth: 340,
    margin: "20px auto",
    padding: 20,
    borderRadius: 12,
    background: "#fff",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,.1)",
  },
  btn: {
    width: "100%",
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
  result: {
    marginTop: 16,
    padding: 10,
    background: "#ecfeff",
    borderRadius: 8,
  },
};
