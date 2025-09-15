# MMM-sbb

A modern MagicMirror² module showing Swiss public transport departures (SBB, IR, IC, S-Bahn, etc.), with grouping and SBB-style line colours.

Data: transport.opendata.ch

## Features
- Next departures for a station (e.g., Rotkreuz)
- Optional destination filter (e.g., to Zürich HB)
- Group by train type (S/IR/IC/RE/…)
- SBB-like line colours
- Relative or absolute time
- Track and delay display

## Options
station: Station name or ID (string, required)
to: Destination filter (string, optional)
maxDepartures: number of rows (default 8)
updateInterval: fetch interval in ms (default 60000)
timeFormat: "relative" shows "in X Min", "absolute" shows HH:MM
showLine: show line badge (default true)
showTrack: show platform (default true)
showDelay: show delay minutes if available (default true)
groupByType: group by S/IR/IC/… (default true)

## Styling
Colours can be adjusted in styles.css. The module assigns classes like:

.type-s, .type-ir, .type-ic, .type-re, .type-ec, .type-rjx, .type-r, .type-bus, .type-tram, .type-other

## Notes
This module queries https://transport.opendata.ch/v1/stationboard (no API key).
To include buses/trams, remove or adjust the transportations[] filter in node_helper.js.
