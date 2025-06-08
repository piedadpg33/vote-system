import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const suppressedWarnings = [
  'Warning: Each child in a list should have a unique "key" prop',
  // Puedes agregar más mensajes aquí si quieres filtrar otros warnings
];

const originalWarn = console.warn;
console.warn = function(msg, ...args) {
  if (!suppressedWarnings.some(w => msg.includes(w))) {
    originalWarn.call(console, msg, ...args);
  }
};


