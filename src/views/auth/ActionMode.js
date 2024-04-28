import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ActionMode() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    handleActionMode();
  }, []);

  const handleActionMode = () => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const oobCode = queryParams.get("oobCode");
    const apiKey = queryParams.get("apiKey");
    const lang = queryParams.get("lang");
    const continueUrl = queryParams.get("continueUrl")
  
    if (mode === "resetPassword") {
      navigate(`/auth/reset-password?mode=${mode}&oobCode=${oobCode}&apiKey=${apiKey}$lang=${lang}`);
    } else if (mode === "verifyEmail") {
      console.log("Verify Email");
      window.location.href = `https://tuitioncentermanagementsystem.firebaseapp.com/__/auth/action?mode=${mode}&oobCode=${oobCode}&apiKey=${apiKey}&continueUrl=${continueUrl}&lang=${lang}`;
    } else {
      navigate(`/auth/login`);
    }
  }

  return null; // This component doesn't render anything visible
}
