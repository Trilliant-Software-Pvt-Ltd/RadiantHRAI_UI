import React, { useState } from "react";
import {
  FiArrowLeft,
  FiFileText,
  FiCreditCard,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiChevronDown,
  FiX,
  FiShield,
  FiUser,
} from "react-icons/fi";

import "./EmpDocument.css";

const initialDocuments = [
  {
    id: 1,
    name: "Aadhaar Card",
    status: "Verified",
    category: "Identity Proof",
    fileName: "aadhaar-card.pdf",
    icon: FiCreditCard,
  },
  {
    id: 2,
    name: "PAN Card",
    status: "Verified",
    category: "Identity Proof",
    fileName: "pan-card.pdf",
    icon: FiCreditCard,
  },
  {
    id: 3,
    name: "Educational Certificates",
    status: "Pending",
    category: "Education Proof",
    fileName: "educational-certificates.pdf",
    icon: FiAward,
  },
  {
    id: 4,
    name: "Experience Letter",
    status: "Verified",
    category: "Employment Proof",
    fileName: "experience-letter.pdf",
    icon: FiBriefcase,
  },
  {
    id: 5,
    name: "Offer Letter",
    status: "Verified",
    category: "Employment Document",
    fileName: "offer-letter.pdf",
    icon: FiFileText,
  },
];

