import { DataTable, type DataTableColumn } from '@my-table/react';
import '@my-table/react/styles.css';

type User = { id: number; name: string; role: string; status: string };

const data: User[] = [
  { id: 1, name: 'Abebe Kebede', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Sara Mekonnen', role: 'Designer', status: 'Active' },
  { id: 3, name: 'Dawit Tesfaye', role: 'PM', status: 'Away' },
  { id: 4, name: 'Hanna Girma', role: 'Engineer', status: 'Active' },
  { id: 5, name: 'Yonas Bekele', role: 'Designer', status: 'Inactive' },
];

function StatusBadge(value: unknown) {
  const v = String(value);
  return <span className={`mt-playground-badge mt-playground-badge--${v.toLowerCase()}`}>{v}</span>;
}

const columns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Name',
    label: 'Name',
    accessor: (row) => row.name,
    cell: (row) => row.name,
  },
  {
    id: 'role',
    header: 'Role',
    label: 'Role',
    accessor: (row) => row.role,
    cell: (row) => row.role,
  },
  {
    id: 'status',
    header: 'Status',
    label: 'Status',
    accessor: (row) => row.status,
    cell: (row) => StatusBadge(row.status),
  },
];

export default function App() {
  return (
    <div className="playground-page">
      <h1 className="playground-title">my-table playground</h1>
      <p className="playground-subtitle">
        Sort by clicking headers. Drag column edges to resize. Open column settings on the right.
      </p>
      <DataTable
        data={data}
        columns={columns}
        getRowKey={(row) => row.id}
        tableKey="playground-users"
      />
    </div>
  );
}
