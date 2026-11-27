import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../../../common/components/Loader/PageLoader";
import {
  EditIcon,
  DeleteIcon,
} from "../../../../common/components/Icons/Icons.jsx";

import Toast from "../../../../common/components/Popups/Toast";

import ConfirmPopup from "../../../../common/components/Popups/Alert.jsx";

import DataTable from "../../../../common/components/DataTable/DataTable";

import {
  getAllShiftCreation,
  getShiftCreationById,
  deleteShiftCreation,
  getEntityList,
} from "../../services/ShiftCreationApi.js";

import {
  extractShiftCreations,
  extractShiftCreationById,
  createEntityMap,
  mapShiftCreation,
  getApiErrorMessage,
} from "../../mapper/ShiftCreationMapper.js";

/* =========================================================
   ROUTES
========================================================= */

const SHIFT_CREATION_ROUTE =
  "/admin/attendance/shiftCreation/add";

/* =========================================================
   COMPONENT
========================================================= */

export default function ShiftCreationList({
  shifts: suppliedShifts,
  loading: suppliedLoading,
  onAdd,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const [shiftRows, setShiftRows] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [selectedShift, setSelectedShift] =
    useState(null);

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback(
    (
      message,
      type = "info",
      duration = 3000
    ) => {
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
     FETCH SHIFT CREATIONS AND ENTITY LIST
  ======================================================= */

  const fetchShiftCreations = useCallback(
    async () => {
      setLoading(true);

      setError("");

      try {
        /* =================================================
           CALL BOTH APIS IN PARALLEL
        ================================================= */

        const [
          shiftResponse,
          entityResponse,
        ] = await Promise.all([
          Array.isArray(suppliedShifts)
            ? Promise.resolve(suppliedShifts)
            : getAllShiftCreation(),

          getEntityList().catch((err) => {
            console.error(
              "Failed to fetch entity list:",
              err
            );

            showToast(
              "Unable to load entity names. Entity IDs will be displayed.",
              "error",
              5000
            );

            return [];
          }),
        ]);

        /* =================================================
           EXTRACT RECORDS
        ================================================= */

        const records =
          extractShiftCreations(shiftResponse);

        /* =================================================
           CREATE ENTITY LOOKUP
        ================================================= */

        const entityMap =
          createEntityMap(entityResponse);

        /* =================================================
           MAP TABLE RECORDS
        ================================================= */

        const mappedRecords = records
          .filter(
            (item) =>
              item?.isDeactivated !== true
          )
          .map((item) =>
            mapShiftCreation(item, entityMap)
          );

        setShiftRows(mappedRecords);
      } catch (err) {
        console.error(
          "Failed to fetch shifts:",
          err.response?.data || err.message
        );

        setShiftRows([]);

        setError(
          getApiErrorMessage(
            err,
            "Unable to load shift creations."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [suppliedShifts, showToast]
  );

  /* =======================================================
     INITIAL DATA FETCH
  ======================================================= */

  useEffect(() => {
    fetchShiftCreations();
  }, [fetchShiftCreations]);

  /* =======================================================
     ADD SHIFT
  ======================================================= */

  const handleAdd = useCallback(() => {
    if (onAdd) {
      onAdd();
      return;
    }

    navigate(SHIFT_CREATION_ROUTE, {
      state: {
        mode: "add",
        isEdit: false,
        id: null,
        encryptedId: null,
        shift: null,
      },
    });
  }, [onAdd, navigate]);

  /* =======================================================
     EDIT SHIFT

     CALL GetShiftCreationByID FIRST
  ======================================================= */

  const handleEdit = useCallback(
    async (item) => {
      if (editingId !== null) return;

      const encryptedId =
        item?.encryptedId;

      /* ===================================================
         VALIDATE ENCRYPTED ID
      =================================================== */

      if (
        typeof encryptedId !== "string" ||
        !encryptedId.trim()
      ) {
        showToast(
          "Encrypted Shift Creation ID is missing.",
          "error",
          5000
        );

        console.error(
          "Encrypted Shift Creation ID missing:",
          item
        );

        return;
      }

      try {
        setEditingId(encryptedId);

        /* =================================================
           GET COMPLETE SHIFT DETAILS
        ================================================= */

        const response =
          await getShiftCreationById(
            encryptedId
          );

        const shiftDetails =
          extractShiftCreationById(
            response
          );

        if (!shiftDetails) {
          throw new Error(
            "Shift details not found."
          );
        }

        /* =================================================
           CUSTOM EDIT CALLBACK
        ================================================= */

        if (onEdit) {
          onEdit(shiftDetails);
          return;
        }

        /* =================================================
           NAVIGATE WITH COMPLETE API RESPONSE
        ================================================= */

        navigate(SHIFT_CREATION_ROUTE, {
          state: {
            mode: "edit",

            isEdit: true,

            id:
              shiftDetails?.rdhR0000LXXXIID ??
              item?.id ??
              null,

            encryptedId,

            shift: shiftDetails,
          },
        });
      } catch (err) {
        console.error(
          "Failed to fetch shift details:",
          err.response?.data || err.message
        );

        showToast(
          getApiErrorMessage(
            err,
            "Unable to load shift details."
          ),
          "error",
          5000
        );
      } finally {
        setEditingId(null);
      }
    },
    [
      editingId,
      onEdit,
      navigate,
      showToast,
    ]
  );

  /* =======================================================
     OPEN DELETE CONFIRMATION
  ======================================================= */

  const handleDelete = useCallback(
    (item) => {
      const encryptedId =
        item?.encryptedId;

      if (
        typeof encryptedId !== "string" ||
        !encryptedId.trim()
      ) {
        showToast(
          "Encrypted Shift Creation ID is missing.",
          "error",
          5000
        );

        console.error(
          "Cannot delete shift. Encrypted ID missing:",
          item
        );

        return;
      }

      setSelectedShift(item);

      setShowDeleteConfirm(true);
    },
    [showToast]
  );

  /* =======================================================
     CANCEL DELETE
  ======================================================= */

  const handleCancelDelete = useCallback(
    () => {
      if (deletingId !== null) return;

      setShowDeleteConfirm(false);

      setSelectedShift(null);
    },
    [deletingId]
  );

  /* =======================================================
     CONFIRM DELETE
  ======================================================= */

  const confirmDelete = useCallback(
    async () => {
      if (deletingId !== null) return;

      const encryptedId =
        selectedShift?.encryptedId;

      if (
        typeof encryptedId !== "string" ||
        !encryptedId.trim()
      ) {
        showToast(
          "Encrypted Shift Creation ID is missing.",
          "error",
          5000
        );

        return;
      }

      try {
        setDeletingId(encryptedId);

        /* =================================================
           DELETE USING ENCRYPTED ID
        ================================================= */

        await deleteShiftCreation(
          encryptedId
        );

        setShowDeleteConfirm(false);

        setSelectedShift(null);

        if (onDelete) {
          onDelete(selectedShift);
        }

        /* =================================================
           REFRESH TABLE
        ================================================= */

        if (
          Array.isArray(suppliedShifts)
        ) {
          setShiftRows((previous) =>
            previous.filter(
              (item) =>
                item.encryptedId !==
                encryptedId
            )
          );
        } else {
          await fetchShiftCreations();
        }

        showToast(
          "Shift deleted successfully.",
          "success"
        );
      } catch (err) {
        console.error(
          "Delete shift failed:",
          err.response?.data || err.message
        );

        showToast(
          getApiErrorMessage(
            err,
            "Unable to delete shift."
          ),
          "error",
          5000
        );
      } finally {
        setDeletingId(null);
      }
    },
    [
      deletingId,
      selectedShift,
      showToast,
      onDelete,
      suppliedShifts,
      fetchShiftCreations,
    ]
  );

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
            title={
              editingId === item.encryptedId
                ? "Loading shift details..."
                : `Edit ${item.shiftName}`
            }
            aria-label={`Edit ${item.shiftName}`}
            disabled={
              editingId !== null ||
              deletingId !== null
            }
            onClick={(event) => {
              event.stopPropagation();

              handleEdit(item);
            }}
          >
            <EditIcon />
          </button>
        ),
      },

      /* ===================================================
         DELETE
      =================================================== */

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
            title={`Delete ${item.shiftName}`}
            aria-label={`Delete ${item.shiftName}`}
            disabled={
              deletingId !== null ||
              editingId !== null
            }
            onClick={(event) => {
              event.stopPropagation();

              handleDelete(item);
            }}
          >
            <DeleteIcon />
          </button>
        ),
      },

      /* ===================================================
         SHIFT NAME
      =================================================== */

      {
        header: "Shift Name",

        key: "shiftName",

        accessor: "shiftName",
      },

      /* ===================================================
         SHIFT CODE
      =================================================== */

      {
        header: "Shift Code",

        key: "shiftCode",

        accessor: "shiftCode",
      },

      /* ===================================================
         ENTITY
      =================================================== */

      {
        header: "Entity",

        key: "entity",

        accessor: "entity",
      },

      /* ===================================================
         START TIME
      =================================================== */

      {
        header: "Start Time",

        key: "startTime",

        accessor: "startTime",

        sortable: false,
      },

      /* ===================================================
         END TIME
      =================================================== */

      {
        header: "End Time",

        key: "endTime",

        accessor: "endTime",

        sortable: false,
      },
    ],
    [
      handleEdit,
      handleDelete,
      editingId,
      deletingId,
    ]
  );

  /* =======================================================
     RENDER
  ======================================================= */


/* =======================================================
   PAGE LOADING
======================================================= */

const pageLoading = suppliedLoading ?? loading;

/* =======================================================
   RENDER
======================================================= */

return (
  <>
    {/* PAGE LOADER */}

    {pageLoading ? (
      <PageLoader message="Loading shift creations..." />
    ) : (
      <>
        {/* TOAST */}

        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={handleToastClose}
          />
        )}

        {/* DELETE CONFIRMATION */}

        <ConfirmPopup
          isOpen={showDeleteConfirm}
          title="Confirm Delete"
          message="Are you sure you want to delete this shift?"
          itemName={selectedShift?.shiftName}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deletingId !== null}
          onConfirm={confirmDelete}
          onCancel={handleCancelDelete}
        />

        {/* LIST CONTAINER */}

        <div className="hrms-form-container organization-entity-list-page">
          {/* ERROR MESSAGE */}

          {error && (
            <div
              className="org-entity-error"
              role="alert"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={fetchShiftCreations}
                disabled={pageLoading}
              >
                Retry
              </button>
            </div>
          )}

          {/* REUSABLE DATA TABLE */}

          <DataTable
            data={shiftRows}
            columns={columns}
            title="Shift Creation - List"
            subtitle="View and manage created shifts."
            titleIcon={<FiList size={19} />}
            showTitle
            searchable
            searchPlaceholder="Search shifts..."
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
            fileName="shift-creations"
            rowKey="encryptedId"
            loading={pageLoading}
            emptyMessage="No shifts found."
            className="organization-entity-table"
          />
        </div>
      </>
    )}
  </>
);

}