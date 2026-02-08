import { Link, useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import Logo1 from "../../assets/logo.svg";
import CardMedia from "@mui/material/CardMedia";
import { BsBell, BsCircle, BsFillBellFill } from "react-icons/bs";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { AppContext } from "../AuthenticateFarmer/Farmer_account/appContext";
import Modal from "react-bootstrap/Modal";
import { Nav, NavDropdown } from "react-bootstrap";

export default function Navbar() {
  const navigate = useNavigate();
  const auth = localStorage.getItem("user");
  const auth2 = localStorage.getItem("userTrader");
  const [notifidata, setNotifidata] = useState([]);
  const { socket } = useContext(AppContext);
  const [show, setShow] = useState(false);
  const [notifyCount, setnotifyCount] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/sign-in");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`modern-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          {/* Logo Section */}
          <Link to="/Farmer_homepage" className="navbar-brand" onClick={closeMobileMenu}>
            <div className="logo-wrapper">
              <CardMedia
                component="img"
                height="45"
                image={Logo1}
                alt="GrowFarm Logo"
                className="brand-logo"
              />
              <span className="brand-text">
                <span className="brand-highlight">G</span>row
                <span className="brand-highlight">&nbsp;F</span>arm
              </span>
            </div>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Navigation Links */}
          <div className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
            {auth2 ? (
              // Trader Navigation
              <ul className="nav-links">
                <CustomLink to="/Genratebill" onClick={closeMobileMenu}>
                  <span className="nav-icon">📄</span>
                  Generate Bill
                </CustomLink>
                <li>
                  <button onClick={logout} className="logout-button">
                    <span className="nav-icon">🚪</span>
                    Logout
                  </button>
                </li>
              </ul>
            ) : (
              <>
                {auth ? (
                  JSON.parse(auth).Username === "admin" ? (
                    // Admin Navigation
                    <ul className="nav-links">
                      <CustomLink to="/Dashboard" onClick={closeMobileMenu}>
                        <span className="nav-icon">📊</span>
                        Dashboard
                      </CustomLink>
                      <CustomLink to="/Apmc" onClick={closeMobileMenu}>
                        <span className="nav-icon">🏪</span>
                        APMC
                      </CustomLink>
                      <CustomLink to="/Yield_analysis" onClick={closeMobileMenu}>
                        <span className="nav-icon">📈</span>
                        Yield Analysis
                      </CustomLink>
                      <CustomLink to="/Soilanalysis" onClick={closeMobileMenu}>
                        <span className="nav-icon">🌱</span>
                        Soil Analysis
                      </CustomLink>
                      <CustomLink to="/Irrigationanalysis" onClick={closeMobileMenu}>
                        <span className="nav-icon">💧</span>
                        Irrigation Analysis
                      </CustomLink>
                      <CustomLink to="/findfarmer" onClick={closeMobileMenu}>
                        <span className="nav-icon">👨‍🌾</span>
                        Find Farmer
                      </CustomLink>
                      <CustomLink to="/AdminSchemesMain" onClick={closeMobileMenu}>
                        <span className="nav-icon">📋</span>
                        Schemes
                      </CustomLink>
                      <li>
                        <button onClick={logout} className="logout-button">
                          <span className="nav-icon">🚪</span>
                          Logout
                        </button>
                      </li>
                    </ul>
                  ) : (
                    // Farmer Navigation
                    <ul className="nav-links">
                      <CustomLink to="/Myaccount" onClick={closeMobileMenu}>
                        <span className="nav-icon">👤</span>
                        My Account
                      </CustomLink>
                      <CustomLink to="/ExpertTalk" onClick={closeMobileMenu}>
                        <span className="nav-icon">💬</span>
                        Expert Talk
                      </CustomLink>
                      <CustomLink to="/chatbot" onClick={closeMobileMenu}>
                        <span className="nav-icon">🤖</span>
                        AI Assistant
                      </CustomLink>
                      <CustomLink to="/Weatherdetails" onClick={closeMobileMenu}>
                        <span className="nav-icon">🌤️</span>
                        Weather
                      </CustomLink>
                      <CustomLink to="/SchemesMain" onClick={closeMobileMenu}>
                        <span className="nav-icon">📋</span>
                        Schemes
                      </CustomLink>
                      <li className="dropdown-wrapper">
                        <NavDropdown
                          title={
                            <span className="dropdown-title">
                              <span className="nav-icon">🌾</span>
                              Smart Farming
                              <FiChevronDown className="dropdown-arrow" />
                            </span>
                          }
                          id="smart-farming-dropdown"
                          className="modern-dropdown"
                        >
                          <NavDropdown.Item>
                            <CustomLink to="/Croprek" onClick={closeMobileMenu}>
                              <span className="dropdown-icon">🌿</span>
                              Crop Recommendation
                            </CustomLink>
                          </NavDropdown.Item>
                          <NavDropdown.Item>
                            <CustomLink to="/Diseasepre" onClick={closeMobileMenu}>
                              <span className="dropdown-icon">🔬</span>
                              Disease Prediction
                            </CustomLink>
                          </NavDropdown.Item>
                          <NavDropdown.Item>
                            <CustomLink to="/yieldfinder" onClick={closeMobileMenu}>
                              <span className="dropdown-icon">📊</span>
                              Yield Finder
                            </CustomLink>
                          </NavDropdown.Item>
                        </NavDropdown>
                      </li>
                      <li>
                        <button onClick={logout} className="logout-button">
                          <span className="nav-icon">🚪</span>
                          Logout
                        </button>
                      </li>
                    </ul>
                  )
                ) : (
                  // Guest Navigation
                  <ul className="nav-links guest-links">
                    <CustomLink to="/sign-up" onClick={closeMobileMenu}>
                      <span className="nav-icon">✍️</span>
                      Farmer Registration
                    </CustomLink>
                    <CustomLink to="/Expertregistration" onClick={closeMobileMenu}>
                      <span className="nav-icon">🎓</span>
                      Expert Registration
                    </CustomLink>
                    <CustomLink to="/sign-in" onClick={closeMobileMenu}>
                      <span className="nav-icon">👨‍🌾</span>
                      Farmer Login
                    </CustomLink>
                    <CustomLink to="/adminlogin" onClick={closeMobileMenu}>
                      <span className="nav-icon">🛡️</span>
                      Admin Login
                    </CustomLink>
                    <CustomLink to="/traderlogin" onClick={closeMobileMenu}>
                      <span className="nav-icon">💼</span>
                      Trader Login
                    </CustomLink>
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Notification Modal */}
      {show && (
        <Modal
          animation={false}
          show={show}
          onHide={() => setShow(false)}
          className="modern-notification-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title>
              <BsFillBellFill className="modal-bell-icon" />
              Notifications
              {notifyCount > 0 && (
                <span className="notification-badge">{notifyCount}</span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            {notifidata.length > 0 ? (
              notifidata.map((dataa, idx) => (
                <div key={idx} className="notification-item">
                  <div className="notification-number">{idx + 1}</div>
                  <div className="notification-content">{dataa.content}</div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <BsBell size={48} className="empty-bell-icon" />
                <p>No notifications yet</p>
              </div>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}
    </>
  );
}

function CustomLink({ to, children, onClick, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = useMatch({ path: resolvedPath.pathname, end: true });

  return (
    <li className={`nav-item ${isActive ? "active" : ""}`}>
      <Link to={to} onClick={onClick} {...props}>
        {children}
      </Link>
    </li>
  );
}