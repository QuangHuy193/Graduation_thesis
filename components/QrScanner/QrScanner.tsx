"use client";

import { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "./QrScanner.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { scrollToPosition, showToast } from "@/lib/function";
import { scanQRTicketAPI } from "@/lib/axios/admin/ticketAPI";

// mã mẫu
//  {"ticketId":76,"bookingId":"91","seat":"L1","startTime":"21:00","room":"Phòng 1",
//   "foods":[{"name":"Com bo bắp nước","quantity":1}]}
export default function QrScanner() {
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);
  // kết quả quét
  const [result, setResult] = useState({});
  // kiểm tra đang quét
  const [isScanning, setIsScanning] = useState(false);
  // "camera" | "image" css cho phù hợp
  const [scanMode, setScanMode] = useState("");
  // hiện bắp nữa của vé
  const [foods, setFoods] = useState([]);

  // tránh xung đột ảnh và camera
  useEffect(() => {
    qrRef.current = new Html5Qrcode("qr-reader");

    return () => {
      if (qrRef.current && isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // gọi api
  useEffect(() => {
    const scanerQrTicket = async (ticket_id: number | string) => {
      try {
        const res = await scanQRTicketAPI(ticket_id);
        if (res.scan === "go") {
          showToast("success", "Quét thành công, mời vào cửa.");
        } else if (res.scan === "food") {
          showToast("success", "Quét thành công, mời nhận bắp nước.");
          setFoods(res.foods);
        } else if (res.scan === "scanner") {
          showToast("info", "Vé đã được quét trước đó rồi.");
        } else if (res.scan === "cancel") {
          showToast("error", "Vé đã hủy, không thể quét!");
        }
      } catch (error) {
        console.log(error);
        showToast("error", "Có lỗi xảy ra, vui lòng quét lại!");
      }
    };

    if (Object.keys(result).length > 0) {
      scanerQrTicket(result.ticketId);
    }
  }, [result]);

  // Quét bằng camera
  const startCameraScan = async () => {
    setScanMode("camera");
    if (!qrRef.current || isScanning) return;

    setResult({});
    setFoods([]);
    setIsScanning(true);

    try {
      await qrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          let ticketData;
          try {
            ticketData = JSON.parse(decodedText);
            setResult(ticketData);
          } catch (err) {
            console.log(err);
            showToast("error", "QR không đúng định dạng vé");
            return;
          }
          stopScan();
        }
      );
    } catch (e) {
      console.log(e);
      setIsScanning(false);
    }
  };

  //  dừng quét
  const stopScan = async () => {
    if (!qrRef.current || !isScanning) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch (e) {
      console.log(e);
    }
    setResult({});
    setIsScanning(false);
    setFoods([]);
  };

  //  Quét từ ảnh upload
  const scanFromImage = async (e) => {
    setScanMode("image");
    setResult({});
    setFoods([]);
    const file = e.target.files[0];
    if (!file || !qrRef.current) return;

    // đảm bảo camera đã tắt
    await stopScan();

    try {
      const decodedText = await qrRef.current.scanFile(file, true);

      let ticketData;

      try {
        ticketData = JSON.parse(decodedText);
        setResult(ticketData);
      } catch (err) {
        console.log(err);
        showToast("error", "QR không đúng định dạng vé");
        return;
      }
    } catch (err) {
      alert("Không quét được QR từ ảnh này");
    }

    // reset input để chọn lại cùng ảnh vẫn chạy
    e.target.value = "";
  };

  return (
    <div className="shadow rounded-lg ">
      {/* thanh action */}
      <div className="flex justify-between gap-5 border-b border-b-gray-300 p-3">
        {/* left */}
        <div className="flex-1"></div>
        {/* right */}
        <div className="flex flex-1 justify-end gap-5">
          <button
            onClick={() => fileInputRef.current.click()}
            className={`${styles.btn} bg-[#16a34a]!`}
          >
            🖼️ Quét từ ảnh QR
          </button>
          <button
            onClick={startCameraScan}
            disabled={isScanning}
            className={`${styles.btn}`}
          >
            📷 Quét bằng camera
          </button>
        </div>
      </div>

      {/* content */}
      <div className={styles.wrapper}>
        {Object.keys(result).length > 0 && (
          <div className={styles.result}>
            🎫 Mã vé đang quét: <b>{result.ticketId}</b>
          </div>
        )}

        {foods.length > 0 && (
          <div className={styles.foodList}>
            <h4 className={styles.foodTitle}>🍿 Combo đã đặt</h4>

            {foods.map((f, i) => (
              <div key={i} className={styles.foodItem}>
                <span className={styles.foodQty}>{f.quantity}x</span>
                <span className={styles.foodName}>{f.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* input tải ảnh */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          hidden
          onChange={scanFromImage}
        />

        <div
          id="qr-reader"
          className={`${styles.reader} ${
            scanMode === "camera" ? styles.readerCamera : ""
          } ${scanMode === "image" ? styles.readerImage : ""}`}
        />

        {isScanning && (
          <div className="mt-3">
            <button
              className={`${styles.btn} bg-[#fb2c36]!`}
              onClick={() => {
                stopScan();
                scrollToPosition(0);
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Dừng quét</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
