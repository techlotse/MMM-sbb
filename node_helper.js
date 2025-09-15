const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start() {
    this.config = null;
    this.timer = null;
  },

  stop() {
    if (this.timer) clearInterval(this.timer);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SBB_CONFIG") {
      this.config = payload;
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.fetchData(), this.config.updateInterval || 60000);
      this.fetchData();
    }
    if (notification === "SBB_FETCH") {
      this.fetchData();
    }
  },

  fetchData() {
    if (!this.config || !this.config.station) return;
    const url = this.buildStationboardUrl(this.config);

    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const departures = (json.stationboard || [])
            .slice(0, this.config.maxDepartures || 8)
            .map(item => this.mapDeparture(item))
            .filter(Boolean);
          this.sendSocketNotification("SBB_DATA", departures);
        } catch (e) {
          this.sendSocketNotification("SBB_ERROR", e.message);
        }
      });
    }).on("error", err => {
      this.sendSocketNotification("SBB_ERROR", err.message);
    });
  },

  buildStationboardUrl(cfg) {
    const base = "https://transport.opendata.ch/v1/stationboard";
    const params = new URLSearchParams();
    params.set("station", cfg.station);
    params.set("limit", String(cfg.maxDepartures || 8));
    params.append("transportations[]", "train");
    if (cfg.to && cfg.to.trim()) params.set("destination", cfg.to.trim());
    return `${base}?${params.toString()}`;
  },

  mapDeparture(item) {
    try {
      const line = item?.number || item?.name || "";
      const to = item?.to || "";
      const stop = item?.stop || {};
      const when = stop?.departure || stop?.prognosis?.departure || stop?.arrival;
      const timeAbs = when ? new Date(when).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) : "";
      const delay = stop?.prognosis?.departure && stop?.departure
        ? Math.max(0, Math.round((new Date(stop.prognosis.departure) - new Date(stop.departure)) / 60000))
        : (stop?.delay || 0);
      const track = stop?.platform || "";
      return { line, to, when, timeAbs, delay, track };
    } catch {
      return null;
    }
  }
});
