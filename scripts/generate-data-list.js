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

  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.parquet'))
    .sort();

  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  console.log(`✅ Список данных обновлен в ${DATA_FOLDER}: ${files.length} файлов.`);
} catch (err) {
  console.error('❌ Ошибка при генерации списка:', err);
}