function EmpDocument({ employee, onBackToList }) {
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState(initialDocuments[2]);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showActions, setShowActions] = useState(null);

  const employeeName = employee?.name || "Mr.Krishna";
  const employeeId = employee?.empId || "TS012";
  const employeeDesignation =
    employee?.designation || "Software developer - UI/UX";

  const verifiedCount = documents.filter(
    (document) => document.status === "Verified",
  ).length;

  const handleReview = (document) => {
    setSelectedDocument(document);
    setShowActions(null);
  };

  const handleMarkVerified = () => {
    if (!selectedDocument) return;

    const updatedDocuments = documents.map((document) =>
      document.id === selectedDocument.id
        ? { ...document, status: "Verified" }
        : document,
    );

    setDocuments(updatedDocuments);

    setSelectedDocument({
      ...selectedDocument,
      status: "Verified",
    });
  };

  return (
    <div className="hrms-form-container dv-page">
      {/* =========================================
          HEADER BANNER - SAME AS EMP ONBOARDING
      ========================================= */}

      <section className="eod-banner dv-document-banner">
        <div className="eod-banner-content">
          <button
            type="button"
            className="eod-back-button"
            onClick={onBackToList}
          >
            <FiArrowLeft />
            Back to Employees
          </button>

          <h1>Document Verification</h1>

          <p>
            Verify and approve documents for <strong>{employeeName}</strong>.
          </p>

          <div className="eod-employee-info">
            {employee?.avatar ? (
              <img src={employee.avatar} alt={employeeName} />
            ) : (
              <div className="eod-avatar-fallback">
                <FiUser />
              </div>
            )}

            <div>
              <strong>{employeeName}</strong>
              <span>
                {employeeId} · {employeeDesignation}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <div className="dv-main-layout">
        {/* DOCUMENT LIST */}

        <section className="dv-documents-card">
          <div className="dv-tabs">
            <button
              type="button"
              className={activeTab === "documents" ? "active" : ""}
              onClick={() => setActiveTab("documents")}
            >
              <FiFileText />
              Documents ({documents.length})
            </button>

            <button
              type="button"
              className={activeTab === "history" ? "active" : ""}
              onClick={() => setActiveTab("history")}
            >
              <FiClock />
              Verification History
            </button>
          </div>

          {activeTab === "documents" ? (
            <div className="dv-table-wrapper">
              <table className="dv-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((document) => {
                    const DocumentIcon = document.icon;

                    return (
                      <tr
                        key={document.id}
                        className={
                          selectedDocument?.id === document.id ? "selected" : ""
                        }
                        onClick={() => handleReview(document)}
                      >
                        <td>
                          <div className="dv-document-name">
                            <span className="dv-document-icon">
                              <DocumentIcon />
                            </span>

                            <div>
                              <strong>{document.name}</strong>
                              <small>{document.fileName}</small>
                            </div>
                          </div>
                        </td>

                        <td>{document.category}</td>

                        <td>
                          <span
                            className={`dv-status ${
                              document.status === "Verified"
                                ? "verified"
                                : "pending"
                            }`}
                          >
                            {document.status === "Verified" ? (
                              <FiCheckCircle />
                            ) : (
                              <FiClock />
                            )}
                            {document.status}
                          </span>
                        </td>

                        <td>
                          <div className="dv-action-wrapper">
                            <button
                              type="button"
                              className="dv-review-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleReview(document);
                              }}
                            >
                              <FiEye />
                              Review
                            </button>

                            {document.status === "Pending" && (
                              <div className="dv-action-dropdown">
                                <button
                                  type="button"
                                  className="dv-dropdown-toggle"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setShowActions(
                                      showActions === document.id
                                        ? null
                                        : document.id,
                                    );
                                  }}
                                >
                                  <FiChevronDown />
                                </button>

                                {showActions === document.id && (
                                  <div className="dv-dropdown-menu">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleReview(document);
                                      }}
                                    >
                                      <FiEye />
                                      View Document
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dv-history-content">
              <div className="dv-history-summary">
                <span className="dv-history-summary-icon">
                  <FiCheckCircle />
                </span>

                <div>
                  <strong>{verifiedCount} Documents Verified</strong>
                  <span>Out of {documents.length} submitted documents</span>
                </div>
              </div>

              <div className="dv-history-list">
                {documents
                  .filter((document) => document.status === "Verified")
                  .map((document) => (
                    <div className="dv-history-item" key={document.id}>
                      <span className="dv-history-check">
                        <FiCheckCircle />
                      </span>

                      <div>
                        <strong>{document.name}</strong>
                        <span>{document.fileName}</span>
                      </div>

                      <span className="dv-status verified">Verified</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* DOCUMENT PREVIEW */}

        <aside className="dv-preview-card">
          <h3 className="dv-preview-title">
            <FiFileText />
            Document Preview
          </h3>

          {selectedDocument ? (
            <>
              <div className="dv-preview-document">
                <div className="dv-preview-paper">
                  <div className="dv-preview-paper-header">
                    <FiShield />
                    <span>DOCUMENT</span>
                  </div>

                  <div className="dv-preview-paper-content">
                    <div className="dv-preview-profile">
                      <FiUser />
                    </div>

                    <strong>{employeeName}</strong>
                    <span>{employeeId}</span>

                    <div className="dv-preview-line" />
                    <div className="dv-preview-line short" />
                    <div className="dv-preview-line" />
                    <div className="dv-preview-line medium" />
                  </div>

                  <div className="dv-preview-paper-footer">
                    {selectedDocument.name}
                  </div>
                </div>
              </div>

              <div className="dv-preview-details">
                <div className="d-flex flex-column">
                  <strong>{selectedDocument.name}</strong>

                  <span>{selectedDocument.fileName}</span>
                </div>
                <span
                  className={`dv-status ${
                    selectedDocument.status === "Verified"
                      ? "verified"
                      : "pending"
                  }`}
                >
                  {selectedDocument.status === "Verified" ? (
                    <FiCheckCircle />
                  ) : (
                    <FiClock />
                  )}
                  {selectedDocument.status}
                </span>
              </div>

              <div className="dv-preview-actions">
                <button
                  type="button"
                  className="dv-view-full-button"
                  onClick={() => setShowFullPreview(true)}
                >
                  <FiEye />
                  View Full Size
                </button>

                {selectedDocument.status === "Pending" && (
                  <button
                    type="button"
                    className="dv-verify-button"
                    onClick={handleMarkVerified}
                  >
                    <FiCheckCircle />
                    Mark as Verified
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="dv-empty-preview">
              <FiFileText />
              <span>Select a document to preview</span>
            </div>
          )}
        </aside>
      </div>

      {/* =========================================
          FULL SIZE PREVIEW MODAL
      ========================================= */}

      {showFullPreview && selectedDocument && (
        <div
          className="dv-modal-overlay"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="dv-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dv-modal-header">
              <div>
                <h3>{selectedDocument.name}</h3>
                <span>{selectedDocument.fileName}</span>
              </div>

              <button type="button" onClick={() => setShowFullPreview(false)}>
                <FiX />
              </button>
            </div>

            <div className="dv-modal-body">
              <div className="dv-modal-placeholder">
                <FiFileText />

                <strong>{selectedDocument.name}</strong>

                <span>
                  Document preview will be displayed here once the actual
                  document file is connected.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpDocument;
