import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

// ─── API helpers ──────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
}

async function fetchContentFromAPI() {
  const res = await fetch(`${API_BASE}/super-admin/landing-content/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load content");
  const data = await res.json();
  return data.content;
}

async function saveContentToAPI(content) {
  const res = await fetch(`${API_BASE}/super-admin/landing-content/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to save content");
  return res.json();
}

// ─── Default content (fallback if API is unreachable) ────────────────────────
const DEFAULT_CONTENT = {
  hero: {
    headline: "PRECISION",
    headlineAccent: "DETAILING",
    subtitle: "Experience the Art of Automotive Perfection",
    ctaLoggedIn: "GO TO DASHBOARD",
    ctaGuest: "BOOK YOUR EXPERIENCE",
    signInPrompt: "Part of the elite?",
    signInLabel: "SIGN IN HERE",
  },
  services: {
    sectionTitle: "OUR",
    sectionTitleAccent: "SERVICES",
    sectionSubtitle:
      "Precision-driven solutions for every automotive need. We bring out the best in every vehicle.",
    items: [
      {
        title: "EXTERIOR",
        sub: "Showroom Shine",
        desc: "Multi-stage washing process, clay bar treatment, and machine polishing for a mirror-like finish.",
      },
      {
        title: "INTERIOR",
        sub: "Pure Luxury",
        desc: "Steam cleaning, leather conditioning, and deep extraction for a sterile, fresh-from-factory interior.",
      },
      {
        title: "PROTECTION",
        sub: "Ultima Guard",
        desc: "Grade-A Ceramic coatings and PPF applications providing 9H hardness and hydrophobic properties.",
      },
    ],
  },
  branches: [
    {
      name: "North Caloocan",
      id: "north",
      address: "Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila",
      hours: "8:00 AM - 7:00 PM",
      phone: "+63 9XX XXX XXXX",
      fb: "https://www.facebook.com/profile.php?id=100090897126761",
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1930.5615!2d121.023!3d14.752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1b477bf30a7%3A0x34a49388d0848c77!2sOtokwikk%20North%20Caloocan!5e0!3m2!1sen!2sph!4v1708740000000!5m2!1sen!2sph",
    },
    {
      name: "South Caloocan",
      id: "south",
      address: "77 General Tinio, Morning Breeze Subdivision, Caloocan",
      hours: "8:00 AM - 7:00 PM",
      phone: "+63 9XX XXX XXXX",
      fb: "https://www.facebook.com/profile.php?id=61572528405228",
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.1066!2d120.9878!3d14.6624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b73d971961bd%3A0x44a251e7c7d1e2bc!2sOtokwikk%20South%20Caloocan!5e0!3m2!1sen!2sph!4v1742220000000!5m2!1sen!2sph",
    },
  ],
  reviews: [
    {
      name: "SIR BJ",
      city: "Tanza, Cavite",
      text: "Ang ganda ng linis, may pafoot paper and wheel plastic covering pa! Dami magpapalinis pag ganyan. Heheh Dito ko na papalinis mga kotse ng skul.",
    },
    {
      name: "SIR CLARENZ",
      city: "Quezon City",
      text: "Panalo yung engine wash nyo sir! Linis lahat! Papuntahin ko yung ninong ko dyan ipa engine wash nya yung Innova nya.",
    },
    {
      name: "SIR JOHN RONAN",
      city: "San Mateo, Rizal",
      text: "SOLID! Worth it yung bayad! Mura na, QUALITY pa.",
    },
    {
      name: "SIR GERMAINE DANCA",
      city: "North Caloocan",
      text: "For top notch and premium car care and affordable price.. Visit #Otokwikk at Saranay Road, Caloocan City.",
    },
    {
      name: "SIR MIGS ONG",
      city: "South Caloocan",
      text: "Thanks heaps for the top-notch service, Otokwikk! Highly recommended! Pogi na ulit si Sky!",
    },
  ],
  fbPages: [
    {
      name: "Otokwikk - North Caloocan",
      url: "https://www.facebook.com/profile.php?id=100090897126761",
    },
    {
      name: "Otokwikk - Tanza Cavite",
      url: "https://www.facebook.com/otokwikk.tanzacavite",
    },
    {
      name: "Otokwikk - Camarin",
      url: "https://www.facebook.com/profile.php?id=61586571534281",
    },
    {
      name: "Otokwikk - Quezon City",
      url: "https://www.facebook.com/profile.php?id=61577247173903",
    },
    {
      name: "Otokwikk - South Caloocan",
      url: "https://www.facebook.com/profile.php?id=61572528405228",
    },
    {
      name: "Otokwikk - San Mateo Rizal",
      url: "https://www.facebook.com/profile.php?id=61556323569842",
    },
  ],
  footer: {
    tagline:
      "Empowering car owners with precision care and premium detailing that protects every drive.",
    copyright: "Copyright © 2026, otokwikk. All Rights Reserved.",
    siteMapLinks: [
      { label: "Homepage", href: "#" },
      { label: "Services", href: "#" },
      { label: "Branches", href: "#" },
      { label: "Client Reviews", href: "#" },
      { label: "Facebook Pages", href: "#" },
      { label: "Sign In", href: "/signin" },
      { label: "Sign Up", href: "/signup" },
    ],
    legalLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
};

// ─── Reusable UI primitives ───────────────────────────────────────────────────
function Field({ label, value, onChange, textarea, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-gray-950 border border-white/10 text-white text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-red-500/60 transition-colors placeholder-gray-700"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-gray-950 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-red-500/60 transition-colors placeholder-gray-700"
        />
      )}
    </div>
  );
}

