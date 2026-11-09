export const DEMO_NOTICE_TEXT =
  "Demo store: brand and products are fictional, orders are not fulfilled.";

export function DemoNotice() {
  return (
    <div role="note" className="bg-ink px-4 py-2 text-center text-xs text-paper sm:text-sm">
      {DEMO_NOTICE_TEXT}
    </div>
  );
}
