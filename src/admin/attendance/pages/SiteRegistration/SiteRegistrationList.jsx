
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  EditIcon,
  DeleteIcon,
} from "../../../../common/components/Icons/Icons.jsx";

import Toast from "../../../../common/components/Popups/Toast";
import ConfirmPopup from "../../../../common/components/Popups/Alert.jsx";
import DataTable from "../../../../common/components/DataTable/DataTable";

import {
  getAllSiteRegistration,
  deleteSiteRegistration,
} from "../../services/SiteRegistrationApi.js";

import {
  extractSiteRegistrations,
  mapSiteRegistration,
  getApiErrorMessage,
} from "../../mapper/SiteRegistrationMapper.js";

/* =========================================================
   COMPONENT
========================================================= */

export default function SiteRegistrationList({
  sites: suppliedSites,
  loading: suppliedLoading,
  onAdd,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const [siteRows, setSiteRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Encrypted ID is used to track the deleting record.
  const [deletingId, setDeletingId] = useState(null);

  const [selectedSite, setSelectedSite] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback(
    (message, type = "info", duration = 3000) => {
      setToast({
        id: Date.now(),
        message,
        type,
        duration,
      });
    },
    []
  );

  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  /* =======================================================
     MAP API RECORDS
  ======================================================= */

  const mapRecords = useCallback((records) => {
    return records.map((item, index) => {
      const mapped = mapSiteRegistration(item, index);

      // Display address without Address Line 2.
      const address = [
        item?.address_line_1,
        item?.city,
        item?.state_region,
        item?.postal_code,
        item?.countryName,
      ]
        .filter(
          (value) =>
            value != null && String(value).trim()
        )
        .join(", ");

      return {
        ...mapped,
        address,
      };
    });
  }, []);

  /* =======================================================
     FETCH SITE REGISTRATIONS
  ======================================================= */

  const fetchSiteRegistrations = useCallback(async () => {
    if (Array.isArray(suppliedSites)) {
      setSiteRows(mapRecords(suppliedSites));
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAllSiteRegistration();
      const records = extractSiteRegistrations(response);

      setSiteRows(mapRecords(records));
    } catch (err) {
      console.error(
        "Failed to fetch site registrations:",
        err.response?.data || err.message
      );

      setSiteRows([]);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load site registrations."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [suppliedSites, mapRecords]);

  useEffect(() => {
    fetchSiteRegistrations();
  }, [fetchSiteRegistrations]);

  /* =======================================================
     ADD
  ======================================================= */

  const handleAdd = useCallback(() => {
    if (onAdd) {
      onAdd();
      return;
    }

    navigate("/admin/attendance/siteRegistration/add", {
      state: {
        mode: "add",
        isEdit: false,
        encryptedId: null,
        site: null,
      },
    });
  }, [onAdd, navigate]);

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = useCallback(
    (item) => {
      const encryptedId = item?.encryptedId;

      if (
        typeof encryptedId !== "string" ||
        !encryptedId.trim()
      ) {
        showToast(
          "Encrypted Site Registration ID is missing.",
          "error",
          5000
        );

        console.error(
          "Encrypted Site Registration ID missing:",
          item
        );

        return;
      }

      if (onEdit) {
        onEdit(item);
        return;
      }

      navigate("/admin/attendance/siteRegistration/add", {
        state: {
          mode: "edit",
          isEdit: true,

          // Retain numeric ID for the update payload if needed.
          id: item?.id ?? null,

          // Encrypted ID is the Update API URL parameter.
          encryptedId,

          site: item,
        },
      });
    },
    [onEdit, navigate, showToast]
  );

  /* =======================================================
     OPEN DELETE CONFIRMATION
  ======================================================= */

  const handleDelete = useCallback(
    (item) => {
      const encryptedId = item?.encryptedId;

      if (
        typeof encryptedId !== "string" ||
        !encryptedId.trim()
      ) {
        showToast(
          "Encrypted Site Registration ID is missing.",
          "error",
          5000
        );

        console.error(
          "Cannot delete site. Encrypted ID missing:",
          item
        );

        return;
      }

      setSelectedSite(item);
      setShowDeleteConfirm(true);
    },
    [showToast]
  );

  /* =======================================================
     CANCEL DELETE
  ======================================================= */

  const handleCancelDelete = useCallback(() => {
    if (deletingId !== null) return;

    setShowDeleteConfirm(false);
    setSelectedSite(null);
  }, [deletingId]);

  /* =======================================================
     CONFIRM DELETE
  ======================================================= */

  const confirmDelete = useCallback(async () => {
    const encryptedId = selectedSite?.encryptedId;

    if (
      typeof encryptedId !== "string" ||
      !encryptedId.trim()
    ) {
      showToast(
        "Encrypted Site Registration ID is missing.",
        "error",
        5000
      );

      return;
    }

    try {
      setDeletingId(encryptedId);

      console.log(
        "Delete Site Registration Encrypted ID:",
        encryptedId
      );

      // IMPORTANT:
      // Pass encrypted ID instead of numeric ID.
      await deleteSiteRegistration(encryptedId);

      setShowDeleteConfirm(false);
      setSelectedSite(null);

      if (onDelete) {
        onDelete(selectedSite);
      }

      if (Array.isArray(suppliedSites)) {
        setSiteRows((previous) =>
          previous.filter(
            (item) => item.encryptedId !== encryptedId
          )
        );
      } else {
        await fetchSiteRegistrations();
      }

      showToast(
        "Site registration deleted successfully.",
        "success"
      );
    } catch (err) {
      console.error(
        "Delete site registration failed:",
        err.response?.data || err.message
      );

      showToast(
        getApiErrorMessage(
          err,
          "Unable to delete site registration."
        ),
        "error",
        5000
      );
    } finally {
      setDeletingId(null);
    }
  }, [
    selectedSite,
    showToast,
    onDelete,
    suppliedSites,
    fetchSiteRegistrations,
  ]);

  /* =======================================================
     TABLE COLUMNS
  ======================================================= */

  const columns = useMemo(
    () => [
      {
        header: "Edit",
        key: "edit",
        width: "80px",
        sortable: false,
        searchable: false,
        exportable: false,
        render: (_, item) => (
          <button
            type="button"
            className="icon-btn"
            title={`Edit ${item.siteName}`}
            aria-label={`Edit ${item.siteName}`}
            onClick={(event) => {
              event.stopPropagation();
              handleEdit(item);
            }}
          >
            <EditIcon />
          </button>
        ),
      },
      {
        header: "Delete",
        key: "delete",
        width: "90px",
        sortable: false,
        searchable: false,
        exportable: false,
        render: (_, item) => (
          <button
            type="button"
            className="delete-icon"
            title={`Delete ${item.siteName}`}
            aria-label={`Delete ${item.siteName}`}
            disabled={deletingId === item.encryptedId}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(item);
            }}
          >
            <DeleteIcon />
          </button>
        ),
      },
      {
        header: "Organization",
        key: "organization",
        accessor: "organization",
      },
      {
        header: "Entity",
        key: "entity",
        accessor: "entity",
      },
      {
        header: "Site Code",
        key: "siteCode",
        accessor: "siteCode",
      },
      {
        header: "Site Name",
        key: "siteName",
        accessor: "siteName",
      },
      {
        header: "Site Type",
        key: "siteType",
        accessor: "siteType",
      },
      {
        header: "Address",
        key: "address",
        accessor: "address",
      },
    //   {
    //     header: "Status",
    //     key: "status",
    //     accessor: "status",
    //   },
    ],
    [handleEdit, handleDelete, deletingId]
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleToastClose}
        />
      )}

      <ConfirmPopup
        isOpen={showDeleteConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this site registration?"
        itemName={selectedSite?.siteName}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="hrms-form-container organization-entity-list-page">
        {error && (
          <div className="org-entity-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchSiteRegistrations}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        <DataTable
          data={siteRows}
          columns={columns}
          title="Site Registration - List"
          subtitle="View and manage registered sites."
          titleIcon={<FiList size={19} />}
          showTitle
          searchable
          searchPlaceholder="Search sites..."
          showAddButton
          addLabel="Add"
          onAdd={handleAdd}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          enableExport
          enableCopy
          enableCsv
          enableExcel
          enablePdf
          enablePrint
          fileName="site-registrations"
          rowKey="encryptedId"
          loading={suppliedLoading ?? loading}
          emptyMessage="No site registrations found."
          className="organization-entity-table"
        />
      </div>
    </>
  );
}
