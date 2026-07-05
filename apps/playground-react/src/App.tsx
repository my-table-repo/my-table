import { DataTable, type ReactColumnDef } from '@my-table/react';
import '@my-table/theme/default.css';

type User = { id: number; name: string; role: string; status: string };

const data: User[] = [
  { id: 1, name: 'Abebe Kebede', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Sara Mekonnen', role: 'Designer', status: 'Active' },
  { id: 3, name: 'Dawit Tesfaye', role: 'PM', status: 'Away' },
];

function StatusBadge(value: unknown) {
  const v = String(value);
  const cls =
    v === 'Active' ? 'mt-badge mt-badge--active'
    : v === 'Away' ? 'mt-badge mt-badge--away'
    : 'mt-badge mt-badge--inactive';
  return <span className={cls}>{v}</span>;
}

const columns: ReactColumnDef<User>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'role', header: 'Role', accessor: (r) => r.role },
  { id: 'status', header: 'Status', accessor: (r) => r.status, cell: StatusBadge },
];

export default function App() {
  return <DataTable data={data} columns={columns} />;
}