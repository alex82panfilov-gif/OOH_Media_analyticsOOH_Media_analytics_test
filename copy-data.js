// copy-data.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// НОВОЕ НАЗВАНИЕ ПАПКИ (совпадает с тем, что в хуках и скрипте генерации)
const DATA_FOLDER = 'storage_v1_9hf29sk';

const srcDir = path.join(__dirname, 'public', DATA_FOLDER);
const destDir = path.join(__dirname, 'dist', DATA_FOLDER);

console.log(`--- КОПИРОВАНИЕ ДАННЫХ В DIST [${DATA_FOLDER}] ---`);

if (!fs.existsSync(srcDir)) {
  console.warn(`⚠️ Папка источника ${srcDir} не найдена. Пропуск...`);
  process.exit(0); 
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

try {
  const files = fs.readdirSync(srcDir);
  let count = 0;

  files.forEach(file => {
    // Копируем только файлы (игнорируем подпапки, если они есть)
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    
    if (fs.lstatSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      count++;
    }
  });

  console.log(`✅ Успешно скопировано файлов: ${count} в папку dist/${DATA_FOLDER}`);
} catch (err) {
  console.error('❌ Ошибка при копировании данных:', err);
  process.exit(1);
}
