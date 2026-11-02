"""Create a source + documentation + static-build ZIP with one ID_NAME root."""
from __future__ import annotations

import argparse
import shutil
import tempfile
import unicodedata
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]


def safe_part(value: str) -> str:
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    value = re.sub(r'[^A-Za-z0-9_-]+', '_', value.strip()).strip('_-')
    if not value:
        raise ValueError('ID e nome precisam conter letras ou números.')
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id', default='ID', help='ID real do participante; padrão deixa o marcador ID.')
    parser.add_argument('--name', default='NAME', help='Nome real do participante; padrão deixa o marcador NAME.')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'delivery')
    args = parser.parse_args()
    label = f'{safe_part(args.id)}_{safe_part(args.name)}'
    output = args.output_dir.resolve()
    folder, archive = output / label, output / f'{label}.zip'
    if folder.exists() or archive.exists():
        parser.error('Já existe um pacote com esse nome. Preserve-o e escolha outro --output-dir para gerar uma nova versão.')
    if not (ROOT / 'dist/index.html').is_file():
        parser.error('Execute npm run build antes de empacotar.')
    output.mkdir(parents=True, exist_ok=True)
    files = ['README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts', 'index.html', '.gitignore', '.prettierrc.json', '.prettierignore']
    directories = ['src', 'public', 'docs', 'scripts', '.github', 'dist']
    ignored = shutil.ignore_patterns('node_modules', '__pycache__', '*.pyc', '.env', '.env.*', '*.tsbuildinfo', '.DS_Store')
    with tempfile.TemporaryDirectory(prefix='clareza-package-') as temp:
        staged = Path(temp) / label
        staged.mkdir()
        for name in files:
            shutil.copy2(ROOT / name, staged / name)
        for name in directories:
            source = ROOT / name
            if source.exists():
                shutil.copytree(source, staged / name, ignore=ignored)
        # Integration tests are part of the source delivery.
        if (ROOT / 'tests').exists():
            shutil.copytree(ROOT / 'tests', staged / 'tests', ignore=ignored)
        staged_zip = Path(temp) / f'{label}.zip'
        with ZipFile(staged_zip, 'w', ZIP_DEFLATED, compresslevel=9) as zip_file:
            for path in sorted(staged.rglob('*')):
                if path.is_file():
                    zip_file.write(path, path.relative_to(staged.parent).as_posix())
        with ZipFile(staged_zip) as zip_file:
            if zip_file.testzip() is not None:
                raise RuntimeError('Falha de integridade no ZIP.')
        shutil.copytree(staged, folder)
        shutil.copy2(staged_zip, archive)
    print(f'Pasta de entrega: {folder}')
    print(f'ZIP: {archive} ({archive.stat().st_size:,} bytes)')
    print('Pendentes: ID/nome reais, vídeo narrado, URL pública verificada, prazo e envio no formulário oficial.')


if __name__ == '__main__':
    main()
