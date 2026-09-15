from pathlib import Path

path = Path('src/features/crossSurface.test.tsx')
text = path.read_text()
old = """    renderTopicPage(fresh)\n    expect(topicPrimary(fresh)).toBe('Start learning')\n    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)\n"""
new = """    renderTopicPage(fresh)\n    expect(document.querySelector('.topic-primary-verb')?.textContent).toBe('Start learning')\n    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)\n"""
if text.count(old) != 1:
    raise RuntimeError('Expected one duplicated-render assertion block')
path.write_text(text.replace(old, new))
print('Corrected issue #97 cross-surface regression test')
