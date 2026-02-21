import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SmartAssistant.css';
import { t, languageOptions, maharashtraDistricts, commonCrops, indianStates } from './translations';

const API_BASE = 'http://localhost:8000/smart-assistant';

// ===== Toast Component =====
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`sa-toast ${type}`}>{message}</div>;
}

// ===== Loading Component =====
function Loading({ text }) {
  return (
    <div className="sa-loading">
      <div className="sa-loading-spinner" />
      <p>{text || 'Loading...'}</p>
    </div>
  );
}

// ===== Voice Input Hook =====
function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  return { isListening, transcript, startListening, setTranscript };
}

// ===== MAIN COMPONENT =====
export default function SmartAssistant() {
  // State
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [farmerId, setFarmerId] = useState(localStorage.getItem('sa_farmerId') || '');
  const [farmerName, setFarmerName] = useState(localStorage.getItem('sa_farmerName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('sa_farmerId'));
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [schemesData, setSchemesData] = useState(null);
  const [insuranceData, setInsuranceData] = useState(null);
  const [applicationsData, setApplicationsData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [checklistData, setChecklistData] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [compareSchemes, setCompareSchemes] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [appDetailData, setAppDetailData] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const langCode = lang === 'English' ? 'en' : lang === 'Hindi' ? 'hi' : lang === 'Marathi' ? 'mr' : lang;

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ===== Fetch Dashboard =====
  const fetchDashboard = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/dashboard/${farmerId}?lang=${langCode}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  }, [farmerId, langCode]);

  // ===== Fetch Eligible Schemes =====
  const fetchSchemes = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/eligible-schemes/${farmerId}?lang=${langCode}`);
      setSchemesData(res.data);
    } catch (err) {
      console.error('Schemes error:', err);
    }
    setLoading(false);
  }, [farmerId, langCode]);

  // ===== Fetch Insurance =====
  const fetchInsurance = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/insurance/${farmerId}?lang=${langCode}`);
      setInsuranceData(res.data);
    } catch (err) {
      console.error('Insurance error:', err);
    }
    setLoading(false);
  }, [farmerId, langCode]);

  // ===== Fetch Applications =====
  const fetchApplications = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/${farmerId}?lang=${langCode}`);
      setApplicationsData(res.data);
    } catch (err) {
      console.error('Applications error:', err);
    }
    setLoading(false);
  }, [farmerId, langCode]);

  // ===== Fetch Weather =====
  const fetchWeather = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/weather-risk/${farmerId}?lang=${langCode}`);
      setWeatherData(res.data);
    } catch (err) {
      console.error('Weather error:', err);
    }
    setLoading(false);
  }, [farmerId, langCode]);

  // ===== Fetch Checklist =====
  const fetchChecklist = useCallback(async (schemeId) => {
    if (!farmerId) return;
    try {
      const res = await axios.get(`${API_BASE}/checklist/${farmerId}/${schemeId}?lang=${langCode}`);
      setChecklistData(res.data);
    } catch (err) {
      console.error('Checklist error:', err);
    }
  }, [farmerId, langCode]);

  // ===== Apply for Scheme =====
  const handleApply = async (schemeId) => {
    try {
      const res = await axios.post(`${API_BASE}/apply/${farmerId}/${schemeId}`);
      if (res.data.status === 'success') {
        showToast(t(langCode, 'register.success') + ' Application #' + res.data.application.applicationNumber);
        fetchSchemes();
        fetchApplications();
      } else if (res.data.status === 'already_applied') {
        showToast('Already applied for this scheme', 'info');
      }
    } catch (err) {
      showToast('Application failed', 'error');
    }
  };

  // ===== Compare Schemes =====
  const handleCompare = async () => {
    if (compareSchemes.length < 2) {
      showToast('Select at least 2 schemes to compare', 'error');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/compare-schemes?lang=${langCode}`, {
        schemeIds: compareSchemes
      });
      setComparisonResult(res.data);
    } catch (err) {
      showToast('Comparison failed', 'error');
    }
  };

  // ===== View Application Detail =====
  const fetchAppDetail = async (appId) => {
    try {
      const res = await axios.get(`${API_BASE}/application/${appId}?lang=${langCode}`);
      setAppDetailData(res.data);
    } catch (err) {
      console.error('App detail error:', err);
    }
  };

  // ===== Effect: Load data on tab change =====
  useEffect(() => {
    if (!isLoggedIn) return;
    switch (activeTab) {
      case 'dashboard': fetchDashboard(); break;
      case 'schemes': fetchSchemes(); break;
      case 'insurance': fetchInsurance(); break;
      case 'applications': fetchApplications(); break;
      case 'weather': fetchWeather(); break;
      default: break;
    }
  }, [activeTab, isLoggedIn, fetchDashboard, fetchSchemes, fetchInsurance, fetchApplications, fetchWeather]);

  // ===== Handle login with existing farmer =====
  const handleLogin = (fId, fName) => {
    setFarmerId(fId);
    setFarmerName(fName);
    setIsLoggedIn(true);
    localStorage.setItem('sa_farmerId', fId);
    localStorage.setItem('sa_farmerName', fName);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFarmerId('');
    setFarmerName('');
    localStorage.removeItem('sa_farmerId');
    localStorage.removeItem('sa_farmerName');
    setDashboardData(null);
    setActiveTab('dashboard');
  };

  // ===== REGISTER / LOGIN PAGE =====
  if (!isLoggedIn) {
    return (
      <div className="sa-container">
        <LanguageBar lang={langCode} setLang={setLang} />
        <RegisterPage langCode={langCode} onLogin={handleLogin} showToast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ===== MAIN APP =====
  return (
    <div className="sa-container">
      <LanguageBar lang={langCode} setLang={setLang} />
      
      {/* Navigation */}
      <nav className="sa-nav">
        {[
          { key: 'dashboard', label: t(langCode, 'nav.dashboard'), icon: '📊' },
          { key: 'schemes', label: t(langCode, 'nav.schemes'), icon: '📋', badge: dashboardData?.dashboard?.eligibleSchemes },
          { key: 'insurance', label: t(langCode, 'nav.insurance'), icon: '🛡️' },
          { key: 'applications', label: t(langCode, 'nav.applications'), icon: '📝' },
          { key: 'weather', label: t(langCode, 'nav.weather'), icon: '⛈️', badge: dashboardData?.dashboard?.weatherAlerts },
        ].map(tab => (
          <button
            key={tab.key}
            className={`sa-nav-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
            {tab.badge > 0 && <span className="sa-nav-badge">{tab.badge}</span>}
          </button>
        ))}
        <button className="sa-nav-btn" onClick={handleLogout} style={{marginLeft: 'auto'}}>
          🚪 {t(langCode, 'nav.logout')}
        </button>
      </nav>

      {/* Content */}
      {loading && <Loading text={t(langCode, 'common.loading')} />}
      
      {!loading && activeTab === 'dashboard' && (
        <DashboardView 
          data={dashboardData} 
          langCode={langCode} 
          onNavigate={setActiveTab}
          farmerName={farmerName}
        />
      )}
      {!loading && activeTab === 'schemes' && (
        <SchemesView 
          data={schemesData}
          langCode={langCode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onApply={handleApply}
          onViewChecklist={(schemeId) => { fetchChecklist(schemeId); setSelectedScheme(schemeId); }}
          compareSchemes={compareSchemes}
          setCompareSchemes={setCompareSchemes}
          onCompare={handleCompare}
          comparisonResult={comparisonResult}
          setComparisonResult={setComparisonResult}
        />
      )}
      {!loading && activeTab === 'insurance' && (
        <InsuranceView data={insuranceData} langCode={langCode} />
      )}
      {!loading && activeTab === 'applications' && (
        <ApplicationsView 
          data={applicationsData} 
          langCode={langCode}
          onViewDetail={fetchAppDetail}
          detailData={appDetailData}
          setDetailData={setAppDetailData}
        />
      )}
      {!loading && activeTab === 'weather' && (
        <WeatherView data={weatherData} langCode={langCode} />
      )}

      {/* Checklist Modal */}
      {checklistData && (
        <div className="sa-modal-overlay" onClick={() => setChecklistData(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>{t(langCode, 'checklist.title')}</h2>
              <button className="sa-modal-close" onClick={() => setChecklistData(null)}>✕</button>
            </div>
            <ChecklistView data={checklistData} langCode={langCode} onApply={() => handleApply(selectedScheme)} />
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ===== LANGUAGE BAR =====
function LanguageBar({ lang, setLang }) {
  return (
    <div className="sa-lang-bar">
      {languageOptions.map(l => (
        <button
          key={l.code}
          className={`sa-lang-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
        >
          {l.nativeName}
        </button>
      ))}
    </div>
  );
}

// ===== REGISTER PAGE =====
function RegisterPage({ langCode, onLogin, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '', mobile: '', state: 'Maharashtra', district: '', landSize: '', crops: [], language: 'English'
  });
  const [loginId, setLoginId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const voice = useVoiceInput();

  // Parse voice input
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voice.transcript) {
      const text = voice.transcript.toLowerCase();
      // Try to extract info from voice
      const cropMatch = commonCrops.find(c => text.includes(c.toLowerCase()));
      const districtMatch = maharashtraDistricts.find(d => text.includes(d.toLowerCase()));
      
      if (cropMatch && !formData.crops.includes(cropMatch)) {
        setFormData(prev => ({ ...prev, crops: [...prev.crops, cropMatch] }));
      }
      if (districtMatch) {
        setFormData(prev => ({ ...prev, district: districtMatch }));
      }

      // Extract land size
      const landMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekad|एकड़)/);
      if (landMatch) {
        setFormData(prev => ({ ...prev, landSize: landMatch[1] }));
      }

      // Try as name if nothing else matched
      if (!cropMatch && !districtMatch && !landMatch && !formData.name) {
        setFormData(prev => ({ ...prev, name: voice.transcript }));
      }

      voice.setTranscript('');
    }
  }, [voice.transcript]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      showToast('Name and mobile are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/register`, formData);
      if (res.data.status === 'success') {
        showToast(t(langCode, 'register.success'));
        onLogin(res.data.farmer.farmerId, res.data.farmer.name);
      } else if (res.data.status === 'existing') {
        showToast('Already registered! Logging in...', 'info');
        onLogin(res.data.farmerId, res.data.farmerName);
      }
    } catch (err) {
      showToast(t(langCode, 'register.error'), 'error');
    }
    setSubmitting(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId) {
      showToast('Enter Farmer ID or Mobile Number', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.get(`${API_BASE}/profile/${loginId}`);
      if (res.data.status === 'success') {
        onLogin(res.data.farmer.farmerId, res.data.farmer.name);
        showToast(`Welcome back, ${res.data.farmer.name}!`);
      }
    } catch (err) {
      showToast('Farmer not found. Please register.', 'error');
      setMode('register');
    }
    setSubmitting(false);
  };

  const toggleCrop = (crop) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.includes(crop) 
        ? prev.crops.filter(c => c !== crop)
        : [...prev.crops, crop]
    }));
  };

  return (
    <div>
      <div className="sa-header" style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1>🌾 {t(langCode, 'nav.smartAssistant')}</h1>
        <p style={{fontSize: 16}}>{t(langCode, 'register.subtitle')}</p>
      </div>

      <div className="sa-card" style={{ maxWidth: 550, margin: '0 auto' }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button 
            className={`sa-btn ${mode === 'login' ? 'sa-btn-primary' : 'sa-btn-secondary'}`}
            onClick={() => setMode('login')}
            style={{flex: 1}}
          >
            🔑 {t(langCode, 'register.login')}
          </button>
          <button 
            className={`sa-btn ${mode === 'register' ? 'sa-btn-primary' : 'sa-btn-secondary'}`}
            onClick={() => setMode('register')}
            style={{flex: 1}}
          >
            📝 {t(langCode, 'register.register')}
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="sa-form">
            <div className="sa-form-group">
              <label className="sa-form-label">Farmer ID / Mobile Number</label>
              <input 
                className="sa-form-input"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Enter your Farmer ID or Mobile"
              />
            </div>
            <button type="submit" className="sa-btn sa-btn-primary sa-btn-block" disabled={submitting}>
              {submitting ? t(langCode, 'common.loading') : '🔑 Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="sa-form">
            {/* Voice Input */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button 
                type="button"
                className={`sa-voice-btn ${voice.isListening ? 'listening' : ''}`}
                onClick={voice.startListening}
                title={t(langCode, 'common.voiceInput')}
              >
                🎤
              </button>
              <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                {voice.isListening ? t(langCode, 'common.listening') : t(langCode, 'common.voiceInput')}
              </p>
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.name')} *</label>
              <input 
                className="sa-form-input"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder={t(langCode, 'register.namePlaceholder')}
                required
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.mobile')} *</label>
              <input 
                className="sa-form-input"
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                placeholder={t(langCode, 'register.mobilePlaceholder')}
                type="tel"
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.state')}</label>
              <select 
                className="sa-form-select"
                value={formData.state}
                onChange={e => setFormData({...formData, state: e.target.value})}
              >
                {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.district')}</label>
              <select 
                className="sa-form-select"
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
              >
                <option value="">{t(langCode, 'register.selectDistrict')}</option>
                {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.landSize')}</label>
              <input 
                className="sa-form-input"
                value={formData.landSize}
                onChange={e => setFormData({...formData, landSize: e.target.value})}
                placeholder={t(langCode, 'register.landSizePlaceholder')}
                type="number"
                step="0.1"
                min="0"
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">{t(langCode, 'register.crops')}</label>
              <div className="sa-chips-container">
                {commonCrops.map(crop => (
                  <button
                    key={crop}
                    type="button"
                    className={`sa-chip ${formData.crops.includes(crop) ? 'selected' : ''}`}
                    onClick={() => toggleCrop(crop)}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="sa-btn sa-btn-primary sa-btn-block" disabled={submitting} style={{marginTop: 16}}>
              {submitting ? t(langCode, 'register.registering') : `🌾 ${t(langCode, 'register.register')}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ===== DASHBOARD VIEW =====
function DashboardView({ data, langCode, onNavigate, farmerName }) {
  if (!data) return <Loading text={t(langCode, 'common.loading')} />;

  const { dashboard, farmer } = data;
  
  return (
    <div>
      <div className="sa-header">
        <h1>📊 {t(langCode, 'dashboard.title')}</h1>
        <p>{t(langCode, 'dashboard.welcome')}, <strong>{farmer?.name || farmerName}</strong> | 
          {farmer?.farmerType} farmer | {farmer?.landSize} {t(langCode, 'common.acre')} | {farmer?.district}, {farmer?.state}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card" onClick={() => onNavigate('schemes')} style={{cursor: 'pointer'}}>
          <div className="sa-stat-icon">📋</div>
          <p className="sa-stat-value">{dashboard?.eligibleSchemes || 0}</p>
          <p className="sa-stat-label">{t(langCode, 'dashboard.eligibleSchemes')}</p>
        </div>
        <div className="sa-stat-card info" onClick={() => onNavigate('applications')} style={{cursor: 'pointer'}}>
          <div className="sa-stat-icon">📝</div>
          <p className="sa-stat-value">{dashboard?.applications?.total || 0}</p>
          <p className="sa-stat-label">{t(langCode, 'dashboard.appliedSchemes')}</p>
        </div>
        <div className="sa-stat-card success">
          <div className="sa-stat-icon">✅</div>
          <p className="sa-stat-value">{dashboard?.applications?.approved || 0}</p>
          <p className="sa-stat-label">{t(langCode, 'dashboard.approvedSchemes')}</p>
        </div>
        <div className="sa-stat-card warning" onClick={() => onNavigate('weather')} style={{cursor: 'pointer'}}>
          <div className="sa-stat-icon">⛈️</div>
          <p className="sa-stat-value">{dashboard?.weatherAlerts || 0}</p>
          <p className="sa-stat-label">{t(langCode, 'dashboard.weatherAlerts')}</p>
        </div>
        {dashboard?.creditScore && (
          <div className="sa-stat-card">
            <div className="sa-stat-icon">📈</div>
            <p className="sa-stat-value">{dashboard.creditScore}</p>
            <p className="sa-stat-label">{t(langCode, 'dashboard.creditScore')}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="sa-card">
        <h3 style={{margin: '0 0 16px 0'}}>{t(langCode, 'dashboard.quickActions')}</h3>
        <div className="sa-actions-grid">
          <button className="sa-action-btn" onClick={() => onNavigate('schemes')}>
            <span className="sa-action-icon">📋</span>
            {t(langCode, 'dashboard.findSchemes')}
          </button>
          <button className="sa-action-btn" onClick={() => onNavigate('insurance')}>
            <span className="sa-action-icon">🛡️</span>
            {t(langCode, 'dashboard.applyInsurance')}
          </button>
          <button className="sa-action-btn" onClick={() => onNavigate('weather')}>
            <span className="sa-action-icon">⛈️</span>
            {t(langCode, 'dashboard.checkWeather')}
          </button>
          <button className="sa-action-btn" onClick={() => onNavigate('applications')}>
            <span className="sa-action-icon">📝</span>
            {t(langCode, 'dashboard.viewApplications')}
          </button>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="sa-card">
        <h3 style={{margin: '0 0 16px 0'}}>{t(langCode, 'dashboard.recentApplications')}</h3>
        {dashboard?.recentApplications?.length > 0 ? (
          dashboard.recentApplications.map(app => (
            <div key={app.id} className="sa-app-row">
              <div className="sa-app-info">
                <h4>{app.schemeName}</h4>
                <p>{app.applicationNumber} | {new Date(app.date).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={app.status} langCode={langCode} />
            </div>
          ))
        ) : (
          <div className="sa-empty">
            <div className="sa-empty-icon">📭</div>
            <p>{t(langCode, 'dashboard.noApplications')}</p>
            <button className="sa-btn sa-btn-primary" onClick={() => onNavigate('schemes')}>
              {t(langCode, 'dashboard.findSchemes')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== SCHEMES VIEW =====
function SchemesView({ data, langCode, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter, 
  onApply, onViewChecklist, compareSchemes, setCompareSchemes, onCompare, comparisonResult, setComparisonResult }) {
  const [expandedScheme, setExpandedScheme] = useState(null);
  
  if (!data) return <Loading text={t(langCode, 'common.loading')} />;

  const filteredSchemes = data.schemes?.filter(s => {
    const matchSearch = !searchTerm || 
      s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.displayDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !categoryFilter || s.category === categoryFilter;
    return matchSearch && matchCategory;
  }) || [];

  const toggleCompare = (id) => {
    setCompareSchemes(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getCategoryBadge = (cat) => {
    const map = {
      subsidy: 'sa-badge-subsidy',
      insurance: 'sa-badge-insurance',
      loan: 'sa-badge-loan',
      pension: 'sa-badge-pension',
      direct_benefit: 'sa-badge-direct'
    };
    return map[cat] || 'sa-badge-direct';
  };

  const getCategoryLabel = (cat) => {
    const map = {
      subsidy: t(langCode, 'schemes.subsidy'),
      insurance: t(langCode, 'schemes.insurance'),
      loan: t(langCode, 'schemes.loan'),
      pension: t(langCode, 'schemes.pension'),
      direct_benefit: t(langCode, 'schemes.directBenefit')
    };
    return map[cat] || cat;
  };

  return (
    <div>
      <div className="sa-header">
        <h1>📋 {t(langCode, 'schemes.title')}</h1>
        <p>{data.totalEligibleSchemes} {t(langCode, 'schemes.schemesFound')} | 
          {data.farmerType} farmer | {data.landSize} {t(langCode, 'common.acre')} | {data.crops?.join(', ')}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="sa-filter-bar">
        <input
          className="sa-search-input"
          placeholder={t(langCode, 'schemes.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="sa-filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">{t(langCode, 'schemes.allCategories')}</option>
          <option value="subsidy">{t(langCode, 'schemes.subsidy')}</option>
          <option value="insurance">{t(langCode, 'schemes.insurance')}</option>
          <option value="loan">{t(langCode, 'schemes.loan')}</option>
          <option value="pension">{t(langCode, 'schemes.pension')}</option>
          <option value="direct_benefit">{t(langCode, 'schemes.directBenefit')}</option>
        </select>
        {compareSchemes.length >= 2 && (
          <button className="sa-btn sa-btn-secondary" onClick={onCompare}>
            ⚖️ {t(langCode, 'schemes.compare')} ({compareSchemes.length})
          </button>
        )}
      </div>

      {/* Scheme Cards */}
      {filteredSchemes.length === 0 ? (
        <div className="sa-empty">
          <div className="sa-empty-icon">📭</div>
          <p>{t(langCode, 'schemes.noSchemes')}</p>
        </div>
      ) : (
        filteredSchemes.map(scheme => (
          <div key={scheme.id} className={`sa-scheme-card ${scheme.category}`}>
            <div className="sa-scheme-top">
              <div style={{flex: 1}}>
                <h3 className="sa-scheme-name">{scheme.displayName}</h3>
                <span className={`sa-scheme-badge ${getCategoryBadge(scheme.category)}`}>
                  {getCategoryLabel(scheme.category)}
                </span>
              </div>
              <label style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12}}>
                <input 
                  type="checkbox"
                  checked={compareSchemes.includes(scheme.id)}
                  onChange={() => toggleCompare(scheme.id)}
                />
                Compare
              </label>
            </div>

            <p className="sa-scheme-desc">{scheme.displayDescription}</p>
            
            <div className="sa-scheme-benefit">
              💰 {scheme.benefitAmount || scheme.estimatedBenefit}
            </div>

            {/* Match Reasons */}
            {scheme.matchReasons?.length > 0 && (
              <div className="sa-scheme-reasons">
                {scheme.matchReasons.map((reason, i) => (
                  <span key={i} className="sa-reason-tag">✓ {reason}</span>
                ))}
              </div>
            )}

            {/* Expandable Details */}
            {expandedScheme === scheme.id && (
              <div style={{marginTop: 12}}>
                {/* Documents */}
                <div className="sa-scheme-docs">
                  <h4>📄 {t(langCode, 'schemes.documents')}</h4>
                  {scheme.displayDocuments?.map((doc, i) => (
                    <div key={i} className="sa-doc-item">📌 {doc}</div>
                  ))}
                </div>

                {/* Application Process */}
                {scheme.displayProcess && (
                  <div className="sa-scheme-docs" style={{marginTop: 8}}>
                    <h4>📝 {t(langCode, 'schemes.process')}</h4>
                    <div className="sa-process-steps">
                      {scheme.displayProcess.split('\n').filter(s => s.trim()).map((step, i) => (
                        <div key={i} className="sa-process-step">
                          <span className="sa-step-number">{i + 1}</span>
                          <span className="sa-step-text">{step.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Helpline & Website */}
                <div style={{display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap'}}>
                  {scheme.helplineNumber && (
                    <span style={{fontSize: 13, color: '#666'}}>📞 {t(langCode, 'schemes.helpline')}: <strong>{scheme.helplineNumber}</strong></span>
                  )}
                  {scheme.websiteUrl && (
                    <a href={scheme.websiteUrl} target="_blank" rel="noreferrer" style={{fontSize: 13}}>
                      🌐 {t(langCode, 'schemes.website')}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="sa-scheme-actions">
              <button 
                className="sa-btn sa-btn-secondary sa-btn-sm"
                onClick={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
              >
                {expandedScheme === scheme.id ? t(langCode, 'common.close') : t(langCode, 'schemes.viewDetails')}
              </button>
              <button 
                className="sa-btn sa-btn-secondary sa-btn-sm"
                onClick={() => onViewChecklist(scheme.id)}
              >
                📄 {t(langCode, 'checklist.title')}
              </button>
              {scheme.alreadyApplied ? (
                <button className="sa-btn sa-btn-disabled sa-btn-sm" disabled>
                  ✅ {t(langCode, 'schemes.applied')}
                </button>
              ) : (
                <button className="sa-btn sa-btn-primary sa-btn-sm" onClick={() => onApply(scheme.id)}>
                  📝 {t(langCode, 'schemes.apply')}
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Comparison Modal */}
      {comparisonResult && (
        <div className="sa-modal-overlay" onClick={() => setComparisonResult(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 900}}>
            <div className="sa-modal-header">
              <h2>⚖️ Scheme Comparison</h2>
              <button className="sa-modal-close" onClick={() => setComparisonResult(null)}>✕</button>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table className="sa-compare-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    {comparisonResult.schemes?.map(s => (
                      <th key={s.id}>{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Category</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.category}</td>)}
                  </tr>
                  <tr>
                    <td><strong>Benefit</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.benefitAmount}</td>)}
                  </tr>
                  <tr>
                    <td><strong>Land Size</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.minLandSize || 0} - {s.maxLandSize || 'No limit'} acres</td>)}
                  </tr>
                  <tr>
                    <td><strong>Farmer Types</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.farmerTypes?.join(', ')}</td>)}
                  </tr>
                  <tr>
                    <td><strong>Crops</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.cropTypes?.length > 0 ? s.cropTypes.join(', ') : 'All'}</td>)}
                  </tr>
                  <tr>
                    <td><strong>Documents</strong></td>
                    {comparisonResult.schemes?.map(s => <td key={s.id}>{s.documentsRequired?.join(', ')}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== INSURANCE VIEW =====
function InsuranceView({ data, langCode }) {
  if (!data) return <Loading text={t(langCode, 'common.loading')} />;

  const getRiskClass = (level) => {
    const map = { critical: 'sa-risk-critical', high: 'sa-risk-high', medium: 'sa-risk-medium', low: 'sa-risk-low' };
    return map[level] || 'sa-risk-low';
  };

  const getRiskLabel = (level) => {
    const map = {
      high: t(langCode, 'insurance.riskHigh'),
      medium: t(langCode, 'insurance.riskMedium'),
      low: t(langCode, 'insurance.riskLow'),
      critical: 'Critical Risk'
    };
    return map[level] || level;
  };

  return (
    <div>
      <div className="sa-header">
        <h1>🛡️ {t(langCode, 'insurance.title')}</h1>
        <p>{t(langCode, 'insurance.subtitle')}</p>
      </div>

      {/* Weather Risk Assessment */}
      {data.weatherRisk && (
        <div className="sa-card" style={{borderLeft: `4px solid ${
          data.weatherRisk.level === 'high' ? '#d32f2f' : 
          data.weatherRisk.level === 'medium' ? '#f57c00' : '#388e3c'
        }`}}>
          <div className="sa-card-header">
            <h3 className="sa-card-title">⛈️ {t(langCode, 'insurance.weatherRisk')}</h3>
            <span className={`sa-risk-indicator ${getRiskClass(data.weatherRisk.level)}`}>
              {getRiskLabel(data.weatherRisk.level)} ({data.weatherRisk.score}/100)
            </span>
          </div>
          
          {data.weatherRisk.currentWeather && (
            <div className="sa-weather-card" style={{marginBottom: 12}}>
              <div className="sa-weather-info">
                <div className="sa-weather-item">
                  <div className="icon">🌡️</div>
                  <div className="value">{data.weatherRisk.currentWeather.temp}°C</div>
                  <div className="label">{t(langCode, 'weather.temperature')}</div>
                </div>
                <div className="sa-weather-item">
                  <div className="icon">💧</div>
                  <div className="value">{data.weatherRisk.currentWeather.humidity}%</div>
                  <div className="label">{t(langCode, 'weather.humidity')}</div>
                </div>
                <div className="sa-weather-item">
                  <div className="icon">💨</div>
                  <div className="value">{data.weatherRisk.currentWeather.windSpeed} m/s</div>
                  <div className="label">{t(langCode, 'weather.wind')}</div>
                </div>
                <div className="sa-weather-item">
                  <div className="icon">☁️</div>
                  <div className="value" style={{fontSize: 14}}>{data.weatherRisk.currentWeather.description}</div>
                  <div className="label">Condition</div>
                </div>
              </div>
            </div>
          )}

          {data.weatherRisk.factors?.length > 0 && (
            <div>
              <h4 style={{margin: '8px 0'}}>{t(langCode, 'insurance.factors')}</h4>
              {data.weatherRisk.factors.map((f, i) => (
                <div key={i} className="sa-alert sa-alert-warning">
                  <span className="sa-alert-icon">⚠️</span>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weather Alerts */}
      {data.weatherAlerts?.length > 0 && (
        <div className="sa-card">
          <h3 style={{margin: '0 0 12px 0'}}>🚨 {t(langCode, 'weather.alerts')}</h3>
          {data.weatherAlerts.map((alert, i) => (
            <div key={i} className={`sa-alert ${
              alert.riskLevel === 'high' || alert.riskLevel === 'critical' ? 'sa-alert-danger' : 'sa-alert-warning'
            }`}>
              <span className="sa-alert-icon">{alert.riskLevel === 'high' ? '🔴' : '🟡'}</span>
              <div>
                <strong>{alert.riskType.toUpperCase()}</strong>
                <p style={{margin: '4px 0 0'}}>{alert.displayDescription}</p>
                {alert.displayActions?.length > 0 && (
                  <ul style={{margin: '8px 0 0', paddingLeft: 20}}>
                    {alert.displayActions.map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insurance Recommendations */}
      <h3 style={{margin: '20px 0 12px'}}>🛡️ {t(langCode, 'insurance.title')}</h3>
      {data.recommendations?.map((ins, i) => (
        <div key={i} className="sa-insurance-card">
          <div className="sa-card-header">
            <div>
              <h3 className="sa-card-title">{ins.displayName}</h3>
              <p className="sa-card-subtitle">{ins.provider}</p>
            </div>
            <span className={`sa-scheme-badge ${
              ins.insuranceType === 'crop' ? 'sa-badge-subsidy' :
              ins.insuranceType === 'weather' ? 'sa-badge-insurance' : 'sa-badge-loan'
            }`}>
              {ins.insuranceType === 'crop' ? t(langCode, 'insurance.cropInsurance') :
               ins.insuranceType === 'weather' ? t(langCode, 'insurance.weatherInsurance') :
               ins.insuranceType === 'livestock' ? t(langCode, 'insurance.livestockInsurance') : ins.insuranceType}
            </span>
          </div>

          <p className="sa-scheme-desc">{ins.displayDescription}</p>

          {/* Reasons */}
          {ins.reasons?.length > 0 && (
            <div className="sa-scheme-reasons">
              {ins.reasons.map((r, j) => (
                <span key={j} className="sa-reason-tag">✓ {r}</span>
              ))}
            </div>
          )}

          {/* Premium Calculation */}
          {ins.calculatedForFarmer && (
            <div className="sa-premium-box">
              <div className="sa-premium-item">
                <div className="label">{t(langCode, 'insurance.sumInsured')}</div>
                <div className="value">₹{ins.calculatedForFarmer.sumInsured?.toLocaleString()}</div>
              </div>
              <div className="sa-premium-item">
                <div className="label">{t(langCode, 'insurance.youPay')}</div>
                <div className="value highlight">₹{ins.calculatedForFarmer.farmerPremium?.toLocaleString()}</div>
              </div>
              <div className="sa-premium-item">
                <div className="label">{t(langCode, 'insurance.govtSubsidy')}</div>
                <div className="value">₹{ins.calculatedForFarmer.governmentSubsidy?.toLocaleString()}</div>
              </div>
              <div className="sa-premium-item">
                <div className="label">{t(langCode, 'insurance.coverage')}</div>
                <div className="value">₹{ins.calculatedForFarmer.totalCoverage?.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Coverage & Claim */}
          {ins.displayCoverage && (
            <div className="sa-scheme-docs">
              <h4>{t(langCode, 'insurance.coverageDetails')}</h4>
              <p style={{fontSize: 13, color: '#666'}}>{ins.displayCoverage}</p>
            </div>
          )}

          {ins.displayClaim && (
            <div className="sa-scheme-docs" style={{marginTop: 8}}>
              <h4>{t(langCode, 'insurance.claimProcess')}</h4>
              <div className="sa-process-steps">
                {ins.displayClaim.split('\n').filter(s => s.trim()).map((step, j) => (
                  <div key={j} className="sa-process-step">
                    <span className="sa-step-number">{j + 1}</span>
                    <span className="sa-step-text">{step.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sa-scheme-actions">
            <button className="sa-btn sa-btn-primary sa-btn-sm">
              {t(langCode, 'insurance.enroll')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== APPLICATIONS VIEW =====
function ApplicationsView({ data, langCode, onViewDetail, detailData, setDetailData }) {
  if (!data) return <Loading text={t(langCode, 'common.loading')} />;

  return (
    <div>
      <div className="sa-header">
        <h1>📝 {t(langCode, 'applications.title')}</h1>
        <p>{t(langCode, 'applications.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="sa-stats-grid">
        {[
          { label: t(langCode, 'applications.submitted'), value: data.stats?.submitted || 0, cls: 'info' },
          { label: t(langCode, 'applications.underReview'), value: data.stats?.underReview || 0, cls: 'warning' },
          { label: t(langCode, 'applications.approved'), value: data.stats?.approved || 0, cls: 'success' },
          { label: t(langCode, 'applications.rejected'), value: data.stats?.rejected || 0, cls: 'danger' },
          { label: t(langCode, 'applications.disbursed'), value: data.stats?.disbursed || 0, cls: '' },
        ].map((stat, i) => (
          <div key={i} className={`sa-stat-card ${stat.cls}`}>
            <p className="sa-stat-value">{stat.value}</p>
            <p className="sa-stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      {data.applications?.length === 0 ? (
        <div className="sa-empty">
          <div className="sa-empty-icon">📭</div>
          <p>{t(langCode, 'applications.noApplications')}</p>
        </div>
      ) : (
        <div className="sa-card">
          {data.applications?.map(app => (
            <div key={app.id} className="sa-app-row">
              <div className="sa-app-info">
                <h4>{app.schemeName}</h4>
                <p>{app.applicationNumber} | {t(langCode, 'applications.appliedOn')}: {new Date(app.appliedDate).toLocaleDateString()}</p>
                {app.benefitAmount && <p style={{color: '#f57f17', fontWeight: 600}}>💰 {app.benefitAmount}</p>}
              </div>
              <StatusBadge status={app.status} langCode={langCode} />
              <button className="sa-btn sa-btn-secondary sa-btn-sm" onClick={() => onViewDetail(app.id)}>
                {t(langCode, 'applications.viewDetail')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailData && (
        <div className="sa-modal-overlay" onClick={() => setDetailData(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>{detailData.application?.schemeName}</h2>
              <button className="sa-modal-close" onClick={() => setDetailData(null)}>✕</button>
            </div>
            
            <div style={{marginBottom: 16}}>
              <p><strong>{t(langCode, 'applications.appNumber')}:</strong> {detailData.application?.applicationNumber}</p>
              <StatusBadge status={detailData.application?.status} langCode={langCode} />
            </div>

            {/* Status Timeline */}
            <h3>{t(langCode, 'applications.timeline')}</h3>
            <div className="sa-timeline">
              {detailData.application?.statusHistory?.map((item, i) => {
                const isLast = i === detailData.application.statusHistory.length - 1;
                const isRejected = item.status === 'Rejected';
                return (
                  <div key={i} className="sa-timeline-item">
                    <div className={`sa-timeline-dot ${isRejected ? 'rejected' : isLast ? 'current' : 'active'}`} />
                    <div className="sa-timeline-content">
                      <div className="sa-timeline-title">{item.status}</div>
                      <div className="sa-timeline-date">{new Date(item.date).toLocaleString()}</div>
                      {item.remarks && <div className="sa-timeline-remarks">{item.remarks}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auto-filled Form Data */}
            {detailData.application?.formData && (
              <div style={{marginTop: 16}}>
                <h3>{t(langCode, 'applications.formData')}</h3>
                <div className="sa-scheme-docs">
                  {Object.entries(detailData.application.formData)
                    .filter(([key]) => !['farms', 'applicationDate'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee'}}>
                        <span style={{fontWeight: 600, fontSize: 13}}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span style={{fontSize: 13, color: '#666'}}>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Document Status */}
            {detailData.application?.documentsChecklist?.length > 0 && (
              <div style={{marginTop: 16}}>
                <h3>{t(langCode, 'applications.documentStatus')}</h3>
                {detailData.application.documentsChecklist.map((doc, i) => (
                  <div key={i} className="sa-checklist-item">
                    <span className={`sa-checklist-icon ${doc.uploaded ? 'ready' : 'needed'}`}>
                      {doc.uploaded ? '✓' : '○'}
                    </span>
                    <div className="sa-checklist-text">
                      <div className="sa-checklist-doc">{doc.document}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailData.application?.rejectionReason && (
              <div className="sa-alert sa-alert-danger" style={{marginTop: 16}}>
                <span className="sa-alert-icon">❌</span>
                <div>
                  <strong>Rejection Reason:</strong>
                  <p style={{margin: '4px 0 0'}}>{detailData.application.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== WEATHER VIEW =====
function WeatherView({ data, langCode }) {
  if (!data) return <Loading text={t(langCode, 'common.loading')} />;

  const getRiskClass = (level) => {
    const map = { critical: 'sa-risk-critical', high: 'sa-risk-high', medium: 'sa-risk-medium', low: 'sa-risk-low' };
    return map[level] || 'sa-risk-low';
  };

  return (
    <div>
      <div className="sa-header">
        <h1>⛈️ {t(langCode, 'weather.title')}</h1>
        <p>{t(langCode, 'weather.subtitle')} - {data.district}, {data.state}</p>
      </div>

      {/* Overall Risk */}
      <div className="sa-card" style={{textAlign: 'center', borderLeft: `4px solid ${
        data.overallRisk === 'high' || data.overallRisk === 'critical' ? '#d32f2f' :
        data.overallRisk === 'medium' ? '#f57c00' : '#388e3c'
      }`}}>
        <span className={`sa-risk-indicator ${getRiskClass(data.overallRisk)}`} style={{fontSize: 16, padding: '8px 20px'}}>
          {data.overallRisk === 'high' ? '🔴' : data.overallRisk === 'medium' ? '🟡' : '🟢'} 
          Overall Risk: {data.overallRisk?.toUpperCase()}
        </span>
      </div>

      {/* Current Weather */}
      {data.currentWeather && (
        <div className="sa-weather-card">
          <h3>{t(langCode, 'weather.currentWeather')}</h3>
          <div className="sa-weather-info">
            <div className="sa-weather-item">
              <div className="icon">🌡️</div>
              <div className="value">{data.currentWeather.temp}°C</div>
              <div className="label">{t(langCode, 'weather.temperature')}</div>
            </div>
            <div className="sa-weather-item">
              <div className="icon">🤒</div>
              <div className="value">{data.currentWeather.feelsLike}°C</div>
              <div className="label">Feels Like</div>
            </div>
            <div className="sa-weather-item">
              <div className="icon">💧</div>
              <div className="value">{data.currentWeather.humidity}%</div>
              <div className="label">{t(langCode, 'weather.humidity')}</div>
            </div>
            <div className="sa-weather-item">
              <div className="icon">💨</div>
              <div className="value">{data.currentWeather.windSpeed} m/s</div>
              <div className="label">{t(langCode, 'weather.wind')}</div>
            </div>
          </div>

          {/* Forecast */}
          {data.forecast?.length > 0 && (
            <div>
              <h3 style={{marginTop: 16}}>{t(langCode, 'weather.forecast')}</h3>
              <div className="sa-forecast-grid">
                {data.forecast.map((f, i) => (
                  <div key={i} className="sa-forecast-item">
                    <div className="time">{new Date(f.datetime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                    <div className="temp">{f.temp}°C</div>
                    <div className="desc">{f.description}</div>
                    {f.rain > 0 && <div className="desc">🌧️ {f.rain}mm</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {data.alerts?.length > 0 && (
        <div className="sa-card">
          <h3 style={{margin: '0 0 12px 0'}}>🚨 {t(langCode, 'weather.alerts')}</h3>
          {data.alerts.map((alert, i) => (
            <div key={i} className={`sa-alert ${
              alert.riskLevel === 'high' || alert.riskLevel === 'critical' ? 'sa-alert-danger' : 'sa-alert-warning'
            }`}>
              <span className="sa-alert-icon">{alert.riskLevel === 'high' ? '🔴' : '🟡'}</span>
              <div>
                <strong>{alert.riskType?.toUpperCase()} - {alert.district}</strong>
                <p style={{margin: '4px 0 0'}}>{alert.displayDescription}</p>
                {alert.displayActions?.length > 0 && (
                  <div style={{marginTop: 8}}>
                    <strong>{t(langCode, 'weather.recommendations')}:</strong>
                    <ul style={{margin: '4px 0 0', paddingLeft: 20}}>
                      {alert.displayActions.map((a, j) => <li key={j} style={{fontSize: 13}}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {alert.insuranceSuggestion && (
                  <div style={{marginTop: 8}}>
                    <span className="sa-reason-tag">🛡️ {t(langCode, 'weather.insuranceSuggestion')}: {alert.insuranceSuggestion}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.alerts?.length === 0 && (
        <div className="sa-alert sa-alert-success">
          <span className="sa-alert-icon">✅</span>
          {t(langCode, 'weather.noAlerts')}
        </div>
      )}

      {/* Crop-wise Risk */}
      {data.cropRisks?.length > 0 && (
        <div className="sa-card">
          <h3 style={{margin: '0 0 12px 0'}}>🌾 {t(langCode, 'weather.cropRisks')}</h3>
          <div className="sa-crop-risk-grid">
            {data.cropRisks.map((crop, i) => (
              <div key={i} className={`sa-crop-risk-card ${crop.riskLevel}`}>
                <div className="sa-crop-name">{crop.crop}</div>
                <span className={`sa-risk-indicator ${getRiskClass(crop.riskLevel)}`}>
                  {crop.riskLevel === 'high' ? '🔴' : crop.riskLevel === 'medium' ? '🟡' : '🟢'} {crop.riskLevel}
                </span>
                <p style={{fontSize: 12, marginTop: 4, color: '#666'}}>{crop.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CHECKLIST VIEW =====
function ChecklistView({ data, langCode, onApply }) {
  if (!data) return null;

  return (
    <div>
      <p className="sa-card-subtitle">{data.scheme?.name}</p>
      
      {/* Progress Bar */}
      <div style={{margin: '16px 0'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
          <span style={{fontWeight: 600, fontSize: 14}}>{t(langCode, 'checklist.readiness')}</span>
          <span style={{fontWeight: 700, color: 'var(--sa-primary)'}}>{data.summary?.readinessPercent}%</span>
        </div>
        <div className="sa-progress-bar">
          <div className="sa-progress-fill" style={{width: `${data.summary?.readinessPercent}%`}} />
        </div>
        <p style={{fontSize: 13, color: '#666', textAlign: 'center'}}>
          {data.summary?.ready} {t(langCode, 'checklist.ready')} / {data.summary?.total} total
        </p>
      </div>

      {/* Checklist Items */}
      {data.checklist?.map((item, i) => (
        <div key={i} className="sa-checklist-item">
          <span className={`sa-checklist-icon ${item.available ? 'ready' : 'needed'}`}>
            {item.available ? '✓' : '○'}
          </span>
          <div className="sa-checklist-text">
            <div className="sa-checklist-doc">{item.document}</div>
            {item.hint && <div className="sa-checklist-hint">{t(langCode, 'checklist.hint')}: {item.hint}</div>}
          </div>
          <span className={`sa-status ${item.available ? 'sa-status-approved' : 'sa-status-under-review'}`}>
            {item.available ? t(langCode, 'checklist.ready') : t(langCode, 'checklist.needed')}
          </span>
        </div>
      ))}

      {/* Message */}
      <div className={`sa-alert ${data.summary?.readinessPercent === 100 ? 'sa-alert-success' : 'sa-alert-info'}`} style={{marginTop: 16}}>
        <span className="sa-alert-icon">{data.summary?.readinessPercent === 100 ? '✅' : 'ℹ️'}</span>
        {data.summary?.message}
      </div>

      <button 
        className="sa-btn sa-btn-primary sa-btn-block" 
        style={{marginTop: 16}}
        onClick={onApply}
      >
        📝 {t(langCode, 'schemes.apply')}
      </button>
    </div>
  );
}

// ===== STATUS BADGE =====
function StatusBadge({ status, langCode }) {
  const statusMap = {
    'Draft': { cls: 'sa-status-draft', icon: '📝' },
    'Submitted': { cls: 'sa-status-submitted', icon: '📤' },
    'Under_Review': { cls: 'sa-status-under-review', icon: '🔍' },
    'Approved': { cls: 'sa-status-approved', icon: '✅' },
    'Rejected': { cls: 'sa-status-rejected', icon: '❌' },
    'Disbursed': { cls: 'sa-status-disbursed', icon: '💰' }
  };

  const statusLabels = {
    'Draft': t(langCode, 'applications.draft'),
    'Submitted': t(langCode, 'applications.submitted'),
    'Under_Review': t(langCode, 'applications.underReview'),
    'Approved': t(langCode, 'applications.approved'),
    'Rejected': t(langCode, 'applications.rejected'),
    'Disbursed': t(langCode, 'applications.disbursed')
  };

  const info = statusMap[status] || statusMap['Draft'];
  
  return (
    <span className={`sa-status ${info.cls}`}>
      {info.icon} {statusLabels[status] || status}
    </span>
  );
}
