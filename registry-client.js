// =============================================================================
// registry-client.js
// Nexus IA Registry Boot Helper — include in every module via <script src="/registry-client.js">
// Fetches /registry, populates globals, exposes helpers
// Must be awaited before attributeDeals() is called
//
// REMOLD vs original: keyed by employee code (UPxxxx) instead of HubSpot owner ID.
// All global names preserved — per-module attribution logic requires zero renaming.
// Two additions: NAME_OVERRIDES (data quality), BUTYPE_MAP (BUType normalisation)
// New helper: parseSalesPersonName() — parses "Name - UPxxxx" from GetBookings
// =============================================================================

// Globals populated by initRegistry() — same names as HubSpot build
let OWNER_REGISTRY    = {};   // full owner map keyed by employee code
let OWNER_BU_MAP      = {};   // { code: "MarTech"|"Digital"|"dynamic" }
let OWNER_GEO         = {};   // { code: "AU"|"UK"|"US"|null }  null = use GEO field
let OWNER_HEAD_MAP    = {};   // { code: head string | null }   null = use headFromRegion()
let OWNER_NAMES       = {};   // { code: display name }
let NBD_OWNER_IDS     = new Set();
let USER_ROLE_IDS     = new Set();
let EXISTING_EXCLUDE  = new Set();   // NBD ∪ User Role — excluded from existing-client counts
let MARTECH_OWNER_IDS = new Set();
let DIGITAL_OWNER_IDS = new Set();
let NBD_IS_GROWTH     = new Set();   // Karan Doshi & Divya S — Growth Ledger special handling
let GEO_MAP           = {};

// IA-specific globals
let NAME_OVERRIDES    = {};   // raw SalesPersonName → clean display name
let BUTYPE_MAP        = {};   // "Digital BU" → "Digital", "Martech BU" → "MarTech"

