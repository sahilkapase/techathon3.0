import React from "react";
import { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Moment from 'moment';
import jsPDF from "jspdf";
import VoiceInput from "../../common/VoiceInput";
import { FaShieldAlt, FaMoneyBillWave, FaLanguage } from 'react-icons/fa';
import "./SchemesMain.css";

export default function EnhancedSchemes() {
    const [schemedata, setschemedata] = useState([]);
    const [filteredSchemes, setFilteredSchemes] = useState([]);
    const [morebtntry, setmorebtntry] = useState({});
    const [show, setShow] = useState(false);
    const [showSimplified, setShowSimplified] = useState(false);
    const [insuranceOptions, setInsuranceOptions] = useState([]);
    const auth = localStorage.getItem("user");

    // Filter states
    const [cropFilter, setCropFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        getschemedata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemedata, cropFilter, seasonFilter, searchQuery]);

    function getschemedata() {
        // Use enhanced API endpoint
        fetch(
            `http://localhost:8000/scheme/enhanced/eligible/${JSON.parse(auth).Farmerid}`,
            {
                method: "GET",
                crossDomain: true,
            }
        )
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setschemedata(data);
                    setFilteredSchemes(data);
                }
            })
            .catch(err => {
                console.error("Error fetching schemes:", err);
                // Fallback to old API
                fetch(
                    `http://localhost:8000/farmer/eligibleschemes/${JSON.parse(auth).Category
                    }/${JSON.parse(auth).Farmertype}/${JSON.parse(auth).Farmerid}`,
                    { method: "GET", crossDomain: true }
                )
                    .then((response) => response.json())
                    .then((data) => {
                        setschemedata(data);
                        setFilteredSchemes(data);
                    });
            });
    }

    function applyFilters() {
        let filtered = [...schemedata];

        // Crop filter
        if (cropFilter) {
            filtered = filtered.filter(scheme =>
                !scheme.CropTypes || scheme.CropTypes.length === 0 ||
                scheme.CropTypes.includes(cropFilter)
            );
        }

        // Season filter
        if (seasonFilter) {
            filtered = filtered.filter(scheme =>
                !scheme.Season || scheme.Season.length === 0 ||
                scheme.Season.includes(seasonFilter)
            );
        }

        // Search query
        if (searchQuery) {
            filtered = filtered.filter(scheme =>
                scheme.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (scheme.Description && scheme.Description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredSchemes(filtered);
    }

    function handlemoreinfo(Schemeid) {
        fetch(`http://localhost:8000/scheme/schemeinfo/${Schemeid}`, {
            method: "GET",
        })
            .then((response) => response.json())
            .then((data) => {
                setmorebtntry(data);

                // Fetch insurance options
                fetch(`http://localhost:8000/scheme/insurance/${Schemeid}`)
                    .then(res => res.json())
                    .then(insData => {
                        if (insData.status === "ok") {
                            setInsuranceOptions(insData.insuranceOptions || []);
                        }
                    })
                    .catch(err => console.error("Error fetching insurance:", err));

                setShow(true);
            });
    }

    function handleApply(scheme) {
        fetch(
            `http://localhost:8000/farmer/applyforscheme/${scheme.Schemeid}/${JSON.parse(auth).Farmerid}`,
            {
                method: "POST",
            }
        )
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "ok") {
                    alert(data.result);
                    getschemedata();
                } else {
                    alert(data.error);
                }
            });
    }

    const downloadpdf_more = () => {
        const doc = new jsPDF();
        const farmer = JSON.parse(auth);

        // Header
        doc.setFontSize(18);
        doc.text("GrowFarm - Scheme Application", 20, 15);

        // Farmer Details (Auto-filled)
        doc.setFontSize(12);
        doc.text("Farmer Details (Auto-filled):", 20, 30);

        const farmerData = [
            { field: "Farmer ID", value: farmer.Farmerid },
            { field: "Name", value: farmer.Name },
            { field: "Category", value: farmer.Category },
            { field: "Farmer Type", value: farmer.Farmertype },
            { field: "District", value: farmer.District },
            { field: "Taluka", value: farmer.Taluka },
            { field: "Village", value: farmer.Village },
            { field: "Mobile", value: farmer.Mobilenum }
        ];

        doc.autoTable({
            startY: 35,
            head: [['Field', 'Value']],
            body: farmerData.map(item => [item.field, item.value]),
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] }
        });

        // Scheme Details
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text("Scheme Details:", 20, finalY);

        const schemeBody = [
            { field: "Scheme ID", value: morebtntry.Schemeid },
            { field: "Title", value: morebtntry.Title },
            { field: "Description", value: morebtntry.Description },
            { field: "Benefits", value: morebtntry.Benefits },
            { field: "How to Apply", value: morebtntry.How },
            { field: "Subsidy Amount", value: morebtntry.SubsidyAmount || "As per guidelines" },
            { field: "Start Date", value: Moment(morebtntry.Start).format('DD-MM-YYYY') },
            { field: "Deadline", value: Moment(morebtntry.Expired).format('DD-MM-YYYY') }
        ];

        doc.autoTable({
            startY: finalY + 5,
            body: schemeBody.map(item => [item.field, item.value]),
            theme: 'grid',
            columnStyles: { 0: { cellWidth: 50 } }
        });

        // Insurance Options
        if (insuranceOptions && insuranceOptions.length > 0) {
            const insY = doc.lastAutoTable.finalY + 10;
            doc.text("Insurance Options:", 20, insY);

            const insBody = insuranceOptions.map(ins => [
                ins.provider,
                `₹${ins.coverageAmount}`,
                `₹${ins.premium}`,
                ins.description
            ]);

            doc.autoTable({
                startY: insY + 5,
                head: [['Provider', 'Coverage', 'Premium', 'Description']],
                body: insBody,
                theme: 'grid',
                headStyles: { fillColor: [33, 150, 243] }
            });
        }

        doc.save(`${morebtntry.Title}_Application.pdf`);
    };

    const handleClose = () => {
        setShow(false);
        setShowSimplified(false);
    };

    const handleVoiceInput = (text) => {
        setSearchQuery(text);
    };

    const getDaysRemaining = (expiredDate) => {
        const days = Math.ceil((new Date(expiredDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <>
            <h5>
                Beneficiary schemes for <span style={{ color: "green" }}>{JSON.parse(auth).Name}</span>
            </h5>

            {/* Voice Input */}
            <VoiceInput onVoiceInput={handleVoiceInput} placeholder="Search schemes by voice or text..." />

            {/* Filters */}
            <div className="scheme-filters" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <Form.Select
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Crops</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Maize">Maize</option>
                    <option value="Pulses">Pulses</option>
                </Form.Select>

                <Form.Select
                    value={seasonFilter}
                    onChange={(e) => setSeasonFilter(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Seasons</option>
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                    <option value="Year Round">Year Round</option>
                </Form.Select>

                <Button
                    variant="outline-secondary"
                    onClick={() => {
                        setCropFilter("");
                        setSeasonFilter("");
                        setSearchQuery("");
                    }}
                >
                    Clear Filters
                </Button>

                <span style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                    <strong>{filteredSchemes.length}</strong> schemes found
                </span>
            </div>

            <Table striped bordered hover className="F_Schemes_Table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Scheme Title</th>
                        <th>Subsidy</th>
                        <th>Deadline</th>
                        <th>Features</th>
                        <th>More Info</th>
                        <th>Apply</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSchemes.map((scheme, idx) => {
                        const daysLeft = getDaysRemaining(scheme.Expired);
                        return (
                            <tr key={scheme.Schemeid}>
                                <td>{idx + 1}</td>
                                <td>
                                    {scheme.Title}
                                    {daysLeft <= 7 && (
                                        <Badge bg="danger" className="ms-2">
                                            {daysLeft} days left!
                                        </Badge>
                                    )}
                                </td>
                                <td>
                                    <FaMoneyBillWave style={{ color: '#4CAF50', marginRight: '5px' }} />
                                    {scheme.SubsidyAmount || "As per guidelines"}
                                </td>
                                <td>{Moment(scheme.Expired).format('DD-MM-YYYY')}</td>
                                <td>
                                    {scheme.InsuranceOptions && scheme.InsuranceOptions.length > 0 && (
                                        <Badge bg="info" className="me-1">
                                            <FaShieldAlt /> Insurance
                                        </Badge>
                                    )}
                                    {scheme.SimplifiedDescription && (
                                        <Badge bg="success">
                                            <FaLanguage /> Simple
                                        </Badge>
                                    )}
                                </td>
                                <td>
                                    <Button variant="info" onClick={() => handlemoreinfo(scheme.Schemeid)}>
                                        More Info
                                    </Button>
                                </td>
                                <td>
                                    <Button variant="success" onClick={() => handleApply(scheme)}>
                                        Apply
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            {/* Enhanced Modal */}
            <Modal
                show={show}
                backdrop="static"
                keyboard={true}
                size="xl"
                onHide={handleClose}
                dialogClassName="modal-190w"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Scheme Information
                        {morebtntry.SimplifiedDescription && (
                            <Form.Check
                                type="switch"
                                label="Simple Language"
                                checked={showSimplified}
                                onChange={(e) => setShowSimplified(e.target.checked)}
                                className="ms-3"
                                style={{ display: 'inline-block', fontSize: '14px' }}
                            />
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <table id="F_model_Table">
                        <tr>
                            <th>Title</th>
                            <td>{morebtntry.Title}</td>
                        </tr>
                        <tr>
                            <th>Description</th>
                            <td>
                                {showSimplified && morebtntry.SimplifiedDescription
                                    ? morebtntry.SimplifiedDescription
                                    : morebtntry.Description}
                            </td>
                        </tr>
                        <tr>
                            <th>Benefits</th>
                            <td>{morebtntry.Benefits}</td>
                        </tr>
                        <tr>
                            <th>Subsidy Amount</th>
                            <td>
                                <strong style={{ color: '#4CAF50' }}>
                                    {morebtntry.SubsidyAmount || "As per scheme guidelines"}
                                </strong>
                            </td>
                        </tr>
                        <tr>
                            <th>How to Apply</th>
                            <td>{morebtntry.How}</td>
                        </tr>
                        <tr>
                            <th>Start Date</th>
                            <td>{Moment(morebtntry.Start).format('DD-MM-YYYY')}</td>
                        </tr>
                        <tr>
                            <th>Deadline</th>
                            <td>
                                {Moment(morebtntry.Expired).format('DD-MM-YYYY')}
                                {getDaysRemaining(morebtntry.Expired) <= 7 && (
                                    <Badge bg="danger" className="ms-2">
                                        Urgent: {getDaysRemaining(morebtntry.Expired)} days left!
                                    </Badge>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <th>Eligible Category</th>
                            <td>{morebtntry.Category && morebtntry.Category.join(", ")}</td>
                        </tr>
                        <tr>
                            <th>Eligible Farmer Type</th>
                            <td>{morebtntry.Farmertype && morebtntry.Farmertype.join(", ")}</td>
                        </tr>
                        {morebtntry.CropTypes && morebtntry.CropTypes.length > 0 && (
                            <tr>
                                <th>Eligible Crops</th>
                                <td>{morebtntry.CropTypes.join(", ")}</td>
                            </tr>
                        )}
                        {morebtntry.Season && morebtntry.Season.length > 0 && (
                            <tr>
                                <th>Applicable Seasons</th>
                                <td>{morebtntry.Season.join(", ")}</td>
                            </tr>
                        )}
                    </table>

                    {/* Insurance Options */}
                    {insuranceOptions && insuranceOptions.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h6><FaShieldAlt /> Insurance Options Available</h6>
                            <Table striped bordered size="sm">
                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Coverage Amount</th>
                                        <th>Premium</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insuranceOptions.map((ins, idx) => (
                                        <tr key={idx}>
                                            <td>{ins.provider}</td>
                                            <td>₹{ins.coverageAmount?.toLocaleString()}</td>
                                            <td>₹{ins.premium?.toLocaleString()}</td>
                                            <td>{ins.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={downloadpdf_more}>
                        Download Auto-filled PDF
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
