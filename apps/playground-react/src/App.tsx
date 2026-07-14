import { useState, useEffect } from 'react';
import { DataTable, type DataTableColumn, StatusBadge } from '@my-table/react';
import '@my-table/react/styles.css';

type User = { id: number; name: string; role: string; status: string };

const data: User[] = [
  { id: 1, name: 'Abebe Kebede', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Sara Mekonnen', role: 'Designer', status: 'Active' },
  { id: 3, name: 'Dawit Tesfaye', role: 'PM', status: 'Away' },
  { id: 4, name: 'Hanna Girma', role: 'Engineer', status: 'Active' },
  { id: 5, name: 'Yonas Bekele', role: 'Designer', status: 'Inactive' },
];

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
    cell: (row) => <StatusBadge value={row.status} />,
  },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="playground-page">
      <div className="playground-header">
        <div>
          <h1 className="playground-title">my-table playground</h1>
          <p className="playground-subtitle">
            Sort by clicking headers. Drag column edges to resize. Open column settings on the right.
          </p>
        </div>
        <button
          id="theme-toggle"
          className="theme-toggle"
          onClick={() => setIsDark((d) => !d)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
      <DataTable
        data={data}
        columns={columns}
        getRowKey={(row) => row.id}
        tableKey="playground-users"
      />
    </div>
  );
}

