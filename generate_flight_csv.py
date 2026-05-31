#!/usr/bin/env python3
"""
generate_flight_csv.py  ─  GTSU-110 Digital Twin  |  v1.0  2026-05
======================================================================
Generates 5-10 synthetic GTSU-110 flights (50-100 h each) of realistic
1 Hz start-cycle telemetry. Adds Gaussian noise, random micro-spikes,
sinusoidal OAT drift, and wear-driven fault injection.

Output:
  data/flights.db            SQLite master database (indexed for fast API access)
  data/csvs/flight_NNN.csv   Per-flight raw trace CSVs

Usage:
  python generate_flight_csv.py                # 7 flights, seed 42
  python generate_flight_csv.py --flights 10 --seed 99
"""

import argparse, csv, math, os, random, sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Dict, Any

# ── GTSU-110 physical constants ──────────────────────────────────────────────
MAX_NGG_RPM   = 22_000      # RPM at 100 %
NOMINAL_P2P1  = 3.86        # design-point pressure ratio
LIGHTUP_RPM   = 12_625      # Ngg RPM for light-up detection
SELF_SUSTAIN  = 57.4        # % Ngg for self-sustaining idle
GROUND_JPT1   = 900.0       # °C ground limit
FLIGHT_JPT1   = 1020.0      # °C in-flight limit
NOMINAL_CYCLE = 40.0        # seconds

