"use client";

import { BranchData } from "@/lib/sheetData";
import { useCountUp } from "@/lib/useCountUp";
import { useMemo, useState } from "react";

function AnimatedNum({ value }: { value: number }) {
  const n = useCountUp(value);
  return <>{n}</>;
}

function BranchMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="branch-metric-card">
      <p>{label}</p>
      <strong style={{ color }}><AnimatedNum value={value} /></strong>
    </div>
  );
}

export default function BranchStats({ branchData }: { branchData: BranchData[] }) {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const safeBranchData = useMemo(() => branchData || [], [branchData]);

  const totals = safeBranchData.reduce(
    (acc, branch) => ({
      total: acc.total + branch.total,
      new: acc.new + branch.new,
      existing: acc.existing + branch.existing,
      na: acc.na + branch.na,
    }),
    { total: 0, new: 0, existing: 0, na: 0 }
  );

  const selectedData = useMemo(() => {
    if (selectedBranch === "all") return safeBranchData;
    return safeBranchData.filter((branch) => branch.branch === selectedBranch);
  }, [safeBranchData, selectedBranch]);

  const selectedTotals = selectedData.reduce(
    (acc, branch) => ({
      total: acc.total + branch.total,
      new: acc.new + branch.new,
      existing: acc.existing + branch.existing,
      na: acc.na + branch.na,
    }),
    { total: 0, new: 0, existing: 0, na: 0 }
  );

  const highestBranch = [...safeBranchData].sort((a, b) => b.total - a.total)[0];
  const selectedLabel = selectedBranch === "all" ? "All Branches" : selectedBranch;

  if (safeBranchData.length === 0) return null;

  return (
    <div className="glass-card fade-in fade-in-3 branch-overview-card">
      <div className="card-header">
        <div>
          <p className="section-title">Branch Issue Overview</p>
          <p className="section-subtitle">Filter branch testing issues by location and status</p>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 12 }}>
        <div className="branch-filter-row">
          <button
            type="button"
            className={`branch-filter-card ${selectedBranch === "all" ? "active" : ""}`}
            onClick={() => setSelectedBranch("all")}
          >
            <span>All Branches</span>
            <strong><AnimatedNum value={totals.total} /></strong>
            <em>{safeBranchData.length} locations</em>
          </button>
          {safeBranchData.map((branch) => (
            <button
              type="button"
              key={branch.branch}
              className={`branch-filter-card ${selectedBranch === branch.branch ? "active" : ""}`}
              onClick={() => setSelectedBranch(branch.branch)}
            >
              <span>{branch.branch}</span>
              <strong><AnimatedNum value={branch.total} /></strong>
              <em>{branch.new} new · {branch.existing} existing</em>
            </button>
          ))}
        </div>

        <div className="branch-overview-grid">
          <div className="branch-focus-panel">
            <div>
              <p className="branch-focus-label">Selected View</p>
              <h3>{selectedLabel}</h3>
              <span>{highestBranch ? `${highestBranch.branch} has the highest issue volume (${highestBranch.total})` : "No branch issues recorded"}</span>
            </div>
            <div className="branch-focus-total">
              <strong><AnimatedNum value={selectedTotals.total} /></strong>
              <span>total issues</span>
            </div>
          </div>

          <div className="branch-metric-grid">
            <BranchMetric label="Total Issues" value={selectedTotals.total} color="#3b82f6" />
            <BranchMetric label="New Issues" value={selectedTotals.new} color="#22c55e" />
            <BranchMetric label="Existing Issues" value={selectedTotals.existing} color="#8b5cf6" />
            <BranchMetric label="Not Applicable" value={selectedTotals.na} color="#64748b" />
          </div>
        </div>

        <div className="branch-stats-scroll-wrapper">
          <div className="branch-stats-scroll-inner">
            <table className="status-table branch-issue-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Total Issues</th>
                  <th>New Issues</th>
                  <th>Existing Issues</th>
                  <th>Not Applicable</th>
                </tr>
              </thead>
              <tbody>
                {selectedData.map((branch) => (
                  <tr key={branch.branch}>
                    <td>
                      <div className="test-name">{branch.branch}</div>
                    </td>
                    <td className="branch-total-cell"><AnimatedNum value={branch.total} /></td>
                    <td style={{ color: "#22c55e", fontWeight: 800 }}><AnimatedNum value={branch.new} /></td>
                    <td style={{ color: "#8b5cf6", fontWeight: 800 }}><AnimatedNum value={branch.existing} /></td>
                    <td style={{ color: "#64748b", fontWeight: 800 }}><AnimatedNum value={branch.na} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