function Card({ title, children, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-950 overflow-hidden">
      <div
        className={`px-5 py-3 border-b border-white/10 flex items-center gap-2.5 ${accent ? "bg-red-600/10" : "bg-white/5"}`}
      >
        {accent && (
          <span className="w-1.5 h-4 rounded-full bg-red-500 inline-block" />
        )}
        <span className="text-xs font-black uppercase tracking-widest text-white">
          {title}
        </span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Section editors ──────────────────────────────────────────────────────────

function HeroEditor({ data, onChange }) {
  const set = (key) => (val) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <Card title="Headline" accent>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Main Word"
            value={data.headline}
            onChange={set("headline")}
          />
          <Field
            label="Accent Word"
            value={data.headlineAccent}
            onChange={set("headlineAccent")}
          />
        </div>
        <Field
          label="Subtitle"
          value={data.subtitle}
          onChange={set("subtitle")}
        />
      </Card>
      <Card title="CTA Buttons">
        <Field
          label="Logged-in Button"
          value={data.ctaLoggedIn}
          onChange={set("ctaLoggedIn")}
        />
        <Field
          label="Guest Button"
          value={data.ctaGuest}
          onChange={set("ctaGuest")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Sign In Prompt"
            value={data.signInPrompt}
            onChange={set("signInPrompt")}
          />
          <Field
            label="Sign In Link Label"
            value={data.signInLabel}
            onChange={set("signInLabel")}
          />
        </div>
      </Card>
    </div>
  );
}

function ServicesEditor({ data, onChange }) {
  const setItem = (i, key) => (val) => {
    const items = data.items.map((item, idx) =>
      idx === i ? { ...item, [key]: val } : item,
    );
    onChange({ ...data, items });
  };
  const addItem = () =>
    onChange({
      ...data,
      items: [
        ...data.items,
        { title: "NEW SERVICE", sub: "Subtitle", desc: "Description here." },
      ],
    });
  const removeItem = (i) =>
    onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <Card title="Section Header" accent>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Title"
            value={data.sectionTitle}
            onChange={(v) => onChange({ ...data, sectionTitle: v })}
          />
          <Field
            label="Title Accent"
            value={data.sectionTitleAccent}
            onChange={(v) => onChange({ ...data, sectionTitleAccent: v })}
          />
        </div>
        <Field
          label="Subtitle"
          value={data.sectionSubtitle}
          onChange={(v) => onChange({ ...data, sectionSubtitle: v })}
          textarea
        />
      </Card>
      {data.items.map((item, i) => (
        <Card key={i} title={`Service ${i + 1}`}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Title"
              value={item.title}
              onChange={setItem(i, "title")}
            />
            <Field
              label="Subtitle"
              value={item.sub}
              onChange={setItem(i, "sub")}
            />
          </div>
          <Field
            label="Description"
            value={item.desc}
            onChange={setItem(i, "desc")}
            textarea
          />
          <button
            onClick={() => removeItem(i)}
            className="text-xs text-red-500 hover:text-red-400 font-bold"
          >
            — Remove service
          </button>
        </Card>
      ))}
      <button
        onClick={addItem}
        className="w-full rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors"
      >
        + Add Service
      </button>
    </div>
  );
}

function BranchesEditor({ data, onChange }) {
  const setField = (i, key) => (val) => {
    const updated = data.map((b, idx) =>
      idx === i ? { ...b, [key]: val } : b,
    );
    onChange(updated);
  };
  const addBranch = () =>
    onChange([
      ...data,
      {
        name: "New Branch",
        id: `branch-${Date.now()}`,
        address: "",
        hours: "8:00 AM - 7:00 PM",
        phone: "",
        fb: "",
        mapUrl: "",
      },
    ]);
  const removeBranch = (i) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {data.map((branch, i) => (
        <Card key={i} title={branch.name || `Branch ${i + 1}`} accent={i === 0}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Branch Name"
              value={branch.name}
              onChange={setField(i, "name")}
            />
            <Field
              label="Branch ID"
              value={branch.id}
              onChange={setField(i, "id")}
            />
          </div>
          <Field
            label="Address"
            value={branch.address}
            onChange={setField(i, "address")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Operating Hours"
              value={branch.hours}
              onChange={setField(i, "hours")}
            />
            <Field
              label="Phone"
              value={branch.phone}
              onChange={setField(i, "phone")}
            />
          </div>
          <Field
            label="Facebook URL"
            value={branch.fb}
            onChange={setField(i, "fb")}
          />
          <Field
            label="Google Maps Embed URL"
            value={branch.mapUrl}
            onChange={setField(i, "mapUrl")}
            textarea
          />
          <button
            onClick={() => removeBranch(i)}
            className="text-xs text-red-500 hover:text-red-400 font-bold"
          >
            — Remove branch
          </button>
        </Card>
      ))}
      <button
        onClick={addBranch}
        className="w-full rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors"
      >
        + Add Branch
      </button>
    </div>
  );
}

function ReviewsEditor({ data, onChange }) {
  const setField = (i, key) => (val) => {
    const updated = data.map((r, idx) =>
      idx === i ? { ...r, [key]: val } : r,
    );
    onChange(updated);
  };
  const addReview = () =>
    onChange([
      ...data,
      { name: "NEW CLIENT", city: "City", text: "Review text here." },
    ]);
  const removeReview = (i) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {data.map((review, i) => (
        <Card key={i} title={review.name || `Review ${i + 1}`}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Name"
              value={review.name}
              onChange={setField(i, "name")}
            />
            <Field
              label="City"
              value={review.city}
              onChange={setField(i, "city")}
            />
          </div>
          <Field
            label="Review Text"
            value={review.text}
            onChange={setField(i, "text")}
            textarea
          />
          <button
            onClick={() => removeReview(i)}
            className="text-xs text-red-500 hover:text-red-400 font-bold"
          >
            — Remove review
          </button>
        </Card>
      ))}
      <button
        onClick={addReview}
        className="w-full rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors"
      >
        + Add Review
      </button>
    </div>
  );
}

