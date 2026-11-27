
import React, { useState } from "react";

import FormOffcanvas from "../../../../../common/components/offcanvas/FormOffcanvas";
import FormInput from "../../../../../common/components/Form/FormInput";
import FormSelect from "../../../../../common/components/Form/FormSelect";
import DynamicCalendar from "../../../../../common/components/calendar/DynamicCalendar";

import { createEmployeeApi } from "../../../services/EmployeeApi";
import { mapEmployeeToApi } from "../../../mappers/EmployeeMapper";

import "./AddEmployee.css";

// =========================================================
// INITIAL FORM DATA
// =========================================================

const INITIAL_FORM = {
    fullName: "",
    email: "",
    mobileNumber: "",
    gender: "",
    birthdayDate: "",
    joiningDate: "",

    designation: "",
    company: "",
    entity: "",
    department: "",

    subentity: "",
    level: "",
    cell: "",
    grade: "",
};

// =========================================================
// DROPDOWN OPTIONS
// =========================================================

const GENDER_OPTIONS = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
];

const DESIGNATION_OPTIONS = [
    { label: "Software Developer", value: "Software Developer" },
    { label: "Senior Software Developer", value: "Senior Software Developer" },
    { label: "HR Executive", value: "HR Executive" },
    { label: "UI/UX Designer", value: "UI/UX Designer" },
    { label: "Project Manager", value: "Project Manager" },
];

// Temporary options until Company master API is integrated.
const WORK_LOCATION_OPTIONS = [
    { label: "Pune", value: "Pune" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "Surat", value: "Surat" },
    { label: "Bengaluru", value: "Bengaluru" },
    { label: "Delhi", value: "Delhi" },
];

// Temporary options until Entity master API is integrated.
const BUSINESS_UNIT_OPTIONS = [
    { label: "Technology", value: "Technology" },
    { label: "Corporate", value: "Corporate" },
    { label: "Operations", value: "Operations" },
];

const DEPARTMENT_OPTIONS = [
    { label: "IT", value: "IT" },
    { label: "HR", value: "HR" },
    { label: "Finance", value: "Finance" },
    { label: "Sales", value: "Sales" },
    { label: "Marketing", value: "Marketing" },
    { label: "Design", value: "Design" },
];

// Temporary options until Cell master API is integrated.
const CELL_OPTIONS = [
    { label: "Cell A", value: "Cell A" },
    { label: "Cell B", value: "Cell B" },
    { label: "Cell C", value: "Cell C" },
];

// Temporary options until Grade master API is integrated.
const GRADE_OPTIONS = [
    { label: "Grade A", value: "Grade A" },
    { label: "Grade B", value: "Grade B" },
    { label: "Grade C", value: "Grade C" },
];

// =========================================================
// ADD EMPLOYEE
// =========================================================

