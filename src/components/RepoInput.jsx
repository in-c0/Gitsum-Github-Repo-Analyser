import { useState } from "react";
import { parseRepoInput } from "../lib/github";

const RepoInput = ({ onSubmit, initialValue = "", compact = false, autoFocus = false }) => {
  const [value, setValue] = useState(initialValue);
  const [invalid, setInvalid] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const target = parseRepoInput(value);
    if (!target) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSubmit(target);
  };

  return (
    <form className={compact ? "repo-form repo-form--compact" : "repo-form"} onSubmit={submit} noValidate>
      <label htmlFor={compact ? "repo-input-compact" : "repo-input"} className="sr-only">
        GitHub repository
      </label>
      <input
        id={compact ? "repo-input-compact" : "repo-input"}
        className="repo-input"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder="owner/repo or github.com URL"
        value={value}
        aria-invalid={invalid}
        aria-describedby={invalid ? "repo-input-error" : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
      />
      <button type="submit" className="repo-submit">
        Analyse
      </button>
      {invalid && (
        <p id="repo-input-error" className="input-error" role="alert">
          That doesn&apos;t look like a GitHub repository. Use <code>owner/repo</code> or a github.com link.
        </p>
      )}
    </form>
  );
};

export default RepoInput;