function FbPagesEditor({ data, onChange }) {
  const setField = (i, key) => (val) => {
    const updated = data.map((p, idx) =>
      idx === i ? { ...p, [key]: val } : p,
    );
    onChange(updated);
  };
  const addPage = () =>
    onChange([
      ...data,
      { name: "Otokwikk - New Branch", url: "https://facebook.com/" },
    ]);
  const removePage = (i) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {data.map((page, i) => (
        <Card key={i} title={page.name || `Page ${i + 1}`}>
          <Field
            label="Page Name"
            value={page.name}
            onChange={setField(i, "name")}
          />
          <Field
            label="Facebook URL"
            value={page.url}
            onChange={setField(i, "url")}
          />
          <button
            onClick={() => removePage(i)}
            className="text-xs text-red-500 hover:text-red-400 font-bold"
          >
            — Remove page
          </button>
        </Card>
      ))}
      <button
        onClick={addPage}
        className="w-full rounded-xl border border-dashed border-white/20 py-3 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors"
      >
        + Add Facebook Page
      </button>
    </div>
  );
}

function FooterEditor({ data, onChange }) {
  const setSiteMapLink = (i, key) => (val) => {
    const updated = data.siteMapLinks.map((l, idx) =>
      idx === i ? { ...l, [key]: val } : l,
    );
    onChange({ ...data, siteMapLinks: updated });
  };
  const setLegalLink = (i, key) => (val) => {
    const updated = data.legalLinks.map((l, idx) =>
      idx === i ? { ...l, [key]: val } : l,
    );
    onChange({ ...data, legalLinks: updated });
  };

  return (
    <div className="space-y-4">
      <Card title="Brand Copy" accent>
        <Field
          label="Tagline"
          value={data.tagline}
          onChange={(v) => onChange({ ...data, tagline: v })}
          textarea
        />
        <Field
          label="Copyright Text"
          value={data.copyright}
          onChange={(v) => onChange({ ...data, copyright: v })}
        />
      </Card>
      <Card title="Site Map Links">
        {data.siteMapLinks.map((link, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <Field
              label={`Label ${i + 1}`}
              value={link.label}
              onChange={setSiteMapLink(i, "label")}
            />
            <Field
              label="Href"
              value={link.href}
              onChange={setSiteMapLink(i, "href")}
            />
          </div>
        ))}
      </Card>
      <Card title="Legal Links">
        {data.legalLinks.map((link, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <Field
              label={`Label ${i + 1}`}
              value={link.label}
              onChange={setLegalLink(i, "label")}
            />
            <Field
              label="Href"
              value={link.href}
              onChange={setLegalLink(i, "href")}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Pages section (the full landing editor) ──────────────────────────────────
const PAGE_TABS = [
  { key: "hero", label: "Hero" },
  { key: "services", label: "Services" },
  { key: "branches", label: "Branches" },
  { key: "reviews", label: "Reviews" },
  { key: "fbPages", label: "FB Pages" },
  { key: "footer", label: "Footer" },
];

function PagesEditor() {
  const [content, setContent] = useState(null); // null = loading
  const [activeTab, setActiveTab] = useState("hero");
  // "idle" | "loading" | "saving" | "saved" | "error"
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  // Load from API on mount
  useEffect(() => {
    fetchContentFromAPI()
      .then((c) => {
        setContent(c);
        setStatus("idle");
      })
      .catch(() => {
        setContent(DEFAULT_CONTENT);
        setErrorMsg("Could not reach server — showing defaults. Changes will save to DB when connection is restored.");
        setStatus("error");
      });
  }, []);

  const update = useCallback(
    (section) => (val) => {
      setContent((prev) => ({ ...prev, [section]: val }));
      setStatus("idle");
    },
    [],
  );

  const handleSave = async () => {
    setStatus("saving");
    try {
      const result = await saveContentToAPI(content);
      setLastSaved(result.updated_at ? new Date(result.updated_at) : new Date());
      setStatus("saved");
    } catch {
      setErrorMsg("Save failed. Check your connection and try again.");
      setStatus("error");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all content to defaults? This cannot be undone.")) return;
    setContent(DEFAULT_CONTENT);
    setStatus("saving");
    try {
      const result = await saveContentToAPI(DEFAULT_CONTENT);
      setLastSaved(result.updated_at ? new Date(result.updated_at) : new Date());
      setStatus("saved");
    } catch {
      setErrorMsg("Reset failed — content was reset locally but could not be saved to the server.");
      setStatus("error");
    }
  };

  if (status === "loading" || !content) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-gray-500 text-sm">
        <svg className="w-4 h-4 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading content from database…
      </div>
    );
  }

  return (
    <div>
      {/* Save bar */}
      <div className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur px-5 py-3 flex items-center justify-between gap-3 mb-6">
        <span className="text-xs font-medium min-w-0">
          {status === "saved" && (
            <span className="text-green-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved to database
              {lastSaved && (
                <span className="text-gray-500 font-normal ml-1">
                  · {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </span>
          )}
          {status === "saving" && (
            <span className="text-yellow-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving to database…
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400 flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{errorMsg}</span>
            </span>
          )}
          {status === "idle" && (
            <span className="text-gray-500">Unsaved changes</span>
          )}
        </span>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReset}
            disabled={status === "saving"}
            className="rounded-xl px-4 py-2 text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-xl px-5 py-2 text-xs font-black bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "saving" ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key
                  ? "bg-red-600 text-white shadow shadow-red-900/30"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section editors */}
      {activeTab === "hero" && (
        <HeroEditor data={content.hero} onChange={update("hero")} />
      )}
      {activeTab === "services" && (
        <ServicesEditor data={content.services} onChange={update("services")} />
      )}
      {activeTab === "branches" && (
        <BranchesEditor data={content.branches} onChange={update("branches")} />
      )}
      {activeTab === "reviews" && (
        <ReviewsEditor data={content.reviews} onChange={update("reviews")} />
      )}
      {activeTab === "fbPages" && (
        <FbPagesEditor data={content.fbPages} onChange={update("fbPages")} />
      )}
      {activeTab === "footer" && (
        <FooterEditor data={content.footer} onChange={update("footer")} />
      )}
    </div>
  );
}

// ─── Other section stubs (posts, media, approvals) ───────────────────────────
function SectionContent({ sectionKey }) {
  switch (sectionKey) {
    case "posts":
      return (
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6 space-y-4">
          <div className="text-sm text-gray-400">
            A list of your latest posts and draft content.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Spring Salon Guide", status: "Published" },
              { title: "New Service Rollout", status: "Draft" },
              { title: "Membership Benefits", status: "Published" },
              { title: "Holiday Hours", status: "Pending Review" },
            ].map((post) => (
              <div
                key={post.title}
                className="rounded-2xl border border-white/10 bg-gray-950 p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-semibold text-white">
                    {post.title}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {post.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Edit and publish content directly from this section once your
                  backend is wired up.
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "media":
      return (
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-sm text-gray-400 mb-6">
            Browse, upload, and manage your media assets here.
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { file: "hero-banner.jpg", type: "Image" },
              { file: "service-menu.pdf", type: "Document" },
              { file: "team-photo.png", type: "Image" },
            ].map((asset) => (
              <div
                key={asset.file}
                className="rounded-2xl border border-white/10 bg-gray-950 p-4"
              >
                <div className="text-sm font-semibold text-white">
                  {asset.file}
                </div>
                <div className="text-xs text-gray-500 mt-2">{asset.type}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "approvals":
      return (
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-sm text-gray-400 mb-6">
            Approve or reject content submissions from your team.
          </div>
          <div className="space-y-4">
            {[
              {
                title: "New blog post: Trends 2026",
                type: "Post",
                requestedBy: "Alex",
              },
              {
                title: "Service page update",
                type: "Page",
                requestedBy: "Mia",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-gray-950 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.type} requested by {item.requestedBy}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-2xl bg-green-500/10 text-green-300 px-3 py-2 text-xs font-semibold hover:bg-green-500/20">
                      Approve
                    </button>
                    <button className="rounded-2xl bg-red-500/10 text-red-300 px-3 py-2 text-xs font-semibold hover:bg-red-500/20">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "pages":
    default:
      return <PagesEditor />;
  }
}


// ─── Main export ─────────────────────────────────────────────────────────────
const SECTION_KEYS = ["pages", "posts", "media", "approvals"];
const SECTION_TITLES = {
  pages: "Pages",
  posts: "Posts",
  media: "Media Library",
  approvals: "Pending Approvals",
};

export default function SuperAdminContentManagement() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("pages");

  useEffect(() => {
    if (location.pathname !== "/super-admin/content") return;
    const hash = location.hash.replace("#", "");

    if (SECTION_KEYS.includes(hash)) {
      setActiveSection(hash);
    } else {
      setActiveSection("pages");
    }
  }, [location.pathname, location.hash]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">
                Super Admin
              </div>
              <h1 className="text-3xl font-black text-white">
                Content Management
              </h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Manage pages, posts, media, and approval workflows from a single
                content hub.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gray-950/60 px-4 py-3 text-xs uppercase tracking-[0.25em] text-gray-300">
              Active section: {SECTION_TITLES[activeSection]}
            </div>
          </div>
        </div>
        <SectionContent sectionKey={activeSection} />
      </div>
    </SuperAdminLayout>
  );
}