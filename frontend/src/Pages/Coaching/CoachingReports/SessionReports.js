import React, { useEffect, useState } from "react";
import axios from "axios";
import { utils, writeFile } from "xlsx";
import "./SessionReports.css";
import CoachingHeader from "../CoachingHeader/CoachingHeader";

const SessionReport = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const api = process.env.REACT_APP_BASE_URL;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${api}/api/coach/sessions`);
        setSessions(res.data);
        setFilteredSessions(res.data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };

    fetchSessions();
  }, [api]);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(session => session.status.toLowerCase() === filterStatus));
    }
  }, [filterStatus, sessions]);

  const exportToExcel = () => {
    const formattedData = filteredSessions.map((s) => ({
      Coach: s.coachName,
      User: s.userName,
      Email: s.userEmail,
      Phone: s.userPhone,
      Type: s.coachType,
      Date: new Date(s.preferredDate).toLocaleDateString(),
      Time: s.preferredTime,
      Status: s.status,
      Notes: s.notes || "",
    }));

    const worksheet = utils.json_to_sheet(formattedData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Session Report");
    writeFile(workbook, "Coach_Session_Report.xlsx");
  };

  return (
    <>
      <CoachingHeader />
      <div className="session-report-container">
        <div className="coach-session-header">
          <h2>Session Booking Report</h2>
          <div className="coach-session-filters">
            <select 
              className="coach-session-filter-dropdown"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="coach-download-btn" onClick={exportToExcel}>Download Report</button>
          </div>
        </div>

        <table className="session-report-table">
          <thead>
            <tr>
              <th>Coach</th>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => (
              <tr key={s._id}>
                <td>{s.coachName}</td>
                <td>{s.userName}</td>
                <td>{s.userEmail}</td>
                <td>{s.userPhone}</td>
                <td>{s.coachType}</td>
                <td>{new Date(s.preferredDate).toLocaleDateString()}</td>
                <td>{s.preferredTime}</td>
                <td className={`coach-status-${s.status.toLowerCase()}`}>{s.status}</td>
                <td>{s.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SessionReport;