// =============================================================================
// /functions/registry.js
// Nexus IA — Owner Registry — Invoice App Native
// Version: 1.0  |  Created: 2026-11-10
// 42 entries: 41 active + 1 historical (Sheldon Fernandes)
// Keyed by employee code (UPxxxx) — replaces HubSpot owner ID
//
// Attribution model (simplified vs HubSpot build):
//   BUType, GEOHead, GEO — all native per booking from GetBookings
//   This registry is used for:
//     1. Display name mapping (employee code → clean name)
//     2. Owner filter UI grouping
//     3. Nature (AM / NBD / User Role) for quick filters
//     4. Historical flag
//   No Tier 2 property lookups needed — BU native from BUType field
//
// Dual-code owners (role encoded in code suffix):
//   Chintan Doshi  — UP0019AM (AM) / UP0019NBD (NBD)
//   Karan Doshi    — UP0215AM (AM) / UP0215NBD (NBD)
//   Mukund Basita  — UP0228AM (AM) / UP0228 (base / User Role)
//
// Raw name → Display name overrides (Invoice App data quality):
//   "BaspinThomas"         → "Baspin Thomas"
//   "DIVYA S"              → "Divya S"
//   "Hammad Riyaz Bhaldar" → "Hammad Bhaldar"
//   "Jebin Monks"          → "Jebin Joy"
//   "Devanshu kumar"       → "Devanshu Kumar"
//
// Pending employee codes (not in developer list — to add when confirmed):
//   Mrugesh Dabhi, Matt Kelly, Krunal Bakraniya, Nevilson Christan
// =============================================================================

