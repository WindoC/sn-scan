
# 📷 SN Photo Collector Web App — Design & Plan (Frontend-Only)

## 🧭 Overview

A **pure frontend** web application built with **Next.js** and published on **Vercel**, allowing users to:

1. **Scan 2D barcodes** using a mobile or laptop camera
2. **Capture photos** associated with each scanned SN (serial number)
3. **Store the data** in local browser storage
4. **Export all items as a ZIP file**, where each photo is stored under an SN-named folder
5. **Persist data** across refreshes using `localStorage`

---

## 🚀 Deployment Target

- **Platform**: [Vercel](https://vercel.com/)
- **Framework**: Next.js (React-based)
- **Hosting Type**: Static Frontend-Only
- **Backend**: Not used

---

## ⚙️ Tech Stack

| Feature                | Tool/Library                     |
|------------------------|----------------------------------|
| Framework              | [Next.js](https://nextjs.org/) (with `app` or `pages`) |
| Barcode Scanner        | [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) |
| Camera Capture         | HTML5 `<input type="file">`     |
| ZIP Creation           | [`jszip`](https://stuk.github.io/jszip/) |
| Local Persistence      | `localStorage`                  |
| Styling (optional)     | Tailwind CSS or CSS Modules     |

---

## 🗂️ Project Structure (Next.js)

```

sn-photo-app/
├── public/
├── app/ or pages/
│   └── index.jsx
├── components/
│   └── PhotoGrid.jsx
├── utils/
│   └── storage.js
├── styles/
│   └── globals.css
├── package.json
└── next.config.js

````

---

## 🧱 Core Components

### `index.jsx` (Main Page)

- Handles:
  - SN input
  - Barcode scanner (via `html5-qrcode`)
  - Photo capture
  - Preview thumbnails
  - Save ZIP + Clear All buttons
  - Sync with `localStorage`

---

## 🧠 State Structure

```js
[
  {
    sn: "12345678",
    dataUrl: "data:image/jpeg;base64,..."
  },
  ...
]
````

---

## 💾 LocalStorage

* Key: `"sn_photos"`
* Value: `JSON.stringify(Array<PhotoEntry>)`
* Used on load, and after every photo add/delete

---

## 🚦 User Flow

1. Open app on browser or phone
2. Scan barcode → fills in SN field
3. Take photo → stored with SN
4. Repeat as needed
5. Click **Download ZIP** → ZIP generated and downloaded
6. Optionally **Clear All** to reset

---

## 📦 Required Dependencies

Install packages:

```bash
npm install html5-qrcode jszip
```

(Optional for styling):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## ✅ Example Code (index.jsx)

```jsx
'use client';

import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Html5QrcodeScanner } from 'html5-qrcode';

const STORAGE_KEY = 'sn_photos';

export default function Home() {
  const [sn, setSn] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPhotos(JSON.parse(saved));

    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render((text) => {
      setSn(text);
      scanner.clear();
    });

    return () => scanner.clear().catch(() => {});
  }, []);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!sn || !file) return alert("SN or photo missing");

    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...photos, { sn, dataUrl: reader.result }];
      setPhotos(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    photos.forEach(({ sn, dataUrl }) => {
      const base64 = dataUrl.split(',')[1];
      zip.file(`${sn}/${sn}.jpg`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'photos.zip';
    a.click();
  };

  const clearAll = () => {
    setPhotos([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Scan Barcode</h2>
      <input type="text" value={sn} readOnly placeholder="Scanned SN" />
      <div id="reader" style={{ width: "300px", marginBottom: 20 }}></div>

      <h2>Take Photo</h2>
      <input type="file" accept="image/*" capture="environment" onChange={handleCapture} />

      <h2>Photos</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {photos.map((p, i) => (
          <div key={i}>
            <img src={p.dataUrl} alt={p.sn} width="100" />
            <div>{p.sn}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <button onClick={downloadZip}>Download ZIP</button>
        <button onClick={clearAll} style={{ marginLeft: 10 }}>Clear All</button>
      </div>
    </div>
  );
}
```

---

## 🚀 Deploying to Vercel

1. Push your Next.js app to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/)
3. Import your repo
4. Set framework = `Next.js`
5. Deploy with default settings

---

## 📌 Notes & Limitations

* All work is done in browser — no server needed
* Data is not synced across devices
* File sizes are limited by browser memory (\~5MB for `localStorage`)
* Works best on modern browsers with camera access

---

## 🔮 Future Improvements

* Add support for multiple images per SN
* Add delete/edit photo entries
* Replace `localStorage` with IndexedDB for large images
* Add PWA support (offline access, installable)
* Add cloud sync/upload option (Firebase, Supabase, etc.)

