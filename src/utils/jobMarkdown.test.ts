import { describe, expect, it } from 'vitest'
import { bodyToHtml } from './jobMarkdown'

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
}

describe('bodyToHtml sanitization', () => {
  it('does not emit an executable <script> element even when input contains one', () => {
    const html = bodyToHtml('<script>alert(1)</script>')
    const doc = parseHtml(html)
    expect(doc.querySelector('script')).toBeNull()
  })

  it('does not emit <iframe>/<object>/<embed> even if input claims to', () => {
    const html = bodyToHtml('<iframe src="x"></iframe><object data="x"></object><embed src="x">')
    const doc = parseHtml(html)
    expect(doc.querySelector('iframe')).toBeNull()
    expect(doc.querySelector('object')).toBeNull()
    expect(doc.querySelector('embed')).toBeNull()
  })

  it('strips event-handler attributes that might survive a future regex change', () => {
    const html = bodyToHtml('hello world')
    const doc = parseHtml(html)
    const all = doc.querySelectorAll('*')
    for (const el of Array.from(all)) {
      for (const attr of Array.from(el.attributes)) {
        expect(attr.name.toLowerCase().startsWith('on')).toBe(false)
      }
    }
  })

  it('keeps the allow-listed formatting markup intact', () => {
    const html = bodyToHtml('- **Stark**: passender Hintergrund\n- Skills: TypeScript')
    expect(html).toContain('<ul')
    expect(html).toContain('<strong>Stark</strong>')
  })

  it('keeps allowed table classes/attrs on a markdown pipe table', () => {
    const md = [
      '| Skill | Match |',
      '| --- | --- |',
      '| TypeScript | ✓ |',
      '| Kubernetes | ✗ |',
    ].join('\n')
    const html = bodyToHtml(md)
    expect(html).toContain('<table class="job-md-table">')
    expect(html).toContain('<th scope="col">')
  })
})
