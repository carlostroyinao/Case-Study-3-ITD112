import React, { useState } from "react";
import { Link } from "react-router-dom";
import AgeDashboard from "../components/dashboard/AgeDashboard";
import SexDashboard from "../components/dashboard/SexDashboard";
import CivilStatusDashboard from "../components/dashboard/CivilStatusDashboard";
import EducationLevelDashboard from "../components/dashboard/EducationLevelDashboard";
import OccupationDashboard from "../components/dashboard/OccupationDashboard";
import OriginDashboard from "../components/dashboard/OriginDashboard";
import MajorCountryDashboard from "../components/dashboard/MajorCountryDashboard";
import AllCountriesDashboard from "../components/dashboard/AllCountriesDashboard";

const Dashboard = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const categories = [
    { name: "Age", icon: "assets/images/age-icon.png" },
    { name: "Sex", icon: "assets/images/sex-icon.png" },
    { name: "Civil Status", icon: "assets/images/civilstatus-icon.png" },
    { name: "Education Level", icon: "assets/images/educationlevel-icon.png" },
    { name: "Occupation", icon: "assets/images/occupation-icon.png" },
    { name: "Place of Origin", icon: "assets/images/origin-icon.png" },
    { name: "Major Country", icon: "assets/images/majorcountry-icon.png" },
    { name: "All Countries", icon: "assets/images/allcountry-icon.png" },
  ];

  const categoryContent = [
    {
      title: "Age Distribution of Emigrants",
      description:
        "Explore the age demographics of Filipino emigrants to understand which age groups are most represented abroad.",
    },
    {
      title: "Gender Distribution of Emigrants",
      description:
        "Analyze migration trends by gender and see how male and female emigrants differ in destinations and purposes.",
    },
    {
      title: "Civil Status Overview",
      description:
        "Discover how marital status influences emigration decisions among Filipinos worldwide.",
    },
    {
      title: "Education Level of Emigrants",
      description:
        "See the educational attainment levels of emigrants and how this impacts their job opportunities abroad.",
    },
    {
      title: "Occupational Breakdown",
      description:
        "Review the occupations most commonly pursued by Filipino emigrants across different countries.",
    },
    {
      title: "Regional Origins of Emigrants",
      description:
        "Find out which provinces and regions in the Philippines have the highest emigration rates.",
    },
    {
      title: "Top Destination Countries",
      description:
        "View the top countries where Filipinos have emigrated and the reasons for choosing these destinations.",
    },
    {
      title: "Global Filipino Diaspora",
      description:
        "A comprehensive look at all countries hosting Filipino emigrants around the world.",
    },
  ];

  const categoryTables = [
    <AgeDashboard />,
    <SexDashboard />,
    <CivilStatusDashboard />,
    <EducationLevelDashboard />,
    <OccupationDashboard />,
    <OriginDashboard />,
    <MajorCountryDashboard />,
    <AllCountriesDashboard />,
  ];

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="top-text header-text">
                <h6>View Statistics Through Charts</h6>
                <h2>Visualize key insights from the Filipino Emigrants Dataset through interactive charts and dashboards.</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Section */}
      <div className="category-post">
          <div className="row">
            <div className="col-lg-12">
              <div className="naccs">
                <div className="grid">
                  <div className="menu">
                    {categories.map((cat, index) => (
                      <div
                        key={index}
                        className={`${index === 0 ? "first-thumb" : ""} ${
                          index === categories.length - 1 ? "last-thumb" : ""
                        } ${activeIndex === index ? "active" : ""}`}
                        onClick={() => setActiveIndex(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="thumb">
                          <span className="icon">
                            <img src={cat.icon} alt={cat.name} />
                            <h4>{cat.name}</h4>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Category Section */}
      <div className="category-post">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="naccs">
                <div className="grid">
                  <ul className="nacc">
                    {categoryContent.map((content, index) => (
                      <li
                        key={index}
                        className={activeIndex === index ? "active" : ""}
                      >
                        <div className="thumb">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="top-content d-flex align-items-center">
                                {/* Left side: Category Icon and Title */}
                                <div className="d-flex align-items-center me-4">
                                  <img
                                    src={categories[index].icon}
                                    alt=""
                                    className="me-2"
                                    style={{ width: "40px", height: "40px", objectFit: "contain" }}
                                  />
                                  <h4 className="mb-0">{content.title}</h4>
                                </div>

                                {/* Right side: Description */}
                                <p className="mb-0">{content.description}</p>
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="general-info">
                                 {/* Render the appropriate data table */}
                                <div className="data-table-section">
                                  {categoryTables[index] || <p>No data available</p>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;