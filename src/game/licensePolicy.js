const BLOCKED_LICENSES = new Set(["unknown", "other", "copyright-authors"]);

export function normalizeLicenseName(name = "") {
  return String(name).trim();
}

export function isRedistributableLicense(name = "") {
  const license = normalizeLicenseName(name);
  if (!license || BLOCKED_LICENSES.has(license)) return false;
  return (
    license === "CC0-1.0"
    || license === "PDDL"
    || license === "ODbL-1.0"
    || license === "ODC-BY-1.0"
    || license === "DbCL-1.0"
    || license.startsWith("CC-BY-")
  );
}

export function assertRedistributableSource(source) {
  const license = source?.license || source?.licenses?.[0]?.name;
  if (!isRedistributableLicense(license)) {
    throw new Error(`Dataset license blocked: ${license || "missing"}`);
  }
  return true;
}

export function filterRedistributableSources(sources = []) {
  return sources.filter((source) => isRedistributableLicense(source.license || source.licenses?.[0]?.name));
}

