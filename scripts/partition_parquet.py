#!/usr/bin/env python3
"""Split parquet data into Hive partitions: year=YYYY/month=MM/data.parquet."""

from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Partition parquet by year/month")
    parser.add_argument("--input", required=True, type=Path, help="Input parquet file")
    parser.add_argument("--output", required=True, type=Path, help="Output directory")
    parser.add_argument("--year-column", default="Год", help="Source year column")
    parser.add_argument("--month-column", default="Месяц", help="Source month column")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        import pyarrow as pa  # type: ignore
        import pyarrow.compute as pc  # type: ignore
        import pyarrow.dataset as ds  # type: ignore
        import pyarrow.parquet as pq  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "pyarrow is required. Install locally with: pip install pyarrow"
        ) from exc

    table = pq.read_table(args.input)
    year_col = pc.cast(table[args.year_column], pa.int32())
    month_col = pc.utf8_lpad(pc.cast(table[args.month_column], pa.string()), 2, "0")

    table = table.append_column("year", year_col).append_column("month", month_col)

    args.output.mkdir(parents=True, exist_ok=True)
    ds.write_dataset(
        data=table,
        base_dir=args.output,
        format="parquet",
        partitioning=ds.partitioning(pa.schema([("year", pa.int32()), ("month", pa.string())]), flavor="hive"),
        existing_data_behavior="overwrite_or_ignore",
    )

    print(f"Partitioned dataset written to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
