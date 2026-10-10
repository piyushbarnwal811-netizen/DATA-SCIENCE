import { useMemo, useState } from "react";
import { COMMON_BRANCHES, COMMON_SECTIONS } from "../utils/collegeOptions.js";

const CUSTOM_VALUE = "__custom__";

export default function BranchSectionFields({
  branch,
  section,
  departments = [],
  onChange,
  branchLabel = "Branch",
  sectionLabel = "Section",
  idPrefix = "campus"
}) {
  const branchOptions = useMemo(
    () => [...new Set([
      ...COMMON_BRANCHES.filter((name) => name !== "Other"),
      ...departments.map((department) => department.name)
    ])].sort((a, b) => a.localeCompare(b)),
    [departments]
  );
  const sectionOptions = useMemo(
    () => [...new Set([
      ...COMMON_SECTIONS,
      ...(
        departments.find((department) => department.name === branch)?.sections ?? []
      )
    ])].sort((a, b) => {
      const aIsLetter = /^[A-P]$/.test(a);
      const bIsLetter = /^[A-P]$/.test(b);
      if (aIsLetter && bIsLetter) return a.localeCompare(b);
      if (aIsLetter) return -1;
      if (bIsLetter) return 1;
      return a.localeCompare(b);
    }),
    [branch, departments]
  );
  const [customBranch, setCustomBranch] = useState(false);
  const [customSection, setCustomSection] = useState(false);

  const isCustomBranch = customBranch || (branch && !branchOptions.includes(branch));
  const isCustomSection = customSection || (section && !sectionOptions.includes(section));

  const updateBranch = (value) => {
    if (value === CUSTOM_VALUE) {
      setCustomBranch(true);
      onChange({ branch: "", section: "" });
      return;
    }
    setCustomBranch(false);
    onChange({ branch: value, section: "" });
  };

  const updateSection = (value) => {
    if (value === CUSTOM_VALUE) {
      setCustomSection(true);
      onChange({ branch, section: "" });
      return;
    }
    setCustomSection(false);
    onChange({ branch, section: value });
  };

  return (
    <div className="branch-section-fields">
      <label className="form-label" htmlFor={`${idPrefix}-branch`}>
        {branchLabel}
        <select
          id={`${idPrefix}-branch`}
          required
          value={isCustomBranch ? CUSTOM_VALUE : branch}
          onChange={(event) => updateBranch(event.target.value)}
        >
          <option value="">Choose branch</option>
          {branchOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          <option value={CUSTOM_VALUE}>Other / enter branch</option>
        </select>
      </label>
      {isCustomBranch && (
        <label className="form-label" htmlFor={`${idPrefix}-branch-custom`}>
          Enter branch name
          <input
            id={`${idPrefix}-branch-custom`}
            className="plain-input"
            value={branch}
            onChange={(event) => onChange({ branch: event.target.value, section: "" })}
            placeholder="Type your college branch"
            maxLength={100}
            required
          />
        </label>
      )}
      <label className="form-label" htmlFor={`${idPrefix}-section`}>
        {sectionLabel}
        <select
          id={`${idPrefix}-section`}
          required
          disabled={!branch.trim()}
          value={isCustomSection ? CUSTOM_VALUE : section}
          onChange={(event) => updateSection(event.target.value)}
        >
          <option value="">Choose section</option>
          {sectionOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          <option value={CUSTOM_VALUE}>Other / enter section</option>
        </select>
      </label>
      {isCustomSection && (
        <label className="form-label" htmlFor={`${idPrefix}-section-custom`}>
          Enter section
          <input
            id={`${idPrefix}-section-custom`}
            className="plain-input"
            value={section}
            onChange={(event) => onChange({ branch, section: event.target.value })}
            placeholder="Type your section"
            maxLength={40}
            required
          />
        </label>
      )}
    </div>
  );
}
