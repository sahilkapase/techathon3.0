import axios from "axios";
import React, { Component } from "react";
import { Button } from "react-bootstrap";
import "./style.css";

class App extends Component {
  state = {
    selectedFile: null,
    Diseas: [],
    Sugestions: [],
    previewimg: null,
    data: false,
  };

  onFileChange = (event) => {
    this.setState({ selectedFile: event.target.files[0] });
    this.setState({ previewimg: URL.createObjectURL(event.target.files[0]) });
  };
  onFileUpload = () => {
    const formData = new FormData();

    formData.append(
      "file",
      this.state.selectedFile,
      this.state.selectedFile.name
    );
    console.log(this.state.selectedFile);
    console.log(this.state.selectedFile.name);

    const promise = axios.post("http://localhost:5000/Crop_Diseas", formData);
    promise.then((data) => {
      this.setState({ Diseas: data.data });
      this.setState({ Sugestions: data.data.Suggestions });
      this.setState({ data: true });
      console.log(data);
      console.log(data.data);
      // console.log(data.data.Diseas)
      // console.log(data.data.Suggestions)
    });

    console.warn(this.state.Diseas);
    console.warn(formData);
  };

  render() {
    return (
      <>
        <h3 style={{ marginTop: "100px" }}>Disease detection</h3>

        <div>
          <input type="file" onChange={this.onFileChange} />
          <Button style={{backgroundColor : "green" , color : "white"}} variant="Success" className="btn"onClick={this.onFileUpload}>Upload!</Button>
        </div>
        <div className="mainbox">
          {this.state.data ? (
            <>
              <div className="Diseasedete">
                <img src={this.state.previewimg} width="400" height="10" />
              </div>
              <div className="Diseasedete2">
                <table id="F_model_Table">
                  <tr>
                    <th>Crop Name</th>
                    <td> {this.state.Diseas.Crop} </td>
                  </tr>
                  <tr>
                    <th>Crop Disease</th>
                    <td>{this.state.Diseas.Diseas} </td>
                  </tr>
                  <tr>
                    <th>Crop Cause</th>
                    <td>{this.state.Diseas.Cause}</td>
                  </tr>

                 
                  <tr>
                    <th>Crop Suggestion</th>
                    <td>{this.state.Diseas.Sugession}</td>
                  </tr>
                </table>
              </div>
            </>
          ) : null}
        </div>

        <br />
      </>
    );
  }
}

export default App;
