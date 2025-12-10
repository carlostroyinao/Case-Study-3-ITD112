import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  return (
    <header className="header-area header-sticky wow slideInDown" data-wow-duration="0.75s" data-wow-delay="0s">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="main-nav">
              <Link to="/" className="logo"></Link>
              <ul className="nav">
                <li>
                  <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/data" className={location.pathname === "/data" ? "active" : ""}>
                    Data
                  </Link>
                </li>
                <li>
                  <Link to="/import" className={location.pathname === "/import" ? "active" : ""}>
                    Import
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/forecasting" className={location.pathname === "/forecasting" ? "active" : ""}>
                    Forecasting
                  </Link>
                </li>
              </ul>
              <a className="menu-trigger">
                <span>Menu</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
