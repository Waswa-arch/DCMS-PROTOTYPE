import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Users, Building2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [officersRes, deptsRes] = await Promise.all([
        api.get('/admin/officers'),
        api.get('/admin/departments'),
      ]);
      setOfficers(officersRes.data.officers || []);
      setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      setError('Failed to load admin data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectDepartment = (officerId, newDeptId) => {
    if (!newDeptId) return;
    setPendingChanges((prev) => ({ ...prev, [officerId]: newDeptId }));
    setFeedback((prev) => ({ ...prev, [officerId]: null }));
  };

  const handleCancelPending = (officerId) => {
    setPendingChanges((prev) => {
      const copy = { ...prev };
      delete copy[officerId];
      return copy;
    });
  };

  const handleConfirmReassign = async (officerId) => {
    const newDeptId = pendingChanges[officerId];
    if (!newDeptId) return;

    setSaving(officerId);

    try {
      const res = await api.patch(`/admin/officers/${officerId}/department`, {
        department_id: parseInt(newDeptId, 10),
      });
      setFeedback((prev) => ({
        ...prev,
        [officerId]: { type: 'success', message: res.data.message },
      }));
      setOfficers((prev) =>
        prev.map((o) =>
          o.id === officerId
            ? {
                ...o,
                department_assigned_id: parseInt(newDeptId, 10),
                department_name: departments.find((d) => d.id === parseInt(newDeptId, 10))?.name || '',
              }
            : o
        )
      );
      setPendingChanges((prev) => {
        const copy = { ...prev };
        delete copy[officerId];
        return copy;
      });
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [officerId]: {
          type: 'error',
          message: err.response?.data?.message || 'Reassignment failed.',
        },
      }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              System Administration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage officer department assignments across all university nodes.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Officers
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              {officers.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Departments
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-500" />
              {departments.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Officer Department Assignments
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading officer roster...
            </div>
          ) : officers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No officers registered yet. Officers must register with a @kabarak.edu.ke email.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {officers.map((officer) => (
                <div
                  key={officer.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800">{officer.name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {officer.id_number}
                      </span>
                      <span>{officer.email}</span>
                    </div>
                    {feedback[officer.id] && (
                      <div
                        className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${
                          feedback[officer.id].type === 'success'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {feedback[officer.id].type === 'success' ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        {feedback[officer.id].message}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={pendingChanges[officer.id] ?? officer.department_assigned_id ?? ''}
                      onChange={(e) => handleSelectDepartment(officer.id, e.target.value)}
                      disabled={saving === officer.id}
                      className="bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 min-w-[200px]"
                    >
                      <option value="" disabled>
                        Select department...
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {pendingChanges[officer.id] && saving !== officer.id && (
                      <>
                        <button
                          onClick={() => handleConfirmReassign(officer.id)}
                          className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancelPending(officer.id)}
                          className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {saving === officer.id && (
                      <span className="text-xs text-slate-400 animate-pulse">Saving...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Department Registry
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {dept.name}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Seq {dept.sequence_order}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
