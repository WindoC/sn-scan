'use client';

import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ThemeToggle from './components/ThemeToggle';
import { getPhotoThumbnails, getFullSizePhotos, addPhoto, deletePhoto, clearAllPhotos } from './utils/photoStorage';

const STORAGE_KEY = 'sn_photos';
const TAB_STORAGE_KEY = 'active_tab'; // Key for storing active tab preference

// Html5QrcodePlugin component for proper React integration
const Html5QrcodePlugin = ({ fps, qrbox, aspectRatio, disableFlip, qrCodeSuccessCallback, qrCodeErrorCallback, verbose }) => {
  const qrcodeRegionId = "html5qr-code-full-region";

  useEffect(() => {
    const config = {};
    if (fps) config.fps = fps;
    if (qrbox) config.qrbox = qrbox;
    if (aspectRatio) config.aspectRatio = aspectRatio;
    if (disableFlip !== undefined) config.disableFlip = disableFlip;

    const verboseFlag = verbose === true;
    
    if (!qrCodeSuccessCallback) {
      throw new Error("qrCodeSuccessCallback is required callback.");
    }

    console.log('📷 初始化 Html5QrcodeScanner...');
    const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, verboseFlag);
    
    html5QrcodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);
    console.log('✅ Html5QrcodeScanner 已渲染');

    // cleanup function when component will unmount
    return () => {
      console.log('🧹 清理 Html5QrcodeScanner...');
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [fps, qrbox, aspectRatio, disableFlip, qrCodeSuccessCallback, qrCodeErrorCallback, verbose]);

  return <div id={qrcodeRegionId} />;
};

// Shared Scanner Section Component
const ScannerSection = ({ sn, setSn, scannerActive, setScannerActive, onScanSuccess, onScanError }) => {
  const startScanner = () => {
    console.log('🔍 開始掃描器...');
    setScannerActive(true);
  };

  const stopScanner = () => {
    console.log('🛑 停止掃描器...');
    setScannerActive(false);
  };

  return (
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
      <div className="scanner-container">
        {scannerActive && (
          <Html5QrcodePlugin
            fps={10}
            qrbox={250}
            aspectRatio={1.0}
            disableFlip={false}
            qrCodeSuccessCallback={onScanSuccess}
            qrCodeErrorCallback={onScanError}
            verbose={false}
          />
        )}
      </div>
    </section>
  );
};

// Immediate Download Mode Component
const ImmediateDownloadMode = ({ sn, setSn, scannerActive, setScannerActive, onScanSuccess, onScanError }) => {
  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      // 確定檔案副檔名
      const extension = file.type.includes('image/png') ? 'png' : 'jpg';
      const filename = `${sn.trim()}.${extension}`;
      
      // 立即下載照片
      downloadImage(reader.result, filename);
      
      console.log(`✅ 照片已下載: ${filename}`);
      
      // 清空 SN 輸入框，準備下一次掃描
      setSn('');
      
      // 重置檔案輸入
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mode-content">
      <ScannerSection 
        sn={sn}
        setSn={setSn}
        scannerActive={scannerActive}
        setScannerActive={setScannerActive}
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
      />

      <section className="photo-section">
        <h2>📸 拍攝照片</h2>
        <p>選擇照片後將自動以 SN 序號命名並下載到您的裝置</p>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleCapture}
          className="photo-input"
        />
      </section>
    </div>
  );
};

