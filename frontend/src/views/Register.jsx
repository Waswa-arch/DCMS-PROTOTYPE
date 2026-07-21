import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth() || {};
  const navigate = useNavigate(); 

  // Wizard Step Control — 2 steps: personal details, then password.
  // Role selection was removed: the backend derives role exclusively from
  // email domain (@kabarak.ac.ke -> STUDENT, @kabarak.edu.ke -> OFFICER)
  // and has never honored a client-submitted role or department. Leaving
  // that step in place let a user pick "Clearance Officer" or "Faculty"
  // and be silently registered as something else with no explanation —
  // a real UX-honesty problem, not just an unused screen.
  const [step, setStep] = useState(1);

  // Form Field States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status Feedback States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !regNumber) {
      setError('Please fully populate all fields to proceed.');
      return;
    }
    setStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password security protocol requires at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password matching verification failed.');
      return;
    }

    try {
      setLoading(true);

      if (register) {
        await register({ firstName, lastName, email, regNumber, password });
      }

      setSuccess('Profile successfully cataloged! Redirecting to login...');

      setTimeout(() => {
        navigate('/login'); 
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failure occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-wrapper">
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <style>{`
        .auth-shell { display: flex; min-height: 100vh; width: 100vw; background: #f7f5f0; font-family: 'DM Sans', sans-serif; text-align: left; }

        /* ===== ILLUSTRATION PANEL (shared visual language with Login.jsx) ===== */
        .illustration-pane { width: 400px; flex-shrink: 0; background: #fdf6ec; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .blob-x { position: absolute; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(93,202,165,0.32), transparent 70%); top: -60px; left: -60px; animation: blobDrift1 10s ease-in-out infinite; }
        .blob-y { position: absolute; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(240,153,123,0.28), transparent 70%); bottom: -50px; right: -50px; animation: blobDrift2 12s ease-in-out infinite; }

        @keyframes blobDrift1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(22px,-18px) scale(1.05); } }
        @keyframes blobDrift2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-18px,16px) scale(1.04); } }
        @keyframes floatDevice { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes checkPop { 0%, 58% { opacity: 0; transform: scale(0.4); } 72% { transform: scale(1.2); } 85% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes rowActive { 0%, 100% { background: transparent; } 50% { background: #e1f5ee; } }
        @keyframes scenePhone { 0% { opacity: 0; transform: scale(0.95) translateY(6px); } 6%, 28% { opacity: 1; transform: scale(1) translateY(0); } 36% { opacity: 0; transform: scale(1.03) translateY(-6px); } 100% { opacity: 0; } }
        @keyframes sceneLaptop { 0%, 30% { opacity: 0; transform: scale(0.95) translateY(6px); } 38%, 58% { opacity: 1; transform: scale(1) translateY(0); } 66% { opacity: 0; transform: scale(1.03) translateY(-6px); } 100% { opacity: 0; } }
        @keyframes sceneGrad { 0%, 64% { opacity: 0; transform: scale(0.95) translateY(6px); } 72%, 94% { opacity: 1; transform: scale(1) translateY(0); } 100% { opacity: 0; transform: scale(1.03) translateY(-6px); } }
        @keyframes tassleSwing { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(90px) rotate(220deg); opacity: 0; } }
        @keyframes capToss { 0%, 70% { transform: translateY(0) rotate(0deg); } 82% { transform: translateY(-26px) rotate(-18deg); } 94% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(0) rotate(0deg); } }
        @keyframes progressFill { 0%, 58% { width: 0%; } 75%, 100% { width: 100%; } }

        .scene { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; animation-duration: 13s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(.45,0,.2,1); }
        .devshadow { position: absolute; bottom: 26%; width: 130px; height: 14px; background: rgba(15,25,35,0.15); border-radius: 50%; filter: blur(4px); }

        .phonebody { width: 190px; height: 390px; background: #101820; border-radius: 38px; padding: 10px; box-shadow: 0 24px 50px rgba(15,25,35,0.28), inset 0 0 0 2px #2b3743; position: relative; animation: floatDevice 3.4s ease-in-out infinite; }
        .phone-powerbtn { position: absolute; right: -2px; top: 96px; width: 2px; height: 52px; background: #0c1218; border-radius: 0 2px 2px 0; }
        .phone-volbtn1 { position: absolute; left: -2px; top: 70px; width: 2px; height: 26px; background: #0c1218; border-radius: 2px 0 0 2px; }
        .phone-volbtn2 { position: absolute; left: -2px; top: 104px; width: 2px; height: 40px; background: #0c1218; border-radius: 2px 0 0 2px; }
        .phonescreen2 { width: 100%; height: 100%; background: #fff; border-radius: 28px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
        .phone-notch2 { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 64px; height: 20px; background: #101820; border-radius: 0 0 14px 14px; z-index: 2; }
        .phone-statusbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px 2px; font-size: 9px; color: #0f1923; font-weight: 600; }
        .phone-content { flex: 1; padding: 20px 16px 8px; }
        .phone-home { width: 100px; height: 4px; background: #0f1923; border-radius: 3px; margin: 0 auto 6px; opacity: 0.7; }
        .phonehead { font-size: 11px; color: #0f1923; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; text-align: center; font-weight: 700; }
        .checkrow { display: flex; align-items: center; gap: 9px; padding: 7px 5px; border-radius: 7px; margin-bottom: 5px; }
        .checkrow span.chk-label { font-size: 12.5px; color: #374151; flex: 1; font-weight: 500; }
        .checkcircle { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .checkcircle i { font-size: 11px; color: #0f6e56; opacity: 0; animation: checkPop 5.2s cubic-bezier(.34,1.56,.64,1) infinite; }
        .r1 { animation: rowActive 5.2s ease-in-out infinite; }
        .r1 i { animation-delay: 0s; }
        .r2 { animation: rowActive 5.2s ease-in-out infinite 0.8s; }
        .r2 i { animation-delay: 0.9s; }
        .r3 { animation: rowActive 5.2s ease-in-out infinite 1.6s; }
        .r3 i { animation-delay: 1.8s; }

        .laptop { width: 280px; }
        .laptopscreen { background: #0f1923; border-radius: 10px 10px 0 0; padding: 14px 14px 18px; box-shadow: 0 22px 42px rgba(15,25,35,0.24); animation: floatDevice 3.6s ease-in-out infinite; }
        .laptopinner { background: #fff; border-radius: 6px; padding: 14px 14px; height: 130px; }
        .laptophead { font-size: 10px; color: #0f1923; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; font-weight: 700; }
        .statgrid { display: flex; gap: 6px; margin-top: 8px; }
        .statcard { flex: 1; background: #f7f5f0; border-radius: 6px; padding: 8px 6px; text-align: center; }
        .statcard .num { font-size: 16px; font-weight: 700; color: #0f6e56; }
        .statcard .lbl { font-size: 8px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
        .progresstrack { height: 5px; background: #e5e2d8; border-radius: 3px; margin-top: 9px; overflow: hidden; }
        .progressfill { height: 100%; background: #0f6e56; border-radius: 3px; width: 0; animation: progressFill 13s ease-out infinite; }
        .approvedbanner { margin-top: 9px; background: #0f6e56; border-radius: 7px; padding: 7px; text-align: center; }
        .approvedbanner span { font-size: 10px; color: #fff; font-weight: 700; }
        .laptopbase { width: 310px; height: 13px; background: linear-gradient(#374151, #1f2937); border-radius: 0 0 9px 9px; margin-left: -15px; position: relative; }
        .laptopbase::after { content: ''; position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 55px; height: 4px; background: #0f1923; border-radius: 0 0 4px 4px; }

        .gradwrap { text-align: center; position: relative; }
        .gradsvg { width: 150px; height: 150px; animation: capToss 13s ease-in-out infinite; }
        .tassel { transform-origin: 50% 0%; animation: tassleSwing 2.2s ease-in-out infinite; }
        .gradtext { color: #0f1923; font-size: 15px; margin-top: 14px; font-weight: 600; }
        .gradsub { color: #6b7280; font-size: 12px; margin-top: 4px; }
        .confetti-piece { position: absolute; width: 6px; height: 6px; top: 20px; animation: confettiFall 2.4s ease-in infinite; }

        .illustration-brand { position: absolute; top: 28px; left: 32px; z-index: 3; display: flex; align-items: center; gap: 10px; }
        .illustration-brand-badge { width: 36px; height: 36px; border-radius: 10px; background: #0f6e56; display: flex; align-items: center; justify-content: center; }
        .illustration-brand-text { font-family: 'DM Serif Display', serif; font-size: 15px; color: #0f1923; line-height: 1.15; }

        /* ===== FORM PANE ===== */
        .auth-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; background: #f7f5f0; }
        .auth-card { width: 100%; max-width: 420px; background: #ffffff; border: 1px solid #e2e0d8; border-radius: 20px; padding: 40px 40px 36px; box-shadow: 0 4px 40px rgba(15,25,35,0.07); text-align: left; box-sizing: border-box; }
        .auth-tag { display: inline-flex; align-items: center; gap: 6px; background: #e1f5ee; color: #0f6e56; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 100px; margin-bottom: 24px; }
        .auth-tag span { width: 6px; height: 6px; border-radius: 50%; background: #1d9e75; display: inline-block; }
        .auth-card h1 { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0f1923; line-height: 1.2; margin-bottom: 6px; font-weight: normal; }
        .auth-desc { font-size: 14px; color: #6b7280; font-weight: 300; margin-bottom: 28px; line-height: 1.5; }
        .field { margin-bottom: 18px; text-align: left; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: #0f1923; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 7px; }
        .field input, .field select { width: 100%; height: 44px; border: 1px solid #e2e0d8; border-radius: 10px; background: #ffffff; padding: 0 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0f1923; outline: none; transition: border 0.2s; box-sizing: border-box; }
        .field input:focus, .field select:focus { border-color: #0f6e56; box-shadow: 0 0 0 3px rgba(15,110,86,0.1); }
        .field-icon { position: relative; }
        .field-icon input { padding-left: 40px; }
        .field-icon i { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #c4c2bc; pointer-events: none; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .btn-primary { width: 100%; height: 48px; background: #0f1923; color: #fff; border: none; border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.2s, transform 0.1s; margin-top: 8px; box-sizing: border-box; }
        .btn-primary:hover { background: #1a2d3e; }

        .tab-bar { display: flex; background: #f7f5f0; border-radius: 10px; padding: 3px; margin-bottom: 28px; }
        .tab { flex: 1; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #6b7280; border-radius: 8px; cursor: pointer; transition: all 0.2s; user-select: none; }
        .tab.active { background: #fff; color: #0f1923; box-shadow: 0 1px 4px rgba(0,0,0,0.08); font-weight: 600; }

        .step-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 24px; }
        .dot { width: 20px; height: 4px; border-radius: 2px; background: #e2e0d8; transition: all 0.25s; }
        .dot.active { background: #0f6e56; width: 28px; }
        .dot.done { background: #1d9e75; }

        .error-message { background: #fdf2f2; color: #9b1c1c; border: 1px solid #f8b4b4; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; font-weight: 500; }
        .success-message { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; font-weight: 500; }
        .field-hint { font-size: 11px; color: #6b7280; margin-top: 5px; font-weight: 300; opacity: 0.7; text-align: left; }

        @media (max-width: 900px) {
          .illustration-pane { display: none; }
        }
      `}</style>

      <div className="auth-shell">
        <div className="illustration-pane">
          <div className="blob-x"></div>
          <div className="blob-y"></div>

          <div className="illustration-brand">
            <div className="illustration-brand-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="illustration-brand-text">DCMS</div>
          </div>

          {/* SCENE 1 — PHONE: checks off each department one by one */}
          <div className="scene" style={{ animationName: 'scenePhone' }}>
            <div className="devshadow"></div>
            <div className="phonebody">
              <div className="phone-volbtn1"></div>
              <div className="phone-volbtn2"></div>
              <div className="phone-powerbtn"></div>
              <div className="phonescreen2">
                <div className="phone-notch2"></div>
                <div className="phone-statusbar"><span>9:41</span><span>●●●</span></div>
                <div className="phone-content">
                  <div className="phonehead">Clearance status</div>
                  <div className="checkrow r1">
                    <div className="checkcircle"><i className="ti ti-check" aria-hidden="true"></i></div>
                    <span className="chk-label">Library</span>
                  </div>
                  <div className="checkrow r2">
                    <div className="checkcircle"><i className="ti ti-check" aria-hidden="true"></i></div>
                    <span className="chk-label">Finance</span>
                  </div>
                  <div className="checkrow r3">
                    <div className="checkcircle"><i className="ti ti-check" aria-hidden="true"></i></div>
                    <span className="chk-label">Hostel</span>
                  </div>
                </div>
                <div className="phone-home"></div>
              </div>
            </div>
          </div>

          {/* SCENE 2 — LAPTOP: full dashboard summary */}
          <div className="scene" style={{ animationName: 'sceneLaptop' }}>
            <div className="devshadow" style={{ bottom: '38%', width: '170px' }}></div>
            <div className="laptop">
              <div className="laptopscreen">
                <div className="laptopinner">
                  <div className="laptophead">Clearance dashboard</div>
                  <div className="statgrid">
                    <div className="statcard"><div className="num">6/6</div><div className="lbl">Cleared</div></div>
                    <div className="statcard"><div className="num">0</div><div className="lbl">Pending</div></div>
                  </div>
                  <div className="progresstrack"><div className="progressfill"></div></div>
                  <div className="approvedbanner"><span>All departments approved</span></div>
                </div>
              </div>
              <div className="laptopbase"></div>
            </div>
          </div>

          {/* SCENE 3 — GRADUATION: celebratory close of the loop */}
          <div className="scene" style={{ animationName: 'sceneGrad' }}>
            <div className="gradwrap">
              <div className="confetti-piece" style={{ left: '20px', background: '#5dcaa5', animationDelay: '0s' }}></div>
              <div className="confetti-piece" style={{ left: '60px', background: '#f0997b', animationDelay: '0.3s' }}></div>
              <div className="confetti-piece" style={{ left: '100px', background: '#fac775', animationDelay: '0.15s' }}></div>
              <div className="confetti-piece" style={{ left: '130px', background: '#7f77dd', animationDelay: '0.45s' }}></div>
              <svg className="gradsvg" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="38" r="16" fill="#f0997b" />
                <path d="M28 92 Q28 62 50 62 Q72 62 72 92 Z" fill="#534ab7" />
                <path d="M50 62 L50 92" stroke="#3c3489" strokeWidth="1.5" />
                <path d="M22 30 L50 20 L78 30 L50 40 Z" fill="#0f1923" />
                <circle className="tassel" cx="50" cy="30" r="2.5" fill="#fac775" />
                <line className="tassel" x1="50" y1="30" x2="50" y2="42" stroke="#fac775" strokeWidth="2" />
              </svg>
              <div className="gradtext">Congratulations, graduate</div>
              <div className="gradsub">Your clearance journey is complete</div>
            </div>
          </div>
        </div>

        <div className="auth-main">
          <div className="auth-card">
            <div className="tab-bar">
              <div className="tab" onClick={() => navigate('/login')}>Sign in</div>
              <div className="tab active">Register</div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="step-dots">
              <div className={`dot ${step === 1 ? 'active' : 'done'}`}></div>
              <div className={`dot ${step === 2 ? 'active' : ''}`}></div>
            </div>

            {step === 1 && (
              <form onSubmit={handleNextStep}>
                <div className="auth-tag"><span></span>Step 1 of 2</div>
                <h1>Your details</h1>
                <p className="auth-desc">Start with your basic personal information.</p>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="reg-first-name">First name</label>
                    <input
                      id="reg-first-name"
                      name="firstName"
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="reg-last-name">Last name</label>
                    <input
                      id="reg-last-name"
                      name="lastName"
                      type="text"
                      placeholder="Mwangi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
                <div className="field field-icon">
                  <label htmlFor="reg-email">University email</label>
                  <i className="ti ti-mail"></i>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="username@kabarak.ac.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="field field-icon">
                  <label htmlFor="reg-id-num">Student / Staff ID</label>
                  <i className="ti ti-id-badge"></i>
                  <input
                    id="reg-id-num"
                    name="regNumber"
                    type="text"
                    placeholder="e.g. 20CS001 or STF-045"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <span>Continue</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleRegisterSubmit}>
                <div className="auth-tag"><span></span>Step 2 of 2</div>
                <h1>Set password</h1>
                <p className="auth-desc">Choose a strong password to secure your account.</p>

                <div className="field field-icon">
                  <label htmlFor="reg-password">Password</label>
                  <i className="ti ti-lock"></i>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="field field-icon">
                  <label htmlFor="reg-confirm-password">Confirm password</label>
                  <i className="ti ti-lock-check"></i>
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {password && confirmPassword && (
                  <div className="field-hint" style={{ marginTop: '-10px', marginBottom: '14px', color: password === confirmPassword && password.length >= 8 ? '#0f6e56' : '#c0392b' }}>
                    {password.length < 8 ? 'Password must be at least 8 characters' : password === confirmPassword ? 'Passwords match ✓' : 'Passwords do not match'}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={loading}>
                  <span>{loading ? 'Creating Account...' : 'Create account'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>

                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <a onClick={() => setStep(1)} style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>← Go back</a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Register;