FAULT_IMPROVEMENTS: Dict[str, str] = {
    'hot-start':        'Reduce fuel schedule 8 %. Inspect igniter for fouling. Verify P2/P1 at light-off.',
    'hung-start':       'Verify air supply ≥ 45 psi. Check SECU Ngg closed-loop gain. Inspect turbine nozzle.',
    'compressor-stall': 'Open IGV 2°. Inspect for FOD. Reduce Ngg ramp rate above 80 %.',
    'sensor-drift':     'Swap JPT1 thermocouple. Run channel calibration. Verify connector resistance.',
    'fuel-overshoot':   'Recalibrate stepper-to-flow curve. Check metering valve hysteresis.',
    'slow-light-up':    'Clean igniter plug. Verify fuel primer pressure. Advance ignition timing 1°.',
    'high-vibration':   'Balance starter rotor. Torque-check mounting fasteners. Check bearing clearance.',
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def phase_for(t: float, dur: float) -> str:
    r = t / max(dur, 1e-6)
    if r < 0.15: return 'cranking'
    if r < 0.32: return 'light-up'
    if r < 0.65: return 'acceleration'
    return 'self-sustaining'


@dataclass
class CycleCfg:
    num:         int
    flight_hour: float
    oat:         float
    wear:        float        # 0..1 accumulated wear index
    status:      str          # success | degraded | faulty | aborted
    fault:       Optional[str]


# ── Single cycle trace (1 Hz) ────────────────────────────────────────────────
def gen_cycle(
    rng: random.Random,
    cfg: CycleCfg,
    base_ts: float,
) -> tuple[List[Dict], float, float, float, float]:
    """
    Returns:
        rows            list of 1-second sample dicts
        duration_sec    actual cycle duration
        peak_jpt1       °C
        max_ngg_pct     %
        total_fuel_kg   kg
    """
    # Duration varies with fault
    if cfg.status == 'aborted':
        dur = max(8.0, 18.0 + rng.gauss(0, 4))
    elif cfg.status in ('faulty', 'degraded'):
        dur = NOMINAL_CYCLE + abs(rng.gauss(0, 6))
    else:
        dur = NOMINAL_CYCLE + rng.gauss(0, 1.8)
    dur = max(8.0, dur)

    rows: List[Dict] = []
    peak_jpt1 = 0.0
    max_ngg   = 0.0
    total_fuel = 0.0

    n = int(dur) + 2  # +2 for endpoints

    for i in range(n):
        t = min(float(i), dur)
        r = t / dur
        phase = phase_for(t, dur)

        # ── Ngg (% of max) ────────────────────────────────────────────────
        if cfg.fault == 'hung-start' and r > 0.40:
            ngg_pct = 34.0 + rng.gauss(0, 0.9)
        elif cfg.fault == 'compressor-stall' and r > 0.38:
            ngg_pct = max(0.0, 55.0 * (1 - (r - 0.38) * 7.0))
        else:
            if r < 0.15:
                # Exponential-style cranking: slow start, then faster as inertia
                # overcome — more realistic than a linear ramp
                ngg_pct = 13.5 * math.pow(r / 0.15, 2.1)
            elif r < 0.32:
                # Light-up band: combustion assist kicks in at ~55 % of LIGHTUP_RPM
                ngg_pct = 13.5 + ((r - 0.15) / 0.17) * 38.0
            else:
                ss_target = (92.0 - cfg.wear * 3.5) + rng.gauss(0, 0.3)
                ngg_pct   = 51.5 + (ss_target - 51.5) * math.tanh((r - 0.32) / 0.14)

        # Noise + micro-drop events
        ngg_pct += rng.gauss(0, 0.28)
        if rng.random() < 0.008:          # rare momentary dip
            ngg_pct -= rng.uniform(1.5, 4.0)
        ngg_pct = round(clamp(ngg_pct, 0.0, 102.0), 2)
        ngg_rpm = round(ngg_pct * MAX_NGG_RPM / 100.0)
        max_ngg = max(max_ngg, ngg_pct)

        # ── JPT1 (°C) ────────────────────────────────────────────────────
        # Asymmetric light-off spike: sharp front edge (~3 s rise), slower decay
        # Real combustion ignition propagates fast; heat soak persists longer.
        spike = 0.0
        T_PEAK  = 0.345   # relative position of JPT peak within cycle
        if cfg.fault == 'hot-start':
            # Earlier, taller spike – fuel-rich combustion
            tp = 0.30
            spike = 300.0 * (
                math.exp(-((r - tp) / 0.040) ** 2) if r <= tp
                else math.exp(-((r - tp) / 0.130) ** 2)
            )
        elif 0.28 < r < 0.75:
            spike = 210.0 * (
                math.exp(-((r - T_PEAK) / 0.042) ** 2) if r <= T_PEAK
                else math.exp(-((r - T_PEAK) / 0.155) ** 2)
            )
        if cfg.fault == 'hot-start' and 0.27 < r < 0.56:
            spike += 90.0 * math.sin((r - 0.27) / 0.29 * math.pi)  # secondary soak

        jpt1 = 175.0 + ngg_pct * 7.9 + spike + cfg.wear * 50.0 + rng.gauss(0, 9.0)
        # Rare sensor spike artifact
        if rng.random() < 0.015:
            jpt1 += rng.uniform(28.0, 80.0)
        # High-wear creep drift
        if cfg.wear > 0.7 and phase == 'self-sustaining':
            jpt1 += rng.gauss(0, 6.0)

        jpt1 = round(clamp(jpt1, 20.0, 1032.0), 1)
        peak_jpt1 = max(peak_jpt1, jpt1)

        # ── P2/P1 ─────────────────────────────────────────────────────────
        p2p1 = 1.0 + (NOMINAL_P2P1 - 1.0) * (ngg_pct / 92.0) ** 1.45
        if cfg.fault == 'compressor-stall' and r > 0.38:
            p2p1 -= 0.65
        # Hysteresis noise: slightly larger fluctuation during acceleration phase
        noise_scale = 0.032 if phase == 'acceleration' else 0.019
        p2p1 += rng.gauss(0, noise_scale)
        # Surge flutter spike
        if cfg.fault == 'compressor-stall' and rng.random() < 0.05:
            p2p1 -= rng.uniform(0.2, 0.5)
        # OAT correction: lower compression at higher intake temperature
        p2p1 -= max(0.0, (cfg.oat - 15.0) * 0.003)
        p2p1 = round(clamp(p2p1, 1.0, 4.9), 3)

        # ── OAT (°C) ───────────────────────────────────────────────────────
        oat = round(cfg.oat + rng.gauss(0, 0.4), 1)

        # ── Fuel / Stepper ─────────────────────────────────────────────────
        fuel_demand  = max(0.0, ngg_pct * 0.079)
        if cfg.fault == 'fuel-overshoot' and 0.3 < r < 0.6:
            fuel_demand *= 1.0 + rng.uniform(0.05, 0.18)   # overshoot band
        fuel_flow  = round(max(0.0, fuel_demand + rng.gauss(0, 0.065)), 3)
        stepper    = int(clamp((fuel_demand / 10.0) * 255.0, 0.0, 255.0))
        total_fuel += fuel_flow / 3600.0

        # ── Vibration (mm/s) ───────────────────────────────────────────────
        vib = 0.22 + ngg_pct * 0.016 + cfg.wear * 0.68 + rng.gauss(0, 0.11)
        if cfg.fault == 'high-vibration':
            vib += 2.1 * abs(math.sin(t * 0.85 + rng.uniform(0, 0.5)))
        if rng.random() < 0.007:           # rare vibration spike
            vib += rng.uniform(1.0, 3.5)
        vib = round(max(0.0, vib), 3)

        # ── SECU / BIT / MIL-STD-1553B ───────────────────────────────────
        secu = 0 if cfg.fault == 'sensor-drift' else 1
        bit  = 1 if (secu and cfg.status != 'aborted') else 0
        mil  = ('0x0410' if cfg.fault == 'sensor-drift' else
                '0x0010' if cfg.status == 'faulty'      else
                '0x0008' if cfg.status == 'degraded'    else '0x0000')

        rows.append({
            'ts':            round(base_ts + t, 1),
            'cycle_num':     cfg.num,
            'phase':         phase,
            'jpt1':          jpt1,
            'ngg_rpm':       ngg_rpm,
            'ngg_pct':       ngg_pct,
            'p2p1':          p2p1,
            'oat':           oat,
            'stepper_pos':   stepper,
            'fuel_flow_kgh': fuel_flow,
            'vibration':     vib,
            'secu_healthy':  secu,
            'bit_pass':      bit,
            'mil_bus_word':  mil,
            'status':        cfg.status,
            'fault_reason':  cfg.fault or '',
            'flight_hour':   round(cfg.flight_hour, 3),
        })

    return rows, round(dur, 1), round(peak_jpt1, 1), round(max_ngg, 1), round(total_fuel, 5)


# ── Full flight generator ─────────────────────────────────────────────────────
def gen_flight(flight_id: int, rng: random.Random) -> Dict[str, Any]:
    duration_hrs = rng.uniform(50, 100)

    # Environmental variation: slow sinusoidal OAT (altitude + time of day)
    oat_base  = rng.uniform(-12, 38)    # base ambient temperature
    oat_amp   = rng.uniform(5, 15)      # day/night amplitude
    oat_phase = rng.uniform(0, 2 * math.pi)

    # Approx 2.8–3.3 start cycles per flight hour
    n_cycles = int(duration_hrs * (2.8 + rng.uniform(0, 0.5)) + rng.gauss(0, 8))
    n_cycles = max(30, min(350, n_cycles))

    cycles_meta: List[Dict] = []
    all_rows:    List[Dict] = []
    ts   = 0.0
    wear = 0.0

    for i in range(n_cycles):
        frac        = i / n_cycles
        flight_hour = frac * duration_hrs

        # OAT: sinusoidal variation (4 complete cycles per flight = ~12 h period)
        oat = oat_base + oat_amp * math.sin(oat_phase + frac * 2 * math.pi * 4)
        oat += rng.gauss(0, 1.4)           # local weather noise
        oat = round(clamp(oat, -28.0, 58.0), 1)

        # ── Fault selection (wear-driven probability) ─────────────────────
        raw = rng.random()
        wb  = wear * 0.18
        if raw < 0.02 + wb * 0.25:
            status = 'aborted'
            fault  = rng.choice(['hot-start', 'compressor-stall'])
        elif raw < 0.05 + wb * 0.55:
            status = 'faulty'
            fault  = rng.choice([
                'hung-start', 'fuel-overshoot', 'hot-start',
                'sensor-drift', 'high-vibration',
            ])
        elif raw < 0.18 + wb:
            status = 'degraded'
            fault  = rng.choice(['slow-light-up', 'sensor-drift', 'high-vibration'])
        else:
            status = 'success'
            fault  = None

        cfg = CycleCfg(
            num=i + 1,
            flight_hour=flight_hour,
            oat=oat,
            wear=wear,
            status=status,
            fault=fault,
        )

        rows, dur, peak_jpt1, max_ngg, total_fuel = gen_cycle(rng, cfg, ts)

        for row in rows:
            row['flight_id'] = flight_id

        all_rows.extend(rows)

        cycles_meta.append({
            'cycle_num':     i + 1,
            'flight_hour':   round(flight_hour, 2),
            'status':        status,
            'fault_reason':  fault or '',
            'improvement':   FAULT_IMPROVEMENTS.get(fault, '') if fault else '',
            'duration_sec':  dur,
            'peak_jpt1':     peak_jpt1,
            'max_ngg_pct':   max_ngg,
            'total_fuel_kg': total_fuel,
            'start_ts':      round(ts, 1),
            'end_ts':        round(ts + dur, 1),
        })

        # Inter-cycle gap: 15–45 min idle
        gap_min = rng.uniform(15, 45)
        ts += dur + gap_min * 60.0

        # Wear accumulation (faster on faults)
        wear_delta = (0.0015 if status == 'success'
                      else 0.006 if status == 'degraded'
                      else 0.014)
        wear = min(1.0, wear + wear_delta)

    # Flight summary
    n_ok    = sum(1 for c in cycles_meta if c['status'] == 'success')
    n_fault = sum(1 for c in cycles_meta if c['status'] in ('faulty', 'aborted'))
    sr      = round(n_ok / n_cycles * 100, 1)
    avg_j   = round(sum(c['peak_jpt1'] for c in cycles_meta) / n_cycles, 1)
    fuel_t  = round(sum(c['total_fuel_kg'] for c in cycles_meta), 2)
    total_trace_sec = round(all_rows[-1]['ts'] if all_rows else 0, 0)

    # Generate an ISO-ish date
    month = ((flight_id - 1) % 12) + 1
    day   = ((flight_id * 7) % 27) + 1
    date  = f'2026-{month:02d}-{day:02d}'

    return {
        'flight_id':      flight_id,
        'label':          f'Flight {flight_id:03d}',
        'duration_hrs':   round(duration_hrs, 1),
        'n_cycles':       n_cycles,
        'date':           date,
        'success_rate':   sr,
        'faulty_cycles':  n_fault,
        'avg_jpt1':       avg_j,
        'total_fuel_kg':  fuel_t,
        'total_trace_sec': total_trace_sec,
        'cycles_meta':    cycles_meta,
        'trace':          all_rows,
    }


# ── SQLite schema ─────────────────────────────────────────────────────────────
CREATE_SQL = """
CREATE TABLE flights (
    id              INTEGER PRIMARY KEY,
    label           TEXT    NOT NULL,
    duration_hrs    REAL    NOT NULL,
    n_cycles        INTEGER NOT NULL,
    date            TEXT    NOT NULL,
    success_rate    REAL    NOT NULL,
    faulty_cycles   INTEGER NOT NULL,
    avg_jpt1        REAL    NOT NULL,
    total_fuel_kg   REAL    NOT NULL,
    total_trace_sec REAL    NOT NULL
);

CREATE TABLE cycles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id       INTEGER NOT NULL REFERENCES flights(id),
    cycle_num       INTEGER NOT NULL,
    flight_hour     REAL    NOT NULL,
    status          TEXT    NOT NULL,
    fault_reason    TEXT    NOT NULL DEFAULT '',
    improvement     TEXT    NOT NULL DEFAULT '',
    duration_sec    REAL    NOT NULL,
    peak_jpt1       REAL    NOT NULL,
    max_ngg_pct     REAL    NOT NULL,
    total_fuel_kg   REAL    NOT NULL,
    start_ts        REAL    NOT NULL,
    end_ts          REAL    NOT NULL
);

CREATE TABLE trace (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id       INTEGER NOT NULL REFERENCES flights(id),
    cycle_num       INTEGER NOT NULL,
    ts              REAL    NOT NULL,
    phase           TEXT    NOT NULL,
    jpt1            REAL    NOT NULL,
    ngg_rpm         INTEGER NOT NULL,
    ngg_pct         REAL    NOT NULL,
    p2p1            REAL    NOT NULL,
    oat             REAL    NOT NULL,
    stepper_pos     INTEGER NOT NULL,
    fuel_flow_kgh   REAL    NOT NULL,
    vibration       REAL    NOT NULL,
    secu_healthy    INTEGER NOT NULL,
    bit_pass        INTEGER NOT NULL,
    mil_bus_word    TEXT    NOT NULL,
    status          TEXT    NOT NULL,
    fault_reason    TEXT    NOT NULL DEFAULT '',
    flight_hour     REAL    NOT NULL
);

CREATE INDEX idx_trace_flight_ts   ON trace(flight_id, ts);
CREATE INDEX idx_trace_flight_cyc  ON trace(flight_id, cycle_num);
CREATE INDEX idx_cycles_flight     ON cycles(flight_id);
"""

CSV_FIELDS = [
    'flight_id', 'cycle_num', 'ts', 'phase',
    'jpt1', 'ngg_rpm', 'ngg_pct', 'p2p1', 'oat',
    'stepper_pos', 'fuel_flow_kgh', 'vibration',
    'secu_healthy', 'bit_pass', 'mil_bus_word',
    'status', 'fault_reason', 'flight_hour',
]


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description='GTSU-110 flight data generator')
    parser.add_argument('--flights', type=int, default=7,  help='Number of flights (5-10)')
    parser.add_argument('--seed',    type=int, default=42, help='RNG seed for reproducibility')
    args = parser.parse_args()

    n_flights = int(clamp(args.flights, 5, 10))
    rng       = random.Random(args.seed)

    data_dir = Path('data')
    csv_dir  = data_dir / 'csvs'
    data_dir.mkdir(exist_ok=True)
    csv_dir.mkdir(exist_ok=True)

    db_path = data_dir / 'flights.db'
    if db_path.exists():
        db_path.unlink()          # fresh regeneration

    print(f'GTSU-110 flight data generator  |  {n_flights} flights  |  seed={args.seed}')
    print(f'Output: {db_path.resolve()}')
    print()

    con = sqlite3.connect(db_path)
    con.executescript(CREATE_SQL)

    for fid in range(1, n_flights + 1):
        print(f'  [{fid}/{n_flights}] Generating flight {fid} ...', end=' ', flush=True)
        flight = gen_flight(fid, rng)

        # Insert flight metadata
        con.execute(
            'INSERT INTO flights VALUES (?,?,?,?,?,?,?,?,?,?)',
            (flight['flight_id'], flight['label'], flight['duration_hrs'],
             flight['n_cycles'], flight['date'], flight['success_rate'],
             flight['faulty_cycles'], flight['avg_jpt1'], flight['total_fuel_kg'],
             flight['total_trace_sec']),
        )

        # Insert cycle summaries
        con.executemany(
            '''INSERT INTO cycles
               (flight_id,cycle_num,flight_hour,status,fault_reason,improvement,
                duration_sec,peak_jpt1,max_ngg_pct,total_fuel_kg,start_ts,end_ts)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
            [(fid, c['cycle_num'], c['flight_hour'], c['status'], c['fault_reason'],
              c['improvement'], c['duration_sec'], c['peak_jpt1'], c['max_ngg_pct'],
              c['total_fuel_kg'], c['start_ts'], c['end_ts'])
             for c in flight['cycles_meta']],
        )

        # Insert 1-Hz trace rows
        trace = flight['trace']
        con.executemany(
            '''INSERT INTO trace
               (flight_id,cycle_num,ts,phase,jpt1,ngg_rpm,ngg_pct,p2p1,oat,
                stepper_pos,fuel_flow_kgh,vibration,secu_healthy,bit_pass,
                mil_bus_word,status,fault_reason,flight_hour)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            [(fid, r['cycle_num'], r['ts'], r['phase'], r['jpt1'], r['ngg_rpm'],
              r['ngg_pct'], r['p2p1'], r['oat'], r['stepper_pos'], r['fuel_flow_kgh'],
              r['vibration'], r['secu_healthy'], r['bit_pass'], r['mil_bus_word'],
              r['status'], r['fault_reason'], r['flight_hour'])
             for r in trace],
        )

        # Write CSV
        csv_path = csv_dir / f'flight_{fid:03d}.csv'
        with open(csv_path, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            w.writeheader()
            for row in trace:
                w.writerow({k: row[k] for k in CSV_FIELDS})

        print(
            f'{len(trace):,} samples · {flight["n_cycles"]} cycles · '
            f'{flight["duration_hrs"]:.1f} hrs · '
            f'{flight["success_rate"]:.0f}% success'
        )

    con.commit()
    con.close()

    size_kb = db_path.stat().st_size // 1024
    print(f'\n✓ Done  →  {db_path}  ({size_kb:,} KB)')
    print(f'  CSVs  →  {csv_dir}/')
    print()
    print('Next steps:')
    print('  pip install fastapi uvicorn')
    print('  cd backend && uvicorn main:app --reload --port 8000')


if __name__ == '__main__':
    main()
