"use client";

import { useState, type FormEvent } from "react";
import { submitStockistApplication } from "@/app/(site)/actions/submit-stockist";

type Errors = Partial<Record<"businessName" | "ownerName" | "phone" | "email" | "city", string>>;

const tradingOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "new", label: "Just starting" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "3-10", label: "3 to 10 years" },
  { value: "10+", label: "More than 10 years" },
];

const volumeOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "under-50", label: "Under 50 pieces" },
  { value: "50-200", label: "50 to 200 pieces" },
  { value: "200-500", label: "200 to 500 pieces" },
  { value: "500-1000", label: "500 to 1000 pieces" },
  { value: "1000+", label: "More than 1000 pieces" },
];

/**
 * The stockist application form.
 *
 * Submits to the server action, which writes the application to the database
 * before anything else happens. That is the point: the application is on file
 * even if the person never replies to the follow-up email or never sees the
 * confirmation, which is exactly how applications used to get lost.
 */
export default function StockistForm() {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [yearsTrading, setYearsTrading] = useState("");
  const [monthlyPieces, setMonthlyPieces] = useState("");
  const [brandsCarried, setBrandsCarried] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const next: Errors = {};
    if (businessName.trim().length < 2) next.businessName = "Please give the shop name.";
    if (ownerName.trim().length < 2) next.ownerName = "Please give your name.";
    if (phone.replace(/\D/g, "").length < 6) next.phone = "Please give a working phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please give an email address so we can send the rate card.";
    }
    if (city.trim().length < 2) next.city = "Please give the city you would sell in.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSending(true);
    const result = await submitStockistApplication({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      websiteOrInstagram: website.trim() || undefined,
      yearsTrading: yearsTrading || undefined,
      monthlyPieces: monthlyPieces || undefined,
      brandsCarried: brandsCarried.trim() || undefined,
      message: message.trim() || undefined,
      website: honeypot,
    });
    setSending(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSent(result.reference);
  }

  if (sent) {
    return (
      <div className="border border-line bg-sand p-8">
        <p className="eyebrow">Application received</p>
        <h2 className="display mt-3 text-3xl">Thank you, we have your shop details</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Your application is with us and we will reply within one business day with wholesale
          figures, minimums and lead times. Your reference is{" "}
          <span className="font-medium text-ink">{sent}</span>.
        </p>
        <button
          type="button"
          className="btn btn-outline mt-7"
          onClick={() => {
            setSent(null);
            setBusinessName("");
            setOwnerName("");
            setPhone("");
            setEmail("");
            setCity("");
            setWebsite("");
            setBrandsCarried("");
            setMessage("");
          }}
        >
          Send another application
        </button>
      </div>
    );
  }

  const field = "field";
  const label = "label";
  const errorText = "mt-1.5 text-xs text-maroon";

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="businessName">
            Shop or business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={field}
            autoComplete="organization"
            aria-invalid={Boolean(errors.businessName)}
          />
          {errors.businessName ? (
            <p role="alert" className={errorText}>
              {errors.businessName}
            </p>
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="ownerName">
            Your name
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className={field}
            autoComplete="name"
            aria-invalid={Boolean(errors.ownerName)}
          />
          {errors.ownerName ? (
            <p role="alert" className={errorText}>
              {errors.ownerName}
            </p>
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="stockistPhone">
            Phone
          </label>
          <input
            id="stockistPhone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? (
            <p role="alert" className={errorText}>
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="stockistEmail">
            Email
          </label>
          <input
            id="stockistEmail"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <p role="alert" className={errorText}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="stockistCity">
            City you would sell in
          </label>
          <input
            id="stockistCity"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={field}
            aria-invalid={Boolean(errors.city)}
          />
          {errors.city ? (
            <p role="alert" className={errorText}>
              {errors.city}
            </p>
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="website">
            Website or Instagram <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={field}
            placeholder="instagram.com/yourshop"
          />
        </div>

        <div>
          <label className={label} htmlFor="yearsTrading">
            How long have you been trading?
          </label>
          <select
            id="yearsTrading"
            value={yearsTrading}
            onChange={(e) => setYearsTrading(e.target.value)}
            className={field}
          >
            {tradingOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="monthlyPieces">
            Roughly how many pieces do you sell a month?
          </label>
          <select
            id="monthlyPieces"
            value={monthlyPieces}
            onChange={(e) => setMonthlyPieces(e.target.value)}
            className={field}
          >
            {volumeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="brandsCarried">
          Which brands do you already stock?
        </label>
        <textarea
          id="brandsCarried"
          rows={3}
          value={brandsCarried}
          onChange={(e) => setBrandsCarried(e.target.value)}
          className={`${field} resize-y`}
        />
      </div>

      <div>
        <label className={label} htmlFor="stockistMessage">
          Anything else we should know?
        </label>
        <textarea
          id="stockistMessage"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${field} resize-y`}
          placeholder="The kind of customer you serve, what sells well, how you like to order..."
        />
      </div>

      {/* Honeypot: hidden from people, filled in by bots. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="stockistWebsite">Website</label>
        <input
          id="stockistWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {serverError ? (
        <p role="alert" className="border border-maroon/30 bg-maroon/5 p-4 text-sm text-maroon">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Sending..." : "Send application"}
        </button>
        <p className="text-xs leading-relaxed text-ink-soft">
          Saved to us straight away. We reply within one business day.
        </p>
      </div>
    </form>
  );
}