import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/Login.css";

const API_URL = "http://localhost:5000";

function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // CAPTCHA
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Robot verification
  const [robotChecked, setRobotChecked] = useState(false);

  // CAPTCHA states
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Login states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD CAPTCHA
  // ========================================

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setError("");

      // Stop any existing speech
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);

      const response = await fetch(
        `${API_URL}/api/captcha/generate`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load CAPTCHA"
        );
      }

      setCaptchaId(data.captchaId);
      setCaptchaImage(data.captchaImage);
      setCaptchaAnswer("");

    } catch (error) {
      console.error(
        "CAPTCHA loading error:",
        error
      );

      setError(
        "Unable to load CAPTCHA. Please refresh the page."
      );
    } finally {
      setCaptchaLoading(false);
    }
  };

  // ========================================
  // LOAD CAPTCHA WHEN LOGIN PAGE OPENS
  // ========================================

  useEffect(() => {
    loadCaptcha();

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ========================================
  // FORM INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ========================================
  // CAPTCHA INPUT
  // ========================================

  const handleCaptchaChange = (e) => {
    const value = e.target.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    setCaptchaAnswer(value);
  };

  // ========================================
  // I'M NOT A ROBOT
  // ========================================

  const handleRobotCheck = () => {
    if (!robotChecked) {
      setRobotChecked(true);
      setError("");
    } else {
      setRobotChecked(false);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);
    }
  };

  // ========================================
  // READ CAPTCHA ALOUD
  // ========================================

  const handleListenCaptcha = async () => {
    try {
      if (!captchaId) {
        setError(
          "CAPTCHA is not ready yet."
        );
        return;
      }

      if (
        !("speechSynthesis" in window)
      ) {
        setError(
          "Voice reading is not supported by this browser."
        );
        return;
      }

      setError("");
      setIsSpeaking(true);

      // Stop previous speech
      window.speechSynthesis.cancel();

      // Ask backend for CAPTCHA text
      const response = await fetch(
        `${API_URL}/api/captcha/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            captchaId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to read CAPTCHA"
        );
      }

      const captchaText =
        data.captchaText;

      /*
        Add pauses between characters.

        Example:
        A7K3P

        Will be spoken as:
        A ... 7 ... K ... 3 ... P
      */

      const spokenText = captchaText
        .split("")
        .join(" ... ");

      const speech =
        new SpeechSynthesisUtterance(
          spokenText
        );

      speech.lang = "en-US";

      // Slightly slower so characters
      // are easier to understand.
      speech.rate = 0.7;

      speech.pitch = 1;
      speech.volume = 1;

      speech.onend = () => {
        setIsSpeaking(false);
      };

      speech.onerror = () => {
        setIsSpeaking(false);

        setError(
          "Unable to read CAPTCHA aloud."
        );
      };

      window.speechSynthesis.speak(
        speech
      );

    } catch (error) {
      console.error(
        "CAPTCHA voice reading error:",
        error
      );

      setIsSpeaking(false);

      setError(error.message);
    }
  };

  // ========================================
  // VERIFY CAPTCHA
  // ========================================

  const verifyCaptcha = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/captcha/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            captchaId,
            captchaAnswer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Incorrect CAPTCHA"
        );
      }

      return true;

    } catch (error) {
      setError(error.message);

      // Generate a new CAPTCHA
      await loadCaptcha();

      return false;
    }
  };

  // ========================================
  // LOGIN
  // ========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Robot checkbox
    if (!robotChecked) {
      setError(
        "Please confirm that you are not a robot."
      );
      return;
    }

    // CAPTCHA
    if (!captchaAnswer.trim()) {
      setError(
        "Please enter the CAPTCHA code."
      );
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------
      // STEP 1: VERIFY CAPTCHA
      // ------------------------------------

      const captchaVerified =
        await verifyCaptcha();

      if (!captchaVerified) {
        setLoading(false);
        return;
      }

      // ------------------------------------
      // STEP 2: LOGIN
      // ------------------------------------

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      // Store logged-in user
      setUser(data.user);

      // Go to home
      navigate("/");

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // GOOGLE LOGIN
  // ========================================

  const handleGoogleLogin = () => {
    window.location.href =
      `${API_URL}/api/auth/google`;
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="login-page">
      <div className="login-container">

        {/* TITLE */}

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Login to continue ordering your
          favorite food
        </p>

        {/* ERROR */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          {/* ============================
              EMAIL
          ============================ */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

          </div>

          {/* ============================
              PASSWORD
          ============================ */}

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

          </div>

          {/* ============================
              I'M NOT A ROBOT
          ============================ */}

          <div className="robot-check">

            <label className="robot-checkbox">

              <input
                type="checkbox"
                checked={robotChecked}
                onChange={handleRobotCheck}
              />

              <span className="custom-checkbox"></span>

              <span className="robot-text">
                I'm not a robot
              </span>

            </label>

          </div>

          {/* ============================
              CAPTCHA
          ============================ */}

          {robotChecked && (
            <div className="captcha-section">

              <div className="captcha-title">
                Enter the code shown below
              </div>

              {/* CAPTCHA IMAGE */}

              <div className="captcha-image-row">

                <div
                  className="captcha-image"
                  dangerouslySetInnerHTML={{
                    __html: captchaImage,
                  }}
                />

                {/* REFRESH */}

                <button
                  type="button"
                  className="captcha-refresh"
                  onClick={loadCaptcha}
                  disabled={captchaLoading}
                  title="Get a new CAPTCHA"
                >
                  {captchaLoading
                    ? "..."
                    : "↻"}
                </button>

              </div>

              {/* INPUT + SPEAKER */}

              <div className="captcha-input-row">

                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={
                    handleCaptchaChange
                  }
                  placeholder="Enter CAPTCHA code"
                  maxLength={5}
                  autoComplete="off"
                  aria-label="CAPTCHA code"
                />

                {/* LISTEN */}

                <button
                  type="button"
                  className={`captcha-voice ${
                    isSpeaking
                      ? "listening"
                      : ""
                  }`}
                  onClick={
                    handleListenCaptcha
                  }
                  disabled={isSpeaking}
                  title="Listen to CAPTCHA"
                  aria-label="Listen to CAPTCHA"
                >
                  {isSpeaking
                    ? "🔊"
                    : "🔈"}
                </button>

              </div>

              {/* HELP TEXT */}

              <p className="captcha-help">
                Can't see the code clearly?
                Click 🔈 to hear the CAPTCHA.
              </p>

            </div>
          )}

          {/* ============================
              LOGIN BUTTON
          ============================ */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* ============================
            DIVIDER
        ============================ */}

        <div className="divider">
          <span>OR</span>
        </div>

        {/* ============================
            GOOGLE LOGIN
        ============================ */}

        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        {/* ============================
            REGISTER
        ============================ */}

        <p className="register-text">

          Don't have an account?{" "}

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Create Account
          </button>

        </p>

      </div>
    </div>
  );
}

export default Login;