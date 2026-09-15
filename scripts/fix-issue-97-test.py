from pathlib import Path

path = Path('src/features/crossSurface.test.tsx')
text = path.read_text()

old_render = """    renderTopicPage(fresh)\n    expect(topicPrimary(fresh)).toBe('Start learning')\n    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)\n"""
new_render = """    renderTopicPage(fresh)\n    expect(document.querySelector('.topic-primary-verb')?.textContent).toBe('Start learning')\n    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)\n"""
if text.count(old_render) != 1:
    raise RuntimeError('Expected one duplicated-render assertion block')
text = text.replace(old_render, new_render)

old_before = "    const beforeBrowse = localStorage.getItem(STORE_KEY)\n"
new_before = """    const beforeBrowse = (JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }).topics?.find(\n      (topic) => topic.id === fresh.id,\n    )\n    expect(beforeBrowse).toEqual(fresh)\n"""
if text.count(old_before) != 1:
    raise RuntimeError('Expected one pre-browse store snapshot')
text = text.replace(old_before, new_before)

old_wait = "    await waitFor(() => expect(localStorage.getItem(STORE_KEY)).toBe(beforeBrowse))\n"
new_wait = """    await waitFor(() => {\n      const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }\n      expect(stored.topics?.find((topic) => topic.id === fresh.id)).toEqual(beforeBrowse)\n    })\n"""
if text.count(old_wait) != 1:
    raise RuntimeError('Expected one whole-store browse assertion')
text = text.replace(old_wait, new_wait)

path.write_text(text)
print('Corrected issue #97 cross-surface regression test')
