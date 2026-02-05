// import style from "./style.css"
import React, { Component } from 'react'
import axios from "axios";
import { Form, Card, ProgressBar } from "react-bootstrap";
import ReactApexChart from "react-apexcharts";
import ApexCharts from 'apexcharts'
import { useEffect, useState } from 'react';
import {
	Container,
	Col,
	Row,
	Button,
	FormGroup,
	Label,
	Input,
} from "reactstrap";
import { v1 as uuid } from 'uuid';
const auth = localStorage.getItem('user');

export default function Yieldfinder ()  {
  const[top5datacrop0 , setTop5data0] = useState([]);
  const [loading, setLoading] = useState(false);
  const [Nitrogen, setNitrogen] = useState("69");
  const [season, setSeason] = useState("Kharif");
  const [Crop, setCrop] = useState("Rice");
  const [Area, setArea] = useState("50");
  const [City, setCity] = useState("Kheda");
  const [Phosphorus, setPhosphorus] = useState("50");
  const [Potassium, setPotassium] = useState("40");
  const [Ph, setPh] = useState("5.2");
  const [shownCrop, setshownCrop] = useState(false);
  const [showntop5, setshowntop5] = useState(false);

  const [Production, setProduction] = useState("");
  const [Yield, setYield] = useState(false);


  const handleShow = (crop) => {
		setshownCrop(crop);
    console.log(crop)
    console.log(crop.Requir_Nitro)
	};

 const handleSubmit = async (e) => {
  e.preventDefault();
  console.log( season, City, Crop, Area , Nitrogen, Phosphorus, Potassium , Ph);

// setLoading(true);
setshowntop5(true)

  const getCropData = () => {

    axios.get(`https://1a78-117-254-32-101.in.ngrok.io/Crop_Yield/%3Cdist%3E/%3Cseason%3E/%3Ccrop%3E/%3Cint:area%3E/%3Cint:N%3E/%3Cint:P%3E/%3Cint:K%3E/%3Cstring:Ph%3E?dist=${City}&season=${season}&crop=${Crop}&area=${Area}&N=${Nitrogen}&P=${Phosphorus}&K=${Potassium}&Ph=${Ph}` , {withCredentials: true})
    .then(response => {
      console.log(response.data);
      setProduction(response.data.Production)
      setYield(response.data.Yield)
      setshowntop5(true)
    })
    .catch(error => {
      console.log(error);
    });

//      fetch(`https://0909-2402-8100-27d0-f428-b47c-e4e3-c607-7036.in.ngrok.io/Crop_Yield/%3Cdist%3E/%3Cseason%3E/%3Ccrop%3E/%3Cint:area%3E/%3Cint:N%3E/%3Cint:P%3E/%3Cint:K%3E/%3Cstring:Ph%3E?dist=${City}&season=${season}&crop=${Crop}&area=${Area}&N=${Nitrogen}&P=${Phosphorus}&K=${Potassium}&Ph=${Ph}`)
//     .then((response) =>  response.json())
//       .then((data) => {
// const Crops = data; 
//         setTop5data0(Crops);
//         console.log(Crops)
//         setLoading(false);
//       }); 
  };
  getCropData();
  }
  
  if (loading) {
    return <p style={{marginTop : "100px"}}>Data is loading...</p>;
  }

let chartvalue = top5datacrop0.map((i => (i.Prob* 100)))
let Labalevalue = top5datacrop0.map((i => (i.Crop)))





    return (
      auth ?
      <> 
       <div className="auth-wrapper" style={{marginTop : "150px"}}>
        <div className="auth-innerCropre">
        <h2>Yield finder</h2>
        <form onSubmit={handleSubmit}>
          <div className="CompdivCropre">
        <label>District </label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter your District "
           onChange={ (event) => setCity(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Season</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Season"
           onChange={ (event) => setSeason(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Crop</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Crop Name"
           onChange={ (event) => setCrop(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Area</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Area"
           onChange={ (event) => setArea(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Nitrogen</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Nitrogen"
           onChange={ (event) => setNitrogen(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Phosphorus</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Phosphorus"
           onChange={ (event) => setPhosphorus(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Potassium</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter Potassium"
           onChange={ (event) => setPotassium(event.target.value)}
         />
       </div> 
          <div className="CompdivCropre">
        <label>Ph</label>
         <input
           // type="email"
           className="form-control"
           placeholder="Enter PH"
           onChange={ (event) => setPh(event.target.value)}
         />
       </div> 
       <div >
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
        </form>
        <div>
        </div>
        </div>
        </div>
<br />
{showntop5 ?
 <div className="auth-innerCropretop5">
<h1>Production :- {Production}</h1>
<h1>Yield :-{Yield}</h1>
   </div>

:null}
       

        <br />
      </>
    
      : 
       <>
      <div style={{marginTop : "150px"}}><h2>Login Require</h2></div>
      </>
    )
  
}