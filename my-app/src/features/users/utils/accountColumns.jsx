const GENDER_LABEL = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US");
}

// Tách thành factory function thay vì const array ở module scope, để nếu sau
// này cần columns khác nhau theo role/tab thì chỉ cần truyền tham số vào đây,
// không phải sửa Accounts.jsx.
export function buildAccountColumns() {
  return [
    {
      key: "avatarUrl",
      header: "Avatar",
      render: (row) =>
        row.avatarUrl ? (
          <img
            src={row.avatarUrl}
            alt={row.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-200" />
        ),
    },
    { key: "fullName", header: "Full Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    {
      key: "dateOfBirth",
      header: "Date of Birth",
      sortable: true,
      sortFn: (a, b) => new Date(a.dateOfBirth) - new Date(b.dateOfBirth),
      render: (row) => formatDate(row.dateOfBirth),
    },
    {
      key: "gender",
      header: "Gender",
      render: (row) => GENDER_LABEL[row.gender] ?? row.gender,
    },
    { key: "phone", header: "Phone" },
    { key: "address", header: "Address" },
  ];
}
