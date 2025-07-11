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

  const startScanner = async () => {
    if (scannerActive) return;
    
    console.log('🔍 開始初始化掃描器...');
    
    // 檢查瀏覽器支援
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ 瀏覽器不支援相機功能');
      alert('您的瀏覽器不支援相機功能，請使用現代瀏覽器如 Chrome、Firefox 或 Safari');
      return;
    }

    // 檢查是否為 HTTPS 或 localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      console.error('❌ 需要 HTTPS 連線才能使用相機');
      alert('相機功能需要安全連線 (HTTPS)。請使用 HTTPS 或在 localhost 上運行。');
      return;
    }

    // 檢查相機權限 - 使用 timeout 避免無限等待
    try {
      console.log('🔐 檢查相機權限...');
      
      // 設定 10 秒超時
      const permissionPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // 優先使用後置相機
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('相機權限請求超時')), 10000);
      });
      
      const stream = await Promise.race([permissionPromise, timeoutPromise]);
      stream.getTracks().forEach(track => track.stop()); // 立即停止測試串流
      console.log('✅ 相機權限已獲得');
      
    } catch (permissionError) {
      console.error('❌ 相機權限問題:', permissionError);
      
      let errorMessage = '無法存取相機。';
      if (permissionError.name === 'NotAllowedError') {
        errorMessage += '\n\n請按照以下步驟允許相機權限：\n1. 點擊瀏覽器網址列左側的鎖頭圖示\n2. 將相機權限設為「允許」\n3. 重新整理頁面並再次嘗試';
      } else if (permissionError.name === 'NotFoundError') {
        errorMessage += '\n\n找不到相機設備，請確認：\n1. 電腦有連接相機\n2. 相機沒有被其他應用程式使用\n3. 嘗試重新啟動瀏覽器';
      } else if (permissionError.message.includes('超時')) {
        errorMessage += '\n\n相機權限請求超時，請：\n1. 檢查是否有權限對話框被阻擋\n2. 重新整理頁面\n3. 手動在瀏覽器設定中允許相機權限';
      } else {
        errorMessage += `\n\n錯誤詳情: ${permissionError.message}`;
      }
      
      alert(errorMessage);
      return;
    }

    // 檢查 DOM 元素
    const readerElement = document.getElementById('reader');
    if (!readerElement) {
      console.error('❌ 找不到掃描器容器元素');
      alert('掃描器初始化失敗：找不到容器元素');
      return;
    }

    console.log('✅ 所有檢查通過，開始初始化掃描器');
    setScannerActive(true);
    
    try {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA]
        },
        false
      );
      
      console.log('📷 掃描器已創建，開始渲染...');
      
      scanner.render(
        (decodedText) => {
          console.log('✅ 掃描成功:', decodedText);
          setSn(decodedText);
          scanner.clear().then(() => {
            console.log('🧹 掃描器已清理');
            setScannerActive(false);
          }).catch((clearError) => {
            console.error('⚠️ 清理掃描器時發生錯誤:', clearError);
            setScannerActive(false);
          });
        },
        (error) => {
          // 只記錄非常見的掃描錯誤
          if (!error.includes('NotFoundException') && !error.includes('No MultiFormat Readers')) {
            console.warn('⚠️ 掃描錯誤:', error);
          }
        }
      );
      
      console.log('🎯 掃描器渲染完成，等待掃描...');
      
    } catch (scannerError) {
      console.error('❌ 掃描器初始化失敗:', scannerError);
      setScannerActive(false);
      alert(`掃描器啟動失敗: ${scannerError.message}\n\n請嘗試：\n1. 重新整理頁面\n2. 檢查相機權限\n3. 使用其他瀏覽器`);
    }
  };

  const stopScanner = () => {
    console.log('🛑 停止掃描器...');
    
    try {
      // 嘗試清理現有的掃描器實例
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        // 清空容器內容
        readerElement.innerHTML = '';
        console.log('🧹 掃描器容器已清空');
      }
      
      setScannerActive(false);
      console.log('✅ 掃描器已停止');
    } catch (error) {
      console.error('⚠️ 停止掃描器時發生錯誤:', error);
      setScannerActive(false);
    }
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
            disabled={scannerActive}
          >
            {scannerActive ? '🔄 掃描中...' : '📷 開始掃描'}
          </button>
        </div>
        {scannerActive && (
          <div className="scanner-status">
            <p>📱 相機正在啟動中，請允許瀏覽器存取相機權限...</p>
            <p>💡 提示：如果沒有看到權限對話框，請檢查瀏覽器網址列是否有相機圖示</p>
          </div>
        )}
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