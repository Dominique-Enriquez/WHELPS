import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  FileWarning,
  Heart,
  Loader2,
  PawPrint,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import SiteImage from "./SiteImage";
import { useAuth } from "../context/AuthContext";

async function json(url: string, options?: RequestInit) {
  const r = await fetch(url, options),
    data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data;
}
export function FavoritesPanel() {
  const [pets, setPets] = useState<any[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = () => {
    setBusy(true);
    json("/api/favorites")
      .then((d) => setPets(d.pets || []))
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, []);
  const remove = async (id) => {
    await json("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId: id }),
    });
    setPets((x) => x.filter((p) => p.id !== id));
  };
  return (
    <Feature
      title="Saved pets"
      copy="Keep your shortlist together while you decide which companion is right for you."
      icon={Heart}
    >
      {busy ? (
        <Loading />
      ) : error ? (
        <ErrorBox text={error} />
      ) : pets.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pets.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-brown/10 bg-white p-4"
            >
              <SiteImage
                src={p.image}
                alt={p.name}
                className="h-44 w-full rounded-xl"
              />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-black">{p.name}</h3>
                  <p className="text-sm text-warm">
                    {p.breed} · {p.age}
                  </p>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="icon-btn"
                  aria-label={`Remove ${p.name} from saved pets`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty text="You have not saved any pets yet. Use the heart action in the pet browser to build your shortlist." />
      )}
    </Feature>
  );
}

