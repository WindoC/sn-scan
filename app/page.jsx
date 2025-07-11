'use client';

import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Html5QrcodeScanner } from 'html5-qrcode';

const STORAGE_KEY = 'sn_photos';

export default function Home() {
  const [sn, setSn] = useState('');
  const [photos, setPhotos] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    // 載入已儲存的照片
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPhotos(JSON.parse(saved));
      } catch (error) {
        console.error('載入儲存資料時發生錯誤:', error);
      }
    }
  }, []);

  const startScanner = () => {
    if (scannerActive) return;
    
    setScannerActive(true);
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );
    
    scanner.render(
      (decodedText) => {
        setSn(decodedText);
        scanner.clear();
        setScannerActive(false);
      },
      (error) => {
        // 忽略掃描錯誤，這很正常
      }
    );
  };

  const stopScanner = () => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.clear().then(() => {
      setScannerActive(false);
    }).catch(() => {
      setScannerActive(false);
    });
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!sn.trim()) {
      alert("請先輸入或掃描 SN 序號");
      return;
    }
    if (!file) {
      alert("請選擇照片");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newPhoto = { 
        sn: sn.trim(), 
        dataUrl: reader.result,
        timestamp: new Date().toISOString()
      };
      const updated = [...photos, newPhoto];
      setPhotos(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // 清空 SN 輸入框，準備下一次掃描
      setSn('');
      
      // 重置檔案輸入
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const downloadZip = async () => {
    if (photos.length === 0) {
      alert("沒有照片可以下載");
      return;
    }

    try {
      const zip = new JSZip();
      
      photos.forEach(({ sn, dataUrl }, index) => {
        const base64 = dataUrl.split(',')[1];
        const extension = dataUrl.includes('image/png') ? 'png' : 'jpg';
        zip.file(`${sn}/${sn}_${index + 1}.${extension}`, base64, { base64: true });
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sn_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('建立 ZIP 檔案時發生錯誤:', error);
      alert('下載失敗，請稍後再試');
    }
  };

  const clearAll = () => {
    if (photos.length === 0) return;
    
    if (confirm('確定要清除所有照片嗎？此操作無法復原。')) {
      setPhotos([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const deletePhoto = (index) => {
    if (confirm('確定要刪除這張照片嗎？')) {
      const updated = photos.filter((_, i) => i !== index);
      setPhotos(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div className="container">
      <header>
        <h1>📷 SN 照片收集器</h1>
        <p>掃描條碼並拍攝相關照片</p>
      </header>

      <section className="scanner-section">
        <h2>🔍 掃描條碼</h2>
        <div className="input-group">
          <input 
            type="text" 
            value={sn} 
            onChange={(e) => setSn(e.target.value)}
            placeholder="輸入或掃描 SN 序號" 
            className="sn-input"
          />
          <button 
            onClick={scannerActive ? stopScanner : startScanner}
            className={`scan-btn ${scannerActive ? 'active' : ''}`}
          >
            {scannerActive ? '停止掃描' : '開始掃描'}
          </button>
        </div>
        <div id="reader" className="scanner-container"></div>
      </section>

      <section className="photo-section">
        <h2>📸 拍攝照片</h2>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleCapture}
          className="photo-input"
        />
      </section>

      <section className="gallery-section">
        <h2>🖼️ 照片庫 ({photos.length})</h2>
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div key={index} className="photo-item">
              <img src={photo.dataUrl} alt={photo.sn} />
              <div className="photo-info">
                <div className="sn-label">{photo.sn}</div>
                <button 
                  onClick={() => deletePhoto(index)}
                  className="delete-btn"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="actions-section">
        <button 
          onClick={downloadZip} 
          className="download-btn"
          disabled={photos.length === 0}
        >
          📦 下載 ZIP 檔案
        </button>
        <button 
          onClick={clearAll} 
          className="clear-btn"
          disabled={photos.length === 0}
        >
          🗑️ 清除全部
        </button>
      </section>
    </div>
  );
}