import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("🚀 Mounting React Root...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ FATAL: Could not find root element with ID 'root'!");
  // Display a fallback message if the DOM is completely broken
  document.body.innerHTML = '<div style="color:white; padding: 20px;"><h1>Fatal Error: Root Element Missing</h1><p>Please check index.html for &lt;div id="root"&gt;&lt;/div&gt;</p></div>';
} else {
  console.log("✅ Root element found. Creating React root...");
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✨ React render call successful.");
  } catch (err) {
    console.error("❌ Error during React mounting process:", err);
  }
}