// scripts/generate-data-list.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// НОВОЕ НАЗВАНИЕ ПАПКИ
const DATA_FOLDER = 'storage_v1_9hf29sk';

const dataDir = path.join(__dirname, '..', 'public', DATA_FOLDER);
const outputFile = path.join(__dirname, '..', 'public', `${DATA_FOLDER}/data-manifest.json`);

try {
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Папка public/${DATA_FOLDER} не найдена`);
    process.exit(1);
  }

  const collectParquetFiles = (dir, rootDir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectParquetFiles(fullPath, rootDir);
      }

      if (!entry.isFile() || !entry.name.endsWith('.parquet')) {
        return [];
      }

      return [path.relative(rootDir, fullPath).replaceAll(path.sep, '/')];
    });
  };

  const files = collectParquetFiles(dataDir, dataDir).sort();

  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  console.log(`✅ Список данных обновлен в ${DATA_FOLDER}: ${files.length} файлов.`);
} catch (err) {
  console.error('❌ Ошибка при генерации списка:', err);
}
