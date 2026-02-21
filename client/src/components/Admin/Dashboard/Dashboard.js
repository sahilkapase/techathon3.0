import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import "./Dashboard.css";

function Dashboard() {
  const [Category, setCategory] = useState("SC");
  const [Taluka2, setTaluka2] = useState("0");
  const [Villagename, setVillagename] = useState("0");
  const [districnewdata3, setdistricnewdata3] = useState("Nashik");
  const [disn, setdisn] = useState([]);
  const [Talukadata2, setTalukadata2] = useState([]);
  const [Villagedata, setVillagedata] = useState([]);

  const [Object, setObject] = useState({
    chart: {
      type: "pie",
      id: "apexchart-example",
    },
    labels: ["SC", "ST", "OBC", "EWS", "GENERAL"],
  });
  const [Series, setSeries] = useState([0, 0, 0, 0, 0]);
  const [Object2, setObject2] = useState({
    chart: {
      type: "pie",
      id: "apexchart-example",
    },
    labels: ["SC", "ST", "OBC", "EWS", "GENERAL"],
  });
  const [Series2, setSeries2] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    getdata();
  }, []);

  useEffect(() => {
    const getstate = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/admin/analysis/${districnewdata3}/${Taluka2}/${Villagename}`,
          { method: "GET" }
        );
        const data = await response.json();
        console.log("Analysis data:", data);

        if (data.data && data.data[0]) {
          const d = data.data[0];
          setSeries2([d.SC || 0, d.ST || 0, d.OBC || 0, d.EWS || 0, d.GENERAL || 0]);
          setObject2({
            chart: { id: "apexchart-example" },
            labels: ["SC", "ST", "OBC", "EWS", "GENERAL"],
          });
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
      }
    };
    getstate();
  }, [districnewdata3, Taluka2, Villagename]);

  function getdata() {
    fetch(`http://localhost:8000/admin/registeredfarmerdetails`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Registered farmers:", data);

        const pieData = [
          data.SCfarmers || 0,
          data.STfarmers || 0,
          data.OBCfarmers || 0,
          data.EWSfarmers || 0,
          data.GENERALfarmers || 0
        ];

        setObject({
          chart: { id: "apexchart-example" },
          labels: ["SC", "ST", "OBC", "EWS", "GENERAL"],
        });
        setSeries(pieData);
      })
      .catch(error => console.error("Error fetching farmer details:", error));
  }

  function handleselectCategory(e) {
    setCategory(e.target.value);
  }

  useEffect(() => {
    const getDistrict = async () => {
      try {
        const response = await fetch("http://localhost:8000/scheme/list");
        const data = await response.json();
        console.log("Districts:", data);
        setdisn(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setdisn([]);
      }
    };
    getDistrict();
  }, []);

  useEffect(() => {
    const getTaluka = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/scheme/list/${districnewdata3}`
        );
        const data = await response.json();
        console.log("Talukas:", data);
        setTalukadata2(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching talukas:", error);
        setTalukadata2([]);
      }
    };
    if (districnewdata3) getTaluka();
  }, [districnewdata3]);

  useEffect(() => {
    const getVillage = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/scheme/list/${districnewdata3}/${Taluka2}`
        );
        const data = await response.json();
        console.log("Villages:", data);
        setVillagedata(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching villages:", error);
        setVillagedata([]);
      }
    };
    if (districnewdata3 && Taluka2) getVillage();
  }, [districnewdata3, Taluka2]);

  const handleDistric3 = (event) => {
    const getDistrictname3 = event.target.value;
    setdistricnewdata3(getDistrictname3);
    setVillagename("0");
    setVillagedata([]);
    setTaluka2("0");
    setTalukadata2([]);
  };

  const handleTaluka2 = (event) => {
    const getTalukaname2 = event.target.value;
    setTaluka2(getTalukaname2);
    setVillagename("0");
    setVillagedata([]);
  };

  const handleVillagename = (event) => {
    const getVillagename = event.target.value;
    setVillagename(getVillagename);
  };

  return (
    <>
      <div className="dashboard-container" style={{ padding: "100px 20px 20px", minHeight: "100vh", background: "#f5f5f5" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#228944" }}>📊 Admin Dashboard</h2>
        
        <div className="Alldatapie" style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
          <div className="graph1" style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h5 style={{ textAlign: "center", marginBottom: "15px" }}>
              All Registered Farmers by Category
            </h5>
            <Chart
              options={Object}
              series={Series}
              type="pie"
              width={450}
              height={350}
            />
          </div>

          <div className="graph2" style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h5 style={{ textAlign: "center", marginBottom: "15px" }}>
              Farmers in {districnewdata3} {Taluka2 !== "0" ? `- ${Taluka2}` : ""} by Category
            </h5>
            <Chart
              options={Object2}
              series={Series2}
              type="pie"
              width={450}
              height={350}
            />
          </div>
        </div>

        <div style={{ marginTop: "40px", background: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", maxWidth: "600px", margin: "40px auto" }}>
          <h5 style={{ marginBottom: "20px", color: "#333" }}>🔍 Filter by Location</h5>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            <div style={{ flex: "1", minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>District</label>
              <select
                value={districnewdata3}
                onChange={handleDistric3}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
              >
                {disn.map((district, idx) => (
                  <option key={idx} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1", minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Taluka</label>
              <select
                value={Taluka2}
                onChange={handleTaluka2}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
              >
                <option value="0">All Talukas</option>
                {Talukadata2.map((taluka, idx) => (
                  <option key={idx} value={taluka}>{taluka}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1", minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Village</label>
              <select
                value={Villagename}
                onChange={handleVillagename}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
              >
                <option value="0">All Villages</option>
                {Villagedata.map((village, idx) => (
                  <option key={idx} value={village}>{village}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
