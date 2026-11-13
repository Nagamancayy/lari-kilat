// Pembaca YAML minimal: cukup untuk file GitHub Actions (mapping, sequence,
// scalar, block scalar). Tujuannya menguji struktur workflow tanpa dependency.
export function parseYaml(text) {
  const lines = tokenize(text);
  if (lines.length === 0) return {};
  const result = parseBlock(lines, 0, lines[0].indent);
  if (result.next !== lines.length) {
    throw new Error(`baris ${lines[result.next].line}: indentasi tidak terduga`);
  }
  return result.value;
}

function tokenize(text) {
  const lines = [];
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  raw.forEach((line, index) => {
    if (line.includes('\t')) {
      throw new Error(`baris ${index + 1}: YAML tidak boleh memakai tab`);
    }
    const content = line.replace(/^\s+/, '');
    if (content === '' || content.startsWith('#')) return;
    lines.push({ indent: line.length - content.length, content, line: index + 1 });
  });
  return lines;
}

function parseBlock(lines, start, indent) {
  const first = lines[start];
  if (first.indent !== indent) {
    throw new Error(`baris ${first.line}: indentasi ${first.indent}, diharapkan ${indent}`);
  }
  if (first.content.startsWith('- ') || first.content === '-') {
    return parseSequence(lines, start, indent);
  }
  return parseMapping(lines, start, indent);
}

function parseMapping(lines, start, indent, seed = []) {
  const value = {};
  for (const [key, item] of seed) value[key] = item;

  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw new Error(`baris ${line.line}: indentasi ${line.indent}, diharapkan ${indent}`);
    }
    if (line.content.startsWith('- ') || line.content === '-') break;

    const match = /^([^:]+):(.*)$/.exec(line.content);
    if (!match) throw new Error(`baris ${line.line}: bukan pasangan key: value`);

    const key = match[1].trim();
    const rest = match[2].trim();

    if (rest === '') {
      const next = lines[index + 1];
      if (next && next.indent > indent) {
        const nested = parseBlock(lines, index + 1, next.indent);
        value[key] = nested.value;
        index = nested.next;
      } else {
        value[key] = null;
        index += 1;
      }
    } else if (rest === '|' || rest === '>' || rest === '|-') {
      const block = parseBlockScalar(lines, index + 1, indent);
      value[key] = block.value;
      index = block.next;
    } else {
      value[key] = parseScalar(rest);
      index += 1;
    }
  }

  return { value, next: index };
}

function parseBlockScalar(lines, start, indent) {
  const chunks = [];
  let index = start;
  while (index < lines.length && lines[index].indent > indent) {
    chunks.push(lines[index].content);
    index += 1;
  }
  return { value: chunks.join('\n'), next: index };
}

function parseSequence(lines, start, indent) {
  const value = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent !== indent) break;
    if (!(line.content.startsWith('- ') || line.content === '-')) break;

    const rest = line.content === '-' ? '' : line.content.slice(2).trim();

    if (rest === '') {
      const next = lines[index + 1];
      if (next && next.indent > indent) {
        const nested = parseBlock(lines, index + 1, next.indent);
        value.push(nested.value);
        index = nested.next;
      } else {
        value.push(null);
        index += 1;
      }
      continue;
    }

    if (isMappingStart(rest)) {
      const colon = rest.indexOf(':');
      const key = rest.slice(0, colon).trim();
      const tail = rest.slice(colon + 1).trim();
      const contentIndent = indent + 2;
      const seed = [];

      if (tail === '') {
        const next = lines[index + 1];
        if (next && next.indent > contentIndent) {
          const nested = parseBlock(lines, index + 1, next.indent);
          seed.push([key, nested.value]);
          index = nested.next;
        } else {
          seed.push([key, null]);
          index += 1;
        }
      } else {
        seed.push([key, parseScalar(tail)]);
        index += 1;
      }

      const item = parseMapping(lines, index, contentIndent, seed);
      value.push(item.value);
      index = item.next;
      continue;
    }

    value.push(parseScalar(rest));
    index += 1;
  }

  return { value, next: index };
}

function isMappingStart(text) {
  const colon = text.indexOf(':');
  return colon > 0 && !text.slice(0, colon).includes(' ');
}

function parseScalar(raw) {
  const text = raw.trim();
  if (text.length >= 2 && ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"')))) {
    return text.slice(1, -1);
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((part) => parseScalar(part))
      .filter((part) => part !== '');
  }
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null' || text === '~') return null;
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}
