export default function GambleAware() {
  return (
    <div className="gamble-bar">
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
        18+ · Gamble Responsibly
      </div>
      <div>
        <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer">BeGambleAware.org</a>
        {" · "}
        <a href="https://www.gamstop.co.uk" target="_blank" rel="noopener noreferrer">GamStop</a>
        {" · "}
        <a href="https://www.gamblingtherapy.org" target="_blank" rel="noopener noreferrer">Gambling Therapy</a>
        {" · "}
        <a href="tel:08088020133">0808 802 0133</a>
      </div>
      <div style={{ marginTop: 4, fontSize: 11 }}>
        Tips are for entertainment only. Never bet more than you can afford to lose.
      </div>
    </div>
  );
}