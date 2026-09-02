"use client";

import AppDock from "@/components/AppDock";
import { SellDropCard } from "@/components/SellDropCard";
import { SellPlusPaywall } from "@/components/SellPlusPaywall";
import { formatAed } from "@/lib/checkout";
import { sellerPayout } from "@/lib/payout";
import {
  SELLER_ROLE_OPTIONS,
  canScheduleDrop,
  type SellerRole,
} from "@/lib/seller-role";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const CONDITIONS = ["Pristine", "Excellent", "Gently Used"] as const;

const BRAND_SUGGESTIONS = [
  "House of CB",
  "Self-Portrait",
  "Rat & Boa",
  "Bouguessa",
  "Bambah",
  "Dima Ayad",
  "Hessa",
  "Amena",
  "Abadia",
  "Nafsika Skourti",
];

type Condition = (typeof CONDITIONS)[number] | "";

type FieldErrors = {
  photo?: string;
  brand?: string;
  size?: string;
  condition?: string;
  originalRetail?: string;
  sellingPrice?: string;
};

type ListingDraft = {
  brand: string;
  size: string;
  condition: string;
  original_retail_price: number;
  price: number;
  original_photo_name: string;
  escrow_status: "none";
  is_consignment: boolean;
  seller_share: number;
  concierge_share: number;
};

function looksLikeScreenshot(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const screenshotName =
    /screenshot|screen[ _-]?shot|screenclip|snip|capture/i.test(name);
  const stockName = /unsplash|pexels|shutterstock|getty|stock/i.test(name);
  return screenshotName || stockName || (type === "image/png" && screenshotName);
}

function isAllowedPhoto(file: File): boolean {
  const type = file.type.toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/webp" ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/png"
  );
}

