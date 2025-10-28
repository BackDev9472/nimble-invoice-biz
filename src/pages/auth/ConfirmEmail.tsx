import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const ConfirmEmailPage = () => {
  const [message, setMessage] = useState("Verifying your email...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setMessage(`Error: ${decodeURIComponent(errorDescription || error)}`);
      return;
    }

    // No error in query params → assume email confirmed
    setMessage("Email confirmed successfully! Redirecting to login...");
    setTimeout(() => navigate("/auth"), 2000);
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Email Confirmation</h2>
      <p>{message}</p>
    </div>
  );
};

export default ConfirmEmailPage;
