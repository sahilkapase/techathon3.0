import React, { useEffect, useState, useContext } from "react";
import "./ExpertTalk.css";
import { AppContext } from "../Farmer_account/appContext";
import { FiSend, FiPhone, FiVideo, FiInfo, FiChevronRight, FiSearch, FiFilter, FiLogOut } from "react-icons/fi";
import { BsCheckCircleFill, BsStarFill } from "react-icons/bs";
import { MdAgriculture, MdVerified } from "react-icons/md";

function ExpertTalk() {
  const [expertList, setExpertList] = useState([]);
  const [filteredExperts, setFilteredExperts] = useState([]);
  const [chatbox, setChatbox] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [expertEmail, setExpertEmail] = useState("");
  const [expertName, setExpertName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("All");
  const [isTyping, setIsTyping] = useState(false);
  const [messageError, setMessageError] = useState("");
  
  const { socket } = useContext(AppContext);
  const auth = localStorage.getItem("user");

  useEffect(() => {
    if (!auth) {
      window.location.href = "/sign-in";
      return;
    }
    fetchExperts();
  }, []);

  // Fetch all available experts
  const fetchExperts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/expert/list_of_experts", {
        method: "GET",
        crossDomain: true,
      });
      const data = await response.json();

      if (data.status === "ok" && data.experts) {
        setExpertList(data.experts);
        setFilteredExperts(data.experts);
      } else {
        console.error("Failed to fetch experts:", data.error);
      }
    } catch (error) {
      console.error("Error fetching experts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle expert selection and room join
  const handleExpertSelect = (expert) => {
    if (!expert.Email) {
      setMessageError("Invalid expert selected");
      return;
    }

    setSelectedExpert(expert);
    setExpertEmail(expert.Email);
    setExpertName(expert.Name);
    setChatbox(true);
    setMessageError("");
    setMessages([]);

    // Emit join room event
    if (socket) {
      const roomId = JSON.parse(auth).Mobilenum + expert.Email;
      socket.emit("join-in-expertroom", {
        content: "Joined consultation",
        roomid: roomId,
        Farmer: JSON.parse(auth).Mobilenum,
        expert_email: expert.Email,
      });

      // Listen for room messages
      socket.off("get-roommessages").on("get-roommessages", (data) => {
        if (data && data.length > 0) {
          setMessages(data);
        }
      });
    }
  };

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setMessageError("Message cannot be empty");
      return;
    }

    if (!socket || !expertEmail) {
      setMessageError("Connection error. Please try again.");
      return;
    }

    try {
      socket.emit("send-message-in-expertroom", {
        content: message,
        roomid: JSON.parse(auth).Mobilenum + expertEmail,
        to: expertName,
        From: JSON.parse(auth).Name,
        Farmer_number: JSON.parse(auth).Mobilenum,
        expert: expertEmail,
        timestamp: new Date(),
      });

      setMessage("");
      setMessageError("");
    } catch (error) {
      setMessageError("Failed to send message. Please try again.");
      console.error("Message send error:", error);
    }
  };

  // Filter experts based on search and expertise
  const handleSearch = (value) => {
    setSearchTerm(value);
    filterExperts(value, selectedExpertise);
  };

  const handleExpertiseFilter = (expertise) => {
    setSelectedExpertise(expertise);
    filterExperts(searchTerm, expertise);
  };

  const filterExperts = (search, expertise) => {
    let filtered = expertList;

    // Filter by expertise
    if (expertise !== "All") {
      filtered = filtered.filter(exp =>
        exp.Expertise && exp.Expertise.includes(expertise)
      );
    }

    // Filter by search term
    if (search) {
      filtered = filtered.filter(exp =>
        exp.Name.toLowerCase().includes(search.toLowerCase()) ||
        (exp.District && exp.District.toLowerCase().includes(search.toLowerCase())) ||
        (exp.Expertise && exp.Expertise.toLowerCase().includes(search.toLowerCase()))
      );
    }

    setFilteredExperts(filtered);
  };

  const handleBackToList = () => {
    setChatbox(false);
    setSelectedExpert(null);
    setMessages([]);
    setMessage("");
    setMessageError("");
  };

  // Get unique expertise list
  const getExpertiseList = () => {
    const expertise = new Set();
    expertise.add("All");
    expertList.forEach(exp => {
      if (exp.Expertise) {
        expertise.add(exp.Expertise);
      }
    });
    return Array.from(expertise);
  };

  return (
    <div className="expertTalk-wrapper">
      {!chatbox ? (
        // ============ EXPERTS LIST VIEW ============
        <div className="expertTalk-container">
          {/* Header */}
          <div className="expertTalk-header">
            <div className="header-content">
              <h1 className="header-title">
                <MdAgriculture className="header-icon" />
                Expert Consultations
              </h1>
              <p className="header-subtitle">
                Connect with experienced agricultural experts for personalized guidance
              </p>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat">
                <div className="stat-number">{expertList.length}</div>
                <div className="stat-label">Experts Available</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
              <div className="stat">
                <div className="stat-number">100%</div>
                <div className="stat-label">Free Service</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="search-filter-section">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search experts by name, specialty, or location..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="filter-chips">
              {getExpertiseList().map((expertise) => (
                <button
                  key={expertise}
                  className={`filter-chip ${selectedExpertise === expertise ? "active" : ""}`}
                  onClick={() => handleExpertiseFilter(expertise)}
                >
                  {expertise}
                </button>
              ))}
            </div>
          </div>

          {/* Experts Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading experts...</p>
            </div>
          ) : filteredExperts.length > 0 ? (
            <div className="experts-grid">
              {filteredExperts.map((expert, idx) => (
                <div
                  key={idx}
                  className="expert-card"
                  onClick={() => handleExpertSelect(expert)}
                >
                  {/* Avatar */}
                  <div className="expert-avatar">
                    <div className="avatar-initial">
                      {expert.Name.charAt(0).toUpperCase()}
                    </div>
                    <div className="verified-badge">
                      <MdVerified size={16} />
                    </div>
                  </div>

                  {/* Expert Info */}
                  <div className="expert-info">
                    <h3 className="expert-name">{expert.Name}</h3>
                    {expert.Qualifications && (
                      <p className="expert-qualifications">
                        {expert.Qualifications}
                      </p>
                    )}
                    {expert.Expertise && (
                      <p className="expert-expertise">
                        <span className="expertise-label">Expertise:</span> {expert.Expertise}
                      </p>
                    )}
                    {expert.District && (
                      <p className="expert-location">
                        📍 {expert.District}
                      </p>
                    )}
                  </div>

                  {/* Rating & CTA */}
                  <div className="expert-footer">
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill
                          key={i}
                          className={i < 4 ? "star-filled" : "star-empty"}
                          size={14}
                        />
                      ))}
                      <span className="rating-text">4.0</span>
                    </div>
                    <button className="connect-btn">
                      Connect <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <MdAgriculture size={64} />
              <h3>No Experts Found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      ) : (
        // ============ CHAT VIEW ============
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <button className="back-btn" onClick={handleBackToList}>
                ← Back
              </button>
              <div className="chat-expert-info">
                <div className="chat-avatar">
                  {selectedExpert?.Name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="chat-expert-name">{expertName}</h2>
                  <p className="chat-expert-status">
                    {selectedExpert?.Expertise && (
                      <>
                        <span className="online-indicator"></span>
                        {selectedExpert.Expertise}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <button className="action-btn" title="Call expert">
                <FiPhone size={20} />
              </button>
              <button className="action-btn" title="Video call">
                <FiVideo size={20} />
              </button>
              <button className="action-btn info-btn" title="Expert info">
                <FiInfo size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="messages-empty">
                <MdAgriculture size={48} />
                <h3>Start Your Consultation</h3>
                <p>
                  Ask {expertName} about your farming challenges, crop selection,
                  irrigation methods, or any agricultural concern.
                </p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${
                      msg.From === JSON.parse(auth).Name ? "sent" : "received"
                    }`}
                  >
                    <div className="message-content">
                      <p className="message-text">{msg.content}</p>
                      <span className="message-time">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
                <p>{expertName} is typing...</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {messageError && (
            <div className="error-message">
              <span>⚠️ {messageError}</span>
              <button onClick={() => setMessageError("")}>×</button>
            </div>
          )}

          {/* Message Input */}
          <form className="message-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="message-input"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!selectedExpert}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!message.trim() || !selectedExpert}
              title="Send message"
            >
              <FiSend size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ExpertTalk;
