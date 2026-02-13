import React, { useEffect, useContext, useState } from "react";
import "./style.css";
import profileimg from "./profile.png";
import Modal from "react-bootstrap/Modal";
import Moment from "moment";
import Image from "react-bootstrap/Image";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Button from "react-bootstrap/Button";
import { BsCheckCircleFill, BsInfoCircleFill } from "react-icons/bs";
import { AiOutlineCopy } from "react-icons/ai";
import { FiEdit2, FiDownload, FiTrendingUp } from "react-icons/fi";
import { MdAgriculture, MdGrass, MdAttachMoney } from "react-icons/md";
import copy from "copy-to-clipboard";
import jsPDF from "jspdf";
import { AppContext } from "./appContext";
import { Form, Card, ProgressBar, Table } from "react-bootstrap";
import { Container, Col, Row, FormGroup, Label, Input } from "reactstrap";
import Select from "react-select";

const options = [
  { value: "Rice", label: "Rice" },
  { value: "Maize", label: "Maize" },
  { value: "Kidneybeans", label: "Kidneybeans" },
  { value: "Pigeonpeas", label: "Pigeonpeas" },
  { value: "Mothbeans", label: "Mothbeans" },
];

function Myaccount() {
  const [farmdata, setFarmdata] = useState([]);
  const [farmdrop, setFarmdrop] = useState([]);
  const [Soil_type, setSoil_type] = useState("");
  const [Season, setSeason] = useState("");
  const [Sow_date, setSow_date] = useState("");
  const [Harvest_date, setHarvest_date] = useState("");
  const [Production, setProduction] = useState("");
  const [UPIN, setUPIN] = useState("");
  const [Farmerid, setFarmerid] = useState("");
  const [Name, setName] = useState("");
  const [UPINinfo, setUPINinfo] = useState("");
  const [Irigation_sources_used, setIrigation_sources_used] = useState("");
  const [Yielddata, setYielddata] = useState([]);
  const [Crop, setCrop] = useState([]);
  const [Cropproduction, setCropproduction] = useState([]);
  const [Ratio, setRatio] = useState([]);
  const [Pro, setPro] = useState([]);
  const [show, setShow] = useState(false);
  const [Billhistorydata, setBillhistorydata] = useState([]);
  
  const auth = localStorage.getItem("user");
  const { socket } = useContext(AppContext);

  const handleChangecrop = (selectedOption) => {
    setCrop(selectedOption);
    setCropproduction(selectedOption);
  };

  useEffect(() => {
    getschemedata();
    getApmcbilldata();
  }, []);

  function getschemedata() {
    fetch(`http://localhost:8000/farm/farminfo/${JSON.parse(auth).Adharnum}`, {
      method: "GET",
      crossDomain: true,
    })
      .then((response) => response.json())
      .then((data) => {
        setFarmdata(data);
        setFarmdrop(data);
      });
  }

  function getApmcbilldata() {
    fetch(`http://localhost:8000/farmer/bills_farmers/${JSON.parse(auth).Farmerid}`, {
      method: "GET",
      crossDomain: true,
    })
      .then((response) => response.json())
      .then((data) => {
        setBillhistorydata(data);
      });
  }

  function getYielddata() {
    fetch(`http://localhost:8000/cropdata/crophistory/${UPINinfo}`, {
      method: "GET",
      crossDomain: true,
    })
      .then((response) => response.json())
      .then((data) => {
        setYielddata(data);
      });
  }

  function AddnewCrop() {
    setFarmerid(JSON.parse(auth).Farmerid);
    setName(JSON.parse(auth).Name);
    setShow(true);
  }

  const handleChangeRatio = (event, index) => {
    const values = [...Ratio];
    values[index] = event.target.value;
    setRatio(values);
  };

  const handleChangeProduction = (event, index) => {
    const values = [...Pro];
    values[index] = event.target.value;
    setPro(values);
  };

  const copyToClipboard = () => {
    copy(JSON.parse(auth).Farmerid);
    alert(`Copied: "${JSON.parse(auth).Farmerid}"`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:8000/cropdata/crophistoryform",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UPIN,
            Farmerid,
            Name,
            Crop,
            Ratio,
            Pro,
            Soil_type,
            Season,
            Sow_date,
            Harvest_date,
            Irigation_sources_used,
          }),
        }
      );
      const data = await response.json();
      setShow(false);
      getYielddata();
    } catch (error) {
      console.error(error);
    }
  };

  return auth ? (
    <div className="myaccount-wrapper">
      {/* ============ PREMIUM HEADER SECTION ============ */}
      <div className="premium-header">
        <div className="header-backdrop"></div>
        
        <div className="profile-card-premium">
          <div className="profile-visual">
            <div className="avatar-circle">
              <img
                src="/Profileimage.svg"
                alt="Profile"
                className="avatar-img"
              />
              <div className="status-indicator online"></div>
            </div>
          </div>

          <div className="profile-content-premium">
            <h1 className="farmer-name-premium">{JSON.parse(auth).Name}</h1>
            <p className="farmer-title">Registered Farmer</p>

            <div className="id-section">
              <span className="id-label">Farmer ID:</span>
              <span className="id-value">{JSON.parse(auth).Farmerid}</span>
              <button className="copy-btn-premium" onClick={copyToClipboard}>
                <AiOutlineCopy size={16} />
              </button>
            </div>

            <div className="stats-grid-premium">
              <div className="stat-card">
                <MdAgriculture className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Farms</span>
                  <span className="stat-value">{farmdata.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <MdGrass className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Crops</span>
                  <span className="stat-value">{Yielddata.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <MdAttachMoney className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Bills</span>
                  <span className="stat-value">{Billhistorydata.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <FiTrendingUp className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Category</span>
                  <span className="stat-value">{JSON.parse(auth).Category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MAIN CONTENT SECTION ============ */}
      <div className="tabs-section-premium">
        <Tabs
          defaultActiveKey="profile"
          id="myaccount-tabs"
          className="nav-tabs-premium"
        >
          {/* ============ TAB 1: COMMUNICATION DETAILS ============ */}
          <Tab
            eventKey="profile"
            title={<span className="tab-title-premium">📋 Personal Info</span>}
          >
            <div className="tab-content-premium">
              <div className="card-grid-2col">
                <div className="info-card">
                  <h3 className="card-title">Communication Details</h3>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <div className="info-value-group">
                      <span className="info-value">{JSON.parse(auth).Email}</span>
                      <span className="verified-badge">
                        <BsCheckCircleFill /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Number</span>
                    <span className="info-value">+91 {JSON.parse(auth).Mobilenum}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address</span>
                    <span className="info-value">{JSON.parse(auth).Address || "Not provided"}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3 className="card-title">Personal Details</h3>
                  <div className="info-item">
                    <span className="info-label">Category</span>
                    <span className="badge-category">{JSON.parse(auth).Category}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Farmer Type</span>
                    <span className="badge-type">{JSON.parse(auth).Farmertype}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{JSON.parse(auth).Gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">
                      {Moment(JSON.parse(auth).Dateofbirth).format("DD-MM-YYYY")}
                    </span>
                  </div>
                </div>

                <div className="info-card">
                  <h3 className="card-title">Banking Details</h3>
                  <div className="info-item">
                    <span className="info-label">Bank Name</span>
                    <span className="info-value">{JSON.parse(auth).Bankname || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">IFSC Code</span>
                    <span className="info-value">{JSON.parse(auth).IFSC || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Number</span>
                    <span className="info-value">****{String(JSON.parse(auth).Accountnum).slice(-4)}</span>
                  </div>
                </div>

                <div className="info-card">
                  <h3 className="card-title">Government IDs</h3>
                  <div className="info-item">
                    <span className="info-label">Aadhaar</span>
                    <span className="info-value">****{String(JSON.parse(auth).Adharnum).slice(-4)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ration Card</span>
                    <span className="info-value">{JSON.parse(auth).Rationcardcategory || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Qualification</span>
                    <span className="info-value">{JSON.parse(auth).Qualification || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Tab>

          {/* ============ TAB 2: FARM INFORMATION ============ */}
          <Tab
            eventKey="home"
            title={<span className="tab-title-premium">🌾 Farm Details</span>}
          >
            <div className="tab-content-premium">
              {farmdata.length > 0 ? (
                <div className="farms-grid">
                  {farmdata.map((farm, idx) => (
                    <div key={idx} className="farm-card-premium">
                      <div className="farm-header">
                        <h3>Farm {idx + 1}</h3>
                        <span className="farm-name">{farm.Farmname}</span>
                      </div>

                      <div className="farm-sections">
                        <div className="farm-section">
                          <h4>📍 Location</h4>
                          <div className="farm-info-grid">
                            <div className="info-item-small">
                              <span className="label">District</span>
                              <span className="value">{farm.District}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Taluka</span>
                              <span className="value">{farm.Taluka}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Village</span>
                              <span className="value">{farm.Village}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Pincode</span>
                              <span className="value">{farm.Pincode || "-"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="farm-section">
                          <h4>📋 Land Details</h4>
                          <div className="farm-info-grid">
                            <div className="info-item-small">
                              <span className="label">UPIN</span>
                              <span className="value mono">{farm.UPIN}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Survey Number</span>
                              <span className="value">{farm.Surveynumber}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Area (H.A.SM)</span>
                              <span className="value">{farm.Hectare}.{farm.Are}.{farm.Square_meters}</span>
                            </div>
                            <div className="info-item-small">
                              <span className="label">Land Use</span>
                              <span className="value">{farm.Landusefor || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <MdAgriculture size={48} />
                  <p>No farms registered yet</p>
                </div>
              )}
            </div>
          </Tab>

          {/* ============ TAB 3: YIELD INFORMATION ============ */}
          <Tab
            eventKey="yield"
            title={<span className="tab-title-premium">📊 Crop Yield</span>}
          >
            <div className="tab-content-premium">
              <div className="yield-controls">
                <div className="control-group">
                  <label>Select Farm</label>
                  <select
                    className="form-select-premium"
                    onChange={(event) => setUPINinfo(event.target.value)}
                  >
                    <option value="">Choose a farm...</option>
                    {farmdrop.map((farm) => (
                      <option key={farm.UPIN} value={farm.UPIN}>
                        {farm.Farmname}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn-premium primary"
                  onClick={getYielddata}
                >
                  <FiTrendingUp /> View Yield Data
                </button>
                <button
                  className="btn-premium secondary"
                  onClick={AddnewCrop}
                >
                  <FiEdit2 /> Add New Crop
                </button>
              </div>

              {Yielddata.length > 0 ? (
                <div className="table-container-premium">
                  <table className="data-table-premium">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Crop</th>
                        <th>Season</th>
                        <th>Production</th>
                        <th>Sow Date</th>
                        <th>Harvest Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Yielddata.map((data, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td className="crop-cell">{data.Crop}</td>
                          <td><span className="badge-season">{data.Season}</span></td>
                          <td className="numeric">{data.Production} units</td>
                          <td>{Moment(data.Sow_date).format("DD-MM-YY")}</td>
                          <td>{Moment(data.Harvest_date).format("DD-MM-YY")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <MdGrass size={48} />
                  <p>No crop yield data yet. Select a farm to view records.</p>
                </div>
              )}
            </div>
          </Tab>

          {/* ============ TAB 4: BILLS & TRANSACTIONS ============ */}
          <Tab
            eventKey="bills"
            title={<span className="tab-title-premium">💰 Bills & Payments</span>}
          >
            <div className="tab-content-premium">
              {Billhistorydata.length > 0 ? (
                <div className="table-container-premium">
                  <table className="data-table-premium">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Trader</th>
                        <th>Crop</th>
                        <th>Date</th>
                        <th>Bags</th>
                        <th>Rate/Bag</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Billhistorydata.map((bill, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td className="trade-cell">{bill.Trade_name}</td>
                          <td>{bill.Crop}</td>
                          <td>{Moment(bill.Bill_date).format("DD-MM-YY")}</td>
                          <td className="numeric">{bill.Bags}</td>
                          <td className="numeric">₹{bill.Rate}</td>
                          <td className="amount-cell">₹{bill.Bill_Amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <MdAttachMoney size={48} />
                  <p>No bill history available</p>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* ============ ADD CROP MODAL ============ */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton className="modal-header-premium">
          <Modal.Title>🌾 Add New Crop Record</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-premium">
          <form onSubmit={handleSubmit}>
            <div className="form-row-2col">
              <div className="form-group">
                <label>Select Farm</label>
                <select
                  className="form-control"
                  onChange={(event) => setUPIN(event.target.value)}
                  required
                >
                  <option value="">Choose a farm...</option>
                  {farmdrop.map((farm) => (
                    <option key={farm.UPIN} value={farm.UPIN}>
                      {farm.Farmname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Season</label>
                <select
                  className="form-control"
                  onChange={(e) => setSeason(e.target.value)}
                  required
                >
                  <option value="">Select Season</option>
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Select Crops</label>
              <Select
                isMulti
                value={Crop}
                onChange={handleChangecrop}
                options={options}
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label>Sow Date</label>
                <input
                  type="date"
                  className="form-control"
                  onChange={(e) => setSow_date(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Harvest Date</label>
                <input
                  type="date"
                  className="form-control"
                  onChange={(e) => setHarvest_date(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Soil Type</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter soil type"
                onChange={(e) => setSoil_type(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Irrigation Sources Used</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Well, Borewell, Canal"
                onChange={(e) => setIrigation_sources_used(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                Save Crop Record
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  ) : (
    <div className="login-required">
      <h2>🔐 Login Required</h2>
      <p>Please log in to view your account details</p>
    </div>
  );
}

export default Myaccount;
