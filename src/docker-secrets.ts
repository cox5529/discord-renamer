import fs from 'fs';

export function config(dir?: string) {
  dir ??= '/run/secrets';

  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(`${dir}`);
  for (const file of files) {
    const value = fs.readFileSync(`${dir}/${file}`);

    process.env[file] = value.toString('utf-8');
  }
}
