import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import "../Styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [robotChecked, setRobotChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const stopCaptchaAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    } catch (error) {
      console.error("Audio cleanup error:", error);
    }
    setIsSpeaking(false);
  };

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setError("");
      stopCaptchaAudio();
      setCaptchaAnswer("");
      const response = await fetch(`${API_URL}/api/captcha/generate`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load CAPTCHA");
      }
      setCaptchaId(data.captchaId);
      setCaptchaImage(data.captchaImage);
    } catch (error) {
      console.error("CAPTCHA loading error:", error);
      setError("Unable to load CAPTCHA. Please refresh the page.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
    return () => {
      stopCaptchaAudio();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
  };

  const handleCaptchaChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setCaptchaAnswer(value);
    setError("");
  };

  const handleRobotCheck = () => {
    if (!robotChecked) {
      setRobotChecked(true);
      setError("");
      loadCaptcha();
    } else {
      setRobotChecked(false);
      setCaptchaAnswer("");
      stopCaptchaAudio();
      setError("");
    }
  };

  const handleListenCaptcha = async () => {
    if (!captchaId) {
      setError("CAPTCHA is not ready. Please refresh the CAPTCHA.");
      return;
    }
    if (captchaLoading) {
      setError("Please wait for the CAPTCHA to load.");
      return;
    }
    try {
      setError("");
      stopCaptchaAudio();
      setIsSpeaking(true);
      const response = await fetch(`${API_URL}/api/captcha/audio/${captchaId}`);
      if (!response.ok) {
        let message = "Unable to play CAPTCHA audio.";
        try {
          const data = await response.json();
          if (data.message) message = data.message;
        } catch {}
        throw new Error(message);
      }
      const audioBlob = await response.blob();
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("The server returned empty audio.");
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = "auto";
      audio.volume = 1;
      audio.onended = () => stopCaptchaAudio();
      audio.onerror = () => {
        console.error("CAPTCHA audio playback error");
        stopCaptchaAudio();
        setError("Unable to play CAPTCHA audio. Please try again.");
      };
      await audio.play();
    } catch (error) {
      console.error("CAPTCHA audio error:", error);
      stopCaptchaAudio();
      setError(error.message || "Unable to play CAPTCHA audio.");
    }
  };

  const verifyCaptcha = async () => {
    try {
      const response = await fetch(`${API_URL}/api/captcha/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaId, captchaAnswer }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Incorrect CAPTCHA");
      }
      return data.captchaProof;
    } catch (error) {
      setError(error.message);
      await loadCaptcha();
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!robotChecked) {
      setError("Please confirm that you are not a robot.");
      return;
    }
    if (!captchaAnswer.trim()) {
      setError("Please enter the CAPTCHA code.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const captchaProof = await verifyCaptcha();
      if (!captchaProof) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Captcha-Proof": captchaProof,
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const loggedInUser = data.user;
      setUser(loggedInUser);

      if (loggedInUser?.role === "admin") {
        window.location.replace("/admin");
        return;
      }

      window.location.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🍴</div>
          <h1>Welcome Back</h1>
          <p>Login to continue ordering your favorite food</p>
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} autoComplete="email" required />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-input-wrapper">
              <input id="login-password" type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} autoComplete="current-password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((previous) => !previous)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="robot-check">
            <label className="robot-checkbox">
              <input type="checkbox" checked={robotChecked} onChange={handleRobotCheck} />
              <span className="custom-checkbox"></span>
              <span className="robot-text">I'm not a robot</span>
            </label>
          </div>

          {robotChecked && (
            <div className="captcha-section">
              <div className="captcha-title">Enter the code shown below</div>
              <div className="captcha-image-row">
                <div className="captcha-image" dangerouslySetInnerHTML={{ __html: captchaImage }} aria-label="CAPTCHA image" />
                <button type="button" className="captcha-refresh" onClick={loadCaptcha} disabled={captchaLoading} title="Get a new CAPTCHA" aria-label="Get a new CAPTCHA">{captchaLoading ? "..." : "↻"}</button>
              </div>
              <div className="captcha-input-row">
                <input type="text" value={captchaAnswer} onChange={handleCaptchaChange} placeholder="Enter CAPTCHA code" maxLength={5} autoComplete="off" aria-label="CAPTCHA code" required />
                <button type="button" className={`captcha-voice ${isSpeaking ? "listening" : ""}`} onClick={handleListenCaptcha} disabled={isSpeaking} title="Listen to CAPTCHA" aria-label="Listen to CAPTCHA">{isSpeaking ? "🔊" : "🔈"}</button>
              </div>
              <p className="captcha-help">Click 🔈 to hear the CAPTCHA characters.</p>
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>

        <div className="login-divider"><span>OR</span></div>

        <button type="button" className="google-login-button" onClick={handleGoogleLogin} disabled={loading}>
          <span className="google-icon">G</span>
          <span>Continue with Google</span>
        </button>

        <p className="login-register">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/register")}>Create Account</button>
        </p>
      </div>
    </div>
  );
}

export default Login;
