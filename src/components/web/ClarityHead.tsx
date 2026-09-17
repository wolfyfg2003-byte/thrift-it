import { CLARITY_PROJECT_ID, clarityHeadScript } from "@/lib/clarity";

/** Session recordings on waitlist landers only. Mask email in the form, not here. */
export function ClarityHead() {
  if (!CLARITY_PROJECT_ID) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: clarityHeadScript(CLARITY_PROJECT_ID) }}
    />
  );
}