export default function SellPage() {
  const photoId = useId();
  const vipId = useId();
  const brandListId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<Condition>("");
  const [originalRetail, setOriginalRetail] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [vip, setVip] = useState(false);
  const [sellerRole, setSellerRole] = useState<SellerRole>("free");
  const [dropEnabled, setDropEnabled] = useState(false);
  const [premiumUsed, setPremiumUsed] = useState(false);
  const [dropAt, setDropAt] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [dropToast, setDropToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [draft, setDraft] = useState<ListingDraft | null>(null);

  const selling = Number(sellingPrice);
  const retail = Number(originalRetail);
  const payout = useMemo(
    () => sellerPayout(Number.isFinite(selling) ? selling : 0, vip),
    [selling, vip],
  );
  const vsRetail =
    Number.isFinite(retail) && retail > 0 && Number.isFinite(selling) && selling > 0
      ? Math.round((1 - selling / retail) * 100)
      : null;

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const acceptPhoto = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!isAllowedPhoto(file)) {
      setErrors((prev) => ({
        ...prev,
        photo: "Use a JPEG, HEIC, or WebP from your phone camera — not a scan.",
      }));
      return;
    }
    if (looksLikeScreenshot(file)) {
      setErrors((prev) => ({
        ...prev,
        photo:
          "Screenshots and catalog pulls are blocked. Photograph the garment with your phone camera.",
      }));
      setPhoto(null);
      return;
    }
    setPhoto(file);
    setErrors((prev) => ({ ...prev, photo: undefined }));
  }, []);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptPhoto(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptPhoto(event.dataTransfer.files[0]);
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!photo) {
      next.photo = "Add an original phone photo so buyers can trust the piece.";
    }
    if (!brand.trim()) next.brand = "Enter the brand as it appears on the label.";
    if (!size.trim()) next.size = "Add a size (for example M, UK 10, or EU 38).";
    if (!condition) next.condition = "Choose the closest condition.";
    if (!Number.isFinite(retail) || retail <= 0) {
      next.originalRetail = "Enter the original retail price in AED.";
    }
    if (!Number.isFinite(selling) || selling <= 0) {
      next.sellingPrice = "Enter your selling price in AED.";
    }
    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !photo) return;

    setStatus("saving");
    const split = sellerPayout(selling, vip);
    const payload: ListingDraft = {
      brand: brand.trim(),
      size: size.trim(),
      condition,
      original_retail_price: Math.round(retail),
      price: split.selling_price,
      original_photo_name: photo.name,
      escrow_status: "none",
      is_consignment: split.is_consignment,
      seller_share: split.seller_share,
      concierge_share: split.concierge_share,
    };

    window.setTimeout(() => {
      setDraft(payload);
      setStatus("saved");
    }, 220);
  };

  const reset = () => {
    setPhoto(null);
    setBrand("");
    setSize("");
    setCondition("");
    setOriginalRetail("");
    setSellingPrice("");
    setVip(false);
    setDropEnabled(false);
    setErrors({});
    setDraft(null);
    setStatus("idle");
  };

  const flashDropToast = (message: string) => {
    setDropToast(message);
    window.setTimeout(() => setDropToast(null), 2800);
  };

  const chooseRole = (role: SellerRole) => {
    setSellerRole(role);
    setDropEnabled(false);
    setPremiumUsed(false);
    setPaywallOpen(false);
  };

  const toggleDrop = () => {
    if (dropEnabled) {
      setDropEnabled(false);
      return;
    }
    if (sellerRole === "free") {
      setPaywallOpen(true);
      return;
    }
    if (sellerRole === "premium" && premiumUsed) {
      flashDropToast(
        "You have used your 1 premium drop for this month! Upgrades coming soon.",
      );
      return;
    }
    if (!canScheduleDrop(sellerRole, premiumUsed)) return;
    if (sellerRole === "premium") setPremiumUsed(true);
    if (!dropAt) setDropAt(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    setDropEnabled(true);
    window.setTimeout(() => {
      const field = document.querySelector<HTMLElement>("[data-drop-date]");
      if (!field) return;
      const dock = 11.5 * 16;
      const top = field.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, top - (window.innerHeight - dock - 80)),
        behavior: "smooth",
      });
    }, 360);
  };

  return (
    <main
      className={`mx-auto min-h-dvh w-full max-w-[28rem] bg-[#F9F6F0] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] ${
        dropEnabled
          ? "pb-[calc(22rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(9.75rem+env(safe-area-inset-bottom))]"
      }`}
    >
      {process.env.NODE_ENV !== "production" ? (
        <div className="mb-6">
          <p className="text-[12px] leading-4 text-[oklch(0.5_0.02_55)]">
            Testing Role Switcher
          </p>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SELLER_ROLE_OPTIONS.map((option) => {
              const selected = sellerRole === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseRole(option.id)}
                  className={`h-8 shrink-0 rounded-full px-3 text-[12px] transition-colors duration-200 ${
                    selected
                      ? "bg-[oklch(0.9_0.02_75)] font-semibold text-[oklch(0.32_0.04_55)]"
                      : "border border-[oklch(0.88_0.018_80)] font-medium text-[oklch(0.5_0.02_55)]"
                  }`}
                  style={{ transitionTimingFunction: EASE }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {dropToast ? (
        <p
          role="status"
          className="pointer-events-none fixed top-[max(0.85rem,env(safe-area-inset-top))] left-1/2 z-40 w-[min(calc(100%-2.5rem),24rem)] -translate-x-1/2 rounded-full bg-[oklch(0.28_0.04_55)] px-4 py-2.5 text-center text-[12px] leading-4 text-[oklch(0.96_0.02_85)] motion-safe:animate-[drop-toast_2.4s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          {dropToast}
        </p>
      ) : null}

      <header className="max-w-[40ch]">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Seller Upload
        </h1>
        <p className="mt-3 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          Thrift It takes original camera photos only — daylight, full garment,
          no catalog slop.
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="mt-8">
        <div>
          <input
            ref={fileRef}
            id={photoId}
            type="file"
            accept="image/jpeg,image/jpg,image/webp,image/heic,image/heif,image/png"
            capture="environment"
            className="sr-only"
            onChange={onFileChange}
          />

          <label
            htmlFor={photoId}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative block aspect-[4/5] cursor-pointer overflow-hidden rounded-[1.5rem] border bg-[oklch(0.96_0.01_82)] transition-[border-color,box-shadow] duration-200 ${
              dragging
                ? "border-[oklch(0.48_0.12_52)] shadow-[0_16px_32px_-18px_oklch(0.35_0.08_52/0.35)]"
                : errors.photo
                  ? "border-[oklch(0.62_0.1_40)]"
                  : "border-[oklch(0.88_0.018_80)]"
            }`}
            style={{ transitionTimingFunction: EASE }}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Garment preview"
                  className="size-full object-cover motion-safe:animate-[photo-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
                />
                <span className="absolute inset-x-0 bottom-0 flex justify-center bg-[oklch(0.22_0.025_55/0.42)] py-3 text-[14px] font-semibold text-[oklch(0.98_0.012_85)]">
                  Replace photo
                </span>
              </>
            ) : (
              <span className="flex size-full flex-col items-center justify-center px-8">
                <Viewfinder />
                <span className="mt-6 text-center font-[family-name:var(--font-display)] text-[22px] leading-7 text-[oklch(0.22_0.025_55)]">
                  Drop a phone photo
                </span>
                <span className="mt-1 text-center text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                  or tap to open the camera
                </span>
              </span>
            )}
            <ViewfinderCorners />
          </label>

          <p className="mt-3 max-w-[44ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
            We only allow original, phone-camera photos to guarantee authenticity
            and keep screenshots, lookbook pulls, and catalog slop off the rack.
          </p>
          {errors.photo ? (
            <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
              {errors.photo}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-5">
          <Field
            id="brand"
            label="Brand name"
            error={errors.brand}
            value={brand}
            list={brandListId}
            onChange={(value) => {
              setBrand(value);
              setErrors((prev) => ({ ...prev, brand: undefined }));
            }}
            autoComplete="off"
            placeholder="House of CB, Self-Portrait, Bouguessa…"
          />
          <datalist id={brandListId}>
            {BRAND_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <Field
            id="size"
            label="Size"
            error={errors.size}
            value={size}
            onChange={(value) => {
              setSize(value);
              setErrors((prev) => ({ ...prev, size: undefined }));
            }}
            placeholder="M, UK 10, EU 38"
          />

          <div>
            <label
              htmlFor="condition"
              className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
            >
              Condition
            </label>
            <div className="relative mt-1.5">
              <select
                id="condition"
                value={condition}
                aria-invalid={errors.condition ? true : undefined}
                onChange={(event) => {
                  setCondition(event.target.value as Condition);
                  setErrors((prev) => ({ ...prev, condition: undefined }));
                }}
                className="h-12 w-full appearance-none rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 pr-10 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
              >
                <option value="">Select condition</option>
                {CONDITIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Chevron className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[oklch(0.42_0.03_55)]" />
            </div>
            {errors.condition ? (
              <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                {errors.condition}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              id="original-retail"
              label="Original retail"
              error={errors.originalRetail}
              value={originalRetail}
              onChange={(value) => {
                setOriginalRetail(value);
                setErrors((prev) => ({ ...prev, originalRetail: undefined }));
              }}
              inputMode="decimal"
              prefix="AED"
              placeholder="0"
            />
            <Field
              id="selling-price"
              label="Your selling price"
              error={errors.sellingPrice}
              value={sellingPrice}
              onChange={(value) => {
                setSellingPrice(value);
                setErrors((prev) => ({ ...prev, sellingPrice: undefined }));
              }}
              inputMode="decimal"
              prefix="AED"
              placeholder="0"
            />
          </div>
          {vsRetail != null && vsRetail > 0 ? (
            <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
              Buyers see {vsRetail}% under original retail.
            </p>
          ) : null}
        </div>

        <section
          className={`mt-8 rounded-[1.35rem] px-4 py-4 transition-colors duration-200 ${
            vip ? "bg-[oklch(0.945_0.02_72)]" : "bg-[oklch(0.96_0.01_82)]"
          }`}
          style={{ transitionTimingFunction: EASE }}
          aria-live="polite"
        >
          <p className="text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            {vip ? "VIP 50/50 profit split" : "0% seller commission"}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {formatAed(payout.seller_share)}
          </p>
          <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            {vip
              ? `You keep 50% · Thrift It keeps ${formatAed(payout.concierge_share)} for the Closet Detox.`
              : "Standard listing — you keep 100% of the selling price. We never take a listing cut."}
          </p>
          {vip && payout.selling_price > 0 ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px] leading-4">
              <div>
                <dt className="text-[oklch(0.42_0.03_55)]">Your payout</dt>
                <dd className="mt-1 text-[14px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(payout.seller_share)}
                </dd>
              </div>
              <div>
                <dt className="text-[oklch(0.42_0.03_55)]">Thrift It 50%</dt>
                <dd className="mt-1 text-[14px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(payout.concierge_share)}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>

        <div className="mt-6 flex items-start gap-4">
          <button
            id={vipId}
            type="button"
            role="switch"
            aria-checked={vip}
            onClick={() => setVip((value) => !value)}
            className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
              vip ? "bg-[oklch(0.48_0.12_52)]" : "bg-[oklch(0.82_0.02_75)]"
            }`}
            style={{ transitionTimingFunction: EASE }}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-[#F9F6F0] shadow-[0_4px_10px_-4px_oklch(0.22_0.03_55/0.35)] transition-transform duration-200 ${
                vip ? "translate-x-5" : "translate-x-0"
              }`}
              style={{ transitionTimingFunction: EASE }}
            />
          </button>
          <label htmlFor={vipId} className="min-w-0 cursor-pointer">
            <span className="block font-[family-name:var(--font-display)] text-[20px] leading-7 text-[oklch(0.22_0.025_55)]">
              Request Thrift It VIP Managed Closet Detox
            </span>
            {vip ? (
              <span className="mt-1 block max-w-[42ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                We handle courier pickup, photography, listing, and storage. The
                sale splits 50/50 once the piece is sold through escrow.
              </span>
            ) : (
              <span className="mt-1 block max-w-[42ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                Leave off to self-list. You photograph, you price, you keep the
                full selling price.
              </span>
            )}
          </label>
        </div>

        {sellerRole !== "free" ? (
          <SellDropCard
            role={sellerRole}
            enabled={dropEnabled}
            premiumUsed={premiumUsed}
            dropAt={dropAt}
            onToggle={toggleDrop}
            onDropAtChange={setDropAt}
          />
        ) : null}

        {status === "saved" && draft ? (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-[oklch(0.94_0.02_145)] px-3.5 py-3 text-[14px] leading-5 text-[oklch(0.32_0.06_145)]"
          >
            {draft.is_consignment
              ? `VIP Closet Detox requested for ${draft.brand}. 50/50 split locked.`
              : `${draft.brand} queued as a self-list. 0% seller commission.`}
            <button
              type="button"
              onClick={reset}
              className="ml-2 font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
            >
              List another
            </button>
          </p>
        ) : null}

        <div className="fixed inset-x-0 bottom-[calc(4.15rem+env(safe-area-inset-bottom))] z-20 border-t border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-5 py-3">
          <div className="mx-auto max-w-[28rem]">
            <button
              type="submit"
              disabled={status === "saving"}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] active:bg-[oklch(0.38_0.11_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
              style={{ transitionTimingFunction: EASE }}
            >
              {status === "saving"
                ? "Saving listing…"
                : vip
                  ? "Request Closet Detox"
                  : "List this piece"}
            </button>
          </div>
        </div>
      </form>

      <SellPlusPaywall
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setSellerRole("premium");
          setPremiumUsed(false);
          setPaywallOpen(false);
        }}
      />

      <AppDock />
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  prefix,
  inputMode,
  autoComplete,
  list,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  prefix?: string;
  inputMode?: "decimal";
  autoComplete?: string;
  list?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        {label}
      </label>
      <div
        className={`mt-1.5 flex h-12 items-center rounded-2xl border bg-[#F9F6F0] px-3.5 ${
          error ? "border-[oklch(0.62_0.1_40)]" : "border-[oklch(0.88_0.018_80)]"
        } focus-within:border-[oklch(0.48_0.12_52)]`}
      >
        {prefix ? (
          <span className="mr-2 text-[14px] text-[oklch(0.42_0.03_55)]">{prefix}</span>
        ) : null}
        <input
          id={id}
          value={value}
          list={list}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full bg-transparent text-[16px] text-[oklch(0.22_0.025_55)] tabular-nums outline-none placeholder:text-[oklch(0.5_0.025_55)]"
        />
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Viewfinder() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className="text-[oklch(0.22_0.025_55)]"
    >
      <rect x="8" y="14" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="28" cy="29" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M20 14V12.5A2.5 2.5 0 0 1 22.5 10h11A2.5 2.5 0 0 1 36 12.5V14"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ViewfinderCorners() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-3">
      <span className="absolute top-0 left-0 h-5 w-5 border-t border-l border-[oklch(0.22_0.025_55/0.35)]" />
      <span className="absolute top-0 right-0 h-5 w-5 border-t border-r border-[oklch(0.22_0.025_55/0.35)]" />
      <span className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-[oklch(0.22_0.025_55/0.35)]" />
      <span className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-[oklch(0.22_0.025_55/0.35)]" />
    </span>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 5 7 9.5 11.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
