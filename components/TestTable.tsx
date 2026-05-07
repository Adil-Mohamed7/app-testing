"use client";

interface Test {
  id: string;
  name: string;
  suite: string;
  status: string;
  duration: string;
  env: string;
  run: string;
}

const STATUS_LABELS: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  skip: "Skip",
  running: "Running",
};

const STATUS_ICONS: Record<string, string> = {
  pass: "✓",
  fail: "✕",
  skip: "—",
  running: "◌",
};

export default function TestTable({ tests }: { tests: Test[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="status-table">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Environment</th>
            <th>Run</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t.id} id={`test-row-${t.id}`}>
              <td>
                <div className="test-name">{t.name}</div>
                <div className="test-suite">{t.suite}</div>
              </td>
              <td>
                <span className={`badge ${t.status}`}>
                  <span className="badge-dot" />
                  {STATUS_LABELS[t.status]}
                </span>
              </td>
              <td className="mono">{t.duration}</td>
              <td>
                <span className="chip">{t.env}</span>
              </td>
              <td className="mono">{t.run}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
