/* global Module */
Module.register("MMM-sbb", {
  defaults: {
    station: "Rotkreuz",
    to: "",
    maxDepartures: 8,
    updateInterval: 60 * 1000,
    timeFormat: "relative",
    showLine: true,
    showTrack: true,
    showDelay: true,
    groupByType: true
  },

  start() {
    this.loaded = false;
    this.error = null;
    this.departures = [];
    this.sendSocketNotification("SBB_CONFIG", this.config);
  },

  getStyles() {
    return ["styles.css"];
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SBB_DATA") {
      this.loaded = true;
      this.error = null;
      this.departures = payload || [];
      this.updateDom();
    } else if (notification === "SBB_ERROR") {
      this.error = payload || "Unknown error";
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (this.error) {
      wrapper.className = "small dimmed";
      wrapper.textContent = `SBB: ${this.error}`;
      return wrapper;
    }

    if (!this.loaded) {
      wrapper.className = "small dimmed";
      wrapper.textContent = "Lade Abfahrten…";
      return wrapper;
    }

    if (!this.departures.length) {
      wrapper.className = "small dimmed";
      wrapper.textContent = "Keine Abfahrten gefunden.";
      return wrapper;
    }

    if (this.config.groupByType) {
      const grouped = this.groupByType(this.departures);
      Object.keys(grouped).sort(this.sortTypeOrder).forEach(type => {
        const section = document.createElement("div");
        section.className = "sbb-group";

        const header = document.createElement("div");
        header.className = "sbb-group-header";
        header.textContent = this.humanType(type);
        section.appendChild(header);

        grouped[type].forEach(dep => section.appendChild(this.renderRow(dep)));
        wrapper.appendChild(section);
      });
    } else {
      this.departures.forEach(dep => wrapper.appendChild(this.renderRow(dep)));
    }

    return wrapper;
  },

  renderRow(dep) {
    const row = document.createElement("div");
    row.className = "sbb-row";

    if (this.config.showLine) {
      const line = document.createElement("span");
      const lineText = dep.line || "";
      const typeClass = this.getTypeClass(lineText);
      line.className = `line ${typeClass}`;
      line.textContent = lineText || "—";
      row.appendChild(line);
    }

    const dest = document.createElement("span");
    dest.className = "dest";
    dest.textContent = dep.to || "";
    row.appendChild(dest);

    if (this.config.showTrack) {
      const track = document.createElement("span");
      track.className = "track";
      track.textContent = dep.track ? `Gleis ${dep.track}` : "";
      row.appendChild(track);
    }

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = this.config.timeFormat === "absolute" ? dep.timeAbs : this.asRelative(dep.when);
    row.appendChild(time);

    if (this.config.showDelay && dep.delay && dep.delay > 0) {
      const delay = document.createElement("span");
      delay.className = "delay";
      delay.textContent = `+${dep.delay}`;
      row.appendChild(delay);
    }

    return row;
  },

  groupByType(list) {
    return list.reduce((acc, dep) => {
      const t = this.getTypeKey(dep.line);
      acc[t] = acc[t] || [];
      acc[t].push(dep);
      return acc;
    }, {});
  },

  sortTypeOrder(a, b) {
    const order = ["IC", "EC", "RJX", "IR", "RE", "S", "R", "BUS", "TRAM", "OTHER"];
    const ia = order.indexOf(a) === -1 ? order.length : order.indexOf(a);
    const ib = order.indexOf(b) === -1 ? order.length : order.indexOf(b);
    return ia - ib;
  },

  humanType(t) {
    const map = { IC: "InterCity", EC: "EuroCity", RJX: "Railjet", IR: "InterRegio", RE: "RegioExpress", S: "S-Bahn", R: "Regio", BUS: "Bus", TRAM: "Tram", OTHER: "Andere" };
    return map[t] || t;
  },

  getTypeKey(line = "") {
   const L = (line || "").toUpperCase();
   if (L.startsWith("IC")) return "IC";
   if (L.startsWith("EC")) return "EC";
   if (L.startsWith("RJX")) return "RJX";
   if (L.startsWith("IR")) return "IR";
   if (L.startsWith("RE")) return "RE";
   if (L.startsWith("S")) return "S";
   if (/^\d+$/.test(L)) return "R"; // purely numeric lines
   if (L.startsWith("R")) return "R";
   if (L.startsWith("BUS")) return "BUS";
   if (L.startsWith("TRAM")) return "TRAM";
   return "OTHER";
 },

  getTypeClass(line = "") {
    const key = this.getTypeKey(line);
    return `type-${key.toLowerCase()}`;
  },

  asRelative(whenISO) {
    const now = Date.now();
    const t = new Date(whenISO).getTime();
    const diffMin = Math.round((t - now) / 60000);
    if (diffMin <= 0) return "jetzt";
    if (diffMin === 1) return "in 1 Min";
    return `in ${diffMin} Min`;
  }
});
