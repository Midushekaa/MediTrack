import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FaTimes, FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/QRScanner.css";

const QRScanner = ({ onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(result) {
      scanner.clear();
      setScanResult(result);
      
      // If result is a URL, navigate to it if it's internal
      if (result.includes(window.location.origin)) {
        const path = result.replace(window.location.origin, "");
        navigate(path);
      } else {
        // Handle external or data results
        alert("Scanned Code: " + result);
        onClose();
      }
    }

    function onScanError(err) {
      // console.warn(err);
    }

    return () => {
      scanner.clear().catch(e => console.log("Scanner clear error", e));
    };
  }, [navigate, onClose]);

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-content">
        <div className="qr-scanner-header">
          <h3><FaCamera /> Scan QR Code</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div id="reader"></div>
        {scanResult && (
          <div className="scan-result">
            Success! Redirecting...
          </div>
        )}
        <p className="scanner-hint">Point your camera at a Meditrack QR code</p>
      </div>
    </div>
  );
};

export default QRScanner;
