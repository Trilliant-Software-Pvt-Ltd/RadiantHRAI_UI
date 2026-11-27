
import React from "react";

const AttendanceRequests = ({
  requests = [],
  formatDate,
}) => {
  return (
    <div className="attendance-requests-list">
      {requests.length === 0 ? (
        <div className="attendance-no-records">
          No attendance requests submitted yet.
        </div>
      ) : (
        requests.map((request) => (
          <div
            className="attendance-request-item"
            key={request.id}
          >
            <div>
              <strong>{request.type}</strong>

              <span>
                {request.type === "Work From Home"
                  ? `${formatDate(request.from)} - ${formatDate(
                      request.to
                    )}`
                  : formatDate(request.date)}
              </span>

              <p>{request.reason || "—"}</p>

              {request.type === "Work From Home" && (
                <small>
                  Duration: {request.duration}
                  {request.workMode !== "Hourly" &&
                    ` (${request.workMode})`}
                </small>
              )}
            </div>

            <span className="attendance-status-badge pending">
              {request.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default AttendanceRequests;
