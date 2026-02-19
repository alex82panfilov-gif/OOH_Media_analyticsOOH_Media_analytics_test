## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Auth API environment variables

Set these server-side variables in your deployment platform (e.g. Vercel):

- `ADMIN_PASSWORD`
- `GUEST_PASSWORD`

Do **not** prefix them with `VITE_`, otherwise they may be exposed to the client bundle.

## Parquet partitioning for Serverless BI

- Recommended storage layout: `public/storage_v1_9hf29sk/year=2024/month=01/<file>.parquet`.
- Build or refresh manifest (supports nested directories):
  - `node scripts/generate-data-list.js`
- Optional local repartition script for a source parquet file:
  - `python scripts/partition_parquet.py --input ./raw/source.parquet --output ./public/storage_v1_9hf29sk`

The DuckDB worker reads parquet with `hive_partitioning = true`, so filters by year/month can prune partitions and reduce transferred bytes over HTTP Range Requests.
