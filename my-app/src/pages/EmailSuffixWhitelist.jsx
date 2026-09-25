import { useCallback, useEffect, useState } from "react";
import { MailCheck, Plus, Trash2 } from "lucide-react";
import Table from "@/components/ui/Table/Table";
import { emailSuffixWhitelistService } from "@/features/email-suffix-whitelist/services/emailSuffixWhitelistService";

const SUFFIX_PATTERN = /^@[^\s@]+\.[^\s@]+$/;

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const getDeleteError = (error) => {
  if (!error.response) return "Unable to connect to the server. Please try again.";
  return error.response.data?.message || "Unable to delete the email suffix. Please try again.";
};

const buildColumns = ({ deletingRuleId, onDelete }) => [
  {
    key: "suffix",
    header: "Email suffix",
    sortable: true,
    render: (rule) => (
      <span className="font-medium text-slate-800">{rule.suffix || "—"}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (rule) => formatDateTime(rule.createdAt),
  },
  {
    key: "updatedAt",
    header: "Last updated",
    sortable: true,
    render: (rule) => formatDateTime(rule.updatedAt),
  },
  {
    key: "actions",
    header: "Actions",
    render: (rule) => (
      <button
        type="button"
        onClick={() => onDelete(rule)}
        disabled={deletingRuleId === rule.id}
        aria-label={`Delete ${rule.suffix || "email suffix"}`}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} aria-hidden="true" />
        {deletingRuleId === rule.id ? "Deleting..." : "Delete"}
      </button>
    ),
  },
];

const getRequestError = (error) => {
  if (!error.response) return "Unable to connect to the server. Please try again.";
  if (error.response.status === 409) return "This email suffix is already approved.";
  return error.response.data?.message || "Unable to add the email suffix. Please try again.";
};

export default function EmailSuffixWhitelist() {
  const [rules, setRules] = useState([]);
  const [suffix, setSuffix] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await emailSuffixWhitelistService.getRules();
      setRules(response ?? []);
    } catch {
      setLoadError("Unable to load approved email suffixes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    emailSuffixWhitelistService
      .getRules()
      .then((response) => {
        if (!ignore) setRules(response ?? []);
      })
      .catch(() => {
        if (!ignore) setLoadError("Unable to load approved email suffixes.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedSuffix = suffix.trim().toLowerCase();
    setFormError("");
    setSuccessMessage("");

    if (!normalizedSuffix) {
      setFormError("Please enter an email suffix.");
      return;
    }

    if (!SUFFIX_PATTERN.test(normalizedSuffix)) {
      setFormError("Enter a suffix such as @example.edu.");
      return;
    }

    if (rules.some((rule) => rule.suffix?.toLowerCase() === normalizedSuffix)) {
      setFormError("This email suffix is already approved.");
      return;
    }

    setSubmitting(true);
    try {
      await emailSuffixWhitelistService.createRule(normalizedSuffix);
      setSuffix("");
      setSuccessMessage(`${normalizedSuffix} has been approved.`);
      await loadRules();
    } catch (error) {
      setFormError(getRequestError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rule) => {
    const suffixLabel = rule.suffix || "this email suffix";
    if (!window.confirm(`Remove ${suffixLabel} from the approved suffixes?`)) return;

    setFormError("");
    setSuccessMessage("");
    setDeletingRuleId(rule.id);

    try {
      await emailSuffixWhitelistService.deleteRule(rule.id);
      setSuccessMessage(`${suffixLabel} has been removed.`);
      await loadRules();
    } catch (error) {
      setFormError(getDeleteError(error));
    } finally {
      setDeletingRuleId(null);
    }
  };

  const columns = buildColumns({ deletingRuleId, onDelete: handleDelete });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <MailCheck size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Email Suffix Whitelist
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Allow students to register with approved email domains only.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Add approved suffix</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="email-suffix" className="mb-1 block text-sm font-medium text-slate-700">
              Email suffix
            </label>
            <input
              id="email-suffix"
              type="text"
              value={suffix}
              onChange={(event) => setSuffix(event.target.value)}
              placeholder="@example.edu"
              maxLength={253}
              disabled={submitting}
              aria-describedby="email-suffix-help"
              aria-invalid={Boolean(formError)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 disabled:bg-gray-100"
            />
            <p id="email-suffix-help" className="mt-1 text-xs text-slate-500">
              Include the @ symbol, for example @example.edu.
            </p>
            {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
            {successMessage && <p className="mt-1 text-sm text-green-700">{successMessage}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6"
          >
            <Plus size={16} aria-hidden="true" />
            {submitting ? "Adding..." : "Add suffix"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Approved suffixes</h2>
        {loadError && <p className="mb-3 text-sm text-red-600">{loadError}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">Loading approved suffixes...</p>
        ) : (
          <Table
            columns={columns}
            data={rules}
            rowKey={(rule) => rule.id}
            emptyMessage="No email suffixes have been approved yet."
          />
        )}
      </section>
    </div>
  );
}