export function NotificationsPanel() {
  const [items, setItems] = useState<any[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = () =>
    json("/api/notifications")
      .then((d) => setItems(d.notifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  useEffect(() => { void load(); }, []);
  const act = async (item, action) => {
    await json("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [item.id], action }),
    });
    action === "delete"
      ? setItems((x) => x.filter((n) => n.id !== item.id))
      : setItems((x) =>
          x.map((n) => (n.id === item.id ? { ...n, isRead: 1 } : n)),
        );
  };
  return (
    <Feature
      title="Notifications"
      copy="Application, message, monitoring, and rehoming updates from WHELPS."
      icon={Bell}
    >
      {busy ? (
        <Loading />
      ) : error ? (
        <ErrorBox text={error} />
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-4 ${n.isRead ? "border-brown/10 bg-white" : "border-orange/30 bg-orange/5"}`}
            >
              <div className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange" />
                <div className="min-w-0 flex-1">
                  <p>{n.message}</p>
                  <p className="mt-1 text-xs text-warm">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex gap-3">
                    {!n.isRead && (
                      <button
                        className="text-sm font-bold text-orange"
                        onClick={() => act(n, "mark_read")}
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      className="text-sm font-bold text-red-700"
                      onClick={() => act(n, "delete")}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty text="You are all caught up." />
      )}
    </Feature>
  );
}

const emptyRehome = {
  petName: "",
  species: "Dog",
  breed: "",
  ageMonths: "",
  sex: "Male",
  size: "Medium",
  location: "",
  vaccinationStatus: "Unknown",
  fixedStatus: "Unknown",
  healthNotes: "",
  personality: "",
  compatibility: "",
  reason: "",
  carerName: "",
  carerEmail: "",
  carerPhone: "",
  relationship: "Owner",
  imageData: "",
};
export function RehomePanel() {
  const { user } = useAuth(),
    [form, setForm] = useState<any>({
      ...emptyRehome,
      carerName: user?.name || "",
      carerEmail: user?.email || "",
      carerPhone: user?.phone || "",
    }),
    [items, setItems] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const load = () =>
    json("/api/rehoming")
      .then((d) => setItems(d.submissions || []))
      .catch(() => {});
  useEffect(() => { void load(); }, []);
  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const photo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Choose a photo under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, imageData: String(reader.result) }));
    reader.readAsDataURL(file);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await json("/api/rehoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage(
        "Your rehoming submission was sent for human review. It will not be published automatically.",
      );
      setForm({
        ...emptyRehome,
        carerName: user?.name || "",
        carerEmail: user?.email || "",
        carerPhone: user?.phone || "",
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Feature
      title="Rehome a pet"
      copy="Submit a pet for responsible, human-reviewed rehoming. WHELPS must approve every listing before publication."
      icon={PawPrint}
    >
      {message && <Success text={message} />}{" "}
      {error && <ErrorBox text={error} />}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-3xl bg-white p-5 md:grid-cols-2"
      >
        <Input
          name="petName"
          label="Pet name"
          value={form.petName}
          onChange={update}
        />
        <Select
          name="species"
          label="Species"
          value={form.species}
          onChange={update}
          values={["Dog", "Cat", "Other"]}
        />
        <Input
          name="breed"
          label="Breed"
          value={form.breed}
          onChange={update}
        />
        <Input
          name="ageMonths"
          type="number"
          min="0"
          max="600"
          label="Age in months"
          value={form.ageMonths}
          onChange={update}
        />
        <Select
          name="sex"
          label="Sex"
          value={form.sex}
          onChange={update}
          values={["Male", "Female", "Unknown"]}
        />
        <Select
          name="size"
          label="Size"
          value={form.size}
          onChange={update}
          values={["Small", "Medium", "Large"]}
        />
        <Input
          name="location"
          label="Location"
          value={form.location}
          onChange={update}
        />
        <Select
          name="vaccinationStatus"
          label="Vaccination status"
          value={form.vaccinationStatus}
          onChange={update}
          values={[
            "Up to date",
            "Partially vaccinated",
            "Not vaccinated",
            "Unknown",
          ]}
        />
        <Select
          name="fixedStatus"
          label="Spayed or neutered"
          value={form.fixedStatus}
          onChange={update}
          values={["Yes", "No", "Unknown"]}
        />
        <Input
          name="relationship"
          label="Relationship to pet"
          value={form.relationship}
          onChange={update}
        />
        <Text
          name="healthNotes"
          label="Health and care needs (optional)"
          value={form.healthNotes}
          onChange={update}
        />
        <Text
          name="personality"
          label="Personality and behavior"
          value={form.personality}
          onChange={update}
        />
        <Text
          name="compatibility"
          label="Compatibility with pets and children"
          value={form.compatibility}
          onChange={update}
        />
        <Text
          name="reason"
          label="Reason for rehoming"
          value={form.reason}
          onChange={update}
        />
        <Input
          name="carerName"
          label="Current carer name"
          value={form.carerName}
          onChange={update}
        />
        <Input
          name="carerEmail"
          type="email"
          label="Current carer email"
          value={form.carerEmail}
          onChange={update}
        />
        <Input
          name="carerPhone"
          label="Philippine mobile number"
          value={form.carerPhone}
          onChange={update}
        />
        <label className="font-bold text-warm">
          Pet photo
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={photo}
          />
        </label>
        <label className="md:col-span-2 flex gap-3 rounded-2xl bg-cream p-4 text-sm">
          <input required type="checkbox" className="mt-1 w-auto" />
          <span>
            I confirm I am authorized to rehome this pet and that the
            information is accurate.
          </span>
        </label>
        <button
          disabled={busy || !form.imageData}
          className="btn-primary md:col-span-2 md:w-fit"
        >
          {busy ? "Submitting…" : "Submit for review"}
        </button>
      </form>
      {items.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display text-2xl font-black">Your submissions</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {items.map((x) => (
              <article key={x.id} className="rounded-2xl bg-white p-4">
                <div className="flex gap-3">
                  <SiteImage
                    src={x.imageData}
                    alt=""
                    className="h-20 w-20 rounded-xl"
                  />
                  <div>
                    <b>{x.petName}</b>
                    <p className="text-sm text-warm">{x.status}</p>
                    <p className="text-sm">{x.reviewNote}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Feature>
  );
}

export function TrustPanel() {
  const { user, logout } = useAuth(),
    [organization, setOrganization] = useState(user?.organizationName || ""),
    [status, setStatus] = useState(user?.verificationStatus || "not_requested"),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const verify = async (e) => {
    e.preventDefault();
    try {
      const d = await json("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName: organization }),
      });
      setStatus(d.status);
      setMessage("Verification request submitted for human review.");
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async () => {
    if (
      !confirm("Permanently delete your WHELPS account and personal profile?")
    )
      return;
    try {
      await json("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      await logout();
      location.href = "/";
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Feature
      title="Trust, safety, and account"
      copy="Request organization verification, report animal-welfare concerns, or manage your account."
      icon={ShieldCheck}
    >
      {message && <Success text={message} />}{" "}
      {error && <ErrorBox text={error} />}
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={verify} className="rounded-3xl bg-white p-5">
          <Building2 className="text-orange" />
          <h3 className="mt-3 font-display text-2xl font-black">
            Organization verification
          </h3>
          <p className="mt-1 text-sm text-warm">
            Current status: {status.replaceAll("_", " ")}
          </p>
          <Input
            name="organization"
            label="Rescue, shelter, or organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <button
            disabled={status === "pending" || status === "verified"}
            className="btn-primary mt-4"
          >
            {status === "verified"
              ? "Verified"
              : status === "pending"
                ? "Review pending"
                : "Request review"}
          </button>
        </form>
        <WelfareReport />
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 lg:col-span-2">
          <h3 className="font-display text-2xl font-black text-red-900">
            Delete account
          </h3>
          <p className="mt-1 text-sm text-red-800">
            This signs out every session and anonymizes your personal profile.
            Adoption records required for animal-welfare accountability are
            retained.
          </p>
          <label className="mt-4 block max-w-md font-bold text-red-900">
            Current password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            onClick={remove}
            disabled={!password}
            className="mt-4 rounded-full bg-red-800 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            Permanently delete my account
          </button>
        </section>
      </div>
    </Feature>
  );
}

function WelfareReport() {
  const [form, setForm] = useState({
      category: "Animal welfare concern",
      location: "",
      details: "",
    }),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      const d = await json("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage(d.message);
      setForm({ ...form, location: "", details: "" });
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-5">
      <FileWarning className="text-orange" />
      <h3 className="mt-3 font-display text-2xl font-black">
        Animal-welfare report
      </h3>
      <p className="mt-1 text-sm text-warm">
        For immediate danger, contact local emergency or animal-welfare
        authorities.
      </p>
      {message && <Success text={message} />}{" "}
      {error && <ErrorBox text={error} />}
      <Select
        name="category"
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        values={[
          "Animal welfare concern",
          "Unsafe listing",
          "Suspected fraud",
          "Other",
        ]}
      />
      <Input
        name="location"
        label="Location or nearby landmark"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <Text
        name="details"
        label="What did you observe?"
        value={form.details}
        onChange={(e) => setForm({ ...form, details: e.target.value })}
      />
      <button className="btn-primary mt-4">Submit report</button>
    </form>
  );
}
function Feature({ title, copy, icon: Icon, children }: any) {
  return (
    <section className="mt-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange/10 text-orange">
          <Icon />
        </span>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="text-warm">{copy}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Input({ label, ...props }: any) {
  return (
    <label className="mt-3 block font-bold text-warm">
      {label}
      <input required {...props} />
    </label>
  );
}
function Text({ label, ...props }: any) {
  return (
    <label className="mt-3 block font-bold text-warm">
      {label}
      <textarea required rows={3} {...props} />
    </label>
  );
}
function Select({ label, values, ...props }: any) {
  return (
    <label className="mt-3 block font-bold text-warm">
      {label}
      <select required {...props}>
        {values.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
function Loading() {
  return (
    <p className="flex items-center gap-2 rounded-2xl bg-white p-6 text-warm">
      <Loader2 className="animate-spin" />
      Loading…
    </p>
  );
}
function Empty({ text }: any) {
  return (
    <p className="rounded-2xl bg-white p-8 text-center text-warm">{text}</p>
  );
}
function ErrorBox({ text }: any) {
  return (
    <p
      className="my-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
      role="alert"
    >
      {text}
    </p>
  );
}
function Success({ text }: any) {
  return (
    <p className="my-3 flex gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">
      <CheckCircle2 size={18} />
      {text}
    </p>
  );
}
