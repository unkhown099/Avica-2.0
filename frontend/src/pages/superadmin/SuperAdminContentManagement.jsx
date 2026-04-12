import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { apiFetch } from "../../hooks/api.js";
import { getAuthHeadersAsync, API_BASE } from "../../hooks/useAuth";

// ─── Normalize media URLs to always use the correct backend host ──────────────
const toMediaUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

async function fetchContentFromAPI() {
  const data = await apiFetch("/super-admin/landing-content/");
  return data.content;
}

// Save landing content to API
async function saveContentToAPI(content) {
  return apiFetch("/super-admin/landing-content/", {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

// ─── Minimal fallback content shape ─────────────────────────────────────────
const EMPTY_CONTENT = {
  hero: {
    headline: "",
    headlineAccent: "",
    subtitle: "",
    ctaLoggedIn: "GO TO DASHBOARD",
    ctaGuest: "BOOK YOUR EXPERIENCE",
    signInPrompt: "",
    signInLabel: "SIGN IN HERE",
    imageUrl: "",
    images: [],
  },
  services: {
    sectionTitle: "",
    sectionTitleAccent: "",
    sectionSubtitle: "",
    items: [],
  },
  branches: [],
  reviews: [],
  fbPages: [],
  posts: [
    {
      key: "terms",
      title: "Terms & Conditions",
      body: "Use of the Otokwikk platform constitutes acceptance of our terms and conditions. Customers must agree to our policies before booking services.",
    },
    {
      key: "privacy",
      title: "Privacy Policy",
      body: "We collect information to improve your experience, process bookings, and maintain secure operations. Personal data is never sold to third parties.",
    },
    {
      key: "cookie",
      title: "Cookie Policy",
      body: "We use cookies to keep you signed in, remember your preferences, and optimize performance across the Otokwikk platform.",
    },
  ],
  footer: {
    tagline: "Your trusted automotive companion",
    copyright: "© 2024 Otokwikk. All rights reserved.",
    siteMapLinks: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    legalLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
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
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assetName, setAssetName] = useState("");

  const set = (key) => (val) => onChange({ ...data, [key]: val });

  const loadMediaAssets = useCallback(async () => {
    setMediaError("");
    setMediaLoading(true);
    try {
      const assets = await apiFetch("/super-admin/media-assets/");
      setMediaAssets(
        assets
          .filter((a) => a.media_type === "image")
          .map((a) => ({ ...a, url: toMediaUrl(a.url) })),
      );
    } catch {
      setMediaError("Unable to load media library.");
    } finally {
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMediaAssets();
  }, [loadMediaAssets]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMediaError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (assetName.trim()) {
        formData.append("name", assetName.trim());
      }

      const headers = await getAuthHeadersAsync();
      delete headers["Content-Type"];

      const response = await fetch(`${API_BASE}/super-admin/media-assets/`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const asset = await response.json();
      const normalized = { ...asset, url: toMediaUrl(asset.url) };
      setMediaAssets((prev) => [normalized, ...prev]);
      setAssetName("");
      onChange({ ...data, imageUrl: normalized.url });
    } catch {
      setMediaError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

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
      <Card title="Hero Background">
        <Field
          label="Background Image URL"
          value={data.imageUrl || ""}
          onChange={set("imageUrl")}
          placeholder="Paste direct image URL or choose from media assets"
        />
        {data.imageUrl && (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
            <img
              src={data.imageUrl}
              alt="Selected hero preview"
              className="w-full h-52 object-cover"
            />
          </div>
        )}
        <Card title="Hero Background Slideshow">
          <div className="text-xs text-gray-400 mb-2">
            Select multiple images to cycle through as a slideshow. Click to
            add/remove.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaAssets.map((asset) => {
              const isSelected = (data.images ?? []).includes(asset.url);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    const current = data.images ?? [];
                    const next = isSelected
                      ? current.filter((u) => u !== asset.url)
                      : [...current, asset.url];
                    set("images")(next);
                  }}
                  className={`group overflow-hidden rounded-3xl border text-left transition ${
                    isSelected
                      ? "border-red-500 ring-2 ring-red-500/40"
                      : "border-white/10"
                  } bg-gray-950`}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-xs text-gray-300 truncate">
                      {asset.name}
                    </div>
                    <div className="text-[11px] text-red-400 mt-0.5">
                      {isSelected ? "✓ Selected" : "Click to add"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {(data.images ?? []).length > 0 && (
            <div className="text-xs text-green-400 mt-2">
              {data.images.length} image{data.images.length > 1 ? "s" : ""}{" "}
              selected for slideshow
            </div>
          )}
        </Card>
        <Field
          label="Upload asset label"
          value={assetName}
          onChange={setAssetName}
          placeholder="Optional file label"
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-black text-white cursor-pointer hover:border-white/40">
            {uploading ? "Uploading…" : "Upload image file"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleUpload}
            />
          </label>
          <button
            type="button"
            onClick={loadMediaAssets}
            disabled={mediaLoading}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {mediaLoading ? "Refreshing…" : "Refresh media library"}
          </button>
        </div>
        {mediaError && <div className="text-sm text-red-400">{mediaError}</div>}
        {mediaAssets.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Choose an image from your media library
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    console.log("Selected asset URL:", asset.url);
                    set("imageUrl")(asset.url);
                  }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-gray-950 text-left"
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 py-3">
                    <div className="text-xs text-gray-300 truncate">
                      {asset.name}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Use for hero banner
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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

function BranchesEditor() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-blue-500/10 border border-blue-500/20 p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-white mb-3">
          Centralized Management
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-8">
          Branch details, map coordinates, and operational settings are now
          managed in the dedicated
          <span className="text-white font-bold"> Branch Management</span> page.
          This ensures your landing page map and booking system stay perfectly
          synchronized.
        </p>
        <a
          href="/admin/branches"
          className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-red-900/40 transform hover:-translate-y-1 active:scale-95"
        >
          GO TO BRANCHES
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            t: "Dynamic Pins",
            d: "Add Latitude/Longitude in Branch settings to automatically place pins on the live map.",
          },
          {
            t: "Auto-Sync",
            d: "Changes saved in Branch Management reflect instantly on the landing page dropdown.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/5 p-5 rounded-2xl"
          >
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
              {item.t}
            </h4>
            <p className="text-xs text-gray-500">{item.d}</p>
          </div>
        ))}
      </div>
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
  // Add new site map link
  const addSiteMapLink = () => {
    onChange({
      ...data,
      siteMapLinks: [
        ...(data.siteMapLinks || []),
        { label: "New Link", href: "/" },
      ],
    });
  };

  // Remove site map link
  const removeSiteMapLink = (index) => {
    const updated = [...(data.siteMapLinks || [])];
    updated.splice(index, 1);
    onChange({ ...data, siteMapLinks: updated });
  };

  // Update site map link
  const updateSiteMapLink = (index, field, value) => {
    const updated = [...(data.siteMapLinks || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, siteMapLinks: updated });
  };

  // Add new legal link
  const addLegalLink = () => {
    onChange({
      ...data,
      legalLinks: [
        ...(data.legalLinks || []),
        { label: "New Legal Link", href: "/" },
      ],
    });
  };

  // Remove legal link
  const removeLegalLink = (index) => {
    const updated = [...(data.legalLinks || [])];
    updated.splice(index, 1);
    onChange({ ...data, legalLinks: updated });
  };

  // Update legal link
  const updateLegalLink = (index, field, value) => {
    const updated = [...(data.legalLinks || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, legalLinks: updated });
  };

  return (
    <div className="space-y-4">
      <Card title="Brand Copy" accent>
        <Field
          label="Tagline"
          value={data.tagline || ""}
          onChange={(v) => onChange({ ...data, tagline: v })}
          textarea
          placeholder="e.g., Your trusted automotive companion"
        />
        <Field
          label="Copyright Text"
          value={data.copyright || ""}
          onChange={(v) => onChange({ ...data, copyright: v })}
          placeholder="e.g., © 2024 Otokwikk. All rights reserved."
        />
      </Card>

      <Card title="Site Map Links">
        <p className="text-xs text-gray-500 mb-3">
          These links appear in the footer navigation under "Site Map"
        </p>
        {(data.siteMapLinks || []).map((link, index) => (
          <div key={index} className="space-y-3 p-4 bg-white/5 rounded-xl mb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-400 font-bold">
                Link {index + 1}
              </span>
              <button
                onClick={() => removeSiteMapLink(index)}
                className="text-xs text-red-500 hover:text-red-400 font-bold"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Label"
                value={link.label || ""}
                onChange={(v) => updateSiteMapLink(index, "label", v)}
                placeholder="e.g., Home"
              />
              <Field
                label="URL"
                value={link.href || ""}
                onChange={(v) => updateSiteMapLink(index, "href", v)}
                placeholder="e.g., /"
              />
            </div>
          </div>
        ))}
        <button
          onClick={addSiteMapLink}
          className="w-full rounded-xl border border-dashed border-white/20 py-2 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors mt-2"
        >
          + Add Site Map Link
        </button>
      </Card>

      <Card title="Legal Links">
        <p className="text-xs text-gray-500 mb-3">
          These links appear in the footer under "Legal" (Privacy Policy, Terms,
          etc.)
        </p>
        {(data.legalLinks || []).map((link, index) => (
          <div key={index} className="space-y-3 p-4 bg-white/5 rounded-xl mb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-400 font-bold">
                Legal Link {index + 1}
              </span>
              <button
                onClick={() => removeLegalLink(index)}
                className="text-xs text-red-500 hover:text-red-400 font-bold"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Label"
                value={link.label || ""}
                onChange={(v) => updateLegalLink(index, "label", v)}
                placeholder="e.g., Privacy Policy"
              />
              <Field
                label="URL"
                value={link.href || ""}
                onChange={(v) => updateLegalLink(index, "href", v)}
                placeholder="e.g., /privacy"
              />
            </div>
          </div>
        ))}
        <button
          onClick={addLegalLink}
          className="w-full rounded-xl border border-dashed border-white/20 py-2 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors mt-2"
        >
          + Add Legal Link
        </button>
      </Card>

      {/* Preview section */}
      <Card title="Footer Preview">
        <div className="bg-black/40 rounded-xl p-4 space-y-3">
          <div className="text-sm text-gray-300">
            <span className="text-red-400">Tagline:</span>{" "}
            {data.tagline || "(not set)"}
          </div>
          <div className="text-sm text-gray-300">
            <span className="text-red-400">Copyright:</span>{" "}
            {data.copyright || "(not set)"}
          </div>
          <div className="text-sm text-gray-300">
            <span className="text-red-400">Site Map Links:</span>{" "}
            {(data.siteMapLinks || []).length > 0
              ? (data.siteMapLinks || []).map((l) => l.label).join(", ")
              : "(none)"}
          </div>
          <div className="text-sm text-gray-300">
            <span className="text-red-400">Legal Links:</span>{" "}
            {(data.legalLinks || []).length > 0
              ? (data.legalLinks || []).map((l) => l.label).join(", ")
              : "(none)"}
          </div>
        </div>
      </Card>
    </div>
  );
}

function PostsEditor() {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchContentFromAPI()
      .then((c) => {
        setContent(c);
        setStatus("idle");
      })
      .catch(() => {
        setContent(EMPTY_CONTENT);
        setErrorMsg(
          "Could not reach server — showing empty content. Changes will save to DB when connection is restored.",
        );
        setStatus("error");
      });
  }, []);

  const updatePost = (index, key) => (value) => {
    setContent((prev) => {
      const posts = Array.isArray(prev.posts) ? [...prev.posts] : [];
      posts[index] = { ...posts[index], [key]: value };
      return { ...prev, posts };
    });
    setStatus("idle");
  };

  const addPost = () => {
    setContent((prev) => {
      const posts = Array.isArray(prev.posts) ? [...prev.posts] : [];
      posts.push({
        key: `post-${Date.now()}`,
        title: "New Legal Document",
        body: "Write the legal content here.",
      });
      return { ...prev, posts };
    });
    setStatus("idle");
  };

  const removePost = (index) => {
    setContent((prev) => {
      const posts = Array.isArray(prev.posts)
        ? prev.posts.filter((_, i) => i !== index)
        : [];
      return { ...prev, posts };
    });
    setStatus("idle");
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const result = await saveContentToAPI(content);
      setLastSaved(
        result.updated_at ? new Date(result.updated_at) : new Date(),
      );
      setStatus("saved");
    } catch {
      setErrorMsg("Save failed. Check your connection and try again.");
      setStatus("error");
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm("Reset all content to defaults? This cannot be undone.")
    )
      return;
    setStatus("saving");
    try {
      const result = await apiFetch("/super-admin/landing-content/", {
        method: "DELETE",
      });
      setContent(result.content);
      setLastSaved(
        result.updated_at ? new Date(result.updated_at) : new Date(),
      );
      setStatus("saved");
    } catch {
      setErrorMsg("Reset failed — content could not be reset on the server.");
      setStatus("error");
    }
  };

  if (status === "loading" || !content) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-gray-500 text-sm">
        <svg
          className="w-4 h-4 animate-spin text-red-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading editable posts…
      </div>
    );
  }

  const posts = Array.isArray(content.posts) ? content.posts : [];

  // Helper to get post type icon and label
  const getPostTypeInfo = (key) => {
    const types = {
      privacy: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        label: "Privacy Policy",
        color: "text-blue-400",
      },
      terms: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        label: "Terms & Conditions",
        color: "text-purple-400",
      },
      cookie: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01M12 14h.01" />
          </svg>
        ),
        label: "Cookie Policy",
        color: "text-yellow-400",
      },
    };
    return types[key] || {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-4H7v4" />
        </svg>
      ),
      label: "Legal Document",
      color: "text-gray-400",
    };
  };

  return (
    <div>
      <div className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur px-5 py-3 flex items-center justify-between gap-3 mb-6">
        <span className="text-xs font-medium min-w-0">
          {status === "saved" && (
            <span className="text-green-400 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
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
              <svg
                className="w-3.5 h-3.5 animate-spin flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Saving to database…
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400 flex items-center gap-1.5 truncate">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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

      <div className="space-y-4">
        <Card title="Legal Content" accent>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  These are the legal documents that appear in modals when users click on 
                  <span className="text-red-400 font-bold mx-1">Privacy Policy</span>,
                  <span className="text-red-400 font-bold mx-1">Terms of Service</span>, and
                  <span className="text-red-400 font-bold mx-1">Cookie Policy</span> links in the footer.
                </p>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tip: Each document is identified by its unique "key" (privacy, terms, cookie). Don't change these keys unless you update the footer links!
                </p>
              </div>
            </div>
          </div>
        </Card>

        {posts.map((post, index) => {
          const postInfo = getPostTypeInfo(post.key);
          return (
            <Card key={post.key || index}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-${postInfo.color.replace('text-', '')}/20 rounded-xl flex items-center justify-center`}>
                  <div className={postInfo.color}>
                    {postInfo.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{postInfo.label}</h3>
                  {post.key && ["privacy", "terms", "cookie"].includes(post.key) && (
                    <span className="text-[10px] text-green-500 bg-green-500/20 px-2 py-0.5 rounded-full">
                      Default Document
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field
                  label="Document Title"
                  value={post.title || ""}
                  onChange={updatePost(index, "title")}
                  placeholder="e.g., Privacy Policy"
                />
                <Field
                  label="Unique Key (identifier)"
                  value={post.key || ""}
                  onChange={updatePost(index, "key")}
                  placeholder="privacy, terms, cookie, etc."
                />
              </div>
              <Field
                label="Document Content"
                value={post.body || ""}
                onChange={updatePost(index, "body")}
                textarea
                placeholder="Write the full legal text here. This will appear in the modal popup."
              />
              {!post.key || !["privacy", "terms", "cookie"].includes(post.key) ? (
                <button
                  onClick={() => removePost(index)}
                  className="text-xs text-red-500 hover:text-red-400 font-bold mt-2 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove custom post
                </button>
              ) : null}
            </Card>
          );
        })}

        <button
          onClick={addPost}
          className="w-full rounded-xl border border-dashed border-white/20 py-4 text-xs font-bold text-gray-500 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Legal Document
        </button>

        <Card title="How it works">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-black text-xs">1</span>
              </div>
              <span className="text-gray-300">Edit the content above for Privacy Policy, Terms, and Cookie Policy</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-black text-xs">2</span>
              </div>
              <span className="text-gray-300">Save your changes</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-black text-xs">3</span>
              </div>
              <span className="text-gray-300">Users clicking footer links will see the updated content in a modal popup</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-black text-xs">4</span>
              </div>
              <span className="text-gray-300">You can add custom legal documents and link them in the Footer editor</span>
            </div>
          </div>
        </Card>
      </div>
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
  { key: "legal", label: "Legal Content" },
];

function PagesEditor() {
  const [content, setContent] = useState(null);
  const [activeTab, setActiveTab] = useState("hero");
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchContentFromAPI()
      .then((c) => {
        setContent(c);
        setStatus("idle");
      })
      .catch(() => {
        setContent(EMPTY_CONTENT);
        setErrorMsg(
          "Could not reach server — showing empty content. Changes will save to DB when connection is restored.",
        );
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
    console.log("Saving imageUrl:", content.hero.imageUrl);
    setStatus("saving");
    try {
      const result = await saveContentToAPI(content);
      setLastSaved(
        result.updated_at ? new Date(result.updated_at) : new Date(),
      );
      setStatus("saved");
    } catch {
      setErrorMsg("Save failed. Check your connection and try again.");
      setStatus("error");
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm("Reset all content to defaults? This cannot be undone.")
    )
      return;
    setStatus("saving");
    try {
      const result = await apiFetch("/super-admin/landing-content/", {
        method: "DELETE",
      });
      setContent(result.content);
      setLastSaved(
        result.updated_at ? new Date(result.updated_at) : new Date(),
      );
      setStatus("saved");
    } catch {
      setErrorMsg("Reset failed — content could not be reset on the server.");
      setStatus("error");
    }
  };

  if (status === "loading" || !content) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-gray-500 text-sm">
        <svg
          className="w-4 h-4 animate-spin text-red-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading content from database…
      </div>
    );
  }

  return (
    <div>
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
      {activeTab === "branches" && <BranchesEditor />}
      {activeTab === "reviews" && (
        <ReviewsEditor data={content.reviews} onChange={update("reviews")} />
      )}
      {activeTab === "fbPages" && (
        <FbPagesEditor data={content.fbPages} onChange={update("fbPages")} />
      )}
      {activeTab === "footer" && (
        <FooterEditor data={content.footer} onChange={update("footer")} />
      )}
      {activeTab === "legal" && <PostsEditor />}
    </div>
  );
}

// ─── Media library manager ─────────────────────────────────────────────────
function MediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assetName, setAssetName] = useState("");

  const loadAssets = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/super-admin/media-assets/");
      setAssets(data.map((a) => ({ ...a, url: toMediaUrl(a.url) })));
    } catch {
      setError(
        "Could not load media assets. Check your network or permissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (assetName.trim()) {
        formData.append("name", assetName.trim());
      }

      const headers = await getAuthHeadersAsync();
      delete headers["Content-Type"];

      const response = await fetch(`${API_BASE}/super-admin/media-assets/`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const asset = await response.json();
      setAssets((prev) => [{ ...asset, url: toMediaUrl(asset.url) }, ...prev]);
      setAssetName("");
      event.target.value = "";
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm("Delete this media asset?")) return;

    try {
      const headers = await getAuthHeadersAsync();
      delete headers["Content-Type"];

      const response = await fetch(
        `${API_BASE}/super-admin/media-assets/${assetId}/`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setAssets((prev) => prev.filter((item) => item.id !== assetId));
    } catch {
      setError("Unable to delete asset. Try again.");
    }
  };

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("Copy to clipboard failed.");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6 space-y-6">
      <div className="text-sm text-gray-400 mb-3">
        Browse, upload, and manage your media assets. Use image URLs from here
        in the Hero editor.
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card title="Upload Media" accent>
            <Field
              label="Asset label"
              value={assetName}
              onChange={setAssetName}
              placeholder="Optional name for the uploaded file"
            />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-black text-white hover:border-white/40">
              <span>{uploading ? "Uploading…" : "Select file to upload"}</span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                hidden
                onChange={handleUpload}
              />
            </label>
            <p className="text-xs text-gray-500">
              Upload an image asset, then choose it in the Hero editor for the
              landing hero.
            </p>
          </Card>
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/50 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-950 p-4 min-h-[160px]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Media assets
              </div>
              <div className="text-sm text-gray-300">
                {assets.length} item{assets.length === 1 ? "" : "s"}
              </div>
            </div>
            <button
              type="button"
              onClick={loadAssets}
              disabled={loading}
              className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-400">Loading assets…</div>
          ) : (
            <div className="space-y-3">
              {assets.length === 0 && (
                <div className="text-sm text-gray-400">
                  No media assets yet. Upload a file to get started.
                </div>
              )}
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-3xl border border-white/10 bg-black/40 p-3 flex items-start gap-3"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                    {asset.media_type === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 uppercase">
                        {asset.media_type}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {asset.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {asset.url}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.url)}
                        className="rounded-xl bg-white/5 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-white/10"
                      >
                        Copy URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(asset.id)}
                        className="rounded-xl bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section content router ───────────────────────────────────────────
function SectionContent({ sectionKey }) {
  switch (sectionKey) {
    case "posts":
      return <PostsEditor />;
    case "media":
      return <MediaLibrary />;
    case "pages":
    default:
      return <PagesEditor />;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────
const SECTION_KEYS = ["pages", "posts", "media"];
const SECTION_TITLES = {
  pages: "Pages",
  posts: "Posts",
  media: "Media Library",
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
                Manage pages, posts, and media from a single content hub.
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
