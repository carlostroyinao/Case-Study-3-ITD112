import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      {/* Main Banner */}
      <div className="main-banner">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="top-text header-text">
                <h6>Providing a Insightful Graphs and Plots</h6>
                <h2>Filipino Emigrants Dataset</h2>
              </div>
            </div>
            <div className="col-lg-10 offset-lg-1">
              <ul className="categories">
                <li>
                  <Link to="/data" onClick={() => window.scrollTo(0, 0)}>
                    <span className="icon">
                      <img src="assets/images/data-icon.png" alt="Data" />
                    </span>
                    Data
                  </Link>
                </li>
                <li>
                  <Link to="/import" onClick={() => window.scrollTo(0, 0)}>
                    <span className="icon">
                      <img src="assets/images/import-icon.png" alt="Import" />
                    </span>
                    Import
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" onClick={() => window.scrollTo(0, 0)}>
                    <span className="icon">
                      <img src="assets/images/dashboard-icon.png" alt="Dashboard" />
                    </span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/forecasting" onClick={() => window.scrollTo(0, 0)}>
                    <span className="icon">
                      <img src="assets/images/forecasting-icon.png" alt="Forecasting" />
                    </span>
                    Forecasting
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
