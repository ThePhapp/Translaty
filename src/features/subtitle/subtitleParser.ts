export type SubtitleFormat = 'srt' | 'vtt';

export interface SubtitleCue {
  id: string;
  identifier?: string;
  timing: string;
  text: string;
  blockIndex: number;
}

export interface SubtitleDocument {
  format: SubtitleFormat;
  blocks: string[];
  cues: SubtitleCue[];
  newline: '\n' | '\r\n';
}

const SRT_TIMING = /^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}(?:\s+.*)?$/;
const VTT_TIMING =
  /^(?:\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(?:\d{2}:)?\d{2}:\d{2}\.\d{3}(?:\s+.*)?$/;

function splitBlocks(content: string): { blocks: string[]; newline: '\n' | '\r\n' } {
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  return { blocks: content.replace(/^\uFEFF/, '').split(/\r?\n\r?\n/), newline };
}

export function parseSubtitle(content: string, format: SubtitleFormat): SubtitleDocument {
  const { blocks, newline } = splitBlocks(content);
  const cues: SubtitleCue[] = [];
  const timingPattern = format === 'srt' ? SRT_TIMING : VTT_TIMING;

  blocks.forEach((block, blockIndex) => {
    const lines = block.split(/\r?\n/);
    const timingIndex = lines.findIndex((line) => timingPattern.test(line.trim()));
    if (timingIndex < 0) return;
    const text = lines.slice(timingIndex + 1).join(newline);
    if (!text) return;
    cues.push({
      id: `cue-${blockIndex}`,
      identifier: timingIndex > 0 ? lines.slice(0, timingIndex).join(newline) : undefined,
      timing: lines[timingIndex],
      text,
      blockIndex,
    });
  });

  if (!cues.length) throw new Error(`No valid ${format.toUpperCase()} subtitle cues were found.`);
  return { format, blocks, cues, newline };
}

export function serializeSubtitle(document: SubtitleDocument, translatedTexts: string[]): string {
  if (translatedTexts.length !== document.cues.length) {
    throw new Error('Translated cue count does not match the subtitle document.');
  }
  const blocks = [...document.blocks];
  document.cues.forEach((cue, index) => {
    const parts = [cue.identifier, cue.timing, translatedTexts[index]].filter(
      (value): value is string => value !== undefined,
    );
    blocks[cue.blockIndex] = parts.join(document.newline);
  });
  return blocks.join(`${document.newline}${document.newline}`);
}

export function formatFromFilename(filename: string): SubtitleFormat {
  const extension = filename.toLocaleLowerCase().split('.').pop();
  if (extension !== 'srt' && extension !== 'vtt') throw new Error('Choose an .srt or .vtt file.');
  return extension;
}
