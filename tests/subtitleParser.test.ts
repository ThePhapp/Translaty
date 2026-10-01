import { describe, expect, it } from 'vitest';
import { parseSubtitle, serializeSubtitle } from '../src/features/subtitle/subtitleParser';

describe('subtitle parser', () => {
  it('round-trips SRT timing, ordering, and multiline text', () => {
    const source = `1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\r\nworld\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,500\r\nSave`;
    const document = parseSubtitle(source, 'srt');
    expect(document.cues.map((cue) => cue.text)).toEqual(['Hello\r\nworld', 'Save']);
    const output = serializeSubtitle(document, ['Xin chào\r\nthế giới', 'Lưu']);
    expect(output).toContain('00:00:01,000 --> 00:00:03,000');
    expect(output).toContain('Xin chào\r\nthế giới');
  });

  it('preserves VTT header metadata and cue settings', () => {
    const source = `WEBVTT\nKind: captions\n\nintro\n00:01.000 --> 00:03.000 align:start\nHello\n\nNOTE keep this\nmetadata`;
    const document = parseSubtitle(source, 'vtt');
    const output = serializeSubtitle(document, ['Bonjour']);
    expect(output).toContain('WEBVTT\nKind: captions');
    expect(output).toContain('intro\n00:01.000 --> 00:03.000 align:start\nBonjour');
    expect(output).toContain('NOTE keep this');
  });

  it('rejects a file without cues', () => {
    expect(() => parseSubtitle('not a subtitle', 'srt')).toThrow(/No valid SRT/);
  });
});