export async function onRequest() {

  // ── Name override map ──────────────────────────────────────────────────────
  // Maps raw SalesPersonName (name part only, before " - UPxxxx") → clean display name
  // Applied in registry-client.js when parsing booking records
  const nameOverrides = {
    "BaspinThomas":           "Baspin Thomas",
    "DIVYA S":                "Divya S",
    "Hammad Riyaz Bhaldar":   "Hammad Bhaldar",
    "Jebin Monks":            "Jebin Joy",
    "Devanshu kumar":         "Devanshu Kumar",
  };

  // ── Owner entries ───────────────────────────────────────────────────────────
  // Fields:
  //   id          — Employee code (string, matches suffix in SalesPersonName)
  //   name        — Clean display name
  //   bu          — "MarTech" | "Digital" | "dynamic"
  //                 "dynamic" = resolved per booking from BUType field
  //   region      — "AU" | "UK" | "US" | "geo"
  //                 "geo" = resolved per booking from GEO field via geoMap
  //   head        — "Jaydeep" | "Jiggyasa" | "Tanuj - UK" | "Tanuj - US" |
  //                 "Nevilson" | "geo"
  //                 "geo" = resolved per booking from GEOHead field
  //   nature      — "AM" | "NBD" | "User Role"
  //   isNBD       — true for all NBD owners (drives existingExclude)
  //   nbdIsGrowth — true for Karan Doshi & Divya S (Growth Ledger handling)
  //   historical  — true = Sheldon Fernandes; excluded from all live attribution
  // ───────────────────────────────────────────────────────────────────────────

  const owners = {

    // ── MARTECH ──────────────────────────────────────────────────────────────

    // User Role
    "UP0053":    { id:"UP0053",    name:"Jaydeep Salla",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    // Dual-code: AM / NBD variants
    "UP0019AM":  { id:"UP0019AM",  name:"Chintan Doshi",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0019NBD": { id:"UP0019NBD", name:"Chintan Doshi",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    // AM
    "UP1468AM":  { id:"UP1468AM",  name:"Divya S",          bu:"MarTech", region:"UK",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:true,  historical:false },
    // Dual-code: base / AM variants
    "UP0228":    { id:"UP0228",    name:"Mukund Basita",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0228AM":  { id:"UP0228AM",  name:"Mukund Basita",    bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    // AM
    "UP2636":    { id:"UP2636",    name:"Sakshi Bissa",     bu:"MarTech", region:"UK",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2829":    { id:"UP2829",    name:"Ayush Dhupar",     bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1997":    { id:"UP1997",    name:"Ayush Rathi",      bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2677":    { id:"UP2677",    name:"Preeti Thapliyal", bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2712":    { id:"UP2712",    name:"Rupali Sindhu",    bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2724":    { id:"UP2724",    name:"Vinita Raidu",     bu:"MarTech", region:"US",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    // NBD
    "UP2464":    { id:"UP2464",    name:"Kamesh Biniwale",  bu:"MarTech", region:"geo", head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    // Dual-code: AM / NBD variants
    "UP0215AM":  { id:"UP0215AM",  name:"Karan Doshi",      bu:"MarTech", region:"AU",  head:"Jaydeep",    nature:"AM",        isNBD:false, nbdIsGrowth:true,  historical:false },
    "UP0215NBD": { id:"UP0215NBD", name:"Karan Doshi",      bu:"MarTech", region:"AU",  head:"Jaydeep",    nature:"NBD",       isNBD:true,  nbdIsGrowth:true,  historical:false },

    // ── DIGITAL ───────────────────────────────────────────────────────────────

    // User Role (leaders — head & region resolved per booking from GEOHead/GEO)
    "UP0079":    { id:"UP0079",    name:"Tanuj Gupta",      bu:"Digital", region:"geo", head:"geo",        nature:"User Role", isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0012AM":  { id:"UP0012AM",  name:"Darshan Modi",     bu:"Digital", region:"geo", head:"geo",        nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },

    // AM — AU  (Head: Jiggyasa)
    "UP1485":    { id:"UP1485",    name:"Jiggyasa Agrawal", bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2539":    { id:"UP2539",    name:"Kunal Gohil",      bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2850":    { id:"UP2850",    name:"Manvi Choumal",    bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1296":    { id:"UP1296",    name:"Prachi Porwal",    bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2014":    { id:"UP2014",    name:"Saquib Khan",      bu:"Digital", region:"AU",  head:"Jiggyasa",   nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },

    // AM — UK  (Head: Tanuj - UK)
    "UP0267":    { id:"UP0267",    name:"Flintoff Mehta",   bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0220":    { id:"UP0220",    name:"Kalgi Shah",       bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0297":    { id:"UP0297",    name:"Vikram Sahi",      bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0081":    { id:"UP0081",    name:"Sheldon Fernandes",bu:"Digital", region:"UK",  head:"Tanuj - UK", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:true  },
    // Sheldon: HISTORICAL ONLY — excluded from all live attribution

    // AM — US  (Head: Tanuj - US)
    "UP0223":    { id:"UP0223",    name:"Baspin Thomas",    bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0422":    { id:"UP0422",    name:"Dhaval Damania",   bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP1976":    { id:"UP1976",    name:"Hammad Bhaldar",   bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP0103":    { id:"UP0103",    name:"Jebin Joy",        bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    // Note: Invoice App returns "Jebin Monks" — overridden to "Jebin Joy" via nameOverrides
    "UP0286":    { id:"UP0286",    name:"Kaustubh Agrawal", bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2074":    { id:"UP2074",    name:"Sourya Ghosh",     bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    "UP2479":    { id:"UP2479",    name:"Sudarshan Damani", bu:"Digital", region:"US",  head:"Tanuj - US", nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },

    // NBD — Nevilson's Team
    "UP1141":    { id:"UP1141",    name:"Aman Acharya",     bu:"Digital", region:"AU",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP2002":    { id:"UP2002",    name:"Devanshu Kumar",   bu:"Digital", region:"UK",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP0341":    { id:"UP0341",    name:"Malav Modi",       bu:"Digital", region:"US",  head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },
    "UP1262":    { id:"UP1262",    name:"Dhruti Dave",      bu:"Digital", region:"geo", head:"Nevilson",   nature:"NBD",       isNBD:true,  nbdIsGrowth:false, historical:false },

    // ── DYNAMIC BU ────────────────────────────────────────────────────────────

    "UP2210PCAM":{ id:"UP2210PCAM",name:"Prativa Dubey",    bu:"dynamic", region:"geo", head:"geo",        nature:"AM",        isNBD:false, nbdIsGrowth:false, historical:false },
    // Prativa: BU resolved per booking from BUType; catch-all fallback for unresolved attribution
  };

  // ── Convenience arrays (derived — do not edit manually) ───────────────────
  const ids            = Object.keys(owners);
  const active         = ids.filter(id =>  !owners[id].historical);
  const nbd            = ids.filter(id =>   owners[id].isNBD);
  const userRole       = ids.filter(id =>   owners[id].nature === "User Role");
  const existingExclude= [...new Set([...nbd, ...userRole])];
  const martech        = ids.filter(id =>   owners[id].bu === "MarTech");
  const digital        = ids.filter(id =>   owners[id].bu === "Digital");
  const nbdIsGrowth    = ids.filter(id =>   owners[id].nbdIsGrowth);

  // ── GEO_MAP ───────────────────────────────────────────────────────────────
  // Maps raw GEO field from GetBookings → canonical region bucket
  // Same values as HubSpot build — Invoice App is the upstream source for both
  const geoMap = {
    "US":          "US",
    "UK":          "UK",
    "AU":          "AU",
    "AU/NZ":       "AU",   // treated as AU
    "India":       "AU",   // Jiggyasa head scope
    "Netherlands": "UK",   // treated as EMEA/UK
    "EU/India":    null,   // excluded from region breakdowns (same as HubSpot behaviour)
    "Other":       null,   // excluded from region-level breakdowns
  };

  // ── BU Type normalisation ──────────────────────────────────────────────────
  // Maps raw BUType field from GetBookings → Nexus canonical label
  const buTypeMap = {
    "Digital BU": "Digital",
    "Martech BU": "MarTech",
  };

  // ── Response ──────────────────────────────────────────────────────────────
  const payload = {
    owners,
    nameOverrides,
    active,
    nbd,
    userRole,
    existingExclude,
    martech,
    digital,
    nbdIsGrowth,
    geoMap,
    buTypeMap,
    meta: {
      total:     ids.length,
      active:    active.length,
      historical:ids.length - active.length,
      updatedAt: "2026-11-10",
      version:   "1.0",
      note:      "Invoice App native. Keyed by employee code. BU/GEO/Head native from GetBookings — registry for display names, UI grouping and nature flags only."
    }
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type":  "application/json",
      "Cache-Control": "public, max-age=86400",
    }
  });
}
