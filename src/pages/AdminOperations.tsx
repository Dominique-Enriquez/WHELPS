import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import SiteImage from "../components/SiteImage";

const tabs = ["rehoming", "verifications", "users", "reports", "audits"];
const labels = {
  rehoming: "Rehoming",
  verifications: "Verification",
  users: "Users",
  reports: "Reports",
  audits: "Audit log",
};
async function request(options?: RequestInit) {
  const r = await fetch("/api/admin/operations", options),
    d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
}
export default function AdminOperations() {
  const [tab, setTab] = useState("rehoming"),
    [data, setData] = useState<any>({
      users: [],
      rehoming: [],
      verifications: [],
      reports: [],
      audits: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    request()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const act = async (action, id, status) => {
    const reason = prompt("Enter the review reason or notes:");
    if (!reason) return;
    try {
      await request({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, status, reason }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <AdminShell
      title="Operations & Safety"
      subtitle="Review rehoming intake, organization verification, member access, welfare reports, and the administrator audit trail."
    >
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={
              tab === x ? "btn-primary shrink-0" : "btn-secondary shrink-0"
            }
          >
            {labels[x]}
          </button>
        ))}
      </div>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>
      )}
      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-warm">
          Loading operational records…
        </p>
      ) : (
        <div className="grid gap-4">
          {tab === "rehoming" &&
            data.rehoming.map((x) => (
              <Card
                key={x.id}
                title={`${x.petName} · ${x.breed}`}
                status={x.status}
                image={x.imageData}
              >
                <p>{x.reason}</p>
                <p className="mt-2 text-sm text-warm">
                  Carer: {x.carerName} · {x.carerEmail} · {x.carerPhone}
                </p>
                <Actions
                  values={[
                    "Under Review",
                    "Additional Information Required",
                    "Approved",
                    "Rejected",
                  ]}
                  onSelect={(v) => act("rehoming", x.id, v)}
                />
              </Card>
            ))}
          {tab === "verifications" &&
            data.verifications.map((x) => (
              <Card
                key={x.id}
                title={x.organizationName || x.name}
                status={x.verificationStatus}
              >
                <p>
                  {x.name} · {x.email}
                </p>
                <Actions
                  values={["verified", "rejected"]}
                  onSelect={(v) => act("verification", x.id, v)}
                />
              </Card>
            ))}
          {tab === "users" &&
            data.users.map((x) => (
              <Card key={x.id} title={x.name} status={x.accountStatus}>
                <p>
                  {x.email} · {[x.city, x.region].filter(Boolean).join(", ")}
                </p>
                <Actions
                  values={["active", "suspended", "banned"]}
                  onSelect={(v) => act("user_status", x.id, v)}
                />
              </Card>
            ))}
          {tab === "reports" &&
            data.reports.map((x) => (
              <Card key={x.id} title={x.category} status={x.status}>
                <p className="font-bold">{x.location}</p>
                <p className="mt-2">{x.details}</p>
                {x.resolutionNote && (
                  <p className="mt-2 text-sm text-warm">
                    Resolution: {x.resolutionNote}
                  </p>
                )}
                <Actions
                  values={["under_review", "resolved", "dismissed"]}
                  onSelect={(v) => act("report", x.id, v)}
                />
              </Card>
            ))}
          {tab === "audits" &&
            data.audits.map((x) => (
              <Card key={x.id} title={x.actionType} status={x.entityType}>
                <p>
                  {x.actorName || "System"} · {x.entityId || "—"}
                </p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-warm">
                  {JSON.stringify(x.details)}
                </pre>
                <p className="mt-2 text-xs">
                  {new Date(x.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          {!(data[tab] || []).length && (
            <p className="rounded-2xl bg-white p-10 text-center text-warm">
              No records in this section.
            </p>
          )}
        </div>
      )}
    </AdminShell>
  );
}
function Card({ title, status, image, children }: any) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        {image && (
          <SiteImage
            src={image}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="font-display text-2xl font-black">{title}</h2>
            <span className="status-pill">{status}</span>
          </div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </article>
  );
}
function Actions({ values, onSelect }: any) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className="btn-secondary min-h-11 !px-4 !py-2 text-sm"
        >
          {String(v).replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}