function AddEmployee({ show, onClose, onSubmit }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        setSubmitError("");
    };

    // =====================================================
    // VALIDATION
    // =====================================================

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email ID is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = "Mobile number is required";
        }

        if (!formData.gender) {
            newErrors.gender = "Please select gender";
        }

        if (!formData.designation) {
            newErrors.designation = "Please select designation";
        }

        if (!formData.company) {
            newErrors.company = "Please select organization";
        }

        if (!formData.entity) {
            newErrors.entity = "Please select entity";
        }

        if (!formData.department) {
            newErrors.department = "Please select department";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {
        setFormData({ ...INITIAL_FORM });
        setErrors({});
        setSubmitError("");
    };

    // =====================================================
    // CLOSE FORM
    // =====================================================

    const handleClose = () => {
        if (isSubmitting) return;

        resetForm();
        onClose?.();
    };

    // =====================================================
    // SUBMIT FORM
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setSubmitError("");

            const employeePayload = mapEmployeeToApi(formData);

            const response = await createEmployeeApi(employeePayload);

            const candidateData = {
                ...formData,
                fullName: formData.fullName.trim(),
                mobile: formData.mobileNumber,
            };

            onSubmit?.(candidateData, response);

            resetForm();
            onClose?.();
        } catch (error) {
            console.error("Add Employee Error:", error);

            setSubmitError(
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error?.message ||
                "Unable to add employee. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // =====================================================
    // FOOTER
    // =====================================================

    const footer = (
        <div className="candidate-form-footer">
            <button
                type="button"
                className="hrms-form-button hrms-form-button-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
            >
                Cancel
            </button>

            <button
                type="submit"
                form="add-candidate-form"
                className="hrms-form-button hrms-form-button-primary"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Saving..." : "Add Employee"}
            </button>
        </div>
    );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <FormOffcanvas
            show={show}
            onClose={handleClose}
            title="Add Employee"
            width={480}
            footer={footer}
        >
            <form
                id="add-candidate-form"
                className="add-candidate-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {submitError && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                        {submitError}
                    </div>
                )}

                {/* EMPLOYEE DETAILS */}

                <section className="candidate-form-section">
                    <h6 className="candidate-form-section-title">
                        Employee details
                    </h6>

                    <div className="candidate-form-grid">

                        {/* FULL NAME */}

                        <div className="hrms-form-group full-width">
                            <FormInput
                                label="Full name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder=""
                                required
                                error={errors.fullName}
                            />
                        </div>

                        {/* EMAIL */}

                        <div className="hrms-form-group">
                            <FormInput
                                label="Organization Email ID"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder=""
                                required
                                error={errors.email}
                            />
                        </div>

                        {/* MOBILE NUMBER */}

                        <div className="hrms-form-group">
                            <label className="hrms-form-label">
                                Mobile number
                            </label>

                            <div className="candidate-phone-group">
                                <input
                                    type="tel"
                                    name="mobileNumber"
                                    className="hrms-form-control candidate-mobile-input"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder=""
                                />
                            </div>

                            {errors.mobileNumber && (
                                <small className="text-danger">
                                    {errors.mobileNumber}
                                </small>
                            )}
                        </div>

                        {/* GENDER */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                options={GENDER_OPTIONS}
                                required
                                error={errors.gender}
                            />
                        </div>

                        {/* DATE OF BIRTH */}

                        <div className="hrms-form-group">
                            <DynamicCalendar
                                label="Date of Birth"
                                name="birthdayDate"
                                value={formData.birthdayDate}
                                onChange={handleChange}
                                mode="dd-mm-yyyy"
                                placeholder="dd/mm/yyyy"
                                error={errors.birthdayDate}
                            />
                        </div>

                        <div className="hrms-form-group">
                            <DynamicCalendar
                                label="Date of Joining"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                mode="dd-mm-yyyy"
                                placeholder="dd/mm/yyyy"
                                error={errors.joiningDate}
                            />
                        </div>

                    </div>
                </section>

                {/* JOB DETAILS */}

                <section className="candidate-form-section candidate-job-section">
                    <h6 className="candidate-form-section-title">
                        Job details
                    </h6>

                    <div className="candidate-form-grid">

                        {/* DESIGNATION */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                options={DESIGNATION_OPTIONS}
                                required
                                error={errors.designation}
                            />
                        </div>

                        {/* ORGANIZATION / COMPANY */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Organization"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                options={WORK_LOCATION_OPTIONS}
                                required
                                error={errors.company}
                            />
                        </div>

                        {/* ENTITY */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Entity"
                                name="entity"
                                value={formData.entity}
                                onChange={handleChange}
                                options={BUSINESS_UNIT_OPTIONS}
                                required
                                error={errors.entity}
                            />
                        </div>

                        {/* DEPARTMENT */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                options={DEPARTMENT_OPTIONS}
                                required
                                error={errors.department}
                            />
                        </div>

                        {/* CELL */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Cell"
                                name="cell"
                                value={formData.cell}
                                onChange={handleChange}
                                options={CELL_OPTIONS}
                            />
                        </div>

                        {/* GRADE */}

                        <div className="hrms-form-group">
                            <FormSelect
                                label="Grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                options={GRADE_OPTIONS}
                            />
                        </div>

                    </div>
                </section>
            </form>
        </FormOffcanvas>
    );
}

export default AddEmployee;
