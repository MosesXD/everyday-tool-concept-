(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat("en-TT", { style: "currency", currency: "TTD", maximumFractionDigits: 0 });
  const fields = ["projectType", "pages", "complexity", "copy", "responsive", "rush", "rate"];
  const form = $("estimateForm"), message = $("message");
  function calculate() {
    const base = Number($("projectType").value), pages = Number($("pages").value);
    const complexity = Number($("complexity").value), rate = Number($("rate").value);
    const extras = ($("copy").checked ? 500 : 0) + ($("responsive").checked ? 350 : 0);
    const rush = $("rush").checked ? 1.25 : 1;
    const pageFactor = 1 + Math.max(0, pages - 1) * 0.08;
    const rateFactor = rate > 0 ? Math.max(0.75, Math.min(1.5, rate / 250)) : 1;
    const midpoint = (base * pageFactor * complexity + extras) * rush * rateFactor;
    const low = Math.round(midpoint * 0.85), high = Math.round(midpoint * 1.2);
    $("pagesOut").value = String(pages);
    $("estimate").textContent = `${money.format(low)} – ${money.format(high)}`;
    $("breakdown").textContent = `Planning midpoint ${money.format(Math.round(midpoint))} · editable demo assumptions, not a market-validated quote.`;
    return { low, high, midpoint: Math.round(midpoint) };
  }
  fields.forEach(id => $(id).addEventListener("input", () => { message.textContent = ""; calculate(); }));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const result = calculate();
    const summary = ["Daymark project planning estimate", `Estimated range: ${money.format(result.low)} – ${money.format(result.high)}`, `Planning midpoint: ${money.format(result.midpoint)}`, "Demo estimate only. Confirm scope, revisions, timeline, expenses, and terms before quoting."].join("\n");
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(summary);
      message.textContent = "Estimate summary copied. Review and adjust it before sharing.";
    } catch (error) { message.textContent = summary; }
  });
  calculate();
})();