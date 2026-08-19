// Renders a DOM node (expected to contain one or more ".pdf-page" A4 sections,
// see index.css) straight to a downloaded PDF file — no server, no viewing
// step. "mode: css" makes html2pdf respect the page-break CSS already applied
// to .pdf-page / .pdf-avoid-break so pages split cleanly rather than mid-card.
// html2pdf bundles jsPDF + html2canvas (~900KB) — imported dynamically so it's
// only fetched when someone actually downloads a summary, not on every page load.
//
// We use html2pdf only up through its DOM-mutation + capture steps (toContainer
// inserts the page-break padding, toCanvas renders it) and then assemble the
// PDF ourselves instead of calling its own toPdf()/save(). Its own pagination
// (worker.js toPdf) computes pxPageHeight via Math.floor(canvas.width *
// pageRatio) — that floor() means a page height intended to land on an exact
// multiple of the page size almost always ends up a few canvas-px short, so
// `pxFullHeight % pxPageHeight` is (almost) never exactly 0 and it ceil-rounds
// in one extra, near-blank trailing page. Redoing just that last slicing step
// lets us drop a trailing sliver under a few mm instead of turning it into a
// whole extra page.
export async function downloadSummaryPdf(node, filename = "route-to-retire-retirement-summary.pdf") {
  if (!node) return;
  const [{ default: html2pdf }, { jsPDF }] = await Promise.all([
    import("html2pdf.js"),
    import("jspdf"),
  ]);

  await html2pdf()
    .set({
      margin: 0,
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css"] },
    })
    .from(node)
    .toContainer()
    .toCanvas()
    .then(function assemblePdf() {
      const canvas = this.prop.canvas;
      const pageSize = this.prop.pageSize;
      const pxPageHeight = Math.floor(canvas.width * pageSize.inner.ratio);
      const minTrailingPx = pxPageHeight * 0.03; // drop a trailing sliver under ~3% of a page

      let fullHeight = canvas.height;
      const remainder = fullHeight % pxPageHeight;
      if (remainder > 0 && remainder < minTrailingPx) fullHeight -= remainder;
      const nPages = Math.max(1, Math.ceil(fullHeight / pxPageHeight));

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      const ctx = pageCanvas.getContext("2d");

      for (let page = 0; page < nPages; page++) {
        const sliceHeight = page === nPages - 1 ? fullHeight - page * pxPageHeight : pxPageHeight;
        pageCanvas.height = sliceHeight;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, sliceHeight);
        ctx.drawImage(canvas, 0, page * pxPageHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        if (page > 0) pdf.addPage();
        const imgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        const sliceHeightMm = (sliceHeight * pageSize.inner.width) / canvas.width;
        pdf.addImage(imgData, "JPEG", 0, 0, pageSize.inner.width, sliceHeightMm);
      }

      pdf.save(filename);
    });
}
