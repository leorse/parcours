#!/usr/bin/env python3
"""
fix_katex_yaml.py — Corrige l'échappement des backslashes KaTeX dans les fichiers YAML.

Règles YAML :
  - Chaîne double-quotée "…" : YAML interprète \t=tabulation, \n=newline, \f=form-feed, etc.
      → les commandes KaTeX doivent être écrites \\times, \\frac, \\text, \\neq …
  - Bloc littéral (|) : les backslashes sont littéraux, aucun traitement YAML.
      → les commandes KaTeX doivent être écrites \times, \frac, \text, \neq …

Ce script détecte automatiquement le contexte et corrige les deux types d'erreurs :
  - double-quotée + \cmd  → \\cmd   (évite que \t soit lu comme tabulation, etc.)
  - bloc |       + \\cmd  → \cmd    (évite que \\ soit envoyé tel quel à KaTeX)

Usage :
  python fix_katex_yaml.py [--dry-run] [fichiers_ou_patterns ...]

  python fix_katex_yaml.py public/content/**/*.yaml
  python fix_katex_yaml.py --dry-run public/content/**/*.yaml
  python fix_katex_yaml.py                  # cherche tous les .yaml/.yml récursivement
"""

import re
import sys
import glob as glob_module
import os

# \<lettre> seul (non précédé d'un autre \)
SINGLE_SLASH_RE = re.compile(r'(?<!\\)\\([a-zA-Z])')
# \\<lettre> (double backslash)
DOUBLE_SLASH_RE = re.compile(r'\\\\([a-zA-Z])')


def fix_double_quoted_content(s):
    """Chaîne double-quotée : \cmd  →  \\cmd  (si pas déjà doublé)."""
    return SINGLE_SLASH_RE.sub(r'\\\\\1', s)


def fix_block_scalar_content(s):
    """Bloc littéral | : \\cmd  →  \cmd."""
    return DOUBLE_SLASH_RE.sub(r'\\\1', s)


def get_indent(line):
    return len(line) - len(line.lstrip(' '))


def is_block_scalar_start(line):
    """Détecte une ligne démarrant un bloc littéral YAML (key: | ou key: >)."""
    return bool(re.search(r':\s*[|>][+\-]?\s*(?:#.*)?$', line.rstrip()))


def fix_double_quoted_in_line(line):
    """
    Parcourt la ligne, trouve toutes les chaînes "…" et corrige les backslashes.
    Retourne (nouvelle_ligne, nombre_de_changements).
    """
    result = []
    changes = 0
    i = 0

    while i < len(line):
        if line[i] == '"':
            # Trouver la guillemet fermante en gérant les \" internes
            j = i + 1
            while j < len(line):
                if line[j] == '\\' and j + 1 < len(line):
                    j += 2  # saute le caractère échappé
                elif line[j] == '"':
                    break
                else:
                    j += 1

            if j < len(line):
                content = line[i + 1:j]
                fixed = fix_double_quoted_content(content)
                if fixed != content:
                    changes += 1
                result.append('"' + fixed + '"')
                i = j + 1
            else:
                # guillemet non fermée : on laisse tel quel
                result.append(line[i:])
                i = len(line)
        else:
            result.append(line[i])
            i += 1

    return ''.join(result), changes


def process_file(filepath, dry_run=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.readlines()

    new_lines = []
    total_changes = 0
    in_block = False
    block_indent = 0

    for lineno, raw in enumerate(original, 1):
        line = raw.rstrip('\n\r')
        eol = raw[len(line):]  # préserve '\n' ou '\r\n' ou ''

        is_blank = line.strip() == ''

        # ── Contexte bloc littéral ─────────────────────────────────────────
        if in_block:
            if is_blank:
                new_lines.append(raw)
                continue

            indent = get_indent(line)
            if indent <= block_indent:
                # On sort du bloc ; on traite cette ligne normalement (cf. suite)
                in_block = False
            else:
                # Contenu du bloc : corriger \\cmd → \cmd
                fixed = fix_block_scalar_content(line)
                if fixed != line:
                    total_changes += 1
                    print(f"  L{lineno} [bloc |] : {line.strip()!r}")
                    print(f"            → {fixed.strip()!r}")
                new_lines.append(fixed + eol)
                continue

        # ── Hors bloc littéral ─────────────────────────────────────────────
        is_comment = line.lstrip().startswith('#')

        if is_blank or is_comment:
            new_lines.append(raw)
            continue

        # Démarrage d'un nouveau bloc ?
        if is_block_scalar_start(line):
            in_block = True
            block_indent = get_indent(line)
            new_lines.append(raw)
            continue

        # Ligne normale : corriger les chaînes double-quotées
        fixed, changes = fix_double_quoted_in_line(line)
        if changes:
            total_changes += changes
            print(f"  L{lineno} [\"…\"]    : {line.strip()!r}")
            print(f"            → {fixed.strip()!r}")
        new_lines.append(fixed + eol)

    if total_changes:
        print(f"  ➜ {total_changes} correction(s)")
        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
    else:
        print("  (aucune correction nécessaire)")

    return total_changes


def collect_files(patterns):
    files = []
    for pattern in patterns:
        matched = glob_module.glob(pattern, recursive=True)
        if matched:
            files.extend(matched)
        elif os.path.isfile(pattern):
            files.append(pattern)
    return sorted(set(files))


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    if dry_run:
        args.remove('--dry-run')

    patterns = args if args else ['**/*.yaml', '**/*.yml']
    files = collect_files(patterns)

    if not files:
        print("Aucun fichier YAML trouvé.")
        sys.exit(1)

    if dry_run:
        print("Mode dry-run — aucun fichier ne sera modifié.\n")

    grand_total = 0
    for filepath in files:
        print(f"\n{filepath}")
        grand_total += process_file(filepath, dry_run=dry_run)

    print(f"\n{'─' * 50}")
    print(f"Total : {grand_total} correction(s) dans {len(files)} fichier(s).")


if __name__ == '__main__':
    main()
