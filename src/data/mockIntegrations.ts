export const integrations = [
  { name: 'Telegram', status: 'OK', checkedAt: '11:30', details: 'Сообщения доступны, импорт включён' },
  { name: 'OBD', status: 'OK', checkedAt: '11:31', details: 'FPS 24, задержка 82 мс' },
  { name: 'ESP32 HID', status: 'OK', checkedAt: '11:31', details: 'Мышь и клавиатура подключены' },
  { name: 'Ollama', status: 'Warning', checkedAt: '11:12', details: 'Локальная модель отвечает медленно' },
  { name: 'Внешние LLM API', status: 'OK', checkedAt: '11:29', details: 'ChatGPT vision-модель доступна' },
  { name: 'OCR', status: 'OK', checkedAt: '11:28', details: 'Распознавание русского текста включено' },
  { name: 'Файловое хранилище', status: 'OK', checkedAt: '11:25', details: 'Скриншоты сохраняются' },
  { name: 'Векторная база', status: 'Warning', checkedAt: '10:55', details: 'Индекс обновляется' },
];

export const diagnostics = [
  { name: 'Backend', status: 'OK', latency: '42 мс', checkedAt: '11:33' },
  { name: 'База данных', status: 'OK', latency: '18 мс', checkedAt: '11:33' },
  { name: 'Файловое хранилище', status: 'OK', latency: '35 мс', checkedAt: '11:32' },
  { name: 'Векторная база', status: 'Warning', latency: '210 мс', checkedAt: '11:20' },
  { name: 'Telegram', status: 'OK', latency: '88 мс', checkedAt: '11:31' },
  { name: 'OBD', status: 'OK', latency: '82 мс', checkedAt: '11:31' },
  { name: 'ESP32', status: 'OK', latency: '24 мс', checkedAt: '11:31' },
  { name: 'OCR', status: 'OK', latency: '132 мс', checkedAt: '11:28' },
  { name: 'Ollama', status: 'Warning', latency: '1.8 с', checkedAt: '11:12' },
  { name: 'Внешние API', status: 'OK', latency: '530 мс', checkedAt: '11:29' },
  { name: 'Агенты', status: 'OK', latency: '64 мс', checkedAt: '11:33' },
];
