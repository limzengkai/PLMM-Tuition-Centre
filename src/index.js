import React from "react";
import { createRoot } from 'react-dom/client';

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/styles/tailwind.css";
// import 'assets/styles/index.css'
import './input.css'
import './output.css'
import 'react-toastify/dist/ReactToastify.css';
import App from './App.js'
import { AuthContextProvider } from "./config/context/AuthContext.js";

const root = createRoot(document.getElementById('root'));


root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </React.StrictMode>
);