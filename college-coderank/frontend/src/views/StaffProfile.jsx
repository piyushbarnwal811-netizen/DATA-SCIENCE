"use client";

import { useEffect, useState } from "react";
import { Check, Save, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../services/api.js";

export default function StaffProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", qualification: user?.qualification || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      qualification: user?.qualification || ""
    });
  }, [user?.name, user?.phone, user?.qualification]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.patch("/auth/me", form);
      updateUser(data.user);
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-intro">
        <div className="page-intro__line">
          <div>
            <h1>My profile</h1>
            <p>Update your personal contact details. Your login email, role, and college assignments are managed securely.</p>
          </div>
          <span className="page-intro__icon"><UserRound size={25} /></span>
        </div>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {notice && <div className="inline-success" role="status"><Check size={16} />{notice}</div>}

      <section className="section-card profile-links-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{(user?.role || "staff").replaceAll("_", " ").toUpperCase()}</span>
            <h2>Account details</h2>
          </div>
        </div>
        <form className="handles-form" onSubmit={saveProfile}>
          <label className="handle-input">
            <span className="handle-input__body">
              <small>Full name</small>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={120}
                required
              />
            </span>
          </label>
          <label className="handle-input">
            <span className="handle-input__body">
              <small>Login email (managed by administrator)</small>
              <input value={user?.email || ""} readOnly />
            </span>
          </label>
          <label className="handle-input">
            <span className="handle-input__body">
              <small>Phone number</small>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={30}
              />
            </span>
          </label>
          <label className="handle-input">
            <span className="handle-input__body">
              <small>Qualification</small>
              <input
                value={form.qualification}
                onChange={(event) => setForm({ ...form, qualification: event.target.value })}
                maxLength={120}
              />
            </span>
          </label>
          <div className="form-actions">
            <span>Role and assigned college scope cannot be changed here.</span>
            <button className="button button--primary" type="submit" disabled={busy}>
              <Save size={15} /> {busy ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