// Batch Download Mode Component
const BatchDownloadMode = ({ sn, setSn, scannerActive, setScannerActive, onScanSuccess, onScanError }) => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    // 載入已儲存的照片縮圖 (記憶體優化)
    const loadPhotos = async () => {
      try {
        const photoThumbnails = await getPhotoThumbnails();
        setPhotos(photoThumbnails);
      } catch (error) {
        console.error('載入儲存資料時發生錯誤:', error);
      }
    };
    
    loadPhotos();
  }, []);

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
    reader.onload = async () => {
      try {
        const newPhoto = {
          sn: sn.trim(),
          dataUrl: reader.result,
          timestamp: new Date().toISOString()
        };
        
        // 使用 IndexedDB 儲存照片 (包含縮圖生成)
        const photoId = await addPhoto(newPhoto);
        
        // 重新載入縮圖以更新顯示 (記憶體優化)
        const photoThumbnails = await getPhotoThumbnails();
        setPhotos(photoThumbnails);
        
        // 清空 SN 輸入框，準備下一次掃描
        setSn('');
        
        // 重置檔案輸入
        e.target.value = '';
      } catch (error) {
        console.error('儲存照片時發生錯誤:', error);
        alert('儲存照片失敗，請稍後再試');
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadZip = async () => {
    if (photos.length === 0) {
      alert("沒有照片可以下載");
      return;
    }

    try {
      // 取得完整尺寸照片用於 ZIP 下載
      const fullSizePhotos = await getFullSizePhotos();
      
      if (fullSizePhotos.length === 0) {
        alert("沒有照片可以下載");
        return;
      }

      const zip = new JSZip();
      
      fullSizePhotos.forEach(({ sn, dataUrl }, index) => {
        const base64 = dataUrl.split(',')[1];
        const extension = dataUrl.includes('image/png') ? 'png' : 'jpg';
        // zip.file(`${sn}.${extension}`, base64, { base64: true });
        zip.file(`${sn}/${sn}_${index + 1}.${extension}`, base64, { base64: true });
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sn_photos_${new Date().toISOString()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      
      console.log(`📦 ZIP 下載完成: ${fullSizePhotos.length} 張完整尺寸照片`);
    } catch (error) {
      console.error('建立 ZIP 檔案時發生錯誤:', error);
      alert('下載失敗，請稍後再試');
    }
  };

  const clearAll = async () => {
    if (photos.length === 0) return;
    
    if (confirm('確定要清除所有照片嗎？此操作無法復原。')) {
      try {
        await clearAllPhotos();
        setPhotos([]);
      } catch (error) {
        console.error('清除照片時發生錯誤:', error);
        alert('清除照片失敗，請稍後再試');
      }
    }
  };

  const deletePhotoById = async (index) => {
    if (confirm('確定要刪除這張照片嗎？')) {
      try {
        const photoToDelete = photos[index];
        await deletePhoto(photoToDelete.id);
        
        // 重新載入縮圖以更新顯示 (記憶體優化)
        const photoThumbnails = await getPhotoThumbnails();
        setPhotos(photoThumbnails);
      } catch (error) {
        console.error('刪除照片時發生錯誤:', error);
        alert('刪除照片失敗，請稍後再試');
      }
    }
  };

  return (
    <div className="mode-content">
      <ScannerSection 
        sn={sn}
        setSn={setSn}
        scannerActive={scannerActive}
        setScannerActive={setScannerActive}
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
      />

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
                  onClick={() => deletePhotoById(index)}
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
};

// Main App Component with Tabbed Interface
// Features:
// - 立即下載 (Immediate Download): Photos are downloaded immediately after capture
// - 組合下載 (Batch Download): Photos are stored and can be downloaded as ZIP
// - Tab preference is persisted in localStorage across browser sessions
export default function Home() {
  const [activeTab, setActiveTab] = useState('immediate'); // Always start with default
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration status
  const [sn, setSn] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  // Handle hydration and load saved tab preference
  useEffect(() => {
    setIsHydrated(true); // Mark as hydrated
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab && (savedTab === 'immediate' || savedTab === 'batch')) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab preference when it changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log('✅ 掃描成功:', decodedText);
    setSn(decodedText);
    setScannerActive(false);
  };

  const onScanError = (error) => {
    // 只記錄非常見的掃描錯誤
    if (!error.includes('NotFoundException') && !error.includes('No MultiFormat Readers')) {
      console.warn('⚠️ 掃描錯誤:', error);
    }
  };

  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div className="container">
        <header>
          <h1>📷 SN 照片收集器</h1>
          <p>掃描條碼並拍攝相關照片</p>
          <ThemeToggle />
        </header>
        <nav className="tab-navigation">
          <button className="tab-btn active">立即下載</button>
          <button className="tab-btn">組合下載</button>
        </nav>
        <div className="mode-content">
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            載入中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>📷 SN 照片收集器</h1>
        <p>掃描條碼並拍攝相關照片</p>
        <ThemeToggle />
      </header>

      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'immediate' ? 'active' : ''}`}
          onClick={() => handleTabChange('immediate')}
        >
          立即下載
        </button>
        <button
          className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => handleTabChange('batch')}
        >
          組合下載
        </button>
      </nav>

      {/* Mode Content */}
      {activeTab === 'immediate' ? (
        <ImmediateDownloadMode
          sn={sn}
          setSn={setSn}
          scannerActive={scannerActive}
          setScannerActive={setScannerActive}
          onScanSuccess={onScanSuccess}
          onScanError={onScanError}
        />
      ) : (
        <BatchDownloadMode
          sn={sn}
          setSn={setSn}
          scannerActive={scannerActive}
          setScannerActive={setScannerActive}
          onScanSuccess={onScanSuccess}
          onScanError={onScanError}
        />
      )}
    </div>
  );
}