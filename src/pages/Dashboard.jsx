import React, { useState } from "react";
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

  const categoryDashboard = [
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

      {/* Category Selector */}
      <div
        className="container"
        style={{
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <div className="row">
          <div className="col-lg-12">
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "8px",
                justifyContent: "space-between",
                alignItems: "stretch",
                paddingBottom: "6px",
                width: "100%",
              }}
            >
              {categories.map((cat, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  style={{
                    border: activeIndex === index ? "2px solid #4b6cb7" : "1px solid #d0d0d0",
                    background: activeIndex === index ? "#f3f7ff" : "#fff",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: activeIndex === index ? "0 3px 10px rgba(0,0,0,0.07)" : "0 2px 6px rgba(0,0,0,0.05)",
                    transition: "all 0.15s ease-in-out",
                    whiteSpace: "nowrap",
                    flex: "1 1 0",
                    minWidth: 0,
                  }}
                >
                  <img
                    src={cat.icon}
                    alt={cat.name}
                    style={{ width: "26px", height: "26px", objectFit: "contain" }}
                  />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Dashboard */}
      <div className="container" style={{ marginBottom: "40px" }}>
        <div className="row">
          <div className="col-lg-12">
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}>
              <img
                src={categories[activeIndex].icon}
                alt={categories[activeIndex].name}
                style={{ width: "36px", height: "36px", objectFit: "contain" }}
              />
              <div>
                <h4 style={{ margin: 0 }}>{categoryContent[activeIndex].title}</h4>
                <p style={{ margin: 0, color: "#555" }}>{categoryContent[activeIndex].description}</p>
              </div>
            </div>

            <div className="general-info" style={{ padding: "12px 0" }}>
              <div className="data-table-section">
                {categoryDashboard[activeIndex] || <p>No data available</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;