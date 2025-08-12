(function () {
  function createStyles() {
    const css = `
#bev-embed-btn { position: fixed; right: 20px; bottom: 20px; z-index: 999999;
  background: linear-gradient(135deg, #10b981, #60a5fa); color: #000; border-radius: 16px;
  padding: 12px 16px; font-weight: 700; box-shadow: 0 10px 25px rgba(16,185,129,0.4); cursor: pointer; }
#bev-embed-iframe { position: fixed; right: 20px; bottom: 80px; width: 380px; height: 520px;
  border: 0; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none; z-index: 999998; }
#bev-embed-iframe.show { display: block; }
`;
    const s = document.createElement("style");
    s.innerHTML = css;
    document.head.appendChild(s);
  }
  function createUI(host, params) {
    const btn = document.createElement("button");
    btn.id = "bev-embed-btn";
    btn.textContent = "Talk to Bev";
    const iframe = document.createElement("iframe");
    iframe.id = "bev-embed-iframe";
    const q = new URLSearchParams(params).toString();
    iframe.src = `${host}/embed/runner?${q}`;
    btn.addEventListener("click", () => {
      iframe.classList.toggle("show");
    });
    document.body.appendChild(btn);
    document.body.appendChild(iframe);
  }
  window.BevEmbed = {
    init(opts) {
      if (!opts || !opts.host) return console.error("[BevEmbed] missing host");
      const params = {
        venueId: opts.venueId || "demo-venue",
        agentId: opts.agentId || "demo-agent",
        lane: opts.lane || "openai",
      };
      createStyles();
      createUI(opts.host.replace(/\/$/, ""), params);
    },
  };
})();