// Inline fallback — mirrors /functions/registry.js exactly.
// Used only if the fetch fails (network error, cold-start timeout, etc.)
// Keep in sync with registry.js on every registry update.
const REGISTRY_FALLBACK = {
  owners: {
    // ── MARTECH ──────────────────────────────────────────────────────────────
    "UP0053":    { id:"UP0053",    name:"Jaydeep Salla",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0019AM":  { id:"UP0019AM",  name:"Chintan Doshi",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0019NBD": { id:"UP0019NBD", name:"Chintan Doshi",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP1468AM":  { id:"UP1468AM",  name:"Divya S",          bu:"MarTech", region:"UK",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:true,  historical:false },
    "UP0228":    { id:"UP0228",    name:"Mukund Basita",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0228AM":  { id:"UP0228AM",  name:"Mukund Basita",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2636":    { id:"UP2636",    name:"Sakshi Bissa",     bu:"MarTech", region:"UK",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2829":    { id:"UP2829",    name:"Ayush Dhupar",     bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1997":    { id:"UP1997",    name:"Ayush Rathi",      bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2677":    { id:"UP2677",    name:"Preeti Thapliyal", bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2712":    { id:"UP2712",    name:"Rupali Sindhu",    bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2724":    { id:"UP2724",    name:"Vinita Raidu",     bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2464":    { id:"UP2464",    name:"Kamesh Biniwale",  bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP0215AM":  { id:"UP0215AM",  name:"Karan Doshi",      bu:"MarTech", region:"AU",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:true,  historical:false },
    "UP0215NBD": { id:"UP0215NBD", name:"Karan Doshi",      bu:"MarTech", region:"AU",  head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:true,  historical:false },
    // ── DIGITAL ──────────────────────────────────────────────────────────────
    "UP0079":    { id:"UP0079",    name:"Tanuj Gupta",      bu:"Digital", region:"geo", head:"geo",        nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0012AM":  { id:"UP0012AM",  name:"Darshan Modi",     bu:"Digital", region:"geo", head:"geo",        nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1485":    { id:"UP1485",    name:"Jiggyasa Agrawal", bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2539":    { id:"UP2539",    name:"Kunal Gohil",      bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2850":    { id:"UP2850",    name:"Manvi Choumal",    bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1296":    { id:"UP1296",    name:"Prachi Porwal",    bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2014":    { id:"UP2014",    name:"Saquib Khan",      bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0267":    { id:"UP0267",    name:"Flintoff Mehta",   bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0220":    { id:"UP0220",    name:"Kalgi Shah",       bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0297":    { id:"UP0297",    name:"Vikram Sahi",      bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0081":    { id:"UP0081",    name:"Sheldon Fernandes",bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:true  },
    "UP0223":    { id:"UP0223",    name:"Baspin Thomas",    bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0422":    { id:"UP0422",    name:"Dhaval Damania",   bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1976":    { id:"UP1976",    name:"Hammad Bhaldar",   bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0103":    { id:"UP0103",    name:"Jebin Joy",        bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0286":    { id:"UP0286",    name:"Kaustubh Agrawal", bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2074":    { id:"UP2074",    name:"Sourya Ghosh",     bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2479":    { id:"UP2479",    name:"Sudarshan Damani", bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1141":    { id:"UP1141",    name:"Aman Acharya",     bu:"Digital", region:"AU",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP2002":    { id:"UP2002",    name:"Devanshu Kumar",   bu:"Digital", region:"UK",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP0341":    { id:"UP0341",    name:"Malav Modi",       bu:"Digital", region:"US",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP1262":    { id:"UP1262",    name:"Dhruti Dave",      bu:"Digital", region:"geo", head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    // ── DYNAMIC ──────────────────────────────────────────────────────────────
    "UP2210PCAM":{ id:"UP2210PCAM",name:"Prativa Dubey",    bu:"dynamic", region:"geo", head:"geo",        nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
  },
  geoMap: {
    "US":"US", "UK":"UK", "AU":"AU",
    "AU/NZ":"AU", "India":"AU", "Netherlands":"UK", "EU/India":null, "Other":null
  },
  nameOverrides: {
    "BaspinThomas":"Baspin Thomas", "DIVYA S":"Divya S",
    "Hammad Riyaz Bhaldar":"Hammad Bhaldar", "Jebin Monks":"Jebin Joy",
    "Devanshu kumar":"Devanshu Kumar"
  },
  buTypeMap: {
    "Digital BU":"Digital", "Martech BU":"MarTech"
  }
};

// ── Core boot function ────────────────────────────────────────────────────────
// Call once at module boot. Await before attributeDeals().
async function initRegistry() {
  let data;

  try {
    const res = await fetch("/registry");
    if (!res.ok) throw new Error(`/registry responded ${res.status}`);
    data = await res.json();
    console.log(`[Nexus IA] Registry v${data.meta?.version} loaded — ${data.meta?.active} active owners`);
  } catch (err) {
    console.warn("[Nexus IA] Registry fetch failed, using inline fallback:", err.message);
    data = REGISTRY_FALLBACK;
  }

  const reg = data.owners;

  // Populate globals
  OWNER_REGISTRY = reg;
  GEO_MAP        = data.geoMap        || {};
  NAME_OVERRIDES = data.nameOverrides  || {};
  BUTYPE_MAP     = data.buTypeMap      || {};

  for (const [id, o] of Object.entries(reg)) {
    OWNER_BU_MAP[id]   = o.bu;
    OWNER_GEO[id]      = o.region === "geo" ? null : o.region;
    OWNER_HEAD_MAP[id] = o.head   === "geo" ? null : _fullHead(o.head);
    OWNER_NAMES[id]    = o.name;
    if (o.isNBD)                    NBD_OWNER_IDS.add(id);
    if (o.nature === "User Role")   USER_ROLE_IDS.add(id);
    if (o.isNBD || o.nature === "User Role") EXISTING_EXCLUDE.add(id);
    if (o.bu === "MarTech")         MARTECH_OWNER_IDS.add(id);
    if (o.bu === "Digital")         DIGITAL_OWNER_IDS.add(id);
    if (o.nbdIsGrowth)              NBD_IS_GROWTH.add(id);
  }
}

// ── Head name mapping ─────────────────────────────────────────────────────────
// Registry stores shortcodes; modules use full display names.
const _HEAD_FULL = {
  "Jaydeep":    "Jaydeep Salla",
  "Jiggyasa":   "Jiggyasa Agrawal",
  "Nevilson":   "Nevilson Christan",
  "Tanuj - UK": "Tanuj Gupta (UK)",
  "Tanuj - US": "Tanuj Gupta (US)"
};
function _fullHead(shortcode) {
  return _HEAD_FULL[shortcode] || shortcode;
}

// ── headFromRegion ────────────────────────────────────────────────────────────
// Resolves head for owners whose head === "geo" in the registry
// Returns full display names consistent with OWNER_HEAD_MAP
function headFromRegion(region, bu) {
  if (bu === "MarTech" || bu === "dynamic") return "Jaydeep Salla";
  if (bu === "Digital") {
    if (region === "AU") return "Jiggyasa Agrawal";
    if (region === "UK") return "Tanuj Gupta (UK)";
    if (region === "US") return "Tanuj Gupta (US)";
  }
  return null;
}

// ── resolveGeo ────────────────────────────────────────────────────────────────
// Applies GEO_MAP to a raw GEO field value from GetBookings
function resolveGeo(raw) {
  return GEO_MAP[raw] ?? null;
}

// ── normalizeBUType ───────────────────────────────────────────────────────────
// Converts raw BUType from GetBookings → Nexus canonical label
// "Digital BU" → "Digital" | "Martech BU" → "MarTech"
function normalizeBUType(raw) {
  return BUTYPE_MAP[raw] || raw || "Digital";
}

// ── parseSalesPersonName ──────────────────────────────────────────────────────
// Splits "Sourya Ghosh - UP2074" → { name: "Sourya Ghosh", code: "UP2074" }
// Applies NAME_OVERRIDES for data quality corrections
// Used in doInvoiceSync() when building the d object from each booking record
function parseSalesPersonName(raw) {
  if (!raw) return { name: "", code: "" };
  const lastDash = raw.lastIndexOf(" - ");
  if (lastDash === -1) return { name: (NAME_OVERRIDES[raw.trim()] || raw.trim()), code: "" };
  const rawName = raw.substring(0, lastDash).trim();
  const code    = raw.substring(lastDash + 3).trim();
  const name    = NAME_OVERRIDES[rawName] || rawName;
  return { name, code };
}

// ── Quick-filter helpers ──────────────────────────────────────────────────────
// Tier 1: registry nature (AM / NBD) decides immediately
// User Role owners: no user_role_invoice_app in IA build — excluded from both filters
// (same effective behaviour as HubSpot build when property is empty)
function dealIsAM(d) {
  const o = OWNER_REGISTRY[String(d.owner_id || "")];
  if (!o) return false;
  if (o.nature === "AM")        return true;
  if (o.nature === "NBD")       return false;
  if (o.nature === "User Role") return false;  // no Tier 2 property in IA build
  return false;
}
function dealIsNBD(d) {
  const o = OWNER_REGISTRY[String(d.owner_id || "")];
  if (!o) return false;
  if (o.nature === "NBD")       return true;
  if (o.nature === "AM")        return false;
  if (o.nature === "User Role") return false;  // no Tier 2 property in IA build
  return false;
}

// ── classifyLineItem ──────────────────────────────────────────────────────────
// Service + BU classifier — applied to Invoice App Service field (one per booking)
// Identical rules to HubSpot build — same service string patterns
// Single source of truth for all Nexus IA modules — do not redefine per-module
function classifyLineItem(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes("campaign -") || n.includes("campaign manager") || n.includes("campaign operation specialist") || n.includes("sfmc"))
    return { svc: "Campaign", bu: "MarTech" };
  if (n.includes("design - asset") || n.includes("design - digital"))
    return { svc: "Web",      bu: "Digital" };
  if (n.includes("design - "))
    return { svc: "Design",   bu: "MarTech" };
  if (n.includes("development - email") || n.includes("email coding"))
    return { svc: "Email",    bu: "MarTech" };
  if (n.includes("email design and coding"))
    return { svc: "Design",   bu: "MarTech" };
  if (n.includes("development - web")        || n.includes("development - lp/hub")          ||
      n.includes("development - mobile app") || n.includes("ai & automation - web")         ||
      n.includes("dot-net development")      || n.includes("operational service - data entry") ||
      n.includes("landing page coding and design") || n.includes("landing page coding")     ||
      n.includes("landing page only coding"))
    return { svc: "Web",      bu: "Digital" };
  if (n.includes("search -") || n.includes("consultancy fees"))
    return { svc: "Search",   bu: "Digital" };
  return null;
}

// ── engGroupFromLiName ────────────────────────────────────────────────────────
// Engagement type classifier — preserved from HubSpot build for compatibility
// In IA build, engGroup() in index.html handles EngagementModel field directly
// Single source of truth for all Nexus IA modules — do not redefine per-module
function engGroupFromLiName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.startsWith("dedicated fte"))                              return "Recurring";
  if (n.startsWith("dedicated pte"))                             return "Recurring";
  if (n.startsWith("recurring"))                                 return "Recurring";
  if (n.startsWith("p2p"))                                       return "P2P";
  if (n.startsWith("time and material") || n.startsWith("t&m")) return "P2P";
  if (n.includes("email coding"))                                return "P2P";
  return null;
}
