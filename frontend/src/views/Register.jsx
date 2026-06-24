import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth() || {};
  const navigate = useNavigate(); 

  // Wizard Step Control
  const [step, setStep] = useState(1);

  // Form Field States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [role, setRole] = useState('Student'); 
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status Feedback States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!firstName || !lastName || !email || !regNumber) {
        setError('Please fully populate all fields to proceed.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (role !== 'Student' && !department) {
        setError('Please select your assigned academic department.');
        return;
      }
      setStep(3);
    }
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
        await register({ firstName, lastName, email, regNumber, role, department, password });
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
        .auth-sidebar { width: 380px; flex-shrink: 0; background: #0f1923; padding: 48px 44px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
        .sidebar-pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(circle at 20% 30%, rgba(15,110,86,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 75%, rgba(29,158,117,0.15) 0%, transparent 45%); pointer-events: none; }
        .sidebar-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px); background-size: 40px 40px; pointer-events: none; }
        .brand { position: relative; z-index: 1; text-align: left; }
        .brand-badge { width: 52px; height: 52px; border-radius: 14px; background: #0f6e56; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .brand-badge svg { width: 28px; height: 28px; stroke: #fff; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .brand-name { font-family: 'DM Serif Display', serif; font-size: 28px; color: #fff; line-height: 1.1; letter-spacing: -0.5px; }
        .brand-sub { font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: 2.5px; text-transform: uppercase; margin-top: 6px; font-weight: 300; }
        .sidebar-quote { position: relative; z-index: 1; text-align: left; }
        .sidebar-quote blockquote { font-family: 'DM Serif Display', serif; font-style: italic; color: rgba(255,255,255,0.55); font-size: 17px; line-height: 1.6; border-left: 2px solid #0f6e56; padding-left: 16px; }
        .sidebar-footer { position: relative; z-index: 1; text-align: left; }
        .sidebar-footer p { font-size: 12px; color: rgba(255,255,255,0.25); font-weight: 300; }
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
        
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
        .role-pill { border: 1px solid #e2e0d8; border-radius: 9px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; color: #6b7280; transition: all 0.15s; background: #fff; text-align: left; }
        .role-pill:hover { border-color: #0f6e56; color: #0f6e56; }
        .role-pill.selected { border-color: #0f6e56; background: #e1f5ee; color: #0f6e56; }
        
        .error-message { background: #fdf2f2; color: #9b1c1c; border: 1px solid #f8b4b4; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; font-weight: 500; }
        .success-message { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; font-weight: 500; }
        .field-hint { font-size: 11px; color: #6b7280; margin-top: 5px; font-weight: 300; opacity: 0.7; text-align: left; }
      `}</style>

      <div className="auth-shell">
        <div className="auth-sidebar">
          <div className="sidebar-pattern"></div>
          <div className="sidebar-grid"></div>
          <div className="brand">
            <div className="brand-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <div className="brand-name">Kabarak<br />University</div>
            <div className="brand-sub">Digital Clearance</div>
          </div>
          <div className="sidebar-quote">
            {/* Principles of the identity script */}
            <blockquote>"Fear God and serve in excellence."</blockquote>
          </div>
          <div className="sidebar-footer">
            <p>© 2025 Kabarak University · Digital Records Office</p>
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
              <div className={`dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}></div>
              <div className={`dot ${step === 3 ? 'active' : ''}`}></div>
            </div>

            {step === 1 && (
              <form onSubmit={handleNextStep}>
                <div className="auth-tag"><span></span>Step 1 of 3</div>
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
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNextStep}>
                <div className="auth-tag"><span></span>Step 2 of 3</div>
                <h1>Your role</h1>
                <p className="auth-desc">Select how you're using the clearance system.</p>
                
                <div className="role-grid">
                  {['Student', 'Department', 'Clearance Officer', 'Faculty'].map((lbl) => (
                    <div key={lbl} className={`role-pill ${role === lbl ? 'selected' : ''}`} onClick={() => setRole(lbl)}>
                      <i className={
                        lbl === 'Student' ? 'ti ti-user-graduate' :
                        lbl === 'Department' ? 'ti ti-building' :
                        lbl === 'Clearance Officer' ? 'ti ti-shield-check' : 'ti ti-school'
                      }></i>
                      {lbl}
                    </div>
                  ))}
                </div>

                <div className="field">
                  <label htmlFor="reg-department">Department / School</label>
                  <select 
                    id="reg-department"
                    name="department"
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                    required={role !== 'Student'}
                  >
                    <option value="" disabled>Select department</option>
                    <option>School of Computing & Informatics</option>
                    <option>School of Business</option>
                    <option>School of Education</option>
                    <option>School of Engineering</option>
                    <option>School of Law</option>
                    <option>School of Medicine</option>
                    <option>School of Nursing</option>
                    <option>Finance Office</option>
                    <option>Library</option>
                    <option>Accommodation</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary">
                  <span>Continue</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <a onClick={() => setStep(1)} style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>← Go back</a>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleRegisterSubmit}>
                <div className="auth-tag"><span></span>Step 3 of 3</div>
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
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                
                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                  <a onClick={() => setStep(2)} style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>← Go back</a>
